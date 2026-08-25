import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Trash2, Copy, Volume2, Sparkles, ShieldCheck } from 'lucide-react'
import type {
  Income,
  Expense,
  CashWithdrawal,
  CreditCard,
  CreditCardTransaction,
  CategoryBudget,
  SavingsGoal,
} from '../../types/finance'
import { generateAiFinancialResponse, type ChatMessage } from '../../utils/aiAdvisorEngine'
import { formatCurrency } from '../../utils/formatters'
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

const QUICK_PROMPTS = [
  '¿Cuánto dinero puedo gastar este mes?',
  '¿Cuánto debería ahorrar?',
  '¿Cómo puedo liquidar mis deudas?',
  'Analiza mi salud financiera general',
  'Diagnóstico de la regla 50/30/20',
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
  const pIncomes  = incomes.filter(i => i.period === currentPeriod)
  const pExpenses = expenses.filter(e => e.period === currentPeriod)
  const totalInc  = pIncomes.reduce((s, i) => s + i.amount, 0)
  const totalExp  = pExpenses.reduce((s, e) => s + e.amount, 0)
  const netBalance = totalInc - totalExp

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: `¡Hola ${userEmail ? userEmail.split('@')[0] : 'de nuevo'}! 👋 Soy tu **Asistente Virtual Financiero impulsado por IA** en AUREUS.\n\nHe analizado tus datos del período **${currentPeriod}**:\n• **Ingresos Totales:** \`${formatCurrency(totalInc)}\`\n• **Gastos Registrados:** \`${formatCurrency(totalExp)}\`\n• **Margen Neto Libre:** \`${formatCurrency(netBalance)}\`\n\n¿En qué te puedo ayudar a tomar la mejor decisión financiera hoy? Selecciona una sugerencia abajo o escribe tu pregunta.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]
  })

  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping]   = useState(false)
  const [copiedId, setCopiedId]   = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim()
    if (!query) return

    const userMsg: ChatMessage = {
      id: createId('msg-user'),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInputText('')
    setIsTyping(true)

    // Simular tiempo de procesamiento natural de la IA (350ms)
    setTimeout(() => {
      const responseText = generateAiFinancialResponse(query, {
        currentPeriod,
        incomes,
        expenses,
        cashWithdrawals,
        creditCards,
        creditTransactions,
        categoryBudgets,
        savingsGoals,
      })

      const aiMsg: ChatMessage = {
        id: createId('msg-ai'),
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 400)
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
        id: `msg-welcome-${Date.now()}`,
        sender: 'assistant',
        text: `Conversación reiniciada. ¿Qué otra duda tienes sobre tus finanzas en **${currentPeriod}**?`,
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
            <span className="context-pill">Ingresos: {formatCurrency(totalInc)}</span>
            <span className="context-pill">Gastos: {formatCurrency(totalExp)}</span>
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
                  {userEmail ? userEmail.slice(0, 2).toUpperCase() : 'YO'}
                </div>
              )}

              <div className="message-bubble">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.text.split('\n').map((line, idx) => (
                    <p key={idx} style={{ margin: '3px 0' }}>{line}</p>
                  ))}
                </div>
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
    </div>
  )
}
