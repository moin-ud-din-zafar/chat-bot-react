import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  base: '/chat-bot-react/', 
plugins: [
  tailwindcss(),
  react()
],


optimizeDeps: {
  include: ['react-markdown', 'remark-gfm'],
  

}
})
