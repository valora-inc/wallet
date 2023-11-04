import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const extensions = [
  '.web.tsx',
  '.tsx',
  '.web.ts',
  '.ts',
  '.web.jsx',
  '.jsx',
  '.web.js',
  '.js',
  '.css',
  '.json',
]

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: extensions,
    },
  },
  plugins: [react()],
  resolve: {
    // alias: {
    //   'react-native': 'react-native-web',
    // },
    alias: [
      { find: 'react-native', replacement: 'react-native-web' },
      { find: 'src', replacement: resolve(__dirname, './src') },
    ],
    extensions: extensions,
  },
})
