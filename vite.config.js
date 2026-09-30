import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// HTTPS + host dibutuhkan agar kamera bisa dipakai dari HP saat development
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: { host: true, https: true },
})
