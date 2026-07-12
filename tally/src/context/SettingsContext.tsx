import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, isCompanySetupComplete } from '../domain/settings'
import type { CompanySettings } from '../domain/types'
import { settingsRepository } from '../repositories/localStorage'

type SettingsContextValue = {
  settings: CompanySettings
  updateSettings: (patch: Partial<CompanySettings>) => void
  isComplete: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(
    () => settingsRepository.load() ?? DEFAULT_SETTINGS,
  )

  useEffect(() => {
    settingsRepository.save(settings)
  }, [settings])

  const updateSettings = useCallback((patch: Partial<CompanySettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      isComplete: isCompanySetupComplete(settings),
    }),
    [settings, updateSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
