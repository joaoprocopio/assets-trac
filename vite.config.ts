import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath, URL } from "url"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"

export default defineConfig(() => {
  return {
    plugins: [react(), svgr()],
    server: {
      port: 3000,
    },
    preview: {
      port: 3000,
    },
    resolve: {
      alias: {
        "~": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.indexOf(path.resolve(__dirname, "node_modules")) === 0) {
              return id.split("node_modules/")[1].split("/")[0]
            }
          },
        },
      },
    },
  }
})
