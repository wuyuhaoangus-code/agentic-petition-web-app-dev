import { Award, Shield, CheckCircle, Users, Database } from 'lucide-react';

export function TrustStrip() {
  const stats = [
    { 
      icon: Award, 
      value: "Document Intelligence", 
      label: "Auto-convert PDF to Word",
    },
    { 
      icon: Shield, 
      value: "Petition Structuring", 
      label: "Built on approved frameworks",
    },
    { 
      icon: Users, 
      value: "Case Tracking", 
      label: "Manage entire timeline",
    },
    { 
      icon: CheckCircle, 
      value: "80% Draft Ready", 
      label: "Designed for final legal polish",
    },
    { 
      icon: Database, 
      value: "4000+ Case Database", 
      label: "Match similar approved cases",
    }
  ];

  // Duplicate the stats array for seamless infinite scroll on desktop
  const allStats = [...stats, ...stats];

  return (
    <section className="py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Scrolling container */}
        <div className="overflow-x-auto md:overflow-hidden pb-4 md:pb-0 -mx-4 md:mx-0 px-4 md:px-0 scrollbar-hide">
          <div className="flex md:animate-scroll w-max md:w-full">
            {/* On mobile, we only show one set of stats to avoid confusion, or we can show all. 
                Since we have horizontal scroll, duplicate might be weird if user reaches end. 
                Let's use a CSS class to control display? 
                Actually, simpler to just map allStats and on mobile it just scrolls for a long time. 
                But better to just show 'stats' on mobile and 'allStats' on desktop? 
                That requires JS media query or two lists.
                Let's just use two lists for clean DOM.
            */}
            
            {/* Mobile View: Single list, scrollable */}
            <div className="flex md:hidden gap-3">
              {stats.map((stat, index) => (
                <div
                  key={`mobile-${index}`}
                  className="flex-shrink-0 w-[260px] bg-card backdrop-blur-sm border border-border rounded-lg p-6 text-center group hover:shadow-md transition-all"
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <stat.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="text-base font-medium text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed font-light">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Infinite Scroll with duplicates */}
            <div className="hidden md:flex">
               {allStats.map((stat, index) => (
                <div
                  key={`desktop-${index}`}
                  className="flex-shrink-0 w-[260px] bg-card backdrop-blur-sm border border-border rounded-lg p-6 text-center group hover:shadow-md transition-all mr-3"
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <stat.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="text-base font-medium text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed font-light">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Fine print disclaimer */}
        <div className="mt-2 md:mt-6 text-center text-xs text-muted-foreground/60 w-full px-2">
          Designed by professionals with deep EB-1 petition experience. Trusted by researchers, engineers, and founders across the U.S. No legal advice. No guarantee of approval.
        </div>
      </div>
    </section>
  );
}