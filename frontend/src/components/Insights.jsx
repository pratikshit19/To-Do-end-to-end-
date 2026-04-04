import { useMemo } from "react";
import { Activity, Zap, TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar as CalendarIcon } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area
} from "recharts";
import useStore from "../store/useStore";

export default function Insights() {
  const { todos, focusSessions, getStats } = useStore();
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatBox icon={<Activity className="text-orange-500" />} label="Avg Daily Tasks" value={Math.round(stats.completedCount / 7)} />
          <StatBox icon={<Zap className="text-amber-500" />} label="Peak Work Intensity" value="High" />
          <StatBox icon={<CalendarIcon className="text-emerald-500" />} label="Days Tracked" value={stats.streak} />
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