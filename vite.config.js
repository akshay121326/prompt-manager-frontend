import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  console.log('--- VITE BUILD DEBUG ---');
  console.log('Build Mode:', mode);
  console.log('VITE_FIREBASE_API_KEY detected:', !!env.VITE_FIREBASE_API_KEY);
  console.log('------------------------');

  return {
    plugins: [react()],
  }
})
