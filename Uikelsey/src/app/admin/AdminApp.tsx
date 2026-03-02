import { useState } from 'react';
import { useNavigate, useLoaderData } from 'react-router';
import { AdminLayout } from './AdminLayout';
import { DashboardHome } from './pages/DashboardHome';
import { PostsList } from './pages/PostsList';
import { PostEditor } from './pages/PostEditor';
import { DiagnosticPanel } from '../components/DiagnosticPanel';

interface AdminAppProps {
  onExit?: () => void;
  currentUser?: { email: string; name?: string } | null;
}

type Page = 'dashboard' | 'posts' | 'categories' | 'media' | 'seo' | 'users' | 'settings' | 'post-editor' | 'diagnostics';

export default function AdminApp({ onExit, currentUser: propCurrentUser }: AdminAppProps = {}) {
  const navigate = useNavigate();
  const loaderData = useLoaderData() as { user: { email: string; name?: string } } | null;
  
  // Use current user from loader data if available, otherwise from props
  const currentUser = loaderData?.user || propCurrentUser;
  
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [editingPostId, setEditingPostId] = useState<string | undefined>(undefined);

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      navigate('/');
    }
  };

  const handleNavigate = (page: string) => {
    setActivePage(page as Page);
    if (page !== 'post-editor') {
      setEditingPostId(undefined);
    }
  };

  const handleEditPost = (id: string) => {
    setEditingPostId(id);
    setActivePage('post-editor');
  };

  const handleCreatePost = () => {
    setEditingPostId(undefined);
    setActivePage('post-editor');
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'posts':
        return <PostsList onEdit={handleEditPost} onCreate={handleCreatePost} />;
      case 'post-editor':
        return <PostEditor postId={editingPostId} onBack={() => setActivePage('posts')} />;
      case 'categories':
        return <PlaceholderPage title="Categories" icon="Tag" />;
      case 'media':
        return <PlaceholderPage title="Media Library" icon="Image" />;
      case 'seo':
        return <PlaceholderPage title="SEO Settings" icon="Search" />;
      case 'users':
        return <PlaceholderPage title="Users" icon="Users" />;
      case 'settings':
        return <PlaceholderPage title="System Settings" icon="Settings" />;
      case 'diagnostics':
        return <DiagnosticPanel />;
      default:
        return <DashboardHome />;
    }
  };

  // If in editor mode, we might want to hide the sidebar or handle it differently?
  // For now, we'll keep the layout wrapper, but maybe the editor needs full width.
  // The PostEditor component already handles its own layout structure, but it sits INSIDE the main layout content area.
  // If we want full screen editor, we might conditionally render layout.
  
  if (activePage === 'post-editor') {
    // We can still use the AdminLayout but maybe collapse the sidebar by default or just let it be.
    // Actually, typically editors are part of the layout.
    return (
      <AdminLayout 
        activePage="posts" // Highlight posts while editing
        onNavigate={handleNavigate} 
        onExit={handleExit}
        currentUser={currentUser}
      >
        {renderContent()}
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      activePage={activePage} 
      onNavigate={handleNavigate} 
      onExit={handleExit}
      currentUser={currentUser}
    >
      {renderContent()}
    </AdminLayout>
  );
}

function PlaceholderPage({ title }: { title: string, icon: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        {/* We can dynamically render icon if needed, but simple placeholder is fine */}
        <span className="text-2xl font-bold opacity-30">{title[0]}</span>
      </div>
      <h2 className="text-xl font-semibold text-slate-600 mb-2">{title}</h2>
      <p className="max-w-md text-center text-slate-400">
        This module is currently under development. Check back later for updates.
      </p>
    </div>
  );
}