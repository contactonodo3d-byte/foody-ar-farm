import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
export default defineConfig({ base:process.env.FOODY_BASE_PATH||'/', plugins: [react(), ...(process.env.HTTPS === '1' ? [basicSsl()] : [])], server: { host: '0.0.0.0' } });
