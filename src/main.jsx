import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile.css'
import App from './App.jsx'

// Run legacy data migration (EngineerOS -> EngineerOS)
const keysToMigrate = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('engineeros_')) {
    keysToMigrate.push(key);
  }
}
keysToMigrate.forEach(oldKey => {
  const newKey = oldKey.replace('engineeros_', 'engineeros_');
  localStorage.setItem(newKey, localStorage.getItem(oldKey));
  localStorage.removeItem(oldKey);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
