## Orquestación del Flujo de Trabajo

### 1. Modo Plan por Defecto
- Entrega en modo plan para CUALQUIER tarea no trivial (3+ pasos o decisiones de arquitectura)
- Si algo se tuerce, detente y vuelve a planificar de inmediato; no sigas empujando
- Usa el modo plan también para los pasos de verificacion, no solo para construir
- Escribe especificaciones detalladas desde el principio para reducir la ambigüedad

### 2. Estategia de Subagentes
- Usa subagentes sin problema para mantener limpia la ventana de contexto principal
- Delega investigación, exploración y análisis en paralelo a subagentes
- Para problemas complejos, asigna más capacidad de cómputo mediante subagentes
- Una tarea por subagente para una ejecución enfocada

### 3. Bucle de Auto-mejora
- Después de CUALQUIER correccion del usuario: actualiza 'tasks/lessons.md' con el patrón
- Escribe reglas para ti mismo que eviten repetir el mismo error
- Itera sin piedad sobre estas lecciones hasta que baje la tasa de errores
- Revisa las lecciones al inicio de la sesión para el proyecto relevante

### 4. Verificación Antes de Darlo por Hecho
- Nunca marques una tarea como completa sin demostrar que funciona
- Compara el comportamiento entrre main y tus cambios cuando sea relevante
- Pregúntate: "¿Lo aprobaría un staff engineer?"
- Ejecuta pruebas, revisa logs y demuestra que es correcto

### 5. Exige Elegancia (Equilibrada)
- Para los cambios no triviales: haz una pausa y pregúntate "¿hay una forma más elegante?"
- Si una solución se siente chapucera: "Sabiendo todo lo que sé ahora, implementa la solucion elegante"
- Cuestiona tu propio trabajo antes de presentarlo

### 6. Corrección Autónoma de bugs
- Cuando te den un reporte de bug: Simplemente arreglalo. no pidas que te lleven de la mano
- Señala logs, errores y tests que fallan, luego resuélvelos
- Cero cambios de contexto requeridos por parte del usuario
- ve y arregla los tests fallidos del CI sin que te digan como

### Gestión de Tareas
1. **Planifica Primero**: Escribe el plan en 'task/todo.md' con elementos verificables
2. **Verifica el Plan**: Haz un check-in antes de empezar con la implementación
3. **Haz Seguimiento del Progress**: Marca los elementos como completados a medida que avanzas
4. **Explica los Cambios**: Resumen de alto nivel en cada paso
5. **Documenta los Resultados**: Añade una seccion de revisión an 'task/todo.md'
6. **Captura Lecciones**: Actualiza 'task/lessons.md' después de las correcciones
7. **Siempre Remata**: Siempre depues de un cambio automaticamente remata la solucion dando un mensaje claro para commits, utilizando las mejores practicas de conventional commits y el estandar para los prefijos
8. **No uses punto final ni puntos suspensivos en tus mensajes**: No usar punto final en los mensajes sugeridos
9. **Añade todo el contexto que sea necesario en el cuerpo del mensaje de commit**: Sé corto y conciso. Si tienes mucho que explicar… seguramente es que tu commit hace demasiadas cosas. ¿Puedes separarlo en diferentes commits? Pues hazlo.
10. **Sé conciso pero con el contexto necesario**: Un mensaje de commit debe ser conciso pero debe explicar el cambio de forma clara. No debe repetir el código.


## Principios Fundamentales
- **La Simplicidad Primero**: Haz cada cambio tan simple como sea posible. Impacta el mínimo código necesario
- **La Corrección Antes que la Perfección**: Asegúrate de que funciona antes de buscar la solución óptima
- **Nada de Pereza**: Encuentra las causas raíz. Nada de arreglos temporales. Estándares de un desarrollador senior.
- **Impacto Mínimo**: Los cambios solo deben tocar lo necesario. Evita introducir bugs.
