import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "puzzle-trailing-slash",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url === "/puzzle" || request.url === "/how") {
            response.statusCode = 302;
            response.setHeader("Location", `${request.url}/`);
            response.end();
            return;
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url === "/puzzle" || request.url === "/how") {
            response.statusCode = 302;
            response.setHeader("Location", `${request.url}/`);
            response.end();
            return;
          }
          next();
        });
      },
    },
    react(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        puzzle: "puzzle/index.html",
        how: "how/index.html",
      },
    },
  },
});
