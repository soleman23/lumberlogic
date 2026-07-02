import { Outlet } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BottomTabBar } from '../components/BottomTabBar'
import { Toast } from '../components/Toast'

export function AppLayout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="app-main">
        <Outlet />
      </main>
      <BottomTabBar />
      <Toast />
    </div>
  )
}
