import { NavLink } from 'react-router-dom'
import { useBreakpoints } from '../hooks/useMediaQuery'
import './BottomTabBar.css'

const TABS = [
  {
    to: '/',
    label: 'Calculator',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="3" width="16" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 7.5h8M8 11.5h4M8 15.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/loads',
    label: 'Loads',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M4 8l8 4 8-4M12 12v8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/prices',
    label: 'Prices',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3v18M7 7.5h7a2.5 2.5 0 010 5H9a2.5 2.5 0 000 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
] as const

export function BottomTabBar() {
  const { isMobile, isShort } = useBreakpoints()
  if (!isMobile) return null

  return (
    <nav
      className="tabbar"
      role="tablist"
      aria-label="Main navigation"
      style={{ padding: isShort ? '6px 0 calc(6px + env(safe-area-inset-bottom))' : '7px 0 calc(9px + env(safe-area-inset-bottom))' }}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => `tabbar__tab ${isActive ? 'tabbar__tab--active' : ''}`}
          role="tab"
        >
          {tab.icon}
          <span className="tabbar__label" style={isShort ? { display: 'none' } : undefined}>
            {tab.label}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
