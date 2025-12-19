import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend URL - when using two ngrok tunnels, change this to your backend ngrok URL
// Example: 'https://your-backend-url.ngrok-free.dev'
const BACKEND_URL = 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Allow external connections (required for ngrok)
    allowedHosts: [
      'juliane-nonlicentious-tackily.ngrok-free.dev',
      '.ngrok-free.dev', // Allow all ngrok subdomains
      '.ngrok.io' // Allow legacy ngrok domains
    ],
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false // Set to true if using HTTPS backend (ngrok uses HTTPS)
      }
    }
  }
});
