import { useSettings } from '../context/SettingsContext'
import { validateCompanySettings } from '../domain/settings'
import { PageHeader } from '../components/PageHeader'
import { Button } from '../components/Button'
import { useToast } from '../context/ToastContext'
import './SettingsScreen.css'

export function SettingsScreen() {
  const { settings, updateSettings, isComplete } = useSettings()
  const { showToast } = useToast()
  const issues = validateCompanySettings(settings)

  const handleSave = () => {
    if (isComplete) showToast('Settings saved')
    else showToast('Fill all required fields before sending quotes')
  }

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Company & quote settings"
        description="Required before sending customer quotes. Cade Baggerly appears as the salesperson."
      />

      {!isComplete && (
        <div className="settings-alert" role="alert">
          Complete required fields to enable quote delivery.
          <ul>
            {issues.filter((i) => i.blocking).map((i) => (
              <li key={i.field}>{i.message}</li>
            ))}
          </ul>
        </div>
      )}

      <form className="settings-form card-surface" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
        <fieldset>
          <legend>Company identity (required)</legend>
          <label>
            Legal name
            <input value={settings.companyLegalName} onChange={(e) => updateSettings({ companyLegalName: e.target.value })} required />
          </label>
          <label>
            Display / DBA name
            <input value={settings.displayName ?? ''} onChange={(e) => updateSettings({ displayName: e.target.value })} />
          </label>
          <label>
            Business address
            <input value={settings.address} onChange={(e) => updateSettings({ address: e.target.value })} required />
          </label>
          <label>
            Phone
            <input value={settings.phone} onChange={(e) => updateSettings({ phone: e.target.value })} required />
          </label>
          <label>
            Reply-to email
            <input type="email" value={settings.replyToEmail} onChange={(e) => updateSettings({ replyToEmail: e.target.value })} required />
          </label>
          <label>
            Shipping origin
            <input value={settings.shippingOrigin} onChange={(e) => updateSettings({ shippingOrigin: e.target.value })} required />
          </label>
          <label>
            Salesperson
            <input value={settings.salespersonName} onChange={(e) => updateSettings({ salespersonName: e.target.value })} required />
          </label>
        </fieldset>

        <fieldset>
          <legend>Quote defaults</legend>
          <label>
            Quote prefix
            <input value={settings.quotePrefix} onChange={(e) => updateSettings({ quotePrefix: e.target.value })} />
          </label>
          <label>
            Default validity (days)
            <input type="number" min={1} value={settings.defaultValidityDays} onChange={(e) => updateSettings({ defaultValidityDays: Number(e.target.value) })} />
          </label>
          <label>
            Default freight ($)
            <input type="number" min={0} value={settings.defaultFreight} onChange={(e) => updateSettings({ defaultFreight: Number(e.target.value) })} />
          </label>
          <label>
            Default tax rate (%)
            <input type="number" min={0} step={0.01} value={settings.defaultTaxRate} onChange={(e) => updateSettings({ defaultTaxRate: Number(e.target.value) })} />
          </label>
          <label>
            Tax destination
            <input value={settings.defaultTaxDestination} onChange={(e) => updateSettings({ defaultTaxDestination: e.target.value })} />
          </label>
          <label>
            Payment terms
            <input value={settings.paymentTerms} onChange={(e) => updateSettings({ paymentTerms: e.target.value })} />
          </label>
          <label>
            Shipping terms
            <input value={settings.shippingTerms} onChange={(e) => updateSettings({ shippingTerms: e.target.value })} />
          </label>
          <label>
            Default customer message
            <textarea rows={3} value={settings.defaultCustomerMessage ?? ''} onChange={(e) => updateSettings({ defaultCustomerMessage: e.target.value })} />
          </label>
          <label>
            Quote footer
            <textarea rows={2} value={settings.quoteFooter ?? ''} onChange={(e) => updateSettings({ quoteFooter: e.target.value })} />
          </label>
        </fieldset>

        <Button type="submit" variant="primary">Save settings</Button>
      </form>
    </>
  )
}
