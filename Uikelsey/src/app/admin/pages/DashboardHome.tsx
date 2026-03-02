import { 
  BarChart3, 
  FileText, 
  Eye, 
  TrendingUp, 
  ArrowUpRight,
  Clock,
  CheckCircle2,
  FileEdit
} from 'lucide-react';
import { 
  AreaChart,
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useState, useEffect } from 'react';
import { postsService } from '../services/postsService';
import { AdminPost } from '../types/post';

const mockChartData = Array.from({ length: 30 }, (_, i) => ({
  date: `Nov ${i + 1}`,
  views: Math.floor(Math.random() * 500) + 100,
  visitors: Math.floor(Math.random() * 300) + 50,
}));

export function DashboardHome() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postsService.getPosts();
        setPosts(data);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Calculate Stats
  const totalPosts = posts.length;
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

  // Format views
  const formatViews = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  // Top Performing Posts
  const topPosts = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Posts" 
          value={totalPosts} 
          trend="+2" 
          trendUp={true} 
          trendLabel="this week"
          icon={FileText}
          color="indigo"
        />
        <StatsCard 
          title="Published" 
          value={publishedCount} 
          trend="+5%" 
          trendUp={true} 
          icon={CheckCircle2}
          color="emerald"
        />
        <StatsCard 
          title="Drafts" 
          value={draftCount} 
          trend="0" 
          trendUp={false} 
          trendLabel="vs last week"
          icon={FileEdit}
          color="amber"
        />
        <StatsCard 
          title="Total Views" 
          value={formatViews(totalViews)} 
          trend="+18%" 
          trendUp={true} 
          icon={Eye}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Traffic Overview</h3>
              <p className="text-sm text-slate-500">Daily views for the past 30 days (Simulated)</p>
            </div>
            <select className="bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
              <option>Last 30 Days</option>
              <option>Last 7 Days</option>
              <option>This Year</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }}
                  itemStyle={{ color: '#1e293b', fontSize: '13px', fontWeight: 600 }}
                  labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Articles */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Performing</h3>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {topPosts.length > 0 ? (
              topPosts.map((post, i) => (
                <div key={post.id} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {post.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {Math.ceil((post.content.split(/\s+/).length) / 200)}m
                      </span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-4">No posts found</div>
            )}
          </div>
          
          <div className="pt-4 mt-auto border-t border-slate-100">
            <button className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 py-2 rounded-lg transition-colors">
              View Analytics Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, trend, trendUp, trendLabel = "vs last month", icon: Icon, color }: any) {
  const colorStyles = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  }[color as string] || "bg-indigo-50 text-indigo-600";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${colorStyles}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'} flex items-center`}>
          {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1 rotate-180" />}
          {trend}
        </span>
        <span className="text-slate-400">{trendLabel}</span>
      </div>
    </div>
  );
}