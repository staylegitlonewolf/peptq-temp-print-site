import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const devCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss: http: https:",
].join('; ');

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Content-Security-Policy': devCsp,
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': devCsp,
    },
  },
});
