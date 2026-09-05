/**
 * Generador y descargador del Documento Oficial de Normativas Globales de Inteligencia Artificial
 * y Cumplimiento Institucional de AUREUS Wealth Advisor (EU AI Act, NIST, OECD).
 */

export function downloadAiRegulationDocument() {
  const content = `================================================================================
          AUREUS WEALTH ADVISOR — MARCO REGULATORIO GLOBAL DE IA (2026)
  CUMPLIMIENTO NORMATIVO, PRIVACIDAD, TRANSPARENCIA Y SUPERVISIÓN ALGORÍTMICA
================================================================================
Fecha de emisión: 2026
Entidad emisora: AUREUS Global Wealth Governance & Compliance
Versión: 2.4 Institucional
Estado: VIGENTE Y CERTIFICADO

--------------------------------------------------------------------------------
1. DECLARACIÓN DE ALCANCE Y PRINCIPIOS
--------------------------------------------------------------------------------
AUREUS Wealth Advisor es un software de gestión patrimonial y financiera personal
diseñado para brindar trazabilidad analítica de ingresos, egresos, instrumentos
de crédito y objetivos de libertad financiera (FIRE).

El presente instrumento normativo formaliza el compromiso vinculante de AUREUS
con los estándares regulatorios internacionales más rigurosos relativos al uso,
gobernanza y ética de modelos de Inteligencia Artificial en plataformas digitales.

--------------------------------------------------------------------------------
2. MARCOS REGULATORIOS Y TRATADOS INTERNACIONALES APLICADOS
--------------------------------------------------------------------------------

A) REGLAMENTO (UE) 2024/1689 DE INTELIGENCIA ARTIFICIAL (EU AI ACT):
   - Clasificación de Riesgo: El Asesor IA de AUREUS está catalogado como sistema
     de "Riesgo Limitado / Propósito Específico" conforme al Título IV del Reglamento.
   - Transparencia Algorítmica (Art. 50): Los usuarios son notificados de manera
     inequívoca siempre que interactúan con un motor de lenguaje natural o análisis
     automatizado.
   - Prohibición de Prácticas Inaceptables (Art. 5): Queda estrictamente vedado el
     empleo de técnicas de manipulación cognitiva subconsciente o de clasificación
     social ("social scoring").

B) MARCO DE GESTIÓN DE RIESGOS DE IA DEL NIST (NIST AI 100-1):
   - Gobernanza y Gobernabilidad: Pruebas continuas de validez matemática, robustez
     ante ataques de inyección de prompts y control de sesgos presupuestarios.

C) PRINCIPIOS DE INTELIGENCIA ARTIFICIAL DE LA OCDE (OECD PRINCIPLES):
   - Diseño centrado en el bienestar de las personas, sostenibilidad patrimonial y
     rendición de cuentas humana (human accountability).

D) ESTÁNDAR INTERNACIONAL ISO/IEC 42001:2023:
   - Sistema de Gestión de Inteligencia Artificial aplicado a la integridad y
     trazabilidad de datos financieros.

--------------------------------------------------------------------------------
3. CÓMO SE INCLUYE Y OPERA AUREUS EN EL MARCO GLOBAL DE IA
--------------------------------------------------------------------------------

3.1. SOBERANÍA Y AISLAMIENTO DE DATOS (ROW LEVEL SECURITY - RLS):
   Toda información de transacciones, saldos, límites de crédito o identificadores
   personales reside en compartimentos estancos protegidos por políticas criptográficas
   de Row Level Security (RLS). Las consultas al Asesor IA se procesan en sesiones
   efímeras en memoria.

3.2. PROHIBICIÓN DE RE-ENTRENAMIENTO CON DATOS DE USUARIO:
   Bajo ninguna circunstancia los datos financieros, hábitos de consumo o conversaciones
   de los usuarios son utilizados para re-entrenar, alimentar ni calibrar modelos de
   lenguaje masivo (LLMs) públicos de terceros.

3.3. AUSENCIA DE AUTONOMÍA DE EJECUCIÓN TRANSACCIONAL:
   El motor de IA de AUREUS carece de facultades de ejecución autónoma sobre cuentas
   bancarias reales. No tiene acceso a números CVV completos ni autoriza débitos
   directos sin la confirmación presencial y explícita del titular.

3.4. DESCARGO DE ASESORAMIENTO FINANCIERO REGULADO (DISCLAIMER LEGAL):
   Las proyecciones patrimoniales, diagnósticos de ahorro y estimaciones de la regla
   FIRE son herramientas de educación financiera y simulación analítica. No constituyen
   asesoramiento de inversión personalizada, intermediación bursátil ni captación de
   depósitos regida por superintendencias de bancos o mercados de valores.

3.5. EXPLICABILIDAD Y AUDITORÍA MATEMÁTICA:
   Cada cálculo emitido por el sistema (Tasa de Ahorro, Margen de Seguridad, Tasa de
   Uso de Tarjetas) expone las fórmulas aritméticas universales empleadas, garantizando
   que no existan "cajas negras" arbitrarias en las recomendaciones.

--------------------------------------------------------------------------------
4. DERECHOS FUNDAMENTALES DEL USUARIO DE AUREUS
--------------------------------------------------------------------------------
1. Derecho de Acceso y Portabilidad: Exportación íntegra de sus datos financieros
   en formatos abiertos (JSON / CSV / PDF) en cualquier momento.
2. Derecho a la Supervisión Humana: Opción de operar el 100% de la plataforma en
   modalidad tradicional, prescindiendo del Asesor IA cuando lo desee.
3. Derecho a la Cancelación y Olvido: Eliminación inmediata y definitiva de toda
   información vinculada a su cuenta sin copias residuales en servidores activos.

--------------------------------------------------------------------------------
5. FIRMA INSTITUCIONAL Y VIGENCIA
--------------------------------------------------------------------------------
Este marco regulatorio entra en vigor de forma permanente a partir de su publicación
y es de aplicación obligatoria sobre todos los módulos del ecosistema AUREUS.

Comité de Cumplimiento Regulatorio y Ética Algorítmica
AUREUS Wealth Advisor · Plataforma Institucional
Contacto de Gobernanza: legal@aureus-advisor.internal
================================================================================
`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'AUREUS_Marco_Regulatorio_Global_IA_2026.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
