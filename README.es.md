# AUREUS · Panel de Control

> 🇬🇧 English version: [README.md](./README.md)

El cliente React de **AUREUS**, un asistente de finanzas del hogar sin fricción. Los gastos y pagos se capturan por chat (primero Telegram) mediante el [backend](https://github.com/Rosdevdr/manejo_finanzas-backend). Esta aplicación es el **panel opcional**: sirve para revisar reportes, ver próximos vencimientos y corregir lo que el asistente haya entendido mal.

> **Estado: en transición.** El cliente se construyó para la versión fintech original de AUREUS y todavía funciona con almacenamiento local. Se está adaptando para leer datos del nuevo backend. La versión anterior vive en la rama [`legacy-aureus`](../../tree/legacy-aureus).

## Rol en el sistema

```
Chat (Telegram / WhatsApp)  →  Backend (ledger + Centinela)  →  Panel (este repo)
```

- **Leer:** resúmenes de gastos, desglose por categoría, flujo de caja y próximos pagos.
- **Corregir:** cambiar una categoría o un monto; la corrección se envía al backend y se guarda como dato de entrenamiento.
- **No es una herramienta de captura:** el registro diario ocurre en el chat, no aquí.

## Stack tecnológico

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · Capacitor (Android, opcional) · Vitest · Vercel

## Hoja de ruta

- [x] Diseño responsivo con temas oscuro y claro
- [x] Dashboard con KPIs, gráficos e historial de flujo
- [x] Módulo de suscripciones y pagos eliminado (sin monetización por ahora)
- [ ] Reemplazar el almacenamiento local por la API del backend
- [ ] Autenticación contra el backend
- [ ] Vista del Centinela de pagos (vencimientos y estado de recordatorios)
- [ ] Flujo de corrección de gastos extraídos
- [ ] Vista del resumen semanal

## Inicio rápido

Requisitos: Node.js 20+ y npm 10+.

```bash
git clone https://github.com/Rosdevdr/manejo_finanzas.git
npm install
npm run dev      # servidor de desarrollo
npm run test     # pruebas unitarias
npm run build    # compilación de producción
```

El servidor de desarrollo redirige `/api` al backend en `http://localhost:3001`.

## Estrategia de ramas

| Rama | Propósito |
|---|---|
| `develop` | Desarrollo activo |
| `qa` | Pruebas de calidad y regresión |
| `main` | Estable, desplegada en Vercel |
| `legacy-aureus` | Copia congelada de la versión fintech original |
