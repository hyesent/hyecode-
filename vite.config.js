import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react()],
  base: './',   // <-- ADD THIS
  css: {
    postcss: './postcss.config.js',
  }
})
