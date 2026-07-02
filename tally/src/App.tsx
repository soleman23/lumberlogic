import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LoadsProvider } from './context/LoadsContext'
import { PricesProvider } from './context/PricesContext'
import { TallyProvider } from './context/TallyContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './layout/AppLayout'
import { CalculatorScreen } from './screens/CalculatorScreen'
import { SavedLoadsScreen } from './screens/SavedLoadsScreen'
import { PricesScreen } from './screens/PricesScreen'
import { SendQuoteScreen } from './screens/SendQuoteScreen'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <TallyProvider>
          <LoadsProvider>
            <PricesProvider>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route index element={<CalculatorScreen />} />
                  <Route path="loads" element={<SavedLoadsScreen />} />
                  <Route path="prices" element={<PricesScreen />} />
                  <Route path="send/:loadId" element={<SendQuoteScreen />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </PricesProvider>
          </LoadsProvider>
        </TallyProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
