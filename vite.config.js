import { reactRouter } from "@react-router/dev/vite"
import { fileURLToPath, URL } from "url"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"

export default defineConfig({
  base: "/assets-trac/",
  plugins: [reactRouter(), svgr()],
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
