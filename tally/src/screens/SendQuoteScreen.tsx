import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { DEFAULT_QUOTE_LINES } from '../lib/priceData'
import { tallyToQuoteLines } from '../lib/quoteFromTally'
import { defaultQuoteMessage, defaultValidUntil, quoteNumberFor } from '../lib/quoteDefaults'
import { buildMailtoUrl, quoteToPlainText } from '../lib/quoteText'
import { dateLong, fmt, initials, money2 } from '../lib/formatters'
import { useLoads } from '../context/LoadsContext'
import { useToast } from '../context/ToastContext'
import { useBreakpoints } from '../hooks/useMediaQuery'
import type { QuoteLine } from '../types'
import { Button } from '../components/Button'
import { SegmentedControl } from '../components/SegmentedControl'
import './SendQuoteScreen.css'

const FREIGHT = 685

function computeQuote(lines: QuoteLine[], showUnit: boolean) {
  const rows = lines.map((l, i) => {
    const bf = (l.pcs * l.t * l.w * l.lenFt) / 12
    const ext = (bf / 1000) * l.mbf
    return {
      ...l,
      bf,
      ext,
      dims: `${l.t}″×${l.w}″×${l.lenFt}′`,
      band: i % 2 === 0 ? '#FFFFFF' : '#FAF6EF',
    }
  })
  const subtotal = rows.reduce((s, r) => s + r.ext, 0)
  const totalBf = rows.reduce((s, r) => s + r.bf, 0)
  const totalPcs = rows.reduce((s, r) => s + r.pcs, 0)
  return { rows, subtotal, totalBf, totalPcs, total: subtotal + FREIGHT, showUnit }
}

export function SendQuoteScreen() {
  const { loadId } = useParams()
  const { loads } = useLoads()
  const { showToast } = useToast()
  const { isMobile, isNarrow } = useBreakpoints()

  const load = loads.find((l) => l.id === loadId)

  const [message, setMessage] = useState(() => (load ? defaultQuoteMessage(load) : ''))
  const [email, setEmail] = useState(load?.email ?? '')
  const [validUntil, setValidUntil] = useState(() => defaultValidUntil())
  const [showUnit, setShowUnit] = useState(true)
  const [delivery, setDelivery] = useState<'email' | 'link' | 'pdf'>('email')

  const lines = useMemo(
    () => (load?.tally ? tallyToQuoteLines(load.tally, load.species) : DEFAULT_QUOTE_LINES),
    [load],
  )
  const quote = useMemo(() => computeQuote(lines, showUnit), [lines, showUnit])

  useEffect(() => {
    if (!load) showToast('Load not found')
  }, [load, showToast])

  if (!load) return <Navigate to="/loads" replace />

  const customer = load.name
  const ref = load.sub
  const quoteNumber = quoteNumberFor(load)
  const contactLine = load.contact ? `${load.contact}${load.role ? ` · ${load.role}` : ''}` : null

  const handleSend = () => {
    const text = quoteToPlainText(quote, {
      customer,
      quoteNumber,
      validUntil,
      message,
      freight: FREIGHT,
    })
    if (delivery === 'email') {
      if (!email.trim()) {
        showToast('Enter an email address first')
        return
      }
      window.location.href = buildMailtoUrl(email, `Quote ${quoteNumber} — ${customer}`, text)
      showToast(`Opening email to ${email}…`)
    } else if (delivery === 'link') {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast('Quote copied to clipboard'))
        .catch(() => showToast('Could not copy to clipboard'))
    } else {
      window.print()
    }
  }

  const handlePrint = () => window.print()

  return (
    <div className="send-page">
      <Link to="/loads" className="send-back">
        ‹ Saved loads
      </Link>

      <div className="send-layout">
        <div className="send-desk">
          <div className="send-desk__surface">
            <article className="quote-page">
              <header className="quote-page__header">
                <div>
                  <strong>Lumber Logic</strong>
                  <p className="quote-page__address">
                    1842 Timber Lane · Bend, OR 97701
                    <br />
                    (541) 555-0142 · quotes@lumberlogic.com
                  </p>
                </div>
                <div className="quote-page__meta">
                  <span className="quote-page__eyebrow">Quote</span>
                  <strong>{quoteNumber}</strong>
                  <p>Issued {dateLong(new Date().toISOString().slice(0, 10))}</p>
                  <p>Valid through {dateLong(validUntil)}</p>
                </div>
              </header>

              <div className="quote-chip">
                <strong>{customer}</strong>
                {contactLine && <span>{contactLine}</span>}
                <span>{ref}</span>
              </div>

              <div className={`quote-table ${!showUnit || isMobile ? 'quote-table--compact' : ''}`}>
                <div className="quote-table__head">
                  <span>Material</span>
                  {!isMobile && <span>Pcs</span>}
                  <span>Bd ft</span>
                  {showUnit && !isMobile && <span>$ per MBF</span>}
                  <span>Amount</span>
                </div>
                {quote.rows.map((row, i) => (
                  <div key={i} className="quote-table__row" style={{ background: row.band }}>
                    <div>
                      <strong>{row.species}</strong>
                      <span className="quote-table__grade">{row.grade}</span>
                      <span className="quote-table__dims">{row.dims}</span>
                    </div>
                    {!isMobile && <span>{fmt(row.pcs, 0)}</span>}
                    <span>{fmt(Math.round(row.bf), 0)}</span>
                    {showUnit && !isMobile && <span>${fmt(row.mbf, 0)}</span>}
                    <span>{money2(row.ext)}</span>
                  </div>
                ))}
              </div>

              <div className="quote-totals-wrap">
                <div className="quote-counts">
                  <p>{quote.rows.length} items</p>
                  <p>{fmt(quote.totalPcs, 0)} pieces</p>
                  <p>{fmt(Math.round(quote.totalBf), 0)} board feet</p>
                </div>
                <div className="quote-totals card-surface">
                  <div>
                    <span>Subtotal</span>
                    <strong>{money2(quote.subtotal)}</strong>
                  </div>
                  <div>
                    <span>Freight</span>
                    <strong>{money2(FREIGHT)}</strong>
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
                <span className="quote-note__eyebrow">Note from Casey Brooks</span>
                <p>{message}</p>
              </div>

              <footer className="quote-footer">
                Valid through {dateLong(validUntil)} · FOB Bend yard · Lumber Logic LLC
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
              showUnit={showUnit}
              setShowUnit={setShowUnit}
              delivery={delivery}
              setDelivery={setDelivery}
              total={quote.total}
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
            showUnit={showUnit}
            setShowUnit={setShowUnit}
            delivery={delivery}
            setDelivery={setDelivery}
            total={quote.total}
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
  showUnit: boolean
  setShowUnit: (v: boolean) => void
  delivery: 'email' | 'link' | 'pdf'
  setDelivery: (v: 'email' | 'link' | 'pdf') => void
  total: number
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
          { value: 'link', label: 'Share link' },
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
        Valid through
        <input type="date" value={props.validUntil} onChange={(e) => props.setValidUntil(e.target.value)} />
      </label>

      <div className="compose-total">
        <span>Quote total</span>
        <strong>{money2(props.total)}</strong>
      </div>

      <div className="compose-actions">
        <Button variant="primary" onClick={props.onSend} style={{ flex: 1, minHeight: 44 }}>
          Send quote
        </Button>
        <Button variant="icon" aria-label="Download PDF" onClick={props.onPrint}>
          ↓
        </Button>
      </div>
    </>
  )
}
