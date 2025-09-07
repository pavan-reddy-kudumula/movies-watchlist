import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AuthProvider from "../src/context/AuthContext.jsx"
import {ThemeProvider} from "../src/context/ThemeContext.jsx"

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </AuthProvider>,
)