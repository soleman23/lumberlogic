import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { quoteLinesOrEmpty } from '../lib/quoteFromTally'
import { defaultQuoteMessage, defaultValidUntil, defaultFreightFor, nextQuoteNumber } from '../lib/quoteDefaults'
import { quoteToPlainText } from '../lib/quoteText'
import { dateLong, fmt, initials, money2 } from '../lib/formatters'
import { useLoads } from '../context/LoadsContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import { savedLoadToDomain } from '../domain/adapters/tallyAdapter'
import { isDemoRecord } from '../domain/demoData'
import { canSendQuote, validateQuoteInput } from '../domain/validation/quote'
import { formatCompanyFooter } from '../domain/settings'
import { emailService, pdfService, shareLinkService } from '../services/delivery'
import { quoteRevisionRepository } from '../repositories/localStorage'
import { useBreakpoints } from '../hooks/useMediaQuery'
import type { QuoteLine } from '../types'
import type { QuoteRevision } from '../domain/types'
import { IconChevronLeft, IconDownload, IconSend } from '../components/Icons'
import { Button } from '../components/Button'
import { SegmentedControl } from '../components/SegmentedControl'
import './SendQuoteScreen.css'

function computeQuote(lines: QuoteLine[], showUnit: boolean, freight: number) {
  const rows = lines.map((l, i) => {
    const bf = l.bf ?? (l.pcs * l.t * l.w * l.lenFt) / 12
    const ext = (bf / 1000) * l.mbf
    return {
      ...l,
      bf,
      ext,
      dims: l.dims ?? `${l.t}″×${l.w}″×${l.lenFt}′`,
      band: i % 2 === 0 ? '#FFFFFF' : '#FAF6EF',
    }
  })
  const subtotal = rows.reduce((s, r) => s + r.ext, 0)
  const totalBf = rows.reduce((s, r) => s + r.bf, 0)
  const totalPcs = rows.reduce((s, r) => s + r.pcs, 0)
  return { rows, subtotal, totalBf, totalPcs, total: subtotal + freight, showUnit }
}

