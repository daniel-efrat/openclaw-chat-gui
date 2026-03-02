import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

const gatewayUrl = (process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789').replace(/\/$/, '')
const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN
const defaultAgent = process.env.OPENCLAW_AGENT_ID || 'main'
const defaultModel = process.env.OPENCLAW_MODEL || `openclaw:${defaultAgent}`
const defaultUser = process.env.OPENCLAW_USER || 'chat-gui'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const historyPath = path.join(__dirname, 'chat-history.json')

const readHistory = async () => {
  try {
    const raw = await fs.readFile(historyPath, 'utf-8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

const writeHistory = async (conversations) => {
  await fs.writeFile(historyPath, JSON.stringify(conversations, null, 2), 'utf-8')
}

app.use(cors())
app.use(express.json())

app.get('/health', async (_req, res) => {
  res.json({
    status: gatewayToken ? 'ok' : 'missing-token',
    gatewayUrl,
    defaultAgent,
    model: defaultModel,
  })
})

app.get('/api/history', async (_req, res) => {
  try {
    const conversations = await readHistory()
    res.json({ conversations })
  } catch (error) {
    console.error('[chat-gui] Failed to read history:', error)
    res.status(500).json({ error: 'Unable to load chat history.' })
  }
})

app.post('/api/history', async (req, res) => {
  const { conversations } = req.body ?? {}
  if (!Array.isArray(conversations)) {
    return res.status(400).json({ error: 'Body must include a "conversations" array.' })
  }

  try {
    await writeHistory(conversations)
    res.json({ status: 'ok' })
  } catch (error) {
    console.error('[chat-gui] Failed to write history:', error)
    res.status(500).json({ error: 'Unable to persist chat history.' })
  }
})

app.post('/api/chat', async (req, res) => {
  if (!gatewayToken) {
    return res.status(503).json({ error: 'OPENCLAW_GATEWAY_TOKEN is not configured on the server.' })
  }

  const { messages } = req.body
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Request body must include a non-empty "messages" array.' })
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${gatewayToken}`,
      'x-openclaw-agent-id': defaultAgent,
    }

    const payload = {
      model: defaultModel,
      messages,
      stream: false,
      user: defaultUser,
    }

    const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Gateway responded with ${response.status}: ${text}`)
    }

    const completion = await response.json()
    const choice = completion.choices?.[0]
    if (!choice) {
      throw new Error('No completion returned by OpenClaw gateway.')
    }

    res.json({
      reply: choice.message,
      usage: completion.usage,
      model: completion.model,
    })
  } catch (error) {
    console.error('[chat-gui] Gateway error:', error)
    const message = error.message ?? 'Unexpected error calling OpenClaw gateway.'
    res.status(502).json({ error: message })
  }
})

app.listen(port, () => {
  console.log(`Chat GUI server listening on http://localhost:${port}`)
  console.log('[chat-gui] gatewayUrl:', gatewayUrl)
  console.log('[chat-gui] default agent:', defaultAgent)
})
