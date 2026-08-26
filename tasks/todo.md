# Plan de Preparación para GitHub Pages

- [x] Corregir el script de construcción (`build`) en `package.json` (`"vite build"`)
- [x] Configurar el `base` path en `vite.config.js` (`base: '/Markdown-studio/'`)
- [x] Crear el archivo `public/.nojekyll` para deshabilitar Jekyll en GitHub Pages
- [x] Crear el flujo de trabajo de GitHub Actions (`.github/workflows/deploy.yml`) para despliegue automático
- [x] Probar la construcción local del sitio (`pnpm build`) y verificar la carpeta `dist`

## Diagnóstico del Error MIME (text/html)
- El error ocurre porque GitHub Pages está configurado actualmente en modo **"Deploy from a branch"** (desplegando el código fuente sin compilar directamente desde la rama `main`). Por ello, la página intenta cargar `/src/main.js` en lugar del bundle compilado en `dist/`.
- **Solución requerida**: Cambiar el origen de publicación en los ajustes del repositorio en GitHub (`Settings -> Pages -> Source: GitHub Actions`).
