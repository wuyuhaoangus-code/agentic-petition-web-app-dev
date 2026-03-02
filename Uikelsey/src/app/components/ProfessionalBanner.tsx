import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface ProfessionalBannerProps {
  variant: 'trust' | 'expert' | 'success';
  onAuth?: (mode: 'signin' | 'signup') => void;
}

export function ProfessionalBanner({ variant, onAuth }: ProfessionalBannerProps) {
  const configs = {
    trust: {
      image: 'https://images.unsplash.com/photo-1758691737278-3af15b37af48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBwcm9mZXNzaW9uYWwlMjBhc2lhbiUyMGJ1c2luZXNzJTIwbWVldGluZ3xlbnwxfHx8fDE3NzAwODQ0OTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Built for professionals who value clarity',
      subtitle: '4,000+ USCIS decisions analyzed to help you understand what works',
      stats: [
        { value: '4,000+', label: 'USCIS Cases' },
        { value: '10', label: 'EB-1A Criteria' },
        { value: '2024', label: 'Latest Data' }
      ]
    },
    expert: {
      image: 'https://images.unsplash.com/photo-1758630737361-ca7532fb5e7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdHRvcm5leSUyMGxhd3llciUyMG9mZmljZSUyMGRvY3VtZW50cyUyMHByb2Zlc3Npb25hbCUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzAwODQ0OTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Expert guidance at every step',
      subtitle: 'From initial assessment to final filing, we help you build a complete petition',
      features: [
        'AI-powered petition drafting',
        'Document organization & prep',
        'Professional review available'
      ]
    },
    success: {
      image: 'https://images.unsplash.com/photo-1758691737138-7b9b1884b1db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdWNjZXNzJTIwYWNoaWV2ZW1lbnQlMjBwcm9mZXNzaW9uYWwlMjBjZWxlYnJhdGlvbiUyMG9mZmljZXxlbnwxfHx8fDE3NzAwODQ1MDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      title: 'Your success is our mission',
      subtitle: 'Join professionals who are taking control of their immigration journey',
      cta: {
        text: 'Start Your Workspace',
        subtext: 'Free assessment included'
      }
    }
  };

  const config = configs[variant];

  return (
    <section className="py-20 px-6 relative overflow-hidden">
      {/* Full-width image container */}
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden shadow-2xl">
          {/* Background Image */}
          <div className="relative h-[500px] md:h-[600px]">
            <img
              src={config.image}
              alt="Professional environment"
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Gradient Overlay - indigo/purple theme */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 via-purple-900/85 to-indigo-900/70" />
            
            {/* Content */}
            <div className="relative h-full flex items-center">
              <div className="max-w-4xl mx-auto px-8 md:px-12 text-center">
                {/* Title */}
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 tracking-tight">
                  {config.title}
                </h2>
                
                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto">
                  {config.subtitle}
                </p>

                {/* Stats variant */}
                {variant === 'trust' && config.stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {config.stats.map((stat, index) => (
                      <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                        <div className="text-5xl font-bold text-white mb-2">
                          {stat.value}
                        </div>
                        <div className="text-lg text-white/80">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Features variant */}
                {variant === 'expert' && config.features && (
                  <div className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-4xl mx-auto">
                    {config.features.map((feature, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-4 border border-white/20"
                      >
                        <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
                        <span className="text-base md:text-lg text-white font-medium">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTA variant */}
                {variant === 'success' && config.cta && onAuth && (
                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => onAuth('signup')}
                      className="group px-8 py-5 bg-white text-indigo-900 hover:bg-gray-100 transition-all text-lg font-semibold rounded-lg shadow-xl flex items-center gap-3"
                    >
                      {config.cta.text}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-sm text-white/80">
                      {config.cta.subtext}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
