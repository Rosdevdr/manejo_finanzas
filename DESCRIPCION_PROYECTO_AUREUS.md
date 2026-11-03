# AUREUS — Household Finance Dashboard
## Documento de Descripción del Proyecto, Arquitectura Contable y Flujo de Usabilidad

> **AUREUS (Edición Soberana Revolut Ultra × Stripe Bento)** es una plataforma de gestión financiera y patrimonial para el hogar en República Dominicana (`RD$ / DOP` con conversión multimoneda en vivo `US$ / USD`). Todos sus módulos operan sobre un **único motor contable reactivo en tiempo real**, garantizando integridad matemática, prevención estricta de sobregiros y trazabilidad completa de liquidez y pasivos.

---

## 1. Arquitectura y Estado Actual del Proyecto

### 1.1. Motor Contable Unificado y Fórmula de Liquidez Real
Toda la plataforma comparte una única fuente de verdad para el saldo disponible acumulado entre períodos (`calculateCumulativeBalance` en `src/utils/calendar.ts`), gobernada por la ecuación:

`Liquidez Disponible = Σ Ingresos - Σ Egresos Directos - Σ Retiros de Efectivo - Σ Pagos a Tarjetas`

- **Sincronización transversal:** Cualquier operación registrada en un módulo actualiza instantáneamente la **Liquidez Inmediata Disponible**, el **Flujo Neto del Ciclo**, los **Sobres de Presupuesto** y el **Asesor Financiero**.
- **Períodos dinámicos (`YYYY-MM`):** La semilla de demostración (`src/hooks/useFinanceStorage.ts`) se autogenera en el mes calendario presente y los dos meses previos para que la aplicación siempre inicie con datos vivos y comparables sin importar la fecha del sistema.

---

### 1.2. Escudo Anti-Sobregiro en Todas las Vías de Salida
AUREUS impide que el hogar gaste dinero líquido que no posee. El sistema bloquea cualquier intento de llevar la liquidez a terreno negativo en **6 puntos críticos**:
1. **Modal de Nuevo Gasto Directo** (`efectivo`, `débito`, `transferencia`): muestra una barra de consumo de saldo en vivo y deshabilita la confirmación si el monto supera la liquidez disponible.
2. **Modal de Retiro de Efectivo**: valida el monto contra la liquidez disponible antes de autorizar el retiro.
3. **Radar Centinela (`Marcar Pagado`)**: verifica fondos líquidos antes de descontar la factura fija y registrar el gasto.
4. **Captura Rápida Telegram Bot**: valida el monto extraído por lenguaje natural antes de conciliar el egreso.
5. **Abono a Tarjetas de Crédito**: permite abonos totales o parciales, pero impide abonar un monto mayor al saldo líquido disponible o mayor a la deuda actual del plástico.
6. **Aporte a Metas de Ahorro**: descuenta el aporte de la liquidez real o valida que no exceda los fondos disponibles.

> **Excepción Contable Inteligente (Tarjetas de Crédito):** Si el usuario no dispone de efectivo pero selecciona **Tarjeta de Crédito** como método de pago en un gasto, AUREUS permite la operación siempre que exista **crédito disponible** en el plástico seleccionado, incrementando el pasivo de la tarjeta sin restar liquidez inmediata hasta que se decida abonar a la tarjeta.

---

### 1.3. Conversión Cambiaria Spot (`RD$ ↔ US$`) en Tiempo Real
- Consulta fuentes financieras internacionales spot (`open.er-api.com` y `@fawazahmed0/currency-api`) con caché inteligente de 24 horas en `src/utils/currencyConverter.ts`.
- Si la tasa del día se mantiene sin variación o el dispositivo opera sin conexión, conserva la última tasa verificada e informa su estado mediante una píldora interactiva (`Al día · Spot`, `Sin cambios · Anterior` o `Base referencial`) con botón de sincronización manual (**Actualizar**).

---

### 1.4. Sistema Visual, Modales e Iconografía Semántica
- **Cero iconos genéricos de IA ni fuentes rotas:** Se eliminaron por completo los iconos de destellos (`Sparkles`) y ligaduras `material-symbols-outlined`. Toda la interfaz emplea iconografía vectorial semántica Lucide:
  - **Retorno y Cashback:** Flechas en espiral (`RefreshCw`) que representan retorno financiero cíclico.
  - **Asesor Financiero:** Iconos de objetivo (`Target`), escudo (`ShieldCheck`) y balanza (`Scale`).
- **Modales con Scroll Interno Independiente:** Todos los modales (`IncomeSection`, `ExpenseSection`, `CashWithdrawalsSection`, `CreditCardsView`, `BudgetsAndGoalsView` y `SentinelDashboardView`) se montan vía `createPortal(..., document.body)` con cabecera y pie fijos y scroll exclusivo en el cuerpo del formulario.
- **Tira de Notificaciones Unificada (`ToastContainer`):** Renderizada en `document.body` (`src/components/ui/ToastContainer.tsx` y `src/components/ui/ToastContainer.css`) con franja de acento lateral, insignia de icono semántico, jerarquía de título + detalle, espaciado blindado y adaptación nativa a Modo Claro y Modo Oscuro.

---

## 2. Flujo de Usabilidad Paso a Paso

El flujo de trabajo recomendado para operar las finanzas del hogar dentro de AUREUS sigue 6 etapas naturales:

