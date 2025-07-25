import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite blocks unknown hostnames by default. When you expose your dev server
// through ngrok (or a similar tunnel) Telegram will access it via a random
// sub-domain like `c2c489ce7756.ngrok-free.app`. We explicitly allow that host
// so that the page loads inside Telegram.

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0 so ngrok can reach the dev server
    port: 5173,
    allowedHosts: ["fbf94b9b674e.ngrok-free.app"],
    proxy: {
      "/auth": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/invite": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/partnership": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/games": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    }
  },
});