export function SendQuoteScreen() {
  const { loadId } = useParams()
  const { loads, updateLoad } = useLoads()
  const { settings, isComplete } = useSettings()
  const { showToast } = useToast()
  const { isMobile, isNarrow } = useBreakpoints()

  const load = loads.find((l) => l.id === loadId)
  const domainLoad = useMemo(() => (load?.tally ? savedLoadToDomain(load) : null), [load])

  const [message, setMessage] = useState(() =>
    load ? defaultQuoteMessage(load, settings.shippingOrigin || 'our yard') : '',
  )
  const [email, setEmail] = useState(load?.email ?? '')
  const [validUntil, setValidUntil] = useState(() => defaultValidUntil(undefined, settings.defaultValidityDays))
  const [freight, setFreight] = useState(() => (load ? defaultFreightFor(load) : settings.defaultFreight))
  const [showUnit, setShowUnit] = useState(true)
  const [delivery, setDelivery] = useState<'email' | 'share_link' | 'pdf'>('email')

  const lines = useMemo(
    () => (load?.tally ? quoteLinesOrEmpty(load.tally, load.species) : []),
    [load],
  )
  const quote = useMemo(() => computeQuote(lines, showUnit, freight), [lines, showUnit, freight])

  const validationIssues = useMemo(() => {
    if (!domainLoad) return [{ code: 'no_load', message: 'Load not found', blocking: true }]
    return validateQuoteInput({
      load: domainLoad,
      settings,
      validUntil,
      issuedAt: new Date().toISOString(),
      email,
      deliveryMethod: delivery,
    })
  }, [domainLoad, settings, validUntil, email, delivery])

  const canSend = canSendQuote(validationIssues) && !isDemoRecord(load ?? {})

  useEffect(() => {
    if (!load) showToast('Load not found')
  }, [load, showToast])

  if (!load) return <Navigate to="/loads" replace />

  const customer = load.name
  const ref = load.sub
  const quotePrefix = settings.quotePrefix.trim() || 'CB'
  const quoteNumberPreview = `${quotePrefix}-${new Date().getFullYear()}-####`
  const contactLine = load.contact ? `${load.contact}${load.role ? ` · ${load.role}` : ''}` : null

  const handleFreightChange = (value: number) => {
    setFreight(value)
    updateLoad({ ...load, freight: value })
  }

  const createRevision = async (status: QuoteRevision['status'], quoteNumber: string): Promise<QuoteRevision> => {
    const revision: QuoteRevision = {
      id: crypto.randomUUID(),
      loadId: load.id,
      revisionNumber: quoteRevisionRepository.getByLoad(load.id).length + 1,
      quoteNumber,
      status,
      customerName: customer,
      customerEmail: email,
      contact: load.contact,
      role: load.role,
      sub: ref,
      species: load.species,
      lines: quote.rows.map((r) => ({
        lineId: r.lineId ?? '',
        species: r.species,
        grade: r.grade,
        dims: r.dims,
        pcs: r.pcs,
        bf: r.bf,
        sellingPricePerMbf: r.mbf,
        extendedSelling: r.ext,
      })),
      subtotal: quote.subtotal,
      freight,
      tax: 0,
      total: quote.total,
      totalBf: quote.totalBf,
      totalPcs: quote.totalPcs,
      message,
      validUntil,
      issuedAt: new Date().toISOString().slice(0, 10),
      companySnapshot: settings,
      deliveryMethod: delivery,
      createdAt: new Date().toISOString(),
    }
    quoteRevisionRepository.save(revision)
    return revision
  }

  const handleSend = async () => {
    if (!canSend) {
      showToast(validationIssues.find((i) => i.blocking)?.message ?? 'Quote cannot be sent')
      return
    }

    const quoteNumber = nextQuoteNumber(quotePrefix)
    const revision = await createRevision('Draft', quoteNumber)
    const text = quoteToPlainText(quote, {
      customer,
      quoteNumber,
      validUntil,
      message,
      freight,
      settings,
    })

    if (delivery === 'email') {
      const result = await emailService.send({
        to: email,
        subject: `Quote ${quoteNumber} — ${customer}`,
        body: text,
        replyTo: settings.replyToEmail,
      })
      if (result.success) {
        quoteRevisionRepository.save({ ...revision, status: 'Sent', deliveryResult: 'success' })
        showToast(`Quote sent to ${email}`)
      } else if (result.fallbackUrl) {
        window.location.href = result.fallbackUrl
        showToast('Opening email app (OAuth not configured)')
      } else {
        showToast(result.error ?? 'Email delivery failed')
      }
    } else if (delivery === 'share_link') {
      const link = await shareLinkService.create(revision.id)
      if (link.revoked) {
        showToast('Share link was revoked')
        return
      }
      await navigator.clipboard.writeText(link.url)
      quoteRevisionRepository.save({
        ...revision,
        status: 'Sent',
        shareLinkToken: link.token,
        deliveryResult: 'success',
      })
      showToast('Share link copied to clipboard')
    } else {
      const blob = await pdfService.generate(revision)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quoteNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      quoteRevisionRepository.save({ ...revision, status: 'Sent', deliveryResult: 'success' })
      showToast('PDF downloaded')
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="send-page">
      <Link to="/loads" className="send-back">
        <IconChevronLeft />
        Saved loads
      </Link>

      {!canSend && (
        <div className="quote-validation-errors" role="alert">
          {validationIssues.filter((i) => i.blocking).map((issue) => (
            <p key={issue.code}>{issue.message}</p>
          ))}
          {!isComplete && (
            <p>
              <Link to="/settings">Complete company setup</Link> before sending.
            </p>
          )}
        </div>
      )}

      <div className="send-layout">
        <div className="send-desk">
          <div className="send-desk__surface">
            <article className="quote-page">
              <header className="quote-page__header">
                <div>
                  <strong>{settings.displayName || settings.appName}</strong>
                  {isComplete ? (
                    <p className="quote-page__address">{formatCompanyFooter(settings)}</p>
                  ) : (
                    <p className="quote-page__address">Company setup required before sending</p>
                  )}
                </div>
                <div className="quote-page__meta">
                  <span className="quote-page__eyebrow">Quote</span>
                  <strong>{quoteNumberPreview}</strong>
                  <p>Issued {dateLong(new Date().toISOString().slice(0, 10))}</p>
                  <p>Valid through {dateLong(validUntil)}</p>
                </div>
              </header>

              <div className="quote-chip">
                <strong>{customer}</strong>
                {contactLine && <span>{contactLine}</span>}
                <span>{ref}</span>
              </div>

              {lines.length === 0 ? (
                <div className="empty-state">No valid line items — add material to the worksheet first.</div>
              ) : (
                <div className={`quote-table ${!showUnit || isMobile ? 'quote-table--compact' : ''}`}>
                  <div className="quote-table__head">
                    <span>Material</span>
                    {!isMobile && <span>Pcs</span>}
                    <span>Bd ft</span>
                    {showUnit && !isMobile && <span>$ per MBF</span>}
                    <span>Amount</span>
                  </div>
                  {quote.rows.map((row, i) => (
                    <div key={row.lineId ?? i} className="quote-table__row" style={{ background: row.band }}>
                      <div>
                        <strong>{row.species}</strong>
                        <span className="quote-table__grade">{row.grade}</span>
                        <span className="quote-table__dims">{row.dims}</span>
                      </div>
                      {!isMobile && <span>{row.pcs > 0 ? fmt(row.pcs, 0) : '—'}</span>}
                      <span>{fmt(Math.round(row.bf), 0)}</span>
                      {showUnit && !isMobile && <span>${fmt(row.mbf, 0)}</span>}
                      <span>{money2(row.ext)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="quote-totals-wrap">
                <div className="quote-counts">
                  <p>{quote.rows.length} items</p>
                  {quote.totalPcs > 0 && <p>{fmt(quote.totalPcs, 0)} pieces</p>}
                  <p>{fmt(Math.round(quote.totalBf), 0)} board feet</p>
                </div>
                <div className="quote-totals card-surface">
                  <div>
                    <span>Subtotal</span>
                    <strong>{money2(quote.subtotal)}</strong>
                  </div>
                  <div>
                    <span>Freight</span>
                    <strong>{money2(freight)}</strong>
                  </div>
                  <div>
                    <span>Tax</span>
                    <strong>{money2(0)}</strong>
                  </div>
                  <div className="quote-totals__due">
                    <span>Total due</span>
                    <strong>{money2(quote.total)}</strong>
                  </div>
                </div>
              </div>

              <div className="quote-note">
                <span className="quote-note__eyebrow">Note from {settings.salespersonName}</span>
                <p>{message}</p>
              </div>

              <footer className="quote-footer">
                Valid through {dateLong(validUntil)} · {settings.shippingTerms} · {settings.paymentTerms}
              </footer>
            </article>
          </div>
        </div>

        {!isNarrow && (
          <aside className="compose-rail card-surface">
            <ComposeRail
              customer={customer}
              contactLine={contactLine}
              email={email}
              setEmail={setEmail}
              message={message}
              setMessage={setMessage}
              validUntil={validUntil}
              setValidUntil={setValidUntil}
              freight={freight}
              setFreight={handleFreightChange}
              showUnit={showUnit}
              setShowUnit={setShowUnit}
              delivery={delivery}
              setDelivery={setDelivery}
              total={quote.total}
              canSend={canSend}
              onSend={handleSend}
              onPrint={handlePrint}
            />
          </aside>
        )}
      </div>

      {isNarrow && (
        <div className="compose-rail compose-rail--stacked card-surface">
          <ComposeRail
            customer={customer}
            contactLine={contactLine}
            email={email}
            setEmail={setEmail}
            message={message}
            setMessage={setMessage}
            validUntil={validUntil}
            setValidUntil={setValidUntil}
            freight={freight}
            setFreight={handleFreightChange}
            showUnit={showUnit}
            setShowUnit={setShowUnit}
            delivery={delivery}
            setDelivery={setDelivery}
            total={quote.total}
            canSend={canSend}
            onSend={handleSend}
            onPrint={handlePrint}
          />
        </div>
      )}
    </div>
  )
}

function ComposeRail(props: {
  customer: string
  contactLine: string | null
  email: string
  setEmail: (v: string) => void
  message: string
  setMessage: (v: string) => void
  validUntil: string
  setValidUntil: (v: string) => void
  freight: number
  setFreight: (v: number) => void
  showUnit: boolean
  setShowUnit: (v: boolean) => void
  delivery: 'email' | 'share_link' | 'pdf'
  setDelivery: (v: 'email' | 'share_link' | 'pdf') => void
  total: number
  canSend: boolean
  onSend: () => void
  onPrint: () => void
}) {
  return (
    <>
      <p className="compose-rail__eyebrow">Send to customer</p>
      <h2>Send quote</h2>

      <div className="compose-customer">
        <div className="compose-customer__avatar">{initials(props.customer)}</div>
        <div>
          <strong>{props.customer}</strong>
          {props.contactLine && <span>{props.contactLine}</span>}
        </div>
      </div>

      <label className="compose-field">
        Email
        <input type="email" value={props.email} onChange={(e) => props.setEmail(e.target.value)} />
      </label>

      <SegmentedControl
        label="Delivery method"
        options={[
          { value: 'email', label: 'Email' },
          { value: 'share_link', label: 'Share link' },
          { value: 'pdf', label: 'PDF' },
        ]}
        value={props.delivery}
        onChange={props.setDelivery}
      />

      <label className="compose-field">
        Message to customer
        <textarea rows={5} value={props.message} onChange={(e) => props.setMessage(e.target.value)} />
      </label>

      <label className="compose-toggle">
        <input type="checkbox" checked={props.showUnit} onChange={(e) => props.setShowUnit(e.target.checked)} />
        Show per-line $/MBF
      </label>

      <label className="compose-field">
        Freight ($)
        <input
          type="number"
          min={0}
          step={1}
          value={props.freight || ''}
          onChange={(e) => props.setFreight(Math.max(0, Number(e.target.value) || 0))}
        />
      </label>

      <label className="compose-field">
        Valid through
        <input type="date" value={props.validUntil} onChange={(e) => props.setValidUntil(e.target.value)} />
      </label>

      <div className="compose-total">
        <span>Quote total</span>
        <strong>{money2(props.total)}</strong>
      </div>

      <div className="compose-actions">
        <Button
          variant="primary"
          onClick={props.onSend}
          disabled={!props.canSend}
          style={{ flex: 1, minHeight: 44 }}
          icon={<IconSend color="#fff" />}
        >
          Send quote
        </Button>
        <Button variant="icon" aria-label="Download PDF" onClick={props.onPrint}>
          <IconDownload />
        </Button>
      </div>
    </>
  )
}
