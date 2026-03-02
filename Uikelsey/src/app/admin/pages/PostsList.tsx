import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  FileText, 
  Globe, 
  Edit3, 
  Trash2,
  Calendar,
  Loader2
} from 'lucide-react';
import { postsService } from '../services/postsService';
import { AdminPost } from '../types/post';
import { toast } from 'sonner';

export function PostsList({ onEdit, onCreate }: { onEdit: (id: string) => void, onCreate: () => void }) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      const data = await postsService.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await postsService.deletePost(id);
      toast.success('Post deleted successfully');
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2">
           <button 
             onClick={() => setStatusFilter('all')}
             className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
           >
             All Posts
           </button>
           <button 
             onClick={() => setStatusFilter('published')}
             className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'published' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
           >
             Published
           </button>
           <button 
             onClick={() => setStatusFilter('draft')}
             className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === 'draft' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
           >
             Drafts
           </button>
        </div>

        <button 
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search posts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-400"
          />
        </div>
        <div className="h-6 w-px bg-slate-200"></div>
        <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-2">
          <Filter className="w-4 h-4" />
          <span>Category</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-medium">
              <th className="px-6 py-4 w-[40%]">Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Categories</th>
              <th className="px-6 py-4">Stats</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPosts.map((post) => (
              <tr key={post.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1.5 rounded bg-slate-100 text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onEdit(post.id)}>
                        {post.title}
                      </h4>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>by {post.author}</span>
                        <span>•</span>
                        <span>Updated {new Date(post.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      post.status === 'draft' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }
                  `}>
                    {post.status === 'scheduled' && <Calendar className="w-3 h-3 mr-1" />}
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                  {post.scheduledFor && (
                    <div className="text-[10px] text-slate-400 mt-1 pl-1">
                      {post.scheduledFor}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {post.categories?.map(cat => (
                      <span key={cat} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                        {cat}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    {(post.views || 0).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(post.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(post.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPosts.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No posts found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
