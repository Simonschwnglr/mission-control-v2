"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Terminal, 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Play, 
  Square, 
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Server,
  Command
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  type: string;
  status: "idle" | "running" | "completed" | "error" | "stopped";
  task: string;
  progress: number;
  logs: Array<{ type: string; message: string; time: string }>;
  startTime: string | null;
  endTime: string | null;
}

interface SystemStats {
  uptime: number;
  memory: { used: number; total: number };
  cpu: number;
  activeAgents: number;
  totalAgents: number;
}

// Matrix Rain Effect Component
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];
    
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }
    
    const draw = () => {
      ctx.fillStyle = "rgba(10, 10, 15, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = "#0f0";
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };
    
    const interval = setInterval(draw, 35);
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-20"
    />
  );
}

// Glitch Text Component
function GlitchText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className="relative z-10">{text}</span>
      <span className="absolute top-0 left-0 -ml-0.5 text-red-500 opacity-70 animate-pulse">
        {text}
      </span>
      <span className="absolute top-0 left-0 ml-0.5 text-cyan-500 opacity-70 animate-pulse delay-75">
        {text}
      </span>
    </span>
  );
}

// Terminal Line Component
function TerminalLine({ type, message, time }: { type: string; message: string; time: string }) {
  const getColor = () => {
    switch (type) {
      case "error": return "text-red-400";
      case "warn": return "text-yellow-400";
      case "success": return "text-green-400";
      case "info": return "text-cyan-400";
      default: return "text-green-300";
    }
  };
  
  return (
    <div className="font-mono text-sm flex gap-3 hover:bg-white/5 px-2 py-0.5">
      <span className="text-gray-500">[{new Date(time).toLocaleTimeString()}]</span>
      <span className={getColor()}>{type.toUpperCase()}</span>
      <span className="text-green-100">{message}</span>
    </div>
  );
}

// Agent Card Component
function AgentCard({ agent, onClick, isSelected }: { 
  agent: Agent; 
  onClick: () => void;
  isSelected: boolean;
}) {
  const getStatusColor = () => {
    switch (agent.status) {
      case "running": return "border-green-500 shadow-green-500/50";
      case "completed": return "border-cyan-500 shadow-cyan-500/50";
      case "error": return "border-red-500 shadow-red-500/50";
      default: return "border-gray-600";
    }
  };
  
  const getStatusIcon = () => {
    switch (agent.status) {
      case "running": return <Activity className="w-4 h-4 text-green-400 animate-pulse" />;
      case "completed": return <CheckCircle2 className="w-4 h-4 text-cyan-400" />;
      case "error": return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };
  
  return (
    <div 
      onClick={onClick}
      className={`
        relative bg-black/40 backdrop-blur-sm border rounded-lg p-4 cursor-pointer
        transition-all duration-300 hover:scale-[1.02]
        ${getStatusColor()} ${isSelected ? "ring-2 ring-green-400 shadow-lg shadow-green-400/20" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <span className="font-mono text-green-100 font-bold">{agent.name}</span>
        </div>
        <span className={`
          px-2 py-0.5 rounded text-xs font-mono uppercase
          ${agent.status === "running" ? "bg-green-500/20 text-green-400" : ""}
          ${agent.status === "completed" ? "bg-cyan-500/20 text-cyan-400" : ""}
          ${agent.status === "error" ? "bg-red-500/20 text-red-400" : ""}
          ${agent.status === "idle" ? "bg-gray-500/20 text-gray-400" : ""}
        `}>
          {agent.status}
        </span>
      </div>
      
      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{agent.task}</p>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500 font-mono">
          <span>PROGRESS</span>
          <span>{agent.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${agent.progress}%` }}
          />
        </div>
      </div>
      
      {agent.status === "running" && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, subtext, color = "green" }: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  color?: "green" | "cyan" | "red" | "yellow";
}) {
  const colors = {
    green: "from-green-500/20 to-green-500/5 border-green-500/30",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
    red: "from-red-500/20 to-red-500/5 border-red-500/30",
    yellow: "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
  };
  
  return (
    <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-sm border rounded-lg p-4`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 text-${color}-400`} />
        <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-mono font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );
}

