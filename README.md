# 💰 AUREUS · Asesor Financiero Personal & Gestión de Presupuesto

Aplicación web moderna de nivel profesional para la gestión inteligente del patrimonio personal, control integral de sueldos y fuentes de ingresos, seguimiento de gastos fijos y variables, monitoreo de retiros en efectivo con Asesor Inteligente en tiempo real, análisis predictivo y diagnóstico de salud financiera.

## 🚀 Tecnologías Principales
- **Frontend:** React 19 + TypeScript + Vite 8
- **Estilos:** Vanilla CSS / CSS Variables / Flexbox / CSS Grid (Diseño Oscuro Premium)
- **Visualización de Datos:** Recharts (Gráficos interactivos de barras y distribución)
- **Iconografía:** Lucide React
- **Testing Unitario:** Vitest 4
- **Linter & Calidad:** ESLint 9
- **Despliegue:** Vercel (Configurado con `vercel.json` para SPA)

---

## 🎯 Estado del Proyecto
- [x] **Fase 0:** Configuración de repositorio y convenciones Git.
- [x] **Fase 1:** Inicialización del proyecto con Vite + TypeScript.
- [x] **Fase 2:** Sistema de diseño base y layout 100% responsive (Mobile First, Tablet, Desktop).
- [x] **Fase 3:** Modelado de datos robusto en TypeScript (`finance.ts`, `navigation.ts`).
- [x] **Fase 4:** Módulo de gestión de ingresos multi-fuente (Sueldos, Freelance, Inversiones, Extras) con edición en línea.
- [x] **Fase 5:** Módulo de gastos clasificados (Fijos vs Variables) y retiros de efectivo con motor de Asesoría en vivo.
- [x] **Fase 6:** Dashboard integral con KPIs financieros en tiempo real, gráficos comparativos y balance neto.
- [x] **Fase 7:** Persistencia desacoplada (LocalStorage Repository Pattern con inicialización segura).
- [x] **Fase 8:** Motor de análisis predictivo y diagnóstico inteligente (Regla 50/30/20, Fondo de Emergencia, Veredicto de Inversión).
- [x] **Fase 9:** Accesibilidad (a11y), contrastes certificados, selectores de fecha en blanco nítido, soporte táctil (mínimo 44px) y micro-animaciones.
- [x] **Fase 10:** Testing unitario automatizado con Vitest (Asesor de efectivo, formateo de moneda y fechas).
- [x] **Fase 11:** Despliegue en producción preparado para Vercel.

---

## 📱 Características de Diseño Responsivo
- **Móviles (< 768px):** Barra de navegación inferior ergonómica (`BottomNav`), formularios en columna fluida, botones de acción de ancho completo y área táctil optimizada.
- **Tablets (768px - 1024px):** Cuadrículas elásticas de KPIs en 2 columnas, gráficos apilados y menú de navegación accesible.
- **Desktop (> 1024px):** Barra lateral de alta fidelidad, vistas en 3 columnas y comparativas lado a lado.
- **Inputs de Fecha:** Selector de calendario con contraste invertido en blanco luminoso sobre fondo oscuro en todos los navegadores.

---

## 🛠️ Instalación, Pruebas y Ejecución Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/Rosdevdr/manejo_finanzas.git

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Ejecutar pruebas unitarias automatizadas
npm run test

# 5. Compilar para producción
npm run build
```
