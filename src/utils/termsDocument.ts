/**
 * Descargador oficial de Términos y Condiciones del Servicio AUREUS Wealth Advisor
 * Cumplimiento estricto: República Dominicana (Leyes 172-13, 183-02, 53-07, 358-05, 126-02)
 * y Estándares Internacionales (GDPR UE 2016/679, EU AI Act UE 2024/1689, PCI-DSS)
 */

export function getTermsAndConditionsContent(): string {
  return `================================================================================
           AUREUS WEALTH ADVISOR — TÉRMINOS Y CONDICIONES DE USO (2026)
        ACUERDO INSTITUCIONAL DE SERVICIO, PRIVACIDAD Y DERECHOS ARCO
================================================================================
Fecha de emisión y vigencia: 2026
Versión: 2.5 Institucional & Regulatoria
Jurisdicción Principal: República Dominicana (con alineación global GDPR / EU AI Act)
Entidad Operadora: AUREUS Financial Software System

--------------------------------------------------------------------------------
RESUMEN EJECUTIVO (EN LENGUAJE CLARO Y DIRECTO)
--------------------------------------------------------------------------------
1. TU DINERO ES TUYO: AUREUS es un software analítico y pedagógico de finanzas
   personales. NO ES UN BANCO ni una entidad de intermediación financiera regulada
   bajo la Ley No. 183-02 Monetaria y Financiera de la República Dominicana. No
   custodia fondos, no capta depósitos públicos ni ejecuta transferencias directas.
2. DERECHO AL OLVIDO Y PRIVACIDAD TOTAL: En estricto apego a la Ley No. 172-13
   sobre Protección de Datos de Carácter Personal y al Art. 17 del RGPD (GDPR),
   tus datos están protegidos por Row Level Security (RLS) y puedes solicitar en
   cualquier momento la supresión total, definitiva e irreversible de tu cuenta
   y registros financieros con un solo clic desde el panel de Seguridad.
3. CERO COMERCIALIZACIÓN DE DATOS: Tus registros financieros y consultas analíticas
   JAMÁS son vendidos a terceros, intermediarios de crédito ni utilizados para
   entrenar inteligencias artificiales públicas de acceso abierto.
4. LIBERTAD Y TRANSPARENCIA: Cumpliendo con la Ley No. 358-05 (Pro Consumidor),
   no existen cargos ocultos, penalidades de salida ni cláusulas de permanencia.
   Puedes exportar todos tus movimientos en formatos abiertos (JSON, CSV, PDF)
   cuando lo desees.

--------------------------------------------------------------------------------
CLÁUSULA 1: ACEPTACIÓN DEL ACUERDO Y VALIDEZ ELECTRÓNICA
--------------------------------------------------------------------------------
1.1. Al registrarte, acceder o utilizar la plataforma web, PWA o aplicación móvil
     de AUREUS ("el Servicio"), manifiestas tu consentimiento libre, previo,
     expreso, informado e inequívoco con el presente Acuerdo Institucional.
1.2. De conformidad con la Ley No. 126-02 sobre Comercio Electrónico, Documentos
     y Firmas Digitales de la República Dominicana, el consentimiento otorgado
     mediante medios telemáticos o clics de aceptación posee plena validez jurídica,
     fuerza ejecutoria y eficacia probatoria entre las partes.
1.3. Si en cualquier momento discrepas de alguna de las cláusulas aquí estipuladas,
     tienes el derecho inalienable de cesar el uso del servicio y ejercer de forma
     gratuita e inmediata tu derecho de cancelación y eliminación de cuenta.

--------------------------------------------------------------------------------
CLÁUSULA 2: NATURALEZA DEL SERVICIO Y EXENCIÓN EXPRESA DE INTERMEDIACIÓN FINANCIERA
--------------------------------------------------------------------------------
2.1. AUREUS es una plataforma puramente tecnológica y pedagógica orientada a la
     planificación presupuestaria, consolidación visual de pasivos, cálculo de
     metas de ahorro (Regla 50/30/20, independencia FIRE) y asistencia analítica
     asistida por algoritmos.
2.2. AVISO REGULATORIO (LEY NO. 183-02 MONETARIA Y FINANCIERA RD):
     AUREUS NO ES una Entidad de Intermediación Financiera (EIF) regulada por la
     Superintendencia de Bancos de la República Dominicana (SB) ni por la Junta
     Monetaria del Banco Central de la República Dominicana (BCRD). En consecuencia:
     a) AUREUS no capta recursos habituales o no habituales del público en general.
     b) AUREUS no realiza operaciones de crédito directo, captación ni inversión.
     c) AUREUS no emite moneda de curso legal, dinero electrónico ni activos virtuales.
2.3. RESPONSABILIDAD DEL USUARIO: Los balances, fechas de corte y límites de tarjeta
     registrados en la plataforma son ingresados por el usuario para su control
     personal. Es responsabilidad del usuario contrastar estos datos con sus
     estados de cuenta bancarios oficiales.

--------------------------------------------------------------------------------
CLÁUSULA 3: PROTECCIÓN DE DATOS PERSONALES Y DERECHOS ARCO (LEY NO. 172-13 & GDPR)
--------------------------------------------------------------------------------
3.1. En cumplimiento con la Ley No. 172-13 sobre Protección de Datos de Carácter
     Personal de la República Dominicana y el Reglamento General de Protección de
     Datos (GDPR, Reglamento UE 2016/679), AUREUS garantiza el ejercicio de los
     Derechos ARCO:
     - DERECHO DE ACCESO: El usuario puede consultar todos sus registros en cualquier
       momento a través de la interfaz o descargando sus respaldos íntegros.
     - DERECHO DE RECTIFICACIÓN: El usuario puede corregir, actualizar o editar
       cualquier transacción, cuenta o parámetro registrado.
     - DERECHO DE CANCELACIÓN (DERECHO AL OLVIDO): El usuario puede exigir y
       ejecutar la supresión total, inmediata e irreversible de su cuenta y todos
       sus registros asociados mediante la opción dedicada en el panel de Seguridad.
     - DERECHO DE OPOSICIÓN: El usuario puede desactivar el Asesor IA o negarse
       al tratamiento analítico de sus datos utilizando únicamente los módulos manuales.
3.2. PRINCIPIO DE FINALIDAD: Los datos recabados solo se emplean para renderizar los
     reportes y análisis financieros solicitados expresamente por el usuario dentro
     de su propia sesión privada.

--------------------------------------------------------------------------------
CLÁUSULA 4: SEGURIDAD DE LA INFORMACIÓN Y CIBERDELITOS (LEY NO. 53-07)
--------------------------------------------------------------------------------
4.1. En concordancia con la Ley No. 53-07 sobre Crímenes y Delitos de Alta
     Tecnología, AUREUS aplica rigurosos controles de seguridad lógica:
     a) ROW LEVEL SECURITY (RLS): Aislamiento a nivel de base de datos que restringe
        estrictamente el acceso a cada fila exclusivamente al usuario autenticado (auth.uid()).
     b) CIFRADO: Toda transmisión de datos se realiza bajo cifrado de grado militar
        TLS 1.3 / HTTPS. Las contraseñas se almacenan mediante hashes unidireccionales
        inviables de descifrar por ingeniería inversa.
     c) PROTECCIÓN DE DATOS BANCARIOS (PCI-DSS): AUREUS NUNCA solicita ni almacena
        el número de tarjeta completo (PAN de 16 dígitos), fecha de vencimiento
        completa ni códigos de seguridad CVV/CVC. Solo se almacena el apodo y los
        últimos 4 dígitos para control presupuestario personal.
4.2. AUTENTICACIÓN DE DOS FACTORES (2FA): AUREUS pone a disposición del usuario
     el estándar TOTP (Time-based One-Time Password) para blindar el acceso a su
     cuenta mediante aplicaciones autenticadoras reconocidas.

--------------------------------------------------------------------------------
CLÁUSULA 5: INTELIGENCIA ARTIFICIAL ÉTICA Y TRANSPARENCIA (EU AI ACT)
--------------------------------------------------------------------------------
5.1. El Asesor Financiero IA es un asistente analítico basado en modelos de lenguaje
     avanzados. De conformidad con el Artículo 50 del Reglamento Europeo de IA
     (EU AI Act, Reglamento UE 2024/1689) sobre transparencia de sistemas de IA:
     a) Se notifica expresamente que las respuestas son sintetizadas por un sistema de IA.
     b) Las recomendaciones no constituyen asesoramiento patrimonial colegiado ni oferta
        de valores regulada.
     c) Las consultas formuladas al Asesor IA se procesan de manera aislada y no se
        incorporan a repositorios de reentrenamiento de modelos públicos.

--------------------------------------------------------------------------------
CLÁUSULA 6: DERECHOS DEL CONSUMIDOR Y RETRACTO (LEY NO. 358-05)
--------------------------------------------------------------------------------
6.1. En acatamiento a la Ley General No. 358-05 de Protección de los Derechos del
     Consumidor o Usuario (Pro Consumidor):
     a) Cero cláusulas abusivas, cero cobros ocultos y cero renovaciones forzadas.
     b) Derecho a la finalización inmediata del servicio sin costes de salida ni
        penalización alguna.
     c) Portabilidad completa: derecho a descargar la información patrimonial en
        formatos universales abiertos (JSON, CSV, PDF) antes o después de la salida.

--------------------------------------------------------------------------------
CLÁUSULA 7: DERECHO AL OLVIDO Y PROCEDIMIENTO DE ELIMINACIÓN TOTAL
--------------------------------------------------------------------------------
7.1. Cualquier usuario que desee ejercer su Derecho al Olvido puede dirigirse al
     módulo "Seguridad & 2FA" dentro de la plataforma y presionar el botón
     "Eliminar Cuenta y Todos Mis Datos".
7.2. Al confirmar la solicitud mediante el mecanismo de verificación y fricción
     del sistema, se ejecutarán las siguientes acciones irreversibles:
     a) Supresión permanente de todas las filas en tablas de ingresos, gastos,
        retiros en efectivo, tarjetas de crédito, transacciones, presupuestos y metas.
     b) Destrucción de historiales de conversación y memoria del Asesor IA.
     c) Revocación inmediata de tokens de autenticación y cierre de sesión.

--------------------------------------------------------------------------------
CLÁUSULA 8: LEGISLACIÓN APLICABLE Y JURISDICCIÓN
--------------------------------------------------------------------------------
8.1. El presente acuerdo se rige e interpreta de conformidad con las leyes de la
     República Dominicana.
8.2. Para la resolución de cualquier discrepancia derivada de la interpretación o
     ejecución de este documento, las partes se someten a los mecanismos de
     resolución previstos por las leyes dominicanas aplicables, incluyendo la vía
     ante el Instituto Nacional de Protección de los Derechos del Consumidor
     (Pro Consumidor) para materias de consumo, y a los tribunales ordinarios de la
     República Dominicana.

================================================================================
AUREUS Wealth Advisor · Compromiso Inquebrantable con la Seguridad y la Confianza
================================================================================
`
}

export function downloadTermsAndConditionsDocument() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const content = getTermsAndConditionsContent()
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'AUREUS_Terminos_y_Condiciones_2026_RD_Global.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

