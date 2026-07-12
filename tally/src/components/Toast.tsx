import { IconCheck } from './Icons'
import { useToast } from '../context/ToastContext'
import './Toast.css'

export function Toast() {
  const { message } = useToast()
  if (!message) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <IconCheck size={17} />
      {message}
    </div>
  )
}
