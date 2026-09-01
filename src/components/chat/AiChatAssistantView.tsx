import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Trash2, Copy, Volume2, Sparkles, ShieldCheck, Lightbulb, UserCheck, Key, Check, X } from 'lucide-react'
import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCard,
  CreditCardTransaction,
  CategoryBudget,
  SavingsGoal,
} from '../../types/finance'
import { generateAiFinancialResponse, type ChatMessage, type FinancialSnapshot } from '../../utils/aiAdvisorEngine'
import { getRandomDailyTip } from '../../utils/financialTips'
import { formatCurrency } from '../../utils/formatters'
import { calculateCumulativeBalance } from '../../utils/calendar'
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  getStoredGeminiModel,
  setStoredGeminiModel,
  queryGeminiFinancialAdvisor,
} from '../../utils/geminiClient'
import './AiChatAssistantView.css'

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

interface AiChatAssistantViewProps {
  currentPeriod: string
  incomes: Income[]
  expenses: Expense[]
  cashWithdrawals: CashWithdrawal[]
  creditCards: CreditCard[]
  creditTransactions: CreditCardTransaction[]
  categoryBudgets: CategoryBudget[]
  savingsGoals: SavingsGoal[]
  userEmail?: string
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex to split by bold (**text**), inline code (`code`), and italics (*text*)
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g)
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i} className="chat-md-bold">{token.slice(2, -2)}</strong>
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={i} className="chat-md-code">{token.slice(1, -1)}</code>
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={i} className="chat-md-em">{token.slice(1, -1)}</em>
    }
    return token
  })
}

function FormattedChatMessage({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  let inList = false
  let listItems: React.ReactNode[] = []

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={key} className="chat-md-list">
          {listItems}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      flushList(`list-before-hr-${index}`)
      elements.push(<hr key={`hr-${index}`} className="chat-md-hr" />)
      return
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList(`list-before-h3-${index}`)
      elements.push(
        <h3 key={`h3-${index}`} className="chat-md-h3">
          {parseInlineMarkdown(trimmed.slice(4))}
        </h3>
      )
      return
    }

    if (trimmed.startsWith('#### ')) {
      flushList(`list-before-h4-${index}`)
      elements.push(
        <h4 key={`h4-${index}`} className="chat-md-h4">
          {parseInlineMarkdown(trimmed.slice(5))}
        </h4>
      )
      return
    }

    if (trimmed.startsWith('## ')) {
      flushList(`list-before-h2-${index}`)
      elements.push(
        <h2 key={`h2-${index}`} className="chat-md-h2">
          {parseInlineMarkdown(trimmed.slice(3))}
        </h2>
      )
      return
    }

    // List items (bullet or numbered)
    const bulletMatch = trimmed.match(/^([*•\-]|(\d+\.))\s+(.*)$/)
    if (bulletMatch) {
      inList = true
      const content = bulletMatch[3]
      const prefix = bulletMatch[2] ? `${bulletMatch[2]} ` : ''
      listItems.push(
        <li key={`li-${index}`} className="chat-md-li">
          {prefix && <span className="chat-md-num">{prefix}</span>}
          <span>{parseInlineMarkdown(content)}</span>
        </li>
      )
      return
    }

    // Normal line / paragraph
    flushList(`list-before-p-${index}`)
    if (trimmed) {
      elements.push(
        <p key={`p-${index}`} className="chat-md-p">
          {parseInlineMarkdown(line)}
        </p>
      )
    } else {
      elements.push(<div key={`empty-${index}`} className="chat-md-spacer" />)
    }
  })

  flushList(`list-end`)

  return <div className="chat-md-body">{elements}</div>
}

const QUICK_PROMPTS = [
  '¿Cuánto dinero puedo gastar este mes?',
  '¿Cuánto debería ahorrar?',
  'Pronóstico de flujo de caja a 30 días',
  'Métricas y consejos para proyectos de emprendimiento',
  'Estrategia de negociación y reducción de costos',
  'Analiza mi salud financiera general',
]

