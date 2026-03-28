"use client";

import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Play, 
  Square, 
  Terminal, 
  Activity, 
  Cpu, 
  HardDrive,
  Clock,
  Plus
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
  activeAgents: number;
  totalAgents: number;
}

export default function MissionControl() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [system, setSystem] = useState<SystemStats | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
    
    // Fetch system stats
    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 5000);
    
    return () => {
      newSocket.close();
      clearInterval(interval);
    };
  }, []);

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
    const name = prompt("Agent name:");
    if (!name) return;
    
    const task = prompt("Task description:");
    if (!task) return;
    
    const command = prompt("Command to run (e.g., claude --print 'do something'):");
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
      alert("Failed to start agent: " + err);
    }
  };

  const stopAgent = async (id: string) => {
    try {
      await fetch(`https://mission-control-api-5118.onrender.com/api/agents/${id}/stop`, {
        method: "POST"
      });
    } catch (err) {
      alert("Failed to stop agent: " + err);
    }
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Terminal className="w-8 h-8 text-blue-500" />
            Mission Control V2
          </h1>
          <p className="text-gray-400 mt-1">
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </p>
        </div>
        <button
          onClick={startAgent}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Agent
        </button>
      </header>

      {/* System Stats */}
      {system && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-5 h-5" />
              Uptime
            </div>
            <div className="text-2xl font-bold">{formatUptime(system.uptime)}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Cpu className="w-5 h-5" />
              Memory
            </div>
            <div className="text-2xl font-bold">{system.memory.used} MB</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Activity className="w-5 h-5" />
              Active Agents
            </div>
            <div className="text-2xl font-bold">{system.activeAgents}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Terminal className="w-5 h-5" />
              Total Agents
            </div>
            <div className="text-2xl font-bold">{system.totalAgents}</div>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Agent List */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Agents
          </h2>
          <div className="space-y-3">
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedAgent?.id === agent.id 
                    ? "bg-blue-900/50 border border-blue-500" 
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{agent.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    agent.status === "running" ? "bg-yellow-600" :
                    agent.status === "completed" ? "bg-green-600" :
                    agent.status === "error" ? "bg-red-600" :
                    "bg-gray-600"
                  }`}>
                    {agent.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-2">{agent.task}</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${agent.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{agent.progress}%</span>
                  {agent.status === "running" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        stopAgent(agent.id);
                      }}
                      className="p-1 hover:bg-red-600 rounded transition-colors"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {agents.length === 0 && (
              <p className="text-gray-500 text-center py-8">No agents running</p>
            )}
          </div>
        </div>

        {/* Agent Logs */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Live Logs
          </h2>
          {selectedAgent ? (
            <div className="font-mono text-sm h-96 overflow-y-auto bg-black rounded p-4">
              {selectedAgent.logs.map((log, i) => (
                <div key={i} className={`mb-1 ${
                  log.type === "stderr" ? "text-red-400" : "text-green-400"
                }`}>
                  <span className="text-gray-500">[{new Date(log.time).toLocaleTimeString()}]</span>
                  {" "}{log.message}
                </div>
              ))}
              {selectedAgent.logs.length === 0 && (
                <p className="text-gray-600">No logs yet...</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Select an agent to view logs</p>
          )}
        </div>
      </div>
    </div>
  );
}
