import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  let apiURL = env.VITE_API_URL || 'https://dms-cab-service-d2up.onrender.com/api/v1';

  // Ensure that the API URL ends with /api/v1 to prevent 404 router errors
  if (apiURL && !apiURL.endsWith('/api/v1')) {
    apiURL = apiURL.replace(/\/$/, '') + '/api/v1';
  }

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Inline the API URL fallback for build time
      'import.meta.env.VITE_API_URL': JSON.stringify(apiURL)
    },
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : []
    },
    build: {
      // Disable source maps in production to increase build speed and reduce file footprint
      sourcemap: false,

      // Inline assets smaller than 8KiB as base64 to save HTTP round-trip latency
      assetsInlineLimit: 8192,

      // Production Rollup Code-Splitting and Manual Chunking
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Group heavy map frameworks
            if (id.includes('node_modules/leaflet')) {
              return 'vendor-maps';
            }
            // Group React core frameworks
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/')
            ) {
              return 'vendor-react';
            }
            // Group React Router frameworks
            if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
              return 'vendor-router';
            }
            // Group heavy animation libraries
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion-dom') || id.includes('node_modules/motion-utils')) {
              return 'vendor-animations';
            }
            // Group heavy icon assets
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
          }
        }
      }
    }
  };
})
