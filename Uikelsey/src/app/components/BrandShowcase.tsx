import { Sparkles, TrendingUp, Shield, Zap, Database } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function BrandShowcase() {
  return (
    <section className="relative py-20 px-6 bg-[rgb(243,244,245)]">
      <div className="max-w-7xl mx-auto">
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Visual Hero Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative rounded-xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758876202980-0a28b744fb24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkYXRhJTIwdmlzdWFsaXphdGlvbiUyMGRhc2hib2FyZHxlbnwxfHx8fDE3NzAyMjMyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="DreamCardAI Platform Dashboard"
                className="w-full h-auto aspect-[4/3] object-cover"
              />
              
              {/* Floating Stats Cards - Simplified */}
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">96%</div>
                    <div className="text-xs text-gray-600">Match Score</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">4,000+</div>
                    <div className="text-xs text-gray-600">Cases Analyzed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Brand Message */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full mb-6">
              <Database className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">
                4,000+ Case Database
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-normal tracking-tight text-gray-900 mb-6 leading-tight" style={{ fontFamily: 'var(--font-serif-display)' }}>
              Your petition, backed by<br />data-driven insights
            </h2>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Analyze real USCIS decisions to craft stronger arguments and predict concerns before filing.
            </p>

            {/* Feature Highlights - Simplified */}
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Real-Time Case Matching
                  </h4>
                  <p className="text-sm text-gray-600">
                    Compare your profile against approved EB-1A cases to identify strengths and concerns.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    RFE Pattern Detection
                  </h4>
                  <p className="text-sm text-gray-600">
                    Predict USCIS questions based on historical patterns, address them upfront.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-white border border-gray-200">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Strategic Petition Building
                  </h4>
                  <p className="text-sm text-gray-600">
                    Leverage insights from thousands of successful cases in your field.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 0.5s;
        }
      `}</style>
    </section>
  );
}