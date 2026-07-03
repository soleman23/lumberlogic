import { useState, type FormEvent } from 'react'
import type { LoadStatus, SavedLoad } from '../types'
import { Button } from './Button'
import { SegmentedControl } from './SegmentedControl'
import './SaveLoadModal.css'

export type SaveLoadMeta = Pick<
  SavedLoad,
  'name' | 'sub' | 'species' | 'status' | 'contact' | 'role' | 'email'
>

type Props = {
  onClose: () => void
  onSave: (meta: SaveLoadMeta) => void
}

export function SaveLoadModal({ onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [sub, setSub] = useState('')
  const [species, setSpecies] = useState('')
  const [contact, setContact] = useState('')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<LoadStatus>('Draft')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      sub: sub.trim() || 'New load',
      species: species.trim() || 'Mixed load',
      status,
      contact: contact.trim() || undefined,
      role: role.trim() || undefined,
      email: email.trim() || undefined,
    })
  }

  return (
    <div
      className="save-modal__overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <form
        className="save-modal card-surface"
        role="dialog"
        aria-modal="true"
        aria-label="Save load"
        onSubmit={handleSubmit}
      >
        <p className="save-modal__eyebrow">Save to tally book</p>
        <h2>Save load</h2>

        <label className="compose-field">
          Customer name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cascade Millworks"
            autoFocus
            required
          />
        </label>

        <div className="save-modal__row">
          <label className="compose-field">
            Reference / PO
            <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="PO 2231" />
          </label>
          <label className="compose-field">
            Species
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Doug Fir"
            />
          </label>
        </div>

        <div className="save-modal__row">
          <label className="compose-field">
            Contact person
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Dana Reeves"
            />
          </label>
          <label className="compose-field">
            Role
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Purchasing" />
          </label>
        </div>

        <label className="compose-field">
          Contact email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="purchasing@example.com"
          />
        </label>

        <SegmentedControl
          label="Status"
          options={[
            { value: 'Draft', label: 'Draft' },
            { value: 'Quoted', label: 'Quoted' },
          ]}
          value={status}
          onChange={setStatus}
        />

        <div className="save-modal__actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!name.trim()}>
            Save load
          </Button>
        </div>
      </form>
    </div>
  )
}
