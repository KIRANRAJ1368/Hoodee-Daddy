import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const apiUrl = env.VITE_API_URL || env.REACT_APP_API_URL || 'https://demoteamapi.saitechnosolutions.co.in';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      open: false,
    },
    define: {
      'process.env.PUBLIC_URL': JSON.stringify(''),
      'process.env.REACT_APP_API_URL': JSON.stringify(apiUrl),
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'process.env.REACT_APP_RAZORPAY_KEY': JSON.stringify(
        env.VITE_RAZORPAY_KEY || env.REACT_APP_RAZORPAY_KEY || 'rzp_test_TBPx9EL1T1aqhC'
      ),
      'process.env.VITE_RAZORPAY_KEY': JSON.stringify(
        env.VITE_RAZORPAY_KEY || env.REACT_APP_RAZORPAY_KEY || 'rzp_test_TBPx9EL1T1aqhC'
      ),
    },
  };
});
