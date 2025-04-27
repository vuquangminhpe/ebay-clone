import './App.css'
import { ToastContainer } from 'react-toastify'
import { useContext, useEffect } from 'react'
import useRouteElement from './useRouteElement'
import { HelmetProvider } from 'react-helmet-async'
import { AppContext } from './Contexts/app.context'
import { getProfileFormLS, localStorageEventTarget } from './utils/auth'
import ThemeProvider from './components/ThemeProvider'
import { Toaster } from 'sonner'
import socket from './utils/socket'

function App() {
  const { reset } = useContext(AppContext)

  useEffect(() => {
    localStorageEventTarget.addEventListener('clearLocalStorage', () => reset())

    return () => localStorageEventTarget.removeEventListener('clearLocalStorage', () => reset())
  }, [reset])
  useEffect(() => {
    if (getProfileFormLS()) {
      socket.connect()
      socket.auth = {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        _id: getProfileFormLS()._id
      }
    }
  }, [])

  const useRouterElement = useRouteElement()
  
  return (
    <HelmetProvider>
      <ThemeProvider defaultTheme='light' storageKey='vite-ui-theme'>
       
       
        
        {useRouterElement}
        <ToastContainer />
        <Toaster />
      </ThemeProvider>
    </HelmetProvider>
  )
}

export default App
