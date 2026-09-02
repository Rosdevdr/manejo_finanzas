/**
 * Descargador oficial de Términos y Condiciones del Servicio AUREUS Wealth Advisor
 */

export function downloadTermsAndConditionsDocument() {
  const content = `================================================================================
           AUREUS WEALTH ADVISOR — TÉRMINOS Y CONDICIONES DE USO (2026)
                  ACUERDO INSTITUCIONAL DE SERVICIO Y PRIVACIDAD
================================================================================
Última actualización: 2026
Versión: 2.4 Institucional
Entidad: AUREUS Financial Software System

--------------------------------------------------------------------------------
RESUMEN EJECUTIVO (EN LENGUAJE CLARO)
--------------------------------------------------------------------------------
1. TU DINERO ES TUYO: AUREUS es una plataforma de software analítico. No es un
   banco, no custodia fondos ni ejecuta movimientos sin tu consentimiento.
2. PRIVACIDAD TOTAL: Tus datos están protegidos por Row Level Security (RLS) y no
   se venden a anunciantes ni se usan para entrenar inteligencias artificiales públicas.
3. LIBERTAD DE SALIDA: Puedes exportar todos tus movimientos o borrar tu cuenta en
   cualquier momento con un solo clic.
4. HERRAMIENTA ORIENTATIVA: Las proyecciones matemáticas y de IA son informativas y
   pedagógicas; las decisiones finales de gasto o inversión son siempre tuyas.

--------------------------------------------------------------------------------
CLÁUSULA 1: ACEPTACIÓN DEL ACUERDO
--------------------------------------------------------------------------------
Al registrarte, acceder o utilizar la plataforma web o móvil de AUREUS ("el Servicio"),
manifiestas tu conformidad libre y voluntaria con estos Términos y Condiciones. Si
no estás de acuerdo con alguna disposición, puedes dejar de utilizar la plataforma
y solicitar la eliminación de tu cuenta sin penalización alguna.

--------------------------------------------------------------------------------
CLÁUSULA 2: NATURALEZA DEL SERVICIO
--------------------------------------------------------------------------------
2.1. AUREUS proporciona herramientas de registro presupuestario, cálculo de amortizaciones,
     simulación de regla 50/30/20, seguimiento de libertad financiera (FIRE) y un Asesor IA.
2.2. En ningún momento AUREUS actúa como institución de captación bancaria, casa de
     bolsa, corredor de valores ni asesor financiero registrado. El usuario es el único
     responsable de contrastar sus datos con sus estados de cuenta bancarios reales.

--------------------------------------------------------------------------------
CLÁUSULA 3: SEGURIDAD, CUENTAS Y CONTROL DE ACCESO
--------------------------------------------------------------------------------
3.1. El usuario es responsable de mantener la confidencialidad de sus credenciales de
     acceso y de habilitar contraseñas seguras.
3.2. Los datos ingresados están aislados a nivel de fila (RLS), asegurando que ningún
     otro usuario ni administrador no autorizado acceda a la información patrimonial.

--------------------------------------------------------------------------------
CLÁUSULA 4: USO DE INTELIGENCIA ARTIFICIAL Y DISCLAIMER
--------------------------------------------------------------------------------
4.1. El Asesor IA responde a solicitudes analíticas formuladas por el usuario en tiempo
     real. Sus diagnósticos tienen carácter informativo y educativo.
4.2. AUREUS cumple con el Reglamento Europeo de IA (EU AI Act, Reglamento UE 2024/1689).
     Ninguna consulta es almacenada de forma persistente para el entrenamiento de modelos
     públicos globales.

--------------------------------------------------------------------------------
CLÁUSULA 5: PROPIEDAD INTELECTUAL
--------------------------------------------------------------------------------
5.1. El código fuente, logotipos, arquitectura de diseño y marcas de AUREUS son
     propiedad exclusiva de sus creadores y desarrolladores.
5.2. El usuario conserva la propiedad 100% soberana sobre los datos financieros que
     registre en la plataforma.

--------------------------------------------------------------------------------
CLÁUSULA 6: DISPONIBILIDAD Y TERMINACIÓN
--------------------------------------------------------------------------------
6.1. AUREUS se esfuerza por mantener una disponibilidad continua del 99.9%. No obstante,
     se reserva el derecho de realizar mantenimientos preventivos programados.
6.2. El usuario puede dar por terminado este acuerdo en cualquier momento exportando
     sus datos y borrando su cuenta desde el panel de Seguridad.

================================================================================
AUREUS Wealth Advisor · Compromiso Institucional con la Confianza y Transparencia
================================================================================
`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'AUREUS_Terminos_y_Condiciones_2026.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
