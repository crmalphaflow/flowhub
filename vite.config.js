import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        receptionist: 'ki-rezeptionist.html',
        admin: 'admin.html',
        impressum: 'impressum.html',
        datenschutz: 'datenschutz.html',
        agb: 'agb.html',
      },
    },
  },
});
