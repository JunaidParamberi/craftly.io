
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third parameter set to '' allows loading all environment variables.
  // Fix: Cast process to any to resolve "Property 'cwd' does not exist on type 'Process'" error.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // This replacement mapping ensures process.env.API_KEY is available in the browser.
      // It checks both the .env file (env.API_KEY) and the shell environment (process.env.API_KEY).
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    server: {
      port: 3000,
      open: true
    }
  };
});
