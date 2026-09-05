import { useState } from 'react'
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
} from 'lucide-react'
import { downloadTermsAndConditionsDocument } from '../../utils/termsDocument'
import './TermsAndConditionsModal.css'

interface TermsAndConditionsModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabKey = 'summary' | 'service' | 'ai' | 'privacy' | 'rights'

export function TermsAndConditionsModal({ isOpen, onClose }: TermsAndConditionsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary')

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
              <div className="terms-tag-pill">DOCUMENTO INSTITUCIONAL OFICIAL</div>
              <h2 className="terms-title">Términos y Condiciones de AUREUS</h2>
              <div className="terms-meta-strip">
                <span className="terms-meta-item">
                  <Clock size={12} /> Lectura estimada: ~3 minutos
                </span>
                <span className="terms-meta-item">
                  <ShieldCheck size={12} className="text-emerald" /> Protección RLS
                </span>
                <span className="terms-meta-item">
                  Versión 2.4 Institucional (2026)
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

        {/* ── TABS SELECTOR (ANTI-FATIGA VISUAL) ── */}
        <div className="terms-tabs-bar">
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            <Sparkles size={13} />
            <span>Resumen Amigable</span>
          </button>
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'service' ? 'active' : ''}`}
            onClick={() => setActiveTab('service')}
          >
            <ShieldCheck size={13} />
            <span>Naturaleza del Servicio</span>
          </button>
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Sparkles size={13} />
            <span>Uso de IA & Disclaimer</span>
          </button>
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <Lock size={13} />
            <span>Privacidad & RLS</span>
          </button>
          <button
            type="button"
            className={`terms-tab-btn ${activeTab === 'rights' ? 'active' : ''}`}
            onClick={() => setActiveTab('rights')}
          >
            <UserCheck size={13} />
            <span>Tus Derechos</span>
          </button>
        </div>

        {/* ── BODY SCROLLABLE AREA ── */}
        <div className="terms-modal-body">
          {/* TAB 1: RESUMEN AMIGABLE */}
          {activeTab === 'summary' && (
            <div className="terms-content-section fade-in">
              <div className="terms-intro-box">
                <h3 className="terms-intro-title">Diseñado para que entiendas exactamente cómo te cuidamos</h3>
                <p className="terms-intro-desc">
                  Sabemos que los contratos largos cansan la vista y casi nadie los lee. Por eso, hemos extraído
                  los 4 compromisos fundamentales que rigen tu relación con AUREUS en palabras claras y directas:
                </p>
              </div>

              <div className="terms-summary-grid">
                <div className="terms-card">
                  <div className="terms-card-header">
                    <div className="terms-card-icon gold">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="terms-card-tag">CONTROL ABSOLUTO</span>
                  </div>
                  <h4 className="terms-card-title">1. Tu Dinero, Tus Decisiones</h4>
                  <p className="terms-card-desc">
                    AUREUS es un software analítico y pedagógico. <strong>No es un banco</strong>, no custodia fondos,
                    no tiene acceso a tus tarjetas reales ni moverá un solo centavo sin tu acción directa.
                  </p>
                  <div className="terms-card-footnote">✓ Cero débitos automáticos no deseados</div>
                </div>

                <div className="terms-card">
                  <div className="terms-card-header">
                    <div className="terms-card-icon emerald">
                      <Lock size={18} />
                    </div>
                    <span className="terms-card-tag">BLINDAJE RLS</span>
                  </div>
                  <h4 className="terms-card-title">2. Privacidad Inquebrantable</h4>
                  <p className="terms-card-desc">
                    Cada uno de tus ingresos y gastos está protegido por Row Level Security (RLS).
                    <strong> Nunca vendemos tus datos a intermediarios</strong> ni los usamos para publicidad.
                  </p>
                  <div className="terms-card-footnote">✓ Cifrado y compartimentación de datos</div>
                </div>

                <div className="terms-card">
                  <div className="terms-card-header">
                    <div className="terms-card-icon blue">
                      <Sparkles size={18} />
                    </div>
                    <span className="terms-card-tag">IA ÉTICA (EU AI ACT)</span>
                  </div>
                  <h4 className="terms-card-title">3. Asistente IA Transparente</h4>
                  <p className="terms-card-desc">
                    Las sugerencias del Asesor IA son orientaciones matemáticas y de optimización de presupuesto.
                    <strong> No sustituyen a un corredor de bolsa regulado</strong> ni captan inversiones.
                  </p>
                  <div className="terms-card-footnote">✓ Sin cajas negras ni manipulación</div>
                </div>

                <div className="terms-card">
                  <div className="terms-card-header">
                    <div className="terms-card-icon purple">
                      <UserCheck size={18} />
                    </div>
                    <span className="terms-card-tag">LIBERTAD TOTAL</span>
                  </div>
                  <h4 className="terms-card-title">4. Sin Ataduras ni Trampas</h4>
                  <p className="terms-card-desc">
                    Tus datos son 100% tuyos. Puedes <strong>exportar todo tu historial en JSON, CSV o PDF</strong>
                    o eliminar tu cuenta de forma definitiva cuando desees con un solo clic.
                  </p>
                  <div className="terms-card-footnote">✓ Portabilidad total garantizada</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NATURALEZA DEL SERVICIO */}
          {activeTab === 'service' && (
            <div className="terms-content-section fade-in">
              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 1</span>
                <h3 className="terms-clause-title">Aceptación y Alcance del Servicio</h3>
                <p className="terms-clause-text">
                  Al registrarte, navegar o utilizar la plataforma AUREUS ("el Servicio"), manifiestas tu conformidad
                  libre, informada e inequívoca con el presente documento. Si en cualquier momento discrepas de estas
                  disposiciones, puedes cancelar tu cuenta desde el panel de Seguridad sin penalizaciones.
                </p>
              </div>

              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 2</span>
                <h3 className="terms-clause-title">Funcionalidades y Responsabilidad del Usuario</h3>
                <p className="terms-clause-text">
                  AUREUS pone a tu disposición herramientas de visualización de liquidez, consolidación de pasivos,
                  control de efectivo, presupuestos por categorías y cálculo de objetivos patrimoniales (Regla 50/30/20 y FIRE).
                </p>
                <div className="terms-highlight-box">
                  <strong>Responsabilidad de Veracidad:</strong> El usuario es el único responsable de la exactitud
                  de los montos, fechas y conceptos ingresados. AUREUS calcula diagnósticos sobre los datos que tú decides registrar.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTELIGENCIA ARTIFICIAL & DISCLAIMER */}
          {activeTab === 'ai' && (
            <div className="terms-content-section fade-in">
              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 3</span>
                <h3 className="terms-clause-title">Operación del Asesor de Inteligencia Artificial</h3>
                <p className="terms-clause-text">
                  El Asesor IA de AUREUS es un motor analítico avanzado diseñado para sintetizar tus movimientos financieros
                  y ofrecer sugerencias de optimización presupuestaria en tiempo real.
                </p>
              </div>

              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 4</span>
                <h3 className="terms-clause-title">Descargo de Responsabilidad Financiera (Disclaimer Legal)</h3>
                <p className="terms-clause-text">
                  Las proyecciones de ahorro, simulaciones de jubilación FIRE y recomendaciones emitidas por el Asesor IA
                  tienen carácter pedagógico, matemático y orientativo.
                </p>
                <div className="terms-highlight-box gold">
                  <strong>Aviso Regulatorio:</strong> AUREUS Wealth Advisor no es una entidad bancaria ni presta
                  asesoramiento financiero regulado bajo superintendencias de valores o bancos centrales. Cualquier
                  decisión de endeudamiento o inversión debe ser contrastada con asesores profesionales autorizados.
                </div>
              </div>

              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 5</span>
                <h3 className="terms-clause-title">Cumplimiento del Reglamento Europeo de IA (EU AI Act)</h3>
                <p className="terms-clause-text">
                  AUREUS categoriza este motor como sistema de riesgo limitado (Art. 50, Reglamento UE 2024/1689).
                  Ningún dato de tus conversaciones o saldos se utiliza para entrenar modelos LLM públicos abiertos.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: PRIVACIDAD & SEGURIDAD */}
          {activeTab === 'privacy' && (
            <div className="terms-content-section fade-in">
              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 6</span>
                <h3 className="terms-clause-title">Políticas de Seguridad y Aislamiento RLS</h3>
                <p className="terms-clause-text">
                  La arquitectura de AUREUS implementa Row Level Security (RLS) a nivel de base de datos.
                  Esto significa que tus registros son criptográficamente inaccesibles para cualquier otro usuario de la plataforma.
                </p>
              </div>

              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 7</span>
                <h3 className="terms-clause-title">Credenciales y Protección de Acceso</h3>
                <p className="terms-clause-text">
                  Las contraseñas se almacenan mediante algoritmos de hash criptográfico unidireccional. AUREUS nunca te
                  solicitará contraseñas por correo ni almacenará números de tarjetas completos ni códigos de seguridad CVV.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: DERECHOS DEL USUARIO */}
          {activeTab === 'rights' && (
            <div className="terms-content-section fade-in">
              <div className="terms-article">
                <span className="terms-clause-number">CLÁUSULA 8</span>
                <h3 className="terms-clause-title">Portabilidad y Derecho al Olvido</h3>
                <p className="terms-clause-text">
                  En cumplimiento con los estándares internacionales de protección al consumidor digital:
                </p>
                <ul className="terms-rights-list">
                  <li>
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span><strong>Exportación Inmediata:</strong> Puedes descargar un respaldo de tus datos en JSON o CSV cuando lo desees.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span><strong>Eliminación Definitiva:</strong> Puedes borrar tu cuenta y todo registro asociado de forma permanente e irrecuperable.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} className="text-emerald" />
                    <span><strong>Modo Sin IA:</strong> Tienes la libertad de usar todos los módulos de registro manual sin interactuar con la IA si así lo prefieres.</span>
                  </li>
                </ul>
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
