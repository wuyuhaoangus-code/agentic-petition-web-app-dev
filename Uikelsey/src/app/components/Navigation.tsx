import { ASSETS } from '@/app/config/assets';
import { ChevronDown, Menu, X, BookOpen, Award, BarChart2, ArrowRight, FileText } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface NavigationProps {
  onAuth: (mode: 'signin' | 'signup') => void;
  onResourcesClick?: (page: 'niw' | 'eb1a' | 'stats') => void;
  currentPage?: 'home' | 'niw' | 'eb1a' | 'stats';
  activeResourcePage?: 'niw' | 'eb1a' | 'stats' | null;
  onHomeClick?: () => void;
  currentUser?: { email: string; name?: string } | null;
  onAccountClick?: () => void;
}

export function Navigation({ onAuth, onResourcesClick, currentPage = 'home', activeResourcePage = null, onHomeClick, currentUser, onAccountClick }: NavigationProps) {
  const [showResourcesDropdown, setShowResourcesDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowResourcesDropdown(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setShowResourcesDropdown(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Determine which logo to show
  const isOnResourcesPage = currentPage === 'niw' || currentPage === 'eb1a' || currentPage === 'stats';
  const currentLogo = isOnResourcesPage ? ASSETS.blogsLogo : ASSETS.logo;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 backdrop-blur-sm z-50 bg-white/80 border-b border-gray-100/50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between relative">
        <img 
          src={currentLogo} 
          alt="DreamCard.AI" 
          className="h-6 md:h-8 cursor-pointer" 
          onClick={() => {
            if (isOnResourcesPage) {
              window.location.reload();
            } else {
              window.scrollTo(0, 0);
            }
          }} 
        />
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          {isOnResourcesPage && (
            <button 
              onClick={() => {
                if (onHomeClick) {
                  onHomeClick();
                } else {
                  window.location.reload();
                }
              }}
              className="text-sm text-foreground hover:text-primary transition-colors relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </button>
          )}

          {!isOnResourcesPage && (
            <>
              <a href="#how-it-works" className="text-sm text-foreground hover:text-primary transition-colors relative group">
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </a>
              
              <a href="#pricing" className="text-sm text-foreground hover:text-primary transition-colors relative group">
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </a>
            </>
          )}
          
          <div 
            className="relative group/resources"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button className="text-sm text-foreground hover:text-primary transition-colors relative group flex items-center gap-1">
              Resources
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showResourcesDropdown ? 'rotate-180' : ''}`} />
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </button>
            
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] h-2" />
            
            <div 
              className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[800px] transition-all duration-200 ${
                showResourcesDropdown 
                  ? 'opacity-100 visible translate-y-0' 
                  : 'opacity-0 invisible -translate-y-2 pointer-events-none'
              }`}
              ref={dropdownRef}
            >
              <div className="bg-white border border-border/60 rounded-xl shadow-2xl overflow-hidden ring-1 ring-black/5">
                <div className="flex">
                  {/* Left Column: Navigation Links */}
                  <div className="flex-1 p-6">

                    
                    <div className="grid gap-2">
                      <button
                        onClick={() => {
                          onResourcesClick?.('niw');
                          setShowResourcesDropdown(false);
                        }}
                        className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 group text-left
                          ${activeResourcePage === 'niw' ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                      >
                        <div className={`mt-1 p-2 rounded-lg transition-colors ${activeResourcePage === 'niw' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`font-semibold text-base mb-1 ${activeResourcePage === 'niw' ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                            About NIW / EB-2
                          </div>
                          <p className="text-sm text-muted-foreground leading-snug">
                            National Interest Waiver guide. Eligibility, three-prong test, and filing strategies.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onResourcesClick?.('eb1a');
                          setShowResourcesDropdown(false);
                        }}
                        className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 group text-left
                          ${activeResourcePage === 'eb1a' ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                      >
                        <div className={`mt-1 p-2 rounded-lg transition-colors ${activeResourcePage === 'eb1a' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`font-semibold text-base mb-1 ${activeResourcePage === 'eb1a' ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                            About EB-1A
                          </div>
                          <p className="text-sm text-muted-foreground leading-snug">
                            Extraordinary Ability Green Card. Criteria breakdown and evidence requirements.
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          onResourcesClick?.('stats');
                          setShowResourcesDropdown(false);
                        }}
                        className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 group text-left
                          ${activeResourcePage === 'stats' ? 'bg-primary/5' : 'hover:bg-slate-50'}`}
                      >
                        <div className={`mt-1 p-2 rounded-lg transition-colors ${activeResourcePage === 'stats' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                          <BarChart2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className={`font-semibold text-base mb-1 ${activeResourcePage === 'stats' ? 'text-primary' : 'text-foreground group-hover:text-primary'}`}>
                            Stats and Reports
                          </div>
                          <p className="text-sm text-muted-foreground leading-snug">
                            Latest USCIS approval rates, processing times, and immigration trends.
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Featured Guide */}
                  <div className="w-[300px] bg-slate-50 border-l border-border/50 p-6 flex flex-col relative overflow-hidden group/card">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform duration-500 group-hover/card:scale-110">
                      <FileText className="w-32 h-32" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                           Popular
                        </span>
                      </div>
                      
                      <h4 className="text-xl font-bold text-foreground mb-3 leading-tight">
                        Complete Guide to EB-1A & NIW
                      </h4>
                      
                      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                         Download our comprehensive guide to understand the key differences and choose the right path for your profile.
                      </p>
                      
                      <div className="mt-auto">
                         <button className="w-full py-2.5 px-4 bg-white border border-border shadow-sm rounded-lg text-sm font-medium text-foreground hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center gap-2 group/btn">
                          
                           <ArrowRight className="w-100 h-4 transition-transform group-hover/btn:translate-x-1" />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {!isOnResourcesPage && (
            <a href="#faq" className="text-sm text-foreground hover:text-primary transition-colors relative group">
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          )}
        </div>
        
        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => currentUser ? onAccountClick?.() : onAuth('signin')} 
            className="text-sm text-foreground hover:text-primary transition-colors relative group"
          >
            My Account
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </button>

          <button 
            onClick={() => currentUser ? onAccountClick?.() : onAuth('signin')}
            className="px-6 py-2.5 bg-primary text-primary-foreground text-base font-medium hover:opacity-90 transition-opacity rounded-sm"
          >
            {currentUser ? 'Go to My Workspace' : 'Get Started'}
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg animate-in slide-in-from-top-5 duration-200 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="flex flex-col p-6 space-y-4">
            {isOnResourcesPage && (
              <button 
                onClick={() => {
                  if (onHomeClick) {
                    onHomeClick();
                  } else {
                    window.location.reload();
                  }
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 text-lg font-medium text-gray-800 border-b border-gray-50"
              >
                Home
              </button>
            )}

            {!isOnResourcesPage && (
              <>
                <a 
                  href="#how-it-works" 
                  className="text-left py-2 text-lg font-medium text-gray-800 border-b border-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a 
                  href="#pricing" 
                  className="text-left py-2 text-lg font-medium text-gray-800 border-b border-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
              </>
            )}

            <div className="py-2 border-b border-gray-50">
              <div className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-500" />
                Resources
              </div>
              <div className="pl-4 flex flex-col space-y-3 mt-3">
                <button
                  onClick={() => {
                    onResourcesClick?.('niw');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 py-1 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                  About NIW/EB-2
                </button>
                <button
                  onClick={() => {
                    onResourcesClick?.('eb1a');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 py-1 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                  About EB-1A
                </button>
                <button
                  onClick={() => {
                    onResourcesClick?.('stats');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-gray-600 py-1 flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  Stats and Reports
                </button>
              </div>
            </div>

            {!isOnResourcesPage && (
               <a 
                href="#faq" 
                className="text-left py-2 text-lg font-medium text-gray-800 border-b border-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
            )}

            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={() => {
                  if (currentUser) {
                    onAccountClick?.();
                  } else {
                    onAuth('signin');
                  }
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 text-center border border-gray-200 rounded-lg text-gray-700 font-medium"
              >
                My Account
              </button>
              <button 
                onClick={() => {
                  if (currentUser) {
                    onAccountClick?.();
                  } else {
                    onAuth('signin');
                  }
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 text-center bg-primary text-primary-foreground rounded-lg font-medium"
              >
                {currentUser ? 'Go to My Workspace' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}