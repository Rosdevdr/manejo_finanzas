import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  X,
  Download,
  ShieldCheck,
  Lock,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Clock,
  Trash2,
  Scale,
  ExternalLink,
} from 'lucide-react'
import { downloadTermsAndConditionsDocument } from '../../utils/termsDocument'
import { triggerHaptic } from '../../utils/haptics'
import './TermsAndConditionsModal.css'

interface TermsAndConditionsModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenSecurity?: () => void
}

type TabKey = 'summary' | 'service' | 'ai' | 'privacy' | 'rights'

export function TermsAndConditionsModal({ isOpen, onClose, onOpenSecurity }: TermsAndConditionsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary')

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modalContent = (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal-card" onClick={e => e.stopPropagation()}>
        {/* ── HEADER ── */}
        <div className="terms-modal-header">
          <div className="terms-header-left">
            <div className="terms-icon-ring">
              <FileText size={22} className="text-gold" />
            </div>
            <div>
              <div className="terms-tag-pill">ACUERDO INSTITUCIONAL & LEGAL</div>
              <h2 className="terms-title">Términos y Condiciones de AUREUS</h2>
              <div className="terms-meta-strip">
                <span className="terms-meta-item">
                  <Scale size={12} className="text-gold" /> Leyes 172-13 & 183-02 RD
                </span>
                <span className="terms-meta-item">
                  <ShieldCheck size={12} className="text-emerald" /> RLS & Cifrado TLS
                </span>
                <span className="terms-meta-item">
                  <Clock size={12} /> Versión 2.5 Institucional
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="terms-close-btn"
            onClick={onClose}
            aria-label="Cerrar términos y condiciones"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── TABS SELECTOR ── */}
        <div className="terms-tabs-bar">
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              setActiveTab('summary')
            }}
          >
            <Sparkles size={13} />
            <span>Resumen Ejecutivo</span>
          </button>
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'service' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              setActiveTab('service')
            }}
          >
            <Scale size={13} />
            <span>Servicio (Ley 183-02)</span>
          </button>
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              setActiveTab('privacy')
            }}
          >
            <Lock size={13} />
            <span>Privacidad (Ley 172-13)</span>
          </button>
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              setActiveTab('ai')
            }}
          >
            <Sparkles size={13} />
            <span>IA (EU AI Act)</span>
          </button>
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'rights' ? 'active' : ''}`}
            onClick={() => {
              triggerHaptic('light')
              setActiveTab('rights')
            }}
          >
            <UserCheck size={13} />
            <span>Derecho al Olvido</span>
          </button>
        </div>

        {/* ── BODY SCROLLABLE AREA ── */}
        <div className="terms-modal-body">
          {/* TAB 1: RESUMEN AMIGABLE */}
          {activeTab === 'summary' && (
            <div className="terms-content-section fade-in">
              <div className="terms-intro-box">
                <h3 className="terms-intro-title">Transparencia, Rigor Legal y Protección de tus Datos</h3>
                <p className="terms-intro-desc">
                  Este servicio ha sido estructurado para ofrecer un entorno seguro, estricto y de máxima confianza
                  tanto bajo la <strong>legislación de la República Dominicana</strong> (Leyes 172-13, 183-02, 53-07, 358-05 y 126-02)
                  como bajo los <strong>estándares internacionales más rigurosos</strong> (GDPR y EU AI Act).
                </p>
              </div>

              <div className="terms-summary-grid">
                <div className="terms-card">
                  <div className="terms-card-header">
                    <div className="terms-card-icon gold">
                      <Scale size={18} />
                    </div>
                    <span className="terms-card-tag">LEY 183-02 RD</span>
                  </div>
                  <h4 className="terms-card-title">1. No Somos un Banco</h4>
                  <p className="terms-card-desc">
                    AUREUS es un software analítico y pedagógico. <strong>No capta depósitos públicos</strong>, no custodia dinero
                    ni otorga créditos. No sustituye a entidades bancarias supervisadas por la Superintendencia de Bancos (SB).
                  </p>
                  <div className="terms-card-footnote">✓ Cero intermediación financiera</div>
                </div>

                <div className="terms-card">
                  <div className="terms-card-header">
                    <div className="terms-card-icon emerald">
                      <Lock size={18} />
                    </div>
                    <span className="terms-card-tag">LEY 172-13 & RLS</span>
                  </div>
                  <h4 className="terms-card-title">2. Privacidad & Derechos ARCO</h4>
                  <p className="terms-card-desc">
                    Tus datos patrimoniales están compartimentados por <strong>Row Level Security (RLS)</strong>.
                    Nunca se venden a intermediarios ni se utilizan para publicidad. Tienes control soberano sobre tu información.
                  </p>
                  <div className="terms-card-footnote">✓ Datos cifrados y aislados por usuario</div>
                </div>

                <div className="terms-card">
                  <div className="terms-card-header">
                    <div className="terms-card-icon blue">
                      <Sparkles size={18} />
                    </div>
                    <span className="terms-card-tag">EU AI ACT (ART. 50)</span>
                  </div>
                  <h4 className="terms-card-title">3. IA Transparente & Ética</h4>
                  <p className="terms-card-desc">
                    El Asesor IA proporciona orientaciones matemáticas y presupuestarias orientativas.
                    <strong> Ninguna conversación se utiliza para entrenar modelos públicos abiertos</strong>.
                  </p>
                  <div className="terms-card-footnote">✓ Sin venta de prompts ni fugas de datos</div>
                </div>

                <div className="terms-card">
                  <div className="terms-card-header">
                    <div className="terms-card-icon purple">
                      <UserCheck size={18} />
                    </div>
                    <span className="terms-card-tag">DERECHO AL OLVIDO</span>
                  </div>
                  <h4 className="terms-card-title">4. Eliminación Total Inmediata</h4>
                  <p className="terms-card-desc">
                    Puedes exportar tus finanzas en JSON/CSV y <strong>destruir tu cuenta y todos tus datos de forma permanente</strong>
                    en cualquier momento desde el panel de Seguridad sin trabas ni penalidades (Ley 358-05).
                  </p>
                  <div className="terms-card-footnote">✓ Cancelación irreversible garantizada</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NATURALEZA DEL SERVICIO */}
          {activeTab === 'service' && (
            <div className="terms-content-section fade-in">
              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 1</span>
                <h3 className="terms-clause-title">Aceptación y Consentimiento Electrónico (Ley 126-02)</h3>
                <p className="terms-clause-text">
                  Al registrarte, iniciar sesión o utilizar AUREUS ("el Servicio"), manifiestas tu consentimiento voluntario,
                  expreso e informado con el presente acuerdo. De conformidad con la <strong>Ley No. 126-02 sobre Comercio Electrónico,
                  Documentos y Firmas Digitales de la República Dominicana</strong>, la manifestación de voluntad vía medios digitales
                  posee plena validez y fuerza vinculante.
                </p>
              </div>

              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 2</span>
                <h3 className="terms-clause-title">Exención Expresa de Intermediación Financiera (Ley No. 183-02)</h3>
                <p className="terms-clause-text">
                  AUREUS es un software aplicativo de gestión presupuestaria, cálculo de metas (Regla 50/30/20 y FIRE) y
                  consolidación analítica de pasivos.
                </p>
                <div className="terms-highlight-box gold">
                  <strong>Aviso Regulatorio Institucional (Superintendencia de Bancos RD):</strong>
                  AUREUS NO ES una Entidad de Intermediación Financiera (EIF) regulada bajo la Ley Monetaria y Financiera
                  No. 183-02 de la República Dominicana. AUREUS no capta depósitos del público, no presta fondos, no realiza
                  transferencias electrónicas ni custodia valores monetarios. El usuario es el único responsable de confrontar
                  sus cifras con sus estados de cuenta bancarios reales emitidos por sus entidades financieras reguladas.
                </div>
              </div>

              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 3</span>
                <h3 className="terms-clause-title">Transparencia y Protección al Consumidor (Ley No. 358-05)</h3>
                <p className="terms-clause-text">
                  En cumplimiento con la <strong>Ley No. 358-05 General de Protección de los Derechos del Consumidor o Usuario (Pro Consumidor)</strong>:
                  No existen cláusulas de permanencia forzosa ni cobros ocultos. El usuario tiene el derecho inalienable a terminar
                  el servicio en el momento que desee sin penalidad comercial ni requerimiento de intermediación humana.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACIDAD & RLS */}
          {activeTab === 'privacy' && (
            <div className="terms-content-section fade-in">
              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 4</span>
                <h3 className="terms-clause-title">Protección de Datos Personales y Derechos ARCO (Ley No. 172-13)</h3>
                <p className="terms-clause-text">
                  En estricto cumplimiento con la <strong>Ley No. 172-13 sobre Protección de Datos de Carácter Personal de la República Dominicana</strong>
                  y el estándar europeo <strong>GDPR (Reglamento UE 2016/679)</strong>, garantizamos el ejercicio íntegro de los derechos:
                </p>
                <ul className="terms-rights-list">
                  <li>
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span><strong>Acceso:</strong> Consultar y exportar íntegramente todos tus movimientos y saldos en JSON, CSV o TXT.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span><strong>Rectificación:</strong> Modificar cualquier ingreso, gasto o parámetro presupuestario en tiempo real.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span><strong>Cancelación (Olvido):</strong> Suprimir definitivamente tu cuenta y destruir todo registro financiero.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span><strong>Oposición:</strong> Utilizar el sistema sin interactuar con el módulo de inteligencia artificial.</span>
                  </li>
                </ul>
              </div>

              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 5</span>
                <h3 className="terms-clause-title">Ciberseguridad y Delitos Tecnológicos (Ley No. 53-07)</h3>
                <p className="terms-clause-text">
                  Conforme a la <strong>Ley No. 53-07 sobre Crímenes y Delitos de Alta Tecnología</strong>, AUREUS implementa:
                </p>
                <div className="terms-highlight-box">
                  <strong>1. Row Level Security (RLS):</strong> Cada registro en la base de datos está atado criptográficamente a tu ID de usuario autenticado.<br />
                  <strong>2. Cifrado TLS 1.3:</strong> Comunicaciones blindadas de extremo a extremo.<br />
                  <strong>3. Estándar PCI-DSS:</strong> AUREUS jamás almacena números de tarjeta completos (PAN de 16 dígitos) ni códigos CVV. Únicamente se registran los últimos 4 dígitos como identificador de conveniencia presupuestaria.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IA & DISCLAIMER */}
          {activeTab === 'ai' && (
            <div className="terms-content-section fade-in">
              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 6</span>
                <h3 className="terms-clause-title">Transparencia de IA (EU AI Act, Art. 50)</h3>
                <p className="terms-clause-text">
                  El Asesor AUREUS es un agente computacional asistido por modelos de lenguaje de inteligencia artificial.
                  En cumplimiento del <strong>Reglamento UE 2024/1689 (EU AI Act)</strong> sobre transparencia algorítmica:
                </p>
                <div className="terms-highlight-box blue">
                  <strong>Naturaleza Educativa y No Vinculante:</strong> Las respuestas y proyecciones del Asesor IA
                  son sintetizadas matemáticamente con fines educativos y de optimización presupuestaria. No constituyen
                  asesoramiento financiero regulado por casas de bolsa ni corredores de valores colegiados.
                </div>
              </div>

              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 7</span>
                <h3 className="terms-clause-title">Privacidad de las Conversaciones</h3>
                <p className="terms-clause-text">
                  Tus preguntas y consultas al Asesor IA se procesan de forma privada y <strong>no son vendidas ni utilizadas para entrenar
                  modelos públicos de terceros</strong>. Puedes borrar el historial del chat en cualquier momento.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DERECHOS DEL USUARIO & DERECHO AL OLVIDO */}
          {activeTab === 'rights' && (
            <div className="terms-content-section fade-in">
              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 8</span>
                <h3 className="terms-clause-title">Derecho al Olvido y Cancelación Definitiva (Ley 172-13 / GDPR Art. 17)</h3>
                <p className="terms-clause-text">
                  En AUREUS, tu derecho al olvido no es una promesa retórica; es una funcionalidad técnica directa y accesible.
                  Tienes la facultad de exigir y ejecutar la eliminación permanente, completa e irreversible de tu cuenta y de
                  todos tus datos financieros.
                </p>

                <div className="terms-highlight-box red-tint">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Trash2 size={20} className="text-red" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong style={{ color: '#F87171' }}>¿Cómo ejercer tu Derecho al Olvido en la plataforma?</strong>
                      <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.45, color: '#E4E4E7' }}>
                        1. Abre el menú de usuario o presiona el botón <strong>Seguridad</strong> en la barra superior.<br />
                        2. Localiza la sección <strong>"Zona de Peligro: Derecho a la Cancelación y al Olvido (Ley 172-13 / GDPR)"</strong>.<br />
                        3. Presiona <strong>"Eliminar Cuenta y Todos Mis Datos"</strong> e introduce la confirmación de seguridad requerida.<br />
                        4. Todos tus ingresos, gastos, tarjetas, retiros, presupuestos, metas y mensajes con el Asesor IA serán destruidos permanentemente de la base de datos y de tu almacenamiento local.
                      </p>
                    </div>
                  </div>
                </div>

                {onOpenSecurity && (
                  <div style={{ marginTop: 16 }}>
                    <button
                      type="button"
                      className="terms-btn-danger-shortcut"
                      onClick={() => {
                        onClose()
                        onOpenSecurity()
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Ir al Panel de Seguridad para Eliminar mi Cuenta</span>
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="terms-modal-footer">
          <button
            type="button"
            className="terms-btn-download"
            onClick={downloadTermsAndConditionsDocument}
          >
            <Download size={14} />
            <span>Descargar Documento Oficial (.txt)</span>
          </button>
          <button
            type="button"
            className="terms-btn-primary"
            onClick={onClose}
          >
            <CheckCircle2 size={15} />
            <span>Entendido y de Acuerdo</span>
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

