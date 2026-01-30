import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['react-compiler'],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      /* 절대경로를 사용할때의 기준을 '@/' 로 시작하면 'src/' 로 시작된다고 설정한다. */
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      {
        find: '@pages',
        replacement: path.resolve(__dirname, 'src/Pages'),
      },
    ],
  },
})
