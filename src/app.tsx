import { PropsWithChildren } from 'react'
import { AppContextProvider } from './context/AppContext'

import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  return (
    <AppContextProvider>
      {children}
    </AppContextProvider>
  )
}

export default App