// Main Dashboard
export default function MissionControl() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [system, setSystem] = useState<SystemStats | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const newSocket = io("https://mission-control-api-5118.onrender.com");
    
    newSocket.on("connect", () => {
      setIsConnected(true);
    });
    
    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });
    
    newSocket.on("agents", (data: Agent[]) => {
      setAgents(data);
    });
    
    newSocket.on("agent-update", (updatedAgent: Agent) => {
      setAgents(prev => 
        prev.map(a => a.id === updatedAgent.id ? updatedAgent : a)
      );
      if (selectedAgent?.id === updatedAgent.id) {
        setSelectedAgent(updatedAgent);
      }
    });
    
    setSocket(newSocket);
    
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 5000);
    
    return () => {
      newSocket.close();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [selectedAgent?.logs]);

  const fetchSystemStats = async () => {
    try {
      const res = await fetch("https://mission-control-api-5118.onrender.com/api/system");
      const data = await res.json();
      setSystem(data);
    } catch (err) {
      console.error("Failed to fetch system stats:", err);
    }
  };

  const startAgent = async () => {
    const name = prompt("AGENT_NAME:");
    if (!name) return;
    
    const task = prompt("TASK_DESCRIPTION:");
    if (!task) return;
    
    const command = prompt("EXECUTE_COMMAND:");
    if (!command) return;
    
    try {
      const res = await fetch("https://mission-control-api-5118.onrender.com/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type: "claude",
          task,
          command,
          args: []
        })
      });
      const newAgent = await res.json();
      setAgents(prev => [...prev, newAgent]);
    } catch (err) {
      alert("FAILED_TO_START_AGENT: " + err);
    }
  };

  const stopAgent = async (id: string) => {
    try {
      await fetch(`https://mission-control-api-5118.onrender.com/api/agents/${id}/stop`, {
        method: "POST"
      });
    } catch (err) {
      alert("FAILED_TO_STOP_AGENT: " + err);
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-green-100 font-mono overflow-hidden">
      <MatrixRain />
      
      {/* Header */}
      <header className="relative z-10 border-b border-green-500/30 bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-cyan-500 rounded flex items-center justify-center">
                <Command className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider">
                  <GlitchText text="MISSION_CONTROL" />
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>SYS.VER.2.0.0</span>
                  <span>•</span>
                  <span>{currentTime.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${
                isConnected 
                  ? "border-green-500/50 bg-green-500/10 text-green-400" 
                  : "border-red-500/50 bg-red-500/10 text-red-400"
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                <span className="text-xs font-mono uppercase">
                  {isConnected ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
              
              <button
                onClick={startAgent}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-bold px-4 py-2 rounded transition-all hover:shadow-lg hover:shadow-green-500/50"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">DEPLOY_AGENT</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        {/* Metrics Grid */}
        {system && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              icon={Clock}
              label="UPTIME"
              value={formatUptime(system.uptime)}
              color="cyan"
            />
            <MetricCard
              icon={Cpu}
              label="CPU_LOAD"
              value={`${system.cpu || 0}%`}
              color="green"
            />
            <MetricCard
              icon={HardDrive}
              label="MEMORY"
              value={`${system.memory?.used || 0}MB`}
              subtext={`/ ${system.memory?.total || 0}MB`}
              color="yellow"
            />
            <MetricCard
              icon={Server}
              label="AGENTS"
              value={`${system.activeAgents}/${system.totalAgents}`}
              color={system.activeAgents > 0 ? "green" : "gray"}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agents Panel */}
          <div className="bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-sm font-bold tracking-wider">ACTIVE_AGENTS</span>
              </div>
              <span className="text-xs text-gray-500">{agents.length} TOTAL</span>
            </div>
            
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {agents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => setSelectedAgent(agent)}
                  isSelected={selectedAgent?.id === agent.id}
                />
              ))}
              {agents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-mono text-sm">NO_ACTIVE_AGENTS</p>
                  <p className="text-xs mt-2">Deploy a new agent to begin</p>
                </div>
              )}
            </div>
          </div>

          {/* Terminal Panel */}
          <div className="bg-black/40 backdrop-blur-sm border border-green-500/30 rounded-lg overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <span className="text-sm font-bold tracking-wider">
                  {selectedAgent ? `LOGS: ${selectedAgent.name}` : "SYSTEM_LOGS"}
                </span>
              </div>
              {selectedAgent && (
                <button
                  onClick={() => stopAgent(selectedAgent.id)}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Square className="w-3 h-3" />
                  TERMINATE
                </button>
              )}
            </div>
            
            <div 
              ref={terminalRef}
              className="flex-1 p-4 font-mono text-sm overflow-y-auto max-h-96 bg-black/60"
            >
              {selectedAgent ? (
                selectedAgent.logs.length > 0 ? (
                  selectedAgent.logs.map((log, i) => (
                    <TerminalLine key={i} {...log} />
                  ))
                ) : (
                  <div className="text-gray-600 text-center py-8">
                    [WAITING_FOR_OUTPUT...]
                  </div>
                )
              ) : (
                <div className="text-gray-600 text-center py-8">
                  <p>[SELECT_AN_AGENT_TO_VIEW_LOGS]</p>
                  <p className="text-xs mt-2 opacity-50">Agents will appear here when deployed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-green-500/30 bg-black/60 backdrop-blur-md mt-6">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>SECURE_CONNECTION</span>
            <span>•</span>
            <span>ENCRYPTED</span>
          </div>
          <div className="flex items-center gap-4">
            <span>RENDER_EU_CENTRAL</span>
            <span>•</span>
            <span>LATENCY: {isConnected ? "<50ms" : "N/A"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
