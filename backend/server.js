const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active agents
const agents = new Map();

// Agent class
class Agent {
  constructor(name, type, task) {
    this.id = uuidv4();
    this.name = name;
    this.type = type;
    this.task = task;
    this.status = 'idle';
    this.progress = 0;
    this.logs = [];
    this.process = null;
    this.startTime = null;
    this.endTime = null;
  }

  start(command, args = []) {
    this.status = 'running';
    this.startTime = new Date().toISOString();
    this.progress = 10;
    
    this.process = spawn(command, args, {
      shell: true,
      env: { ...process.env, ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
    });

    this.process.stdout.on('data', (data) => {
      const output = data.toString();
      this.logs.push({ type: 'stdout', message: output, time: new Date().toISOString() });
      this.broadcastUpdate();
    });

    this.process.stderr.on('data', (data) => {
      const output = data.toString();
      this.logs.push({ type: 'stderr', message: output, time: new Date().toISOString() });
      this.broadcastUpdate();
    });

    this.process.on('close', (code) => {
      this.status = code === 0 ? 'completed' : 'error';
      this.endTime = new Date().toISOString();
      this.progress = code === 0 ? 100 : this.progress;
      this.broadcastUpdate();
    });

    this.broadcastUpdate();
  }

  stop() {
    if (this.process) {
      this.process.kill();
      this.status = 'stopped';
      this.endTime = new Date().toISOString();
      this.broadcastUpdate();
    }
  }

  updateProgress(progress) {
    this.progress = progress;
    this.broadcastUpdate();
  }

  broadcastUpdate() {
    io.emit('agent-update', this.toJSON());
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      task: this.task,
      progress: this.progress,
      logs: this.logs.slice(-50), // Last 50 logs
      startTime: this.startTime,
      endTime: this.endTime
    };
  }
}

// Routes
app.get('/api/agents', (req, res) => {
  const agentList = Array.from(agents.values()).map(a => a.toJSON());
  res.json(agentList);
});

app.post('/api/agents', (req, res) => {
  const { name, type, task, command, args } = req.body;
  
  const agent = new Agent(name, type, task);
  agents.set(agent.id, agent);
  
  if (command) {
    agent.start(command, args);
  }
  
  res.json(agent.toJSON());
});

app.post('/api/agents/:id/stop', (req, res) => {
  const agent = agents.get(req.params.id);
  if (agent) {
    agent.stop();
    res.json(agent.toJSON());
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.get('/api/agents/:id/logs', (req, res) => {
  const agent = agents.get(req.params.id);
  if (agent) {
    res.json(agent.logs);
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.get('/api/system', (req, res) => {
  const usage = process.memoryUsage();
  res.json({
    uptime: process.uptime(),
    memory: {
      used: Math.round(usage.heapUsed / 1024 / 1024),
      total: Math.round(usage.heapTotal / 1024 / 1024)
    },
    activeAgents: Array.from(agents.values()).filter(a => a.status === 'running').length,
    totalAgents: agents.size
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current agents
  const agentList = Array.from(agents.values()).map(a => a.toJSON());
  socket.emit('agents', agentList);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Mission Control API running on port ${PORT}`);
});