export function AiChatAssistantView({
  currentPeriod,
  incomes,
  expenses,
  cashWithdrawals,
  creditCards,
  creditTransactions,
  categoryBudgets,
  savingsGoals,
  userEmail,
}: AiChatAssistantViewProps) {
  const userName = userEmail ? userEmail.split('@')[0] : 'Jesús'
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1)

  const dailyTip = getRandomDailyTip(currentPeriod)

  // Estado de API Gemini
  const [apiKey, setApiKey] = useState(getStoredGeminiApiKey)
  const [selectedModel, setSelectedModel] = useState(getStoredGeminiModel)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [tempModel, setTempModel] = useState(selectedModel)

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome-init',
      sender: 'assistant',
      text: `¡Bienvenido de nuevo, **${capitalizedName}**! 👋

Soy tu **Asesor Financiero con Inteligencia Artificial**. He cargado en vivo la información de tus **ingresos, gastos, tarjetas y presupuestos** para el período **${currentPeriod}**.

💡 **Consejo Financiero del Día (${dailyTip.category.toUpperCase()}):**
*${dailyTip.title}* — ${dailyTip.content}

¿En qué puedo ayudarte a tomar decisiones financieras hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping]   = useState(false)
  const [copiedId, setCopiedId]   = useState<string | null>(null)
  const messagesEndRef            = useRef<HTMLDivElement>(null)

  const cumulative = calculateCumulativeBalance(incomes, expenses, currentPeriod)
  const pIncomes  = incomes.filter(i => i.period === currentPeriod)
  const pExpenses = expenses.filter(e => e.period === currentPeriod)
  const totalInc  = pIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExp  = pExpenses.reduce((s, e) => s + e.amount, 0)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSaveSettings = () => {
    setStoredGeminiApiKey(tempApiKey)
    setStoredGeminiModel(tempModel)
    setApiKey(tempApiKey)
    setSelectedModel(tempModel)
    setIsSettingsOpen(false)
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim()
    if (!query) return

    const userMsg: ChatMessage = {
      id: createId('msg-user'),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    const snapshot: FinancialSnapshot = {
      currentPeriod,
      incomes,
      expenses,
      cashWithdrawals,
      creditCards,
      creditTransactions,
      categoryBudgets,
      savingsGoals,
    }

    if (apiKey) {
      try {
        const responseText = await queryGeminiFinancialAdvisor(query, snapshot, messages)
        const aiMsg: ChatMessage = {
          id: createId('msg-ai'),
          sender: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, aiMsg])
      } catch (err: any) {
        const fallback = generateAiFinancialResponse(query, snapshot)
        const aiMsg: ChatMessage = {
          id: createId('msg-ai'),
          sender: 'assistant',
          text: `*(Google Gemini no disponible: ${err.message || 'Error de conexión'}. Mostrando análisis local)*\n\n${fallback}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, aiMsg])
      } finally {
        setIsTyping(false)
      }
    } else {
      setTimeout(() => {
        const responseText = generateAiFinancialResponse(query, snapshot)
        const aiMsg: ChatMessage = {
          id: createId('msg-ai'),
          sender: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
        setMessages(prev => [...prev, aiMsg])
        setIsTyping(false)
      }, 350)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const cleanText = text.replace(/[*`#•]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = 'es-ES'
      window.speechSynthesis.speak(utterance)
    }
  }

  const handleClearChat = () => {
    setMessages([
      {
        id: createId('msg-welcome'),
        sender: 'assistant',
        text: `Conversación reiniciada para **${capitalizedName}**. ¿Qué otra duda tienes sobre tus finanzas en **${currentPeriod}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="breadcrumb">AUREUS · <span className="breadcrumb-accent">Asistente Financiero IA</span></div>
        <h1 className="page-title">Asesor Financiero Conversacional con IA</h1>
      </div>

      <div className="chat-container">
        {/* EU AI Act Article 50 Compliance Banner */}
        <div className="ai-act-banner">
          <div className="ai-act-badge">
            <ShieldCheck size={14} />
            <span>Sistema interactivo de Inteligencia Artificial en tiempo real</span>
          </div>
          <div className="ai-act-tag">Transparencia: Art. 50 Reglamento UE (AI Act)</div>
        </div>

        {/* Personalized Welcome Card with Variable Daily Tip */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201, 168, 76, 0.12) 0%, rgba(18, 18, 26, 0.8) 100%)',
          border: '1px solid rgba(201, 168, 76, 0.25)',
          borderRadius: 14,
          padding: '12px 18px',
          margin: '12px 16px 0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserCheck size={20} style={{ color: '#F3CA65' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F3CA65' }}>
                ¡Bienvenido de nuevo, {capitalizedName}! 👋
              </div>
              <div style={{ fontSize: 11.5, color: '#9CA3AF' }}>
                Sesión activa para {userEmail || 'Usuario AUREUS'} · Datos sincronizados
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Lightbulb size={15} style={{ color: '#F59E0B', flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: '#E5E7EB', maxWidth: 380 }}>
              <strong style={{ color: '#F3CA65' }}>Tip del Día:</strong> {dailyTip.title}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="chat-header">
          <div className="chat-title-box">
            <div className="chat-avatar-ai">
              <Bot size={22} />
            </div>
            <div className="chat-header-info">
              <h2>AUREUS Financial Intelligence</h2>
              <p>Análisis cuantitativo y toma de decisiones en vivo</p>
            </div>
          </div>

          <div className="chat-context-pills">
            <span className="context-pill" style={{ color: '#F3CA65', borderColor: 'rgba(243, 202, 101, 0.3)' }}>
              Disponible: {formatCurrency(cumulative.totalCumulativeBalance)}
            </span>
            {cumulative.carriedOverBalance !== 0 && (
              <span className="context-pill" style={{ color: '#34D399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                Arrastre: {formatCurrency(cumulative.carriedOverBalance)}
              </span>
            )}
            {totalInc > 0 && <span className="context-pill">Ingresos Mes: {formatCurrency(totalInc)}</span>}
            {totalExp > 0 && <span className="context-pill">Gastos Mes: {formatCurrency(totalExp)}</span>}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setTempApiKey(apiKey)
                setTempModel(selectedModel)
                setIsSettingsOpen(true)
              }}
              style={{
                padding: '6px 12px',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: apiKey ? '#34D399' : '#F3CA65',
                borderColor: apiKey ? 'rgba(52, 211, 153, 0.35)' : 'rgba(243, 202, 101, 0.35)',
                background: apiKey ? 'rgba(52, 211, 153, 0.08)' : 'rgba(243, 202, 101, 0.08)',
              }}
              title="Configurar conexión con Google Gemini API"
            >
              <Sparkles size={13} /> {apiKey ? 'Gemini AI Conectado' : 'Conectar Gemini API'}
            </button>
            <button className="btn btn-secondary" onClick={handleClearChat} style={{ padding: '6px 12px', fontSize: 11 }}>
              <Trash2 size={13} /> Limpiar Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}`}>
              {msg.sender === 'assistant' ? (
                <div className="ai-avatar-icon">
                  <Bot size={16} />
                </div>
              ) : (
                <div className="user-avatar-icon">
                  {capitalizedName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="message-bubble">
                <FormattedChatMessage text={msg.text} />
                <span className="message-time">{msg.timestamp}</span>

                {msg.sender === 'assistant' && (
                  <div className="message-actions">
                    <button className="msg-action-btn" onClick={() => handleCopy(msg.id, msg.text)}>
                      <Copy size={12} /> {copiedId === msg.id ? 'Copiado' : 'Copiar'}
                    </button>
                    <button className="msg-action-btn" onClick={() => handleSpeak(msg.text)}>
                      <Volume2 size={12} /> Escuchar Audio
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message-row assistant">
              <div className="ai-avatar-icon">
                <Bot size={16} />
              </div>
              <div className="message-bubble" style={{ color: '#9CA3AF', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} className="spin" style={{ color: '#F3CA65' }} /> Procesando datos de tu cartera...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="prompt-chips-container">
          <Sparkles size={14} style={{ color: '#F3CA65', flexShrink: 0 }} />
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button key={idx} className="chip-btn" onClick={() => handleSendMessage(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Footer */}
        <form className="chat-input-area" onSubmit={(e) => { e.preventDefault(); handleSendMessage() }}>
          <input
            type="text"
            className="chat-input-field"
            placeholder="Pregúntale al Asistente IA (ej: ¿cuánto puedo gastar este mes?)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={!inputText.trim() || isTyping}>
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* Gemini Settings Modal */}
      {isSettingsOpen && (
        <div className="mit-modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div
            className="mit-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, background: '#12121A', border: '1px solid rgba(243, 202, 101, 0.3)', borderRadius: 16, padding: 24 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(243, 202, 101, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={18} style={{ color: '#F3CA65' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, color: '#FFF', fontWeight: 700 }}>Conexión con Google Gemini AI</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Alimenta al Asesor Financiero con Inteligencia Artificial real</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#E5E7EB', display: 'block', marginBottom: 6 }}>
                  Google Gemini API Key:
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#1A1A24',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFF',
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                />
                <span style={{ fontSize: 11, color: '#9CA3AF', display: 'block', marginTop: 4 }}>
                  🔑 Tu clave se guarda exclusivamente en tu navegador local (localStorage). Puedes obtenerla gratis en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#F3CA65' }}>Google AI Studio</a>.
                </span>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#E5E7EB', display: 'block', marginBottom: 6 }}>
                  Modelo de Inteligencia Artificial:
                </label>
                <select
                  value={tempModel}
                  onChange={(e) => setTempModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#1A1A24',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFF',
                    fontSize: 13,
                  }}
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Recomendado - Ultra rápido y preciso)</option>
                  <option value="gemma-4-31b-it">Gemma 4 31B Instruct (Alta capacidad analítica)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                </select>
              </div>

              <div style={{ background: 'rgba(243, 202, 101, 0.08)', border: '1px solid rgba(243, 202, 101, 0.2)', padding: '10px 14px', borderRadius: 8, fontSize: 11.5, color: '#D1D5DB' }}>
                💡 <strong>¿Cómo funciona?</strong> Al activar Gemini, AUREUS le suministra a la IA todo tu contexto financiero (ingresos, gastos, balance arrastrado, tarjetas, metas y regla 50/30/20) para que actúe como tu Director Financiero (CFO) personal.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsSettingsOpen(false)}
                style={{ padding: '8px 16px', fontSize: 12 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="mit-submit-btn"
                onClick={handleSaveSettings}
                style={{ padding: '8px 18px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={14} /> Guardar Conexión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
