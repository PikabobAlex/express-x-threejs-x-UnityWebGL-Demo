import { defineConfig } from 'vite'
import BasicSSL from '@vitejs/plugin-basic-ssl'
export default defineConfig({
    // set build directory to `dist`
    plugins: [BasicSSL()],
    server: {
        port: 4500,
        host: '0.0.0.0',
    },
    build: {
        outDir: '../'
    }
})