### Paso 1: Alimentar la Bóveda de Liquidez (`Módulo de Ingresos`)
1. Dirígete a **Ingresos** y pulsa **Registrar Ingreso**.
2. Selecciona la categoría mediante el selector visual con iconos adaptativos (`Salario`, `Freelance`, `Inversiones`, `Regalo / Bono`, `Otros`), define si es recurrente y guarda.
3. **Efecto inmediato:** La tarjeta de **Liquidez Inmediata Disponible** se actualiza tanto en `RD$` como en su equivalente `US$` a la tasa del día.

### Paso 2: Programar y Liquidar Compromisos Fijos (`Consola Centinela`)
1. En **Consola Centinela**, revisa el **Radar de Compromisos (Próximos 30 Días)**.
2. Para registrar un nuevo contrato o recibo fijo, pulsa **+ Nuevo Compromiso**, elige su categoría con iconos (`Electricidad`, `Internet`, `Colegio`, `Agua`, `Préstamo / Tarjeta`), el día de corte, el monto estimado y la mora que evitas al pagar a tiempo.
3. Cuando pagues un servicio, pulsa **Marcar Pagado** en la fila correspondiente:
   - El sistema verifica tu liquidez disponible.
   - Descuenta el monto creando automáticamente el asiento contable en **Gastos** (`Pago Centinela: [Servicio]`).
   - Suma la penalidad evitada al indicador **Moras Evitadas**.
   - Despliega la tira de notificación confirmando el pago y registra el evento en la bitácora del **Centinela Bot**.

### Paso 3: Registrar Gastos Diarios y Retiros (`Gastos` / `Retiros` / `Telegram Bot`)
Tienes tres canales sincronizados para registrar salidas del día a día:
1. **Desde el módulo Gastos:**
   - Pulsa **Registrar Gasto**, elige categoría y método de pago.
   - Si eliges **Efectivo, Débito o Transferencia**, verás una barra de progreso en vivo que calcula qué porcentaje de tu saldo disponible consumirá el gasto y qué remanente te quedará.
   - Si eliges **Tarjeta de Crédito**, se desplegará el selector de tu tarjeta activa para cargarlo a tu línea de crédito sin tocar tu efectivo líquido.
2. **Desde el simulador Telegram Bot (en Consola Centinela):**
   - Escribe un mensaje natural (ej. `Supermercado Bravo 3450` o `Farmacia Carol 1200`).
   - El motor clasifica automáticamente la categoría (`Alimentación`, `Salud`, `Transporte`, `Servicios`), valida tu saldo y registra el gasto en tiempo real.
3. **Desde el módulo Retiros de Efectivo:**
   - Registra extracciones de cajero indicando el destino con iconos AUREUS (`Para la Casa`, `Billetera Personal`, `Fondo de Emergencia`, `Varios`), las cuales se descuentan inmediatamente de la liquidez bancaria.

### Paso 4: Administrar Deuda Rotativa y Cashback (`Tarjetas de Crédito`)
1. En **Tarjetas**, selecciona cualquier plástico del carrusel interactivo para inspeccionar su límite, balance utilizado, porcentaje de utilización y fecha de corte/pago.
2. **Registrar Consumo:** Añade compras a crédito que incrementan el balance de la tarjeta y calculan automáticamente el **Cashback Acumulado** (identificado con el icono de retorno en espiral `RefreshCw`).
3. **Pagar Tarjeta (Total o Parcial):** Pulsa **Pagar Tarjeta**, elige si deseas saldar el **Balance Total** o un **Abono Parcial** personalizado (`RD$`). Al confirmar:
   - Se reduce la deuda de la tarjeta seleccionada.
   - Se registra el egreso real en tu contabilidad (`Abono a tarjeta ...`), descontándolo de tu liquidez inmediata.

### Paso 5: Controlar Topes Mensuales y Construir Patrimonio (`Presupuestos y Metas`)
1. **Sobres de Presupuesto:** Define o ajusta el tope mensual (`RD$`) por categoría. Los sobres en **Consola Centinela**, **Resumen** y **Presupuestos** cambian de color (`Esmeralda → Ámbar → Rojo`) conforme tus gastos reales se acercan al límite.
2. **Metas de Ahorro:** Crea metas patrimoniales con fecha objetivo (`Fondo de Emergencia`, `Inicial de Vivienda`, `Viaje Familiar`) y utiliza el botón **+ Abonar a Meta** para transferir liquidez disponible hacia tus reservas de ahorro.

### Paso 6: Auditar tu Salud Financiera (`Asesor Financiero`)
1. Abre la pestaña **Asesor Financiero** (`src/components/ai/AIInsightsPanel.tsx`).
2. Consulta el diagnóstico dinámico del período activo:
   - **Capacidad de Gasto Seguro:** Cuánto puedes gastar hoy y por día sin comprometer tus obligaciones.
   - **Capacidad de Ahorro Real:** Excedente retenido frente a la meta recomendada del `20%`.
   - **Auditoría 50 / 30 / 20:** Comparativa exacta entre tus Necesidades Fijas (`50%`), Estilo de Vida (`30%`) y Ahorro/Futuro (`20%`).
   - **Alertas Accionables:** Tarjetas dinámicas que te avisan sobre concentración de gastos en una categoría, utilización elevada de crédito o facturas próximas a vencer en las siguientes 48 horas.

