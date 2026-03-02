# Claw Chat GUI

A lightweight, ChatGPT-inspired interface you can run locally to talk with your OpenClaw gateway (or any OpenAI-compatible endpoint). The layout mirrors the modern ChatGPT experience—sidebar, chat stream, typing indicator, keyboard shortcuts—so you can interact in the browser without reaching for external tooling.

## Highlights

- ⚡️ **Vite + React** front-end with polished dark theme and responsive layout
- 💬 **Chat history** stays in-memory per tab; “New chat” resets the context
- ✨ **Typing indicator, avatars, shortcuts** (⌘/Ctrl + K focuses the composer)
- 🔌 **Proxy server** (`server/server.js`) calls OpenClaw’s `/v1/chat/completions` endpoint (no browser secrets)
- 🛡️ **Environment driven**: gateway URL, token, agent id, and model live in `.env`

## Directory structure

```
chat-gui/
├── README.md
├── index.html
├── package.json          # client (Vite) scripts
├── src/                  # React application
├── dist/                 # production build output (`npm run build`)
└── server/
    ├── package.json      # Express proxy (OpenClaw client)
    ├── server.js
    └── .env.example
```

## Getting started

1. **Install client dependencies**
   ```bash
   cd chat-gui
   npm install
   ```

2. **Install server dependencies & configure env**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # edit .env and add your OPENCLAW_GATEWAY_TOKEN (and optional overrides)
   ```

3. **Run the proxy**
   ```bash
   npm run dev      # from chat-gui/server (defaults to http://localhost:4000)
   ```

4. **Run the client** (new terminal)
   ```bash
   cd chat-gui
   npm run dev      # opens http://localhost:5173
   ```

Open the displayed Vite URL in Chromium/Chrome and start chatting. The client talks to `/api/chat`, which Vite proxies to `http://localhost:4000/api/chat`, and the proxy forwards everything to the OpenClaw gateway.

## Production build

```bash
cd chat-gui
npm run build   # outputs to dist/
```

Serve `/dist` with any static host (e.g., `npx serve dist`). Keep the proxy server running—it still handles all gateway traffic.

## Configuration (`server/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `OPENCLAW_GATEWAY_URL` | Gateway base URL (HTTP). | `http://127.0.0.1:18789` |
| `OPENCLAW_GATEWAY_TOKEN` | Required bearer token (`gateway.auth.token`). | — |
| `OPENCLAW_AGENT_ID` | Agent id to route conversations to. | `main` |
| `OPENCLAW_MODEL` | Model string sent to `/v1/chat/completions`. | `openclaw:main` |
| `OPENCLAW_USER` | Optional user/session hint. | `chat-gui` |
| `PORT` | Express server port. | `4000` |

## Next steps

- Swap the backend to any other OpenAI-compatible endpoint
- Persist conversations (SQLite, Supabase, etc.) instead of in-memory state
- Add auth if you expose the proxy or gateway beyond localhost

Enjoy the clawsome chat surface! 🦞
