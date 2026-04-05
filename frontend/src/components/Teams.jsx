import { useState, useEffect } from "react";
import { Users, Plus, Key, ArrowRight, User, CheckCircle2, ChevronRight } from "lucide-react";
import useStore from "../store/useStore";
import toast from "react-hot-toast";
import API_BASE_URL from "../config";

export default function Teams({ setCurrentPage }) {
  const { currentWorkspace, setCurrentWorkspace, teams, fetchTeams, fetchTodos } = useStore();
  const [activeTab, setActiveTab] = useState("my-teams");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: teamName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Team "${data.team.name}" created!`);
        setTeamName("");
        await fetchTeams();
        handleSelectWorkspace(data.team._id);
      } else {
        toast.error(data.message || "Failed to create team");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/team/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inviteCode: inviteCode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully joined ${data.team.name}!`);
        setInviteCode("");
        await fetchTeams();
        handleSelectWorkspace(data.team._id);
      } else {
        toast.error(data.message || "Failed to join team");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectWorkspace = (workspaceId) => {
    setCurrentWorkspace(workspaceId);
    fetchTodos();
    toast.success(workspaceId === "personal" ? "Switched to Personal Workspace" : "Switched to Team Workspace");
    setCurrentPage("home");
  };

  return (
    <div className="w-full pb-24 md:pb-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-semibold tracking-widest bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent uppercase mb-1">
            Collaboration
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Users className="text-(--accent)" size={32} />
            Teams
          </h1>
        </div>
      </div>

      <div className="flex gap-2 mb-6 p-1 bg-(--card-bg) border border-(--border)/60 rounded-xl overflow-x-auto hide-scrollbar">
        {[
          { id: "my-teams", label: "My Workspaces", icon: User },
          { id: "create", label: "Create Team", icon: Plus },
          { id: "join", label: "Join via Code", icon: Key }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center outline-none ${
              activeTab === tab.id 
                ? "bg-linear-to-r from-(--gradient-start) to-(--gradient-end) text-white shadow-md shadow-(--gradient-start)/20" 
                : "text-(--text-secondary) hover:bg-(--bg) hover:text-(--text-primary)"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "my-teams" && (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
          
          <div 
            onClick={() => handleSelectWorkspace("personal")}
            className={`p-6 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between ${
              currentWorkspace === "personal" 
                ? "bg-(--accent)/5 border-(--accent) shadow-sm shadow-(--accent)/10" 
                : "bg-(--card-bg) border-(--border)/60 hover:border-(--accent)/50 hover:shadow-md"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                currentWorkspace === "personal" ? "bg-(--accent) text-white" : "bg-(--bg) text-(--text-secondary) group-hover:text-(--accent)"
              }`}>
                <User size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Personal Workspace
                  {currentWorkspace === "personal" && <CheckCircle2 size={16} className="text-emerald-500" />}
                </h3>
                <p className="text-xs opacity-60 font-medium">Your private tasks.</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-(--text-secondary) group-hover:translate-x-1 transition-transform" />
          </div>

          {teams.map(team => (
            <div 
              key={team._id}
              onClick={() => handleSelectWorkspace(team._id)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer group flex items-center justify-between ${
                currentWorkspace === team._id 
                  ? "bg-(--accent)/5 border-(--accent) shadow-sm shadow-(--accent)/10" 
                  : "bg-(--card-bg) border-(--border)/60 hover:border-(--accent)/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                  currentWorkspace === team._id ? "bg-(--accent) text-white" : "bg-(--bg) text-(--text-secondary) group-hover:text-(--accent)"
                }`}>
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    {team.name}
                    {currentWorkspace === team._id && <CheckCircle2 size={16} className="text-emerald-500" />}
                  </h3>
                  <p className="text-xs opacity-60 font-medium bg-(--border)/50 px-2 py-0.5 rounded-md inline-block mt-1">
                    Invite Code: <span className="font-mono text-(--text-primary) tracking-wider">{team.inviteCode}</span>
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-(--text-secondary) group-hover:translate-x-1 transition-transform" />
            </div>
          ))}

          {teams.length === 0 && (
             <div className="py-12 px-6 flex flex-col items-center justify-center bg-(--card-bg)/30 rounded-3xl border border-dashed border-(--border)">
                <Users size={48} className="text-(--text-secondary) opacity-30 mb-4" />
                <p className="font-bold opacity-60 text-center mb-1">No Team Workspaces Yet</p>
                <p className="text-xs opacity-40 text-center max-w-sm">Create a new team to collaborate with colleagues, or join a team using an invite code.</p>
             </div>
          )}

        </div>
      )}

      {activeTab === "create" && (
        <form onSubmit={handleCreateTeam} className="p-8 bg-(--card-bg) rounded-3xl border border-(--border)/60 shadow-sm animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
            <Plus size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2">Build a Team</h2>
          <p className="text-sm opacity-60 mb-6 font-medium">Create a shared workspace to collaborate on tasks in real-time with colleagues.</p>
          
          <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-2">Team Name</label>
          <input 
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Marketing Team, Project Apollo..."
            className="w-full px-5 py-4 bg-(--bg) rounded-2xl border border-transparent focus:border-(--accent) focus:ring-2 ring-(--accent)/20 outline-none text-sm mb-6 transition-all font-semibold"
            required
            autoFocus
          />
          
          <button 
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 rounded-xl bg-(--accent) text-white font-bold tracking-widest uppercase text-xs flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-(--gradient-start)/20 disabled:opacity-50"
          >
            {isProcessing ? "Creating..." : "Create Team"}
            <ArrowRight size={16} />
          </button>
        </form>
      )}

      {activeTab === "join" && (
        <form onSubmit={handleJoinTeam} className="p-8 bg-(--card-bg) rounded-3xl border border-(--border)/60 shadow-sm animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6">
            <Key size={32} />
          </div>
          <h2 className="text-2xl font-black mb-2">Join a Team</h2>
          <p className="text-sm opacity-60 mb-6 font-medium">Got an invite code from a coworker? Drop it below to dive into their workspace.</p>
          
          <label className="text-xs font-bold uppercase tracking-wider opacity-60 block mb-2">Secret Invite Code</label>
          <input 
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="e.g. A3F9KX"
            className="w-full px-5 py-4 bg-(--bg) rounded-2xl border border-transparent focus:border-(--accent) focus:ring-2 ring-(--accent)/20 outline-none text-xl tracking-[0.3em] font-mono mb-6 transition-all uppercase"
            required
            autoFocus
            maxLength={6}
          />
          
          <button 
            type="submit"
            disabled={isProcessing || inviteCode.length < 6}
            className="w-full py-4 rounded-xl bg-(--accent) text-white font-bold tracking-widest uppercase text-xs flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-(--gradient-start)/20 disabled:opacity-50"
          >
            {isProcessing ? "Joining..." : "Join Team"}
            <ArrowRight size={16} />
          </button>
        </form>
      )}

    </div>
  );
}
