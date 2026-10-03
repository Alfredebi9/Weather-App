import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
// Open-Meteo and Geoapify both support CORS, so no dev proxy is required.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
