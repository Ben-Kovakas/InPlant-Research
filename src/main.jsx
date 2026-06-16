import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // kept as the old reference demo
import AnsleyApp from './AnsleyApp.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AnsleyApp />
  </React.StrictMode>,
)
