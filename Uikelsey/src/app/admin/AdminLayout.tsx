import { useState } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Tag, 
  Image, 
  Search, 
  Users, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  ChevronDown,
  Activity
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  onExit: () => void;
  currentUser?: { email: string; name?: string } | null;
}

export function AdminLayout({ children, activePage, onNavigate, onExit, currentUser }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'posts', label: 'Posts', icon: FileText },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'seo', label: 'SEO Settings', icon: Search },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
    { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex font-sans text-slate-800">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-[#0B0F19] text-slate-400 transition-all duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
              D
            </div>
            {sidebarOpen && (
              <span className="font-semibold text-white tracking-wide truncate">
                DreamCard AI
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${activePage === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400' 
                  : 'hover:bg-white/5 hover:text-slate-200'
                }
              `}
              title={!sidebarOpen ? item.label : undefined}
            >
              <item.icon 
                className={`w-5 h-5 shrink-0 transition-colors
                  ${activePage === item.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}
                `} 
              />
              {sidebarOpen && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0B0F19]">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-200 text-xs font-medium shrink-0 border border-indigo-500/30">
              {currentUser?.name?.[0] || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {currentUser?.name || 'Admin User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentUser?.email || 'admin@dreamcard.ai'}
                </div>
              </div>
            )}
            {sidebarOpen && (
              <button 
                onClick={onExit}
                className="text-slate-500 hover:text-white transition-colors"
                title="Exit Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              {menuItems.find(i => i.id === activePage)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1"></div>

            <button 
              onClick={onExit}
              className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Exit to App
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}