# 🐕 Linaje Dóberman — Landing Page

Landing page para un criadero de cachorros Dóberman en Bogotá. El sitio muestra el catálogo de cachorros con su disponibilidad, precios y características, y convierte a las personas interesadas en contactos directos por WhatsApp.

🔗 **Demo en vivo:** [https://linaje-doberman.netlify.app/](https://linaje-doberman.netlify.app/)

---

## ✨ Características

- **Animación 360° del Dóberman controlada por scroll.** Secuencia de 105 imágenes (`.webp`) dibujadas en un `<canvas>` que avanzan a medida que el usuario hace scroll, con un modo alternativo en bucle para dispositivos móviles.
- **Catálogo de cachorros** en un carrusel interactivo, con estado (Disponible / Reservado / Vendido), precio, sexo, edad y color de cada cachorro.
- **Captación de clientes por WhatsApp**, con mensajes pre-cargados para agilizar el contacto y la reserva.
- **Diseño responsive**, adaptado a móvil, tablet y escritorio.
- **Scroll suave y animaciones de entrada** al recorrer la página.
- **Optimización para buscadores (SEO):** metaetiquetas, Open Graph para compartir en redes y datos estructurados (JSON-LD).
- **Preloader** de carga con la identidad de la marca.

---

## 🛠️ Tecnologías

- **HTML5** semántico
- **CSS3** (variables, Flexbox, Grid, diseño responsive)
- **JavaScript** (ES6+)
- **Librerías (vía CDN):**
  - [GSAP + ScrollTrigger](https://gsap.com/) — animaciones ligadas al scroll
  - [Lenis](https://lenis.studiofreight.com/) — scroll suave
  - [Swiper](https://swiperjs.com/) — carrusel de cachorros
- **Canvas API** — secuencia de imágenes del giro 360°

---

## 📁 Estructura del proyecto

```
linaje-doberman/
├── index.html              # Página principal
├── assets/
│   ├── css/
│   │   └── styles.css      # Estilos del sitio
│   ├── js/
│   │   └── main.js         # Lógica: scroll, 360°, carrusel, navegación
│   ├── img/                # Imágenes (cachorros, galería, logo, USP...)
│   └── frames/             # 105 frames del giro 360° del Dóberman (.webp)
└── README.md
```

---

## 🚀 Cómo verlo en local

Al usar rutas relativas y cargar frames, conviene servirlo con un servidor local en lugar de abrir el archivo directamente:

```bash
# Opción 1: con Python
python -m http.server 8000

# Opción 2: con la extensión "Live Server" de VS Code
# (clic derecho sobre index.html → "Open with Live Server")
```

Luego abre `http://localhost:8000` en el navegador.

---

## 👤 Autor

**Andrés León** — Estudiante de Ingeniería Mecatrónica y desarrollador web en formación.

- Proyecto desarrollado de forma autodidacta como primer proyecto web completo.
- LinkedIn: https://www.linkedin.com/in/andr%C3%A9s-felipe-le%C3%B3n-s%C3%A1nchez-29063339b/?skipRedirect=true

---

## 📝 Nota

Este es un proyecto personal con fines de aprendizaje y portafolio. Las imágenes y la marca "Linaje Dóberman" se usan con propósito demostrativo.
