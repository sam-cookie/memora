import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync, rmSync, unlinkSync } from 'fs'

const OUT_DIR = 'dist-ext'

function copyExtensionAssets(): Plugin {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      mkdirSync(OUT_DIR, { recursive: true })
      copyFileSync('manifest.json', `${OUT_DIR}/manifest.json`)
      copyFileSync('src/assets/memora.png', `${OUT_DIR}/memora.png`)

      // Vite mirrors the HTML source path into outDir.
      // Move panel.html to the outDir root so the manifest can reference it as "panel.html".
      const nested = path.join(OUT_DIR, 'src', 'extension', 'panel.html')
      const target = path.join(OUT_DIR, 'panel.html')
      if (existsSync(nested)) {
        copyFileSync(nested, target)
        unlinkSync(nested)
        rmSync(path.join(OUT_DIR, 'src'), { recursive: true, force: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/styles': path.resolve(__dirname, './src/styles'),
    },
  },
  base: '/',
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel: path.resolve(__dirname, 'src/extension/panel.html'),
        background: path.resolve(__dirname, 'src/extension/background.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
