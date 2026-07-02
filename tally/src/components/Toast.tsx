import { useToast } from '../context/ToastContext'
import './Toast.css'

export function Toast() {
  const { message } = useToast()
  if (!message) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 13l4 4L19 7" stroke="#9FCBAE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {message}
    </div>
  )
}
