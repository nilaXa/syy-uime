import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        orders: resolve(__dirname, 'orders.html'),
        products: resolve(__dirname, 'products.html'),
        customers: resolve(__dirname, 'customers.html'),
      },
    },
  },
});
