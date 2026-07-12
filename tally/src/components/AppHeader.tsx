import { NavLink, useNavigate } from 'react-router-dom'
import { useBreakpoints } from '../hooks/useMediaQuery'
import { useTally } from '../context/TallyContext'
import { BrandLogo } from './BrandLogo'
import { Button } from './Button'
import './AppHeader.css'

const NAV = [
  { to: '/', label: 'Calculator' },
  { to: '/loads', label: 'Saved loads' },
  { to: '/prices', label: 'Prices' },
  { to: '/settings', label: 'Settings' },
] as const

type Props = {
  action?: React.ReactNode
}

export function AppHeader({ action }: Props) {
  const { isMobile, isShort } = useBreakpoints()
  const { resetAll } = useTally()
  const navigate = useNavigate()

  return (
    <header className={`app-header ${isShort ? 'app-header--unstick' : ''}`}>
      <div className="app-header__inner">
        <div className="app-header__brand" onClick={() => navigate('/')} role="link" tabIndex={0}>
          <BrandLogo />
          <span className="app-header__wordmark">
            <span className="app-header__wordmark-dark">Lumber</span>{' '}
            <span className="app-header__wordmark-accent">Logic</span>
          </span>
        </div>

        {!isMobile && (
          <nav className="app-header__nav" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `app-header__link ${isActive ? 'app-header__link--active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="app-header__spacer" />

        {action}

        <Button variant="secondary" size="sm" onClick={resetAll} className="app-header__clear">
          {isMobile ? 'Clear' : 'Clear tally'}
        </Button>

        <div className="app-header__avatar" aria-hidden="true">
          CB
        </div>
      </div>
    </header>
  )
}
