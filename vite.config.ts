import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const modelName = process.env.MODEL_NAME || env.MODEL_NAME || 'gpt-5.5';
    const apiBaseUrl = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL || 'http://127.0.0.1:8787';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.MODEL_NAME': JSON.stringify(modelName),
        'process.env.VITE_MODEL_NAME': JSON.stringify(modelName),
        'process.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
