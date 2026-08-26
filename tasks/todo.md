# Plan: Modo Oscuro con Animaciones (Sol / Luna)

- [x] Definir variables de diseño CSS (`:root` y `[data-theme="dark"]`) para modo claro y oscuro
- [x] Implementar la reactividad del tema en `App.vue` con soporte de `localStorage`
- [x] Crear el botón de switch interactivo (Sol/Luna) con animaciones CSS (rotación, resplandor, micro-animación)
- [x] Implementar la animación de apertura / transición suave al cambiar entre temas (View Transitions API + CSS)
- [x] Ajustar la vista previa de Markdown (tablas, citas, bloques de código, encabezados) para el modo oscuro
- [x] Verificar el comportamiento y la persistencia en el navegador (`pnpm build` exitoso)

## Revisión de Resultados
- Se incorporaron las variables CSS en `src/style.css` para cambiar instantánea y suavemente todos los componentes (topbar, document bar, editor, toolbar, vista previa y footer).
- Se implementó en `src/App.vue` el botón de conmutación de switch animado con iconos de Sol (modo claro) y Luna (modo oscuro).
- Se agregó la animación de apertura radial mediante View Transitions API con fallback a transición suave CSS.
- Se mantiene la persistencia del tema seleccionado en `localStorage`.
