# 💌 Carta Animada Interactiva con Explosión de Corazones

Una hermosa página web interactiva con temática de sobre/carta romántica, inspirada en la ilustración y diseñada especialmente para verse y sentirse increíble en teléfonos móviles y cualquier pantalla.

---

## ✨ Características Principales

1. **Diseño fiel a la ilustración**:
   - Sobre rosa pastel con trazos estilo dibujo / cómic.
   - Corazones flotantes alrededor idénticos al boceto de referencia.
   - Corazón sello central interactivo con efecto pulsante (*"¡Tócame! ❤️"*).

2. **Animación de Apertura Realista en 3D**:
   - Al presionar el corazón o el sobre, la solapa superior se abre hacia arriba en 3D.
   - La hoja de papel (la carta) se desliza suavemente hacia afuera/arriba del sobre con física de rebote natural.

3. **Explosión y Caída de Corazones por Detrás**:
   - Un sistema de partículas en `<canvas>` de alto rendimiento (60fps) proyecta una **ráfaga de decenas de corazones que emergen por detrás de la carta**.
   - Los corazones se dispersan hacia arriba y hacia los lados y luego caen flotando con efecto de bamboleo (*flutter/sway*) y gravedad realista.
   - Lluvia ambiental suave de corazones mientras la carta esté abierta.
   - Tocar la pantalla con la carta abierta crea mini ráfagas interactivas.

4. **100% Responsivo para Móviles**:
   - Diseñado con unidades dinámicas (`100dvh`, `clamp()`) para adaptarse a cualquier tamaño de pantalla (iPhone, Samsung, Xiaomi, tablets y computadoras).
   - Botón *"Leer en grande 📖"* o toque en la carta que abre una vista de lectura en pantalla completa para leer cómodamente textos largos.

5. **Personalización del Mensaje**:
   - Botón *"Personalizar ✍️"* para cambiar el destinatario, el mensaje y la firma.
   - Incluye plantillas rápidas: *Amor 💕*, *Aniversario 🥂*, *Amistad 🌸* y *Ánimo ✨*.
   - Guarda automáticamente el mensaje en el navegador (`localStorage`).

6. **Efectos de Sonido y Música Romántica**:
   - Generación de sonido sintetizado en tiempo real con **Web Audio API** (sin depender de archivos externos que puedan fallar o tardar en cargar).
   - Acorde mágico tipo arpa/campanilla al abrir y efecto sonoro suave al cerrar.
   - Melodía romántica en bucle activable con el botón *"Melodía 🎵"*.

---

## 🚀 Cómo abrir y probar el proyecto

1. Simplemente haz doble clic en el archivo `index.html` para abrirlo directamente en tu navegador favorito (Chrome, Safari, Edge, Firefox).
2. Para probarlo en el teléfono:
   - Puedes abrirlo desde tu móvil compartiendo la carpeta o subiéndolo a plataformas gratuitas como **GitHub Pages**, **Vercel** o **Netlify**.
   - En tu computadora también puedes abrir las Herramientas de Desarrollador (`F12`), presionar el icono de dispositivo móvil (`Ctrl + Shift + M`) y probar cualquier modelo de teléfono (iPhone 14/15, Pixel, Galaxy, etc.).
