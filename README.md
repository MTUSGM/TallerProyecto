# TallerProyecto — Laboratorio de Fractales Complejos

Aplicación web educativa para explorar iteraciones de funciones complejas y visualizar la órbita de puntos seleccionados.

## Funciones incluidas

- Mandelbrot y Julia.
- Multibrot de grado 3 y 4.
- Polinomios personalizados.
- sin(z), cos(z), exp(z) y otras funciones mediante el editor de expresiones.
- Burning Ship.
- Tricorn.
- Expresiones con +, -, *, /, ^, paréntesis y signo unario.

## Visualización

- Paleta principal **amarillo → rojo → negro**: representa la velocidad relativa de escape.
- Suavizado de color para evitar bandas visibles.
- Zoom con rueda y desplazamiento con arrastre.
- Aumento automático de iteraciones al hacer zoom.
- Coordenadas complejas del cursor.
- Órbita animada del punto seleccionado.
- Gráfica de |z_n| en escala logarítmica.
- Exportación del fractal como PNG.
- Guardado y carga de configuraciones JSON.

## Optimización

Mandelbrot, Julia y las funciones cuadráticas comunes utilizan un camino de cálculo optimizado por píxel, evitando crear objetos complejos innecesariamente para cada iteración. La imagen se genera directamente con ImageData.

## Ejecutar localmente

No requiere Node.js ni dependencias.

1. Descarga el repositorio.
2. Descomprime el ZIP.
3. Abre index.html en Chrome, Edge o Firefox.

Para una experiencia más consistente también puedes servir la carpeta con un servidor local:

    python -m http.server 8000

y abrir http://localhost:8000.

## GitHub Pages

El repositorio incluye un workflow en .github/workflows/pages.yml.

1. Ve a **Settings → Pages**.
2. En **Build and deployment**, selecciona **GitHub Actions**.
3. Ejecuta el workflow o haz push a main.
