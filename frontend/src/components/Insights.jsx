import { useMemo } from "react";
import { Activity, Zap, TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar as CalendarIcon, Lock } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from "recharts";
import useStore from "../store/useStore";

export default function Insights() {
  const { todos, focusSessions, getStats, isPro } = useStore();
  const stats = getStats();

  /* ================= WEEKLY DATA FOR LINE CHART ================= */
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toDateString();
    });

    return last7Days.map(day => {
      const completedCount = todos.filter(t => 
        t.completed && t.completedAt && new Date(t.completedAt).toDateString() === day
      ).length;
      
      const sessionCount = focusSessions.filter(s => 
        new Date(s.date).toDateString() === day
      ).length;

      return {
        name: day.split(' ')[0], // Mon, Tue...
        tasks: completedCount,
        focus: sessionCount
      };
    });
  }, [todos, focusSessions]);

  /* ================= CATEGORY DATA FOR PIE CHART ================= */
  const categoryData = useMemo(() => {
    const map = {};
    todos.forEach(t => {
      if (t.completed) {
        const cat = t.priority || "medium";
        map[cat] = (map[cat] || 0) + 1;
      }
    });

    return Object.entries(map).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [todos]);

  const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b"];

  /* ================= HEATMAP DATA (90 DAYS) ================= */
  const heatmapData = useMemo(() => {
    const days = [];
    const end = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date();
      d.setDate(end.getDate() - i);
      const dateStr = d.toDateString();
      const count = todos.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === dateStr).length;
      days.push({ date: dateStr, count });
    }
    return days;
  }, [todos]);

  /* ================= SMART CORRELATIONS ================= */
  const correlations = useMemo(() => {
    const hourMap = {};
    const dayMap = {};
    
    todos.forEach(t => {
      if (t.completed && t.completedAt) {
        const d = new Date(t.completedAt);
        const hour = d.getHours();
        const day = d.getDay();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
        dayMap[day] = (dayMap[day] || 0) + 1;
      }
    });

    const bestHour = Object.entries(hourMap).sort((a,b) => b[1] - a[1])[0]?.[0] || "--";
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bestDayIdx = Object.entries(dayMap).sort((a,b) => b[1] - a[1])[0]?.[0];
    const bestDay = bestDayIdx !== undefined ? days[bestDayIdx] : "--";

    const formattedHour = bestHour !== "--" ? (bestHour > 12 ? `${bestHour-12} PM` : `${bestHour} AM`) : "--";

    return { bestHour: formattedHour, bestDay };
  }, [todos]);

  /* ================= UI ================= */

  return (
    <div className="w-full pb-24 md:pb-6 transition-colors duration-300">
      
      {/* HERO METRIC */}
      <div className="relative bg-(--card-bg) rounded-[2.5rem] p-8 mb-8 shadow-sm border border-(--border)/60 overflow-hidden group">
        <div className="absolute top-[-50px] right-[-50px] w-[250px] h-[250px] bg-linear-to-bl from-(--gradient-start)/20 to-(--gradient-end)/10 rounded-full blur-[60px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-(--accent)/10 flex items-center justify-center text-(--accent)">
                <TrendingUp size={22} />
              </div>
              <p className="text-sm font-black tracking-widest opacity-60 uppercase">Productivity Index</p>
            </div>
            
            <h1 className="text-6xl sm:text-7xl font-black bg-linear-to-r from-(--gradient-start) to-(--gradient-end) bg-clip-text text-transparent mb-4">
              {stats.completionRate}%
            </h1>
            
            <p className="text-lg font-medium opacity-80 max-w-md leading-relaxed">
              You've crushed <span className="text-(--text-primary) font-black">{stats.completedCount} tasks</span> across <span className="text-(--text-primary) font-black">{stats.streak} days</span> of consistent effort.
            </p>
          </div>

          <div className="flex-1 min-h-[220px] w-full">
             <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--gradient-start)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--gradient-start)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="tasks" stroke="var(--gradient-start)" strokeWidth={4} fillOpacity={1} fill="url(#colorTasks)" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Weekly Activity Line Chart */}
        <div className="bg-(--card-bg) p-8 rounded-[2.5rem] border border-(--border)/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                 <BarChart3 size={20} />
               </div>
               <p className="text-sm font-black uppercase tracking-widest opacity-50">Workload Trends</p>
            </div>
          </div>
          <div className="h-[250px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, opacity: 0.5}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border)', fontWeight: 700, fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2 }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: "#8b5cf6", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution Pie Chart */}
        <div className="bg-(--card-bg) p-8 rounded-[2.5rem] border border-(--border)/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                 <PieChartIcon size={20} />
               </div>
               <p className="text-sm font-black uppercase tracking-widest opacity-50">Priority Focus</p>
            </div>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center min-h-[250px]">
            {categoryData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
                <div className="text-center opacity-30 font-bold uppercase tracking-widest text-xs">No Data Yet</div>
            )}
          </div>
        </div>

      </div>

      {/* HEATMAP SECTION (PRO) */}
      <div className="bg-(--card-bg) p-8 rounded-[2.5rem] border border-(--border)/60 shadow-sm mb-8 overflow-hidden relative">
         
         {/* PRO LOCK OVERLAY */}
         {!isPro && (
           <div className="absolute inset-0 z-20 bg-linear-to-b from-transparent via-(--card-bg)/60 to-(--card-bg) backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/10 border border-orange-500/20">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight">Unlock Consistency</h3>
              <p className="text-sm font-medium opacity-70 max-w-xs mb-6 leading-relaxed">
                Connect your daily effort with long-term trends using the **90-Day Activity Heatmap**.
              </p>
              <button 
                className="px-8 py-3 bg-linear-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:scale-105 transition-transform uppercase tracking-widest text-xs"
              >
                Upgrade to Pro
              </button>
           </div>
         )}

         <div className={`transition-all duration-700 ${!isPro ? 'blur-sm opacity-30 select-none grayscale' : ''}`}>
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest opacity-50">Consistency Heatmap</p>
               </div>
               <span className="text-[10px] bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-black">PRO INSIGHTS</span>
            </div>

            <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center md:justify-start">
               {heatmapData.map((day, i) => {
                  let opacity = "opacity-10";
                  if (day.count > 0) opacity = "bg-orange-500/30";
                  if (day.count > 2) opacity = "bg-orange-500/60";
                  if (day.count > 4) opacity = "bg-orange-500";
                  
                  return (
                     <div 
                       key={i} 
                       title={isPro ? `${day.date}: ${day.count} tasks` : "Pro Feature"}
                       className={`w-3 h-3 sm:w-4 sm:h-4 rounded-[3px] sm:rounded-[4px] transition-all hover:scale-125 hover:z-10 cursor-help ${day.count === 0 ? 'bg-(--text-primary)/10' : opacity}`}
                     />
                  );
               })}
            </div>
            <div className="flex justify-between mt-4 text-[9px] font-black uppercase opacity-30 tracking-widest">
               <span>90 Days Ago</span>
               <span>Today</span>
            </div>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatBox icon={<Activity className="text-orange-500" />} label="Peak Productive Day" value={correlations.bestDay} />
          <StatBox icon={<Zap className="text-amber-500" />} label="Prime Work Hour" value={correlations.bestHour} />
          <StatBox icon={<CalendarIcon className="text-emerald-500" />} label="Avg Daily Session" value={Math.round((stats.completedCount / stats.streak) || 0) + " Tasks"} />
      </div>

    </div>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <div className="bg-(--card-bg) p-6 rounded-3xl shadow-sm border border-(--border)/60 hover:shadow-md transition-shadow">
       <div className="flex items-center justify-between mb-4">
         <p className="text-xs font-bold tracking-widest opacity-50 uppercase">{label}</p>
         <div className="w-10 h-10 rounded-xl bg-linear-to-br from-(--bg) to-(--border)/30 flex items-center justify-center">
           {icon}
         </div>
       </div>
       <h2 className="text-3xl font-black">{value}</h2>
    </div>
  );
}