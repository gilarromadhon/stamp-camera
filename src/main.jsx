import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Analytics />
    <SpeedInsights />
  </>,
)
