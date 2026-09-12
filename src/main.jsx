import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyTheme, getTheme } from '@/lib/theme'

applyTheme(getTheme())

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)