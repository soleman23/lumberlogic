import { Link, useParams } from 'react-router-dom'
import { dateLong, fmt, money2 } from '../lib/formatters'
import { formatCompanyFooter } from '../domain/settings'
import { quoteRevisionRepository } from '../repositories/localStorage'
import { shareLinkService } from '../services/delivery'
import './SendQuoteScreen.css'

export function SharedQuoteScreen() {
  const { token = '' } = useParams()
  const link = token ? shareLinkService.getByToken(token) : undefined
  const revision = link ? quoteRevisionRepository.get(link.revisionId) : undefined

  if (!link || !revision) {
    return (
      <div className="send-page">
        <Link to="/" className="send-back">
          Lumber Logic
        </Link>
        <div className="empty-state card-surface">This quote link is unavailable or has been revoked.</div>
      </div>
    )
  }

  const settings = revision.companySnapshot

  return (
    <div className="send-page">
      <Link to="/" className="send-back">
        Lumber Logic
      </Link>
      <div className="send-desk">
        <div className="send-desk__surface">
          <article className="quote-page">
            <header className="quote-page__header">
              <div>
                <strong>{settings.displayName || settings.appName}</strong>
                <p className="quote-page__address">{formatCompanyFooter(settings)}</p>
              </div>
              <div className="quote-page__meta">
                <span className="quote-page__eyebrow">Quote</span>
                <strong>{revision.quoteNumber}</strong>
                <p>Issued {dateLong(revision.issuedAt)}</p>
                <p>Valid through {dateLong(revision.validUntil)}</p>
              </div>
            </header>

            <div className="quote-chip">
              <strong>{revision.customerName}</strong>
              {revision.contact && <span>{revision.contact}</span>}
              <span>{revision.sub}</span>
            </div>

            <div className="quote-table">
              <div className="quote-table__head">
                <span>Material</span>
                <span>Pcs</span>
                <span>Bd ft</span>
                <span>$ per MBF</span>
                <span>Amount</span>
              </div>
              {revision.lines.map((line) => (
                <div key={line.lineId} className="quote-table__row">
                  <div>
                    <strong>{line.species}</strong>
                    <span className="quote-table__grade">{line.grade}</span>
                    <span className="quote-table__dims">{line.dims}</span>
                  </div>
                  <span>{line.pcs > 0 ? fmt(line.pcs, 0) : '-'}</span>
                  <span>{fmt(Math.round(line.bf), 0)}</span>
                  <span>${fmt(line.sellingPricePerMbf, 0)}</span>
                  <span>{money2(line.extendedSelling)}</span>
                </div>
              ))}
            </div>

            <div className="quote-totals-wrap">
              <div className="quote-counts">
                <p>{revision.lines.length} items</p>
                {revision.totalPcs > 0 && <p>{fmt(revision.totalPcs, 0)} pieces</p>}
                <p>{fmt(Math.round(revision.totalBf), 0)} board feet</p>
              </div>
              <div className="quote-totals card-surface">
                <div>
                  <span>Subtotal</span>
                  <strong>{money2(revision.subtotal)}</strong>
                </div>
                <div>
                  <span>Freight</span>
                  <strong>{money2(revision.freight)}</strong>
                </div>
                <div>
                  <span>Tax</span>
                  <strong>{money2(revision.tax)}</strong>
                </div>
                <div className="quote-totals__due">
                  <span>Total due</span>
                  <strong>{money2(revision.total)}</strong>
                </div>
              </div>
            </div>

            <div className="quote-note">
              <span className="quote-note__eyebrow">Note from {settings.salespersonName}</span>
              <p>{revision.message}</p>
            </div>

            <footer className="quote-footer">
              Valid through {dateLong(revision.validUntil)} - {settings.shippingTerms} - {settings.paymentTerms}
            </footer>
          </article>
        </div>
      </div>
    </div>
  )
}
