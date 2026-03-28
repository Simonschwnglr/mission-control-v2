# Mission Control V2 - Echte Agenten

## Architektur

```
┌─────────────────────────────────────────┐
│           Mission Control V2            │
├─────────────────────────────────────────┤
│  Frontend (Next.js + WebSocket)         │
│  - Live Dashboard                       │
│  - Agent Control UI                     │
│  - Real-time Logs                       │
└──────────────┬──────────────────────────┘
               │ WebSocket
┌──────────────▼──────────────────────────┐
│  Backend API (Node.js/Express)          │
│  - Agent Manager                        │
│  - Task Queue                           │
│  - Log Streamer                         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Agent Runner (Child Processes)         │
│  - Claude Code                          │
│  - Codex                                │
│  - Custom Scripts                       │
└─────────────────────────────────────────┘
```

## Features

### 1. Echte Agenten
- Spawn echte Prozesse
- Live stdout/stderr
- Resource monitoring
- Start/Stop/Kill

### 2. Task Queue
- Redis/Upstash
- Priorisierung
- Retry-Logik
- Status-Tracking

### 3. Live Updates
- WebSocket-Verbindung
- Echtzeit-Logs
- Progress-Updates
- Agent-Status

### 4. Resource Monitor
- CPU Usage
- Memory Usage
- Disk Usage
- Network

## Tech Stack

- **Frontend:** Next.js 15, Tailwind, Socket.io-client
- **Backend:** Node.js, Express, Socket.io
- **Database:** Upstash Redis (kostenlos)
- **Hosting:** Vercel (Frontend), Render/Railway (Backend)

## Roadmap

1. Backend API + Agent Runner
2. Redis Task Queue
3. Frontend mit WebSocket
4. Agent-Prozesse (Claude/Codex)
5. Resource Monitoring
