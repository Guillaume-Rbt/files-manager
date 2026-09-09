import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import preact from "@preact/preset-vite";


export default defineConfig({
    plugins: [preact(), svgr({
        svgrOptions: {
            jsxRuntime: "classic-preact",
        }
    })],
    server: {
        proxy: {
            "/api": "http://localhost:8000/",
            "/files": {
                target: "http://localhost:8000",
                rewrite: (path) => path.replace(/^\/files/, "/public"),
            },
        },
        watch: {
            ignored: ["**/public/files/**"],
        },
    }

})