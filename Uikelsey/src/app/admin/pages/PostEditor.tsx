import { useState, useEffect } from 'react';
import { 
  Save, 
  Eye, 
  Send, 
  ArrowLeft, 
  Image as ImageIcon,
  Calendar,
  Search,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Heading1,
  Heading2,
  Heading3,
  MoreVertical,
  X,
  Loader2,
  Plus as PlusIcon
} from 'lucide-react';
import { postsService } from '../services/postsService';
import { AdminPost } from '../types/post';
import { toast } from 'sonner';

interface PostEditorProps {
  postId?: string;
  onBack: () => void;
}

export function PostEditor({ postId, onBack }: PostEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [categories, setCategories] = useState<string[]>(['NIW Fundamentals']);
  const [scheduledFor, setScheduledFor] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');

  useEffect(() => {
    if (postId) {
      loadPost(postId);
    }
  }, [postId]);

  const loadPost = async (id: string) => {
    try {
      setIsLoading(true);
      const post = await postsService.getPost(id);
      setTitle(post.title);
      setSlug(post.slug);
      setContent(post.content);
      setStatus(post.status);
      setCategories(post.categories);
      if (post.scheduledFor) setScheduledFor(post.scheduledFor);
      if (post.metaTitle) setMetaTitle(post.metaTitle);
      if (post.metaDescription) setMetaDescription(post.metaDescription);
    } catch (error) {
      console.error('Failed to load post:', error);
      toast.error('Failed to load post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (newStatus?: 'draft' | 'published' | 'scheduled') => {
    try {
      setIsSaving(true);
      const postData: Partial<AdminPost> = {
        title,
        slug,
        content,
        status: newStatus || status,
        categories,
        scheduledFor: newStatus === 'scheduled' ? scheduledFor : undefined,
        metaTitle,
        metaDescription,
        excerpt: content.substring(0, 150) + '...', // Simple excerpt generation
        author: 'Admin User', // Hardcoded for now
      };

      if (postId) {
        await postsService.updatePost(postId, postData);
        toast.success('Post updated successfully');
      } else {
        await postsService.createPost(postData);
        toast.success('Post created successfully');
        onBack(); // Go back after create
      }
      
      if (newStatus) setStatus(newStatus);
    } catch (error) {
      console.error('Failed to save post:', error);
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const toolbarItems = [
    { icon: Heading1, label: 'H1' },
    { icon: Heading2, label: 'H2' },
    { icon: Heading3, label: 'H3' },
    { separator: true },
    { icon: Bold, label: 'Bold' },
    { icon: Italic, label: 'Italic' },
    { separator: true },
    { icon: List, label: 'Bullet List' },
    { icon: ListOrdered, label: 'Numbered List' },
    { icon: Quote, label: 'Quote' },
    { icon: Code, label: 'Code Block' },
    { separator: true },
    { icon: Link, label: 'Link' },
    { icon: ImageIcon, label: 'Image' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Editor Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              {postId ? 'Edit Post' : 'New Post'}
            </h2>
            <p className="text-sm text-slate-500">
              {status === 'published' ? 'Published' : 'Draft - Unsaved changes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            Save Draft
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button 
            onClick={() => handleSave('published')}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
             Publish
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Left Panel: Meta Settings (Scrollable) */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
          
          {/* Main Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Details</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Post title"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Slug</label>
              <div className="flex">
                <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs text-slate-500 flex items-center">
                  /blog/
                </span>
                <input 
                  type="text" 
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-r-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Status</label>
              <select 
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {status === 'scheduled' && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Publish Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
             <div className="flex items-center justify-between">
               <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Categories</h3>
               <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Add New</button>
             </div>
             
             <div className="flex flex-wrap gap-2">
               {categories.map(cat => (
                 <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full border border-indigo-100">
                   {cat}
                   <button onClick={() => setCategories(categories.filter(c => c !== cat))} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                 </span>
               ))}
               <button className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-500 text-xs rounded-full border border-slate-200 border-dashed hover:border-slate-300 hover:text-slate-700 transition-colors">
                 <PlusIcon className="w-3 h-3" /> Add
               </button>
             </div>
          </div>

          {/* Cover Image */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">Cover Image</h3>
            
            <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/10 hover:text-indigo-500 transition-all cursor-pointer group">
              <ImageIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Click to upload</span>
            </div>
            
            <div className="space-y-1.5">
               <label className="text-xs font-medium text-slate-600">Alt Text</label>
               <input 
                 type="text" 
                 placeholder="Describe image for SEO"
                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
               />
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4" /> SEO Settings
            </h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Meta Title</label>
              <input 
                type="text" 
                value={metaTitle || title}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 text-right">{(metaTitle || title).length}/60 characters</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600">Meta Description</label>
              <textarea 
                rows={3}
                placeholder="Brief summary for search engines..."
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
              />
              <p className="text-[10px] text-slate-400 text-right">{metaDescription.length}/160 characters</p>
            </div>

            {/* OG Preview */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-medium text-slate-600 mb-2 block">Social Preview</label>
              <div className="bg-slate-50 border border-slate-200 rounded overflow-hidden">
                <div className="aspect-[1.91/1] bg-slate-200 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="p-3 bg-white">
                  <div className="text-xs font-bold text-slate-800 truncate">{title || 'Post Title'}</div>
                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2">{metaDescription || 'No description...'}</div>
                  <div className="text-[10px] text-slate-400 mt-2">dreamcard.ai</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Editor Area */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
          {/* Toolbar */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50 overflow-x-auto">
            {toolbarItems.map((item, index) => (
              item.separator ? (
                <div key={index} className="w-px h-5 bg-slate-200 mx-2 flex-shrink-0" />
              ) : (
                <button 
                  key={index}
                  className="p-2 text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded transition-all"
                  title={item.label}
                >
                  <item.icon className="w-4 h-4" />
                </button>
              )
            ))}
            <div className="flex-1" />
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>

          {/* Editor Input */}
          <textarea 
            className="flex-1 w-full p-8 resize-none focus:outline-none font-mono text-sm leading-relaxed text-slate-800"
            placeholder="# Start writing..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {/* Footer Status */}
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span>Words: {content.split(/\s+/).filter(Boolean).length}</span>
              <span>Reading time: {Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)} min</span>
            </div>
            <div>Markdown supported</div>
          </div>
        </div>
      </div>
    </div>
  );
}
