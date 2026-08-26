# Plan de Preparación para GitHub Pages

- [x] Corregir el script de construcción (`build`) en `package.json` (`"vite build"`)
- [x] Configurar el `base` path en `vite.config.js` (`base: '/Markdown-studio/'`)
- [x] Crear el archivo `public/.nojekyll` para deshabilitar Jekyll en GitHub Pages
- [x] Solucionar regla de `pnpm-workspace.yaml` agregando el campo `packages: - '.'`
- [x] Eliminar el flujo duplicado `jekyll-gh-pages.yml` que sobrescribía la compilación de Vite
- [x] Probar la construcción local del sitio (`pnpm build`) y verificar la carpeta `dist`

## Diagnóstico Final Solucionado
- Existían dos flujos de GitHub Actions ejecutándose al mismo tiempo: `Deploy to GitHub Pages` (el de Vite) y `Deploy Jekyll with GitHub Pages dependencies preinstalled` (creado automáticamente por GitHub).
- El flujo de Jekyll se ejecutaba después y sobrescribía el despliegue con los archivos fuente sin compilar (`/src/main.js`).
- Se eliminó `.github/workflows/jekyll-gh-pages.yml` y se envió el commit a `main`.
