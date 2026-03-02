import { ASSETS } from '@/app/config/assets';

interface VideoHeroProps {
  onAuth: (mode: 'signin' | 'signup') => void;
}

export function VideoHero({ onAuth }: VideoHeroProps) {
  return (
    <section className="pt-20 pb-12 px-4 md:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full overflow-hidden rounded-xl shadow-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          {/* Image container with aspect ratio - adjusted for mobile to be taller */}
          <div className="relative w-full h-[400px] md:h-auto md:pb-[56.25%]">
            {/* Background Image */}
            <img
              src={ASSETS.heroImage}
              alt="Airplane window with city skyline view"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            
            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
            
            {/* Text overlay and buttons centered */}
            <div className="absolute inset-0 flex items-center justify-center mx-[2px] my-[0px] px-[24px] py-[49px]">
              <div className="text-center w-full max-w-4xl">
                <h1 className="font-thin tracking-tight text-white text-4xl md:text-5xl leading-tight mx-[0px] mt-[20px] mb-[16px]" style={{ fontFamily: 'var(--font-serif-display)' }}>
                  Ethical Preparation<br />Strategically Strong Petitions
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-6 md:mb-8 leading-relaxed">
                  Analyze 4,000+ USCIS decisions to craft stronger arguments and predict RFE concerns before filing for EB1/EB2
                </p>
                
                {/* Two buttons */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center w-full sm:w-auto p-[0px]">
                  <button 
                    onClick={() => onAuth('signup')}
                    className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white hover:bg-indigo-700 transition-colors text-base font-semibold rounded-[10px] shadow-lg"
                  >
                    Start your workspace
                  </button>
                  <button 
                    onClick={() => onAuth('signup')}
                    className="w-full sm:w-auto py-3.5 bg-white/10 backdrop-blur-sm text-white border-2 border-white/40 hover:bg-white/20 transition-colors text-base font-semibold rounded-lg px-[32px] py-[15px]"
                  >
                    Book a demo →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}