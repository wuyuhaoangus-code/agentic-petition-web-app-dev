import { Calendar, Clock, ArrowRight, Search } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';
import { useState, useEffect } from 'react';
import { postsService } from '@/app/admin/services/postsService';
import { AdminPost } from '@/app/admin/types/post';

interface ResourcesPageProps {
  page: 'niw' | 'eb1a' | 'stats';
}

export function ResourcesPage({ page }: ResourcesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
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

  const getPageConfig = () => {
    switch (page) {
      case 'niw':
        return {
          title: 'NIW & EB-2 Insights',
          subtitle: 'National Interest Waiver',
          description: 'Expert guidance on waiving labor certification. Discover how to position your work\'s national importance and substantial merit.',
          heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop', // Architecture/Building looking up
          accent: 'from-indigo-500 to-blue-600'
        };
      case 'eb1a':
        return {
          title: 'EB-1A Extraordinary Ability',
          subtitle: 'The "Einstein Visa"',
          description: 'Master the rigorous criteria for extraordinary ability. Deep dives into evidence strategies, reference letters, and case studies.',
          heroImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop', // Global network/tech
          accent: 'from-purple-500 to-pink-600'
        };
      case 'stats':
        return {
          title: 'Immigration Intelligence',
          subtitle: 'Data & Analytics',
          description: 'Data-driven decision making. We analyze USCIS processing times, approval trends, and policy shifts so you don\'t have to.',
          heroImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop', // Charts/Data
          accent: 'from-emerald-500 to-teal-600'
        };
      default:
        return {
          title: 'Resources',
          subtitle: 'Knowledge Base',
          description: 'Explore our collection of guides and articles.',
          heroImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2070',
          accent: 'from-blue-500 to-indigo-600'
        };
    }
  };

  const config = getPageConfig();
  
  // Filter posts based on page category and search
  const filteredPosts = posts.filter(post => {
    // 1. Filter by Page Category
    let matchesCategory = false;
    const categories = post.categories || [];
    
    if (page === 'niw') {
      matchesCategory = categories.some(c => 
        c.includes('NIW') || c.includes('EB-2') || c.includes('National Interest Waiver')
      );
    } else if (page === 'eb1a') {
      matchesCategory = categories.some(c => 
        c.includes('EB-1A') || c.includes('Extraordinary') || c.includes('Einstein')
      );
    } else if (page === 'stats') {
      matchesCategory = categories.some(c => 
        c.includes('Data') || c.includes('Stat') || c.includes('Trend') || c.includes('Policy')
      );
    } else {
      matchesCategory = true;
    }

    if (!matchesCategory) return false;

    // 2. Filter by Search Term
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      post.title.toLowerCase().includes(term) || 
      (post.excerpt && post.excerpt.toLowerCase().includes(term))
    );
  });

  // Only show published posts
  const publishedPosts = filteredPosts.filter(p => p.status === 'published');

  // Featured post is the first one
  const featuredPost = publishedPosts[0];
  const remainingPosts = publishedPosts.slice(1);

  // Helper to calculate read time
  const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric', 
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 font-sans selection:bg-primary/30">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={config.heroImage}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-60 scale-105 animate-[pulse_20s_ease-in-out_infinite] transition-transform duration-[20s]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F19]/80 via-[#0B0F19]/60 to-[#0B0F19]" />
          <div className={`absolute inset-0 bg-gradient-to-tr ${config.accent} mix-blend-overlay opacity-30`} />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-20">
          <span className={`inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium tracking-wider mb-6 text-gray-300 uppercase`}>
            {config.subtitle}
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 drop-shadow-xl leading-tight font-[Hanken_Grotesk]">
            {config.title}
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl mx-auto font-light font-[Poppins]">
            {config.description}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 -mt-24 relative z-20 pb-24">
        
        {/* Search Bar - Optional, can be added if needed, currently implied by state */}
        <div className="mb-12 flex justify-center">
           <div className="relative w-full max-w-lg">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
               <Search className="h-5 w-5 text-gray-400" />
             </div>
             <input
               type="text"
               className="block w-full pl-11 pr-4 py-3 bg-[#151B2B]/80 backdrop-blur-md border border-white/10 rounded-xl leading-5 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm shadow-xl transition-all"
               placeholder={`Search ${config.subtitle} articles...`}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : publishedPosts.length > 0 ? (
          <>
            {/* Featured Post (Large) */}
            {featuredPost && (
              <div className="mb-16 group cursor-pointer">
                <div className="grid md:grid-cols-2 gap-0 bg-[#151B2B] rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-500 shadow-2xl hover:shadow-indigo-900/10">
                  <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden">
                    <ImageWithFallback
                      src={featuredPost.imageUrl || config.heroImage}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151B2B] via-transparent to-transparent md:hidden" />
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
                        {featuredPost.categories?.[0] || 'General'}
                      </span>
                      <span className="text-gray-500 text-sm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {getReadTime(featuredPost.content)}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight group-hover:text-indigo-400 transition-colors font-[Poppins]">
                      {featuredPost.title}
                    </h2>
                    <p className="text-lg text-gray-400 mb-8 leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center text-white font-semibold group-hover:translate-x-2 transition-transform duration-300">
                      Read Full Article <ArrowRight className="ml-2 w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Remaining Posts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingPosts.map((post) => (
                <article
                  key={post.id}
                  className="group bg-[#151B2B] border border-white/5 rounded-2xl overflow-hidden hover:bg-[#1A2133] hover:border-white/10 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <ImageWithFallback
                      src={post.imageUrl || config.heroImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-lg border border-white/10">
                        {post.categories?.[0] || 'Article'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(post.updatedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{getReadTime(post.content)}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-100 mb-3 group-hover:text-indigo-400 transition-colors leading-snug line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-sm text-gray-400 leading-relaxed mb-6 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center text-sm font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      Read Article <ArrowRight className="ml-1 w-4 h-4" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No articles found</h3>
            <p className="text-gray-400">Try adjusting your search terms or check back later.</p>
          </div>
        )}

        {/* Newsletter CTA Dark Mode */}
        <div className="mt-24 relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-white/10 p-12 text-center">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">
              Join the Inner Circle
            </h3>
            <p className="text-gray-300 mb-8 text-lg">
              Get advanced immigration strategies and policy alerts delivered to your inbox. 
              We only send high-signal content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 bg-[#0B0F19] border border-white/20 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button className="px-8 py-3 bg-white text-[#0B0F19] font-bold rounded-xl hover:bg-gray-200 transition-colors whitespace-nowrap shadow-lg shadow-white/5">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}