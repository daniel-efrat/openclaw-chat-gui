import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const HISTORY_ENDPOINT = '/api/history'

const buildSystemGreeting = () => ({
  id: crypto.randomUUID(),
  role: 'assistant',
  content: "Hey there! I'm Claw, ready to help. What should we tackle?",
  createdAt: new Date().toISOString(),
})

const createConversation = () => {
  const timestamp = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [buildSystemGreeting()],
  }
}

const formatPreview = (text) => {
  if (!text) return 'No messages yet.'
  const condensed = text.replace(/\s+/g, ' ').trim()
  return condensed.length > 80 ? `${condensed.slice(0, 77)}…` : condensed
}

const formatTitleFromMessage = (text) => {
  if (!text) return 'New chat'
  const condensed = text.replace(/\s+/g, ' ').trim()
  return condensed.length > 32 ? `${condensed.slice(0, 29)}…` : condensed || 'New chat'
}

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user'

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="avatar" aria-hidden="true">
        {isUser ? '🧑‍💻' : '🦞'}
      </div>
      <div className="bubble">
        <div className="bubble-meta">
          <span>{isUser ? 'You' : 'Claw'}</span>
          {message.createdAt && (
            <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
          )}
        </div>
        <p>{message.content}</p>
      </div>
    </div>
  )
}

const TypingIndicator = () => (
  <div className="message message-assistant typing">
    <div className="avatar" aria-hidden="true">🦞</div>
    <div className="bubble">
      <div className="typing-dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  </div>
)

function App() {
  const [conversations, setConversations] = useState(() => {
    const initialConversation = createConversation()
    return [initialConversation]
  })
  const [activeConversationId, setActiveConversationId] = useState(() => conversations[0]?.id)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0]

  const messages = activeConversation?.messages ?? []
  const canSend = input.trim().length > 0 && !isTyping && Boolean(activeConversation)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    let cancelled = false

    const hydrateHistory = async () => {
      try {
        const response = await fetch(HISTORY_ENDPOINT)
        if (!response.ok) {
          throw new Error(`Failed to load history: ${response.status}`)
        }
        const data = await response.json()
        if (!cancelled && Array.isArray(data.conversations) && data.conversations.length) {
          setConversations(data.conversations)
          setActiveConversationId(data.conversations[0].id)
        }
      } catch (err) {
        console.warn('[chat-gui] Unable to hydrate history', err)
      } finally {
        if (!cancelled) {
          setIsHydrated(true)
        }
      }
    }

    hydrateHistory()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 960px)')
    const handleChange = () => {
      if (mediaQuery.matches) {
        setIsSidebarOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const controller = new AbortController()

    const persistHistory = async () => {
      try {
        await fetch(HISTORY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversations }),
          signal: controller.signal,
        })
      } catch (err) {
        if (err.name === 'AbortError') return
        console.warn('[chat-gui] Unable to persist history', err)
      }
    }

    persistHistory()
    return () => controller.abort()
  }, [conversations, isHydrated])

  const chatPayload = useMemo(
    () => messages.map(({ role, content }) => ({ role, content })),
    [messages]
  )

  const historyItems = useMemo(
    () =>
      [...conversations].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [conversations]
  )

  const updateConversation = (conversationId, updater) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId ? updater(conversation) : conversation
      )
    )
  }

  const handleSend = async (evt) => {
    evt?.preventDefault()
    if (!canSend || !activeConversation) return

    const trimmed = input.trim()
    const now = new Date().toISOString()
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: now,
    }

    const targetConversationId = activeConversation.id

    updateConversation(targetConversationId, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, userMessage],
      updatedAt: userMessage.createdAt,
      title:
        conversation.title === 'New chat' ? formatTitleFromMessage(trimmed) : conversation.title,
    }))

    setInput('')
    setError('')
    setIsTyping(true)

    const payload = [...chatPayload, { role: 'user', content: trimmed }]

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: payload }),
      })

      if (!response.ok) {
        throw new Error('Request failed. Check the server logs for details.')
      }

      const data = await response.json()
      const reply = data.reply ?? data.message
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: reply?.role ?? 'assistant',
        content: reply?.content ?? 'Something went wrong, but I am still here.',
        createdAt: new Date().toISOString(),
      }

      updateConversation(targetConversationId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, assistantMessage],
        updatedAt: assistantMessage.createdAt,
      }))
    } catch (err) {
      console.error(err)
      setError(err.message ?? 'Failed to reach the chat server.')
    } finally {
      setIsTyping(false)
    }
  }

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false)
  }

  const handleNewChat = () => {
    const nextConversation = createConversation()
    setConversations((prev) => [nextConversation, ...prev])
    setActiveConversationId(nextConversation.id)
    setInput('')
    setError('')
    handleCloseSidebar()
  }

  const handleSelectConversation = (conversationId) => {
    if (conversationId === activeConversationId) {
      handleCloseSidebar()
      return
    }
    setActiveConversationId(conversationId)
    setError('')
    setInput('')
    handleCloseSidebar()
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <span>🦞</span>
          <div>
            <strong>Claw Studio</strong>
            <small>Chat Surface</small>
          </div>
          <button
            type="button"
            className="close-drawer"
            onClick={handleCloseSidebar}
            aria-label="Close chat history"
          >
            ×
          </button>
        </div>

        <button className="primary" onClick={handleNewChat}>
          + New chat
        </button>

        <div className="history-panel">
          <div className="history-header">
            <h2>Chat history</h2>
            <span>{historyItems.length} total</span>
          </div>
          <ul className="history-list">
            {historyItems.map((conversation) => {
              const latestMessage = conversation.messages[conversation.messages.length - 1]
              const isActive = conversation.id === activeConversation?.id
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className={`history-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="history-meta">
                      <span>{conversation.title}</span>
                      <time>
                        {new Date(conversation.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p>{formatPreview(latestMessage?.content)}</p>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="panel">
          <p>Prototype UI inspired by ChatGPT. Messages are proxied via the local server.</p>
          <ul>
            <li>⌘/Ctrl + K — focus composer</li>
            <li>Enter — send</li>
            <li>Shift + Enter — newline</li>
          </ul>
        </div>
      </aside>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={handleCloseSidebar}
      />

      <main className="chat-panel">
        <header className="chat-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-toggle"
              onClick={handleToggleSidebar}
              aria-label="Toggle chat history drawer"
            >
              <span />
              <span />
              <span />
            </button>
            <div>
              <h1>{activeConversation?.title ?? 'Conversation'}</h1>
              <p>Connected to local proxy · Powered by OpenAI</p>
            </div>
          </div>
          <div className="header-actions">
            <span className={isTyping ? 'status-dot live' : 'status-dot'} />
            {isTyping ? 'Claw is typing…' : 'Ready'}
          </div>
        </header>

        <section className="message-list">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </section>

        <footer className="composer">
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleSend}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(evt) => setInput(evt.target.value)}
              placeholder="Message Claw…"
              rows={1}
            />
            <button type="submit" disabled={!canSend}>
              Send
            </button>
          </form>
          <p className="disclaimer">
            Responses are generated via OpenAI. Do not share secrets. This interface is not ChatGPT, but it feels close.
          </p>
        </footer>
      </main>
    </div>
  )
}

export default App
