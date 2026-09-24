# 💰 AUREUS · Frontend Client (Web & Mobile)

Aplicación cliente de alta fidelidad para el sistema financiero **AUREUS Wealth Advisor**. Construida con React 19, TypeScript, Tailwind CSS v4, Recharts y Capacitor para Android, desacoplada por completo del backend para escalabilidad y mantenimiento profesional.

---

## 🏛️ Arquitectura Desacoplada (Frontend / Backend Independientes)

Este proyecto ha sido separado de un monorepo a dos repositorios independientes:
1. **Frontend Repo (`manejo_finanzas`)**: Interfaz de usuario, gráficos interactivos, modo oscuro/claro, PWA y cliente móvil Android.
2. **Backend Repo (`manejo_finanzas-backend`)**: API REST en Express + TypeScript, orquestador Gemini AI, pasarela de suscripciones Stripe, migraciones analíticas y suite automatizada de QA con Vitest/Supertest.

---

## 🚀 Tecnologías del Cliente
- **Core:** React 19 + TypeScript + Vite 8
- **Estilos:** Tailwind CSS v4 + Tokens de Diseño Stitch (Stripe + Revolut)
- **Modos:** Dark Mode ("Apex Obsidian") y Light Mode ("Apex Alabaster")
- **Visualización de Datos:** Recharts (Bento Grids, Donut de Distribución, Cash Flow)
- **Móvil:** Capacitor 8 (Soporte nativo para Android)
- **Testing:** Vitest 4
- **API Proxy:** Vite Server Proxy integrado hacia el backend (`http://localhost:3001`)

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
