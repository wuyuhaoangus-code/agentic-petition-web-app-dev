import { ASSETS } from '@/app/config/assets';

interface FooterProps {
  onNavigate?: (page: 'privacy' | 'terms' | 'cookie') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#2a3255] text-white border-t border-white/10">
      
        {/* Large Logo */}
        <div className="text-center flex justify-center mx-[0px] mt-[82px] mb-[-30px]">
          <img 
            src="https://ktwdsnuuqlffwnnajefe.supabase.co/storage/v1/object/public/dreamcard-assets/logowhite.png" 
            alt="DreamCard.AI" 
            className="h-10 md:h-10 lg:h-18 opacity-100 mx-[0px] " 
          />
        </div>
         <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
       
         {/* Top Links Section - Centered */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 md:gap-20 text-sm font-light mx-[0px] mt-[-1px] mb-[64px]">
          <button 
            onClick={() => onNavigate?.('privacy')} 
            className="text-white/50 hover:text-white transition-colors text-[14px] font-thin"
          >
            Privacy Policy
          </button>
          
          <button 
            onClick={() => onNavigate?.('terms')} 
            className="text-white/50 hover:text-white transition-colors text-[14px] font-thin"
          >
            Terms of Use
          </button>
          <button
            onClick={() => window.location.href = 'mailto:hello@dreamcardai.com'}
            className="text-white/50 hover:text-white transition-colors text-[14px] font-thin"
          >
            Contact
          </button>
        </div>


        {/* Legal Disclaimer */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex gap-4 text-xs text-white/50 leading-relaxed">
            <span className="flex-shrink-0">© 2024</span>
            <div>
              <p className="mb-2">
                <strong className="text-white/70">Disclaimer:</strong> This website is intended for general informational purposes only.  It does not constitute legal advice and is no substitute for consulting a licensed attorney. Only an attorney can provide you with legal advice, and only after considering your specific facts and circumstances. 
                For legal advice specific to your case, please consult with a licensed attorney. Nothing on this website, including guides and resources, 
                is intended to be legal advice, and use of this site does not create an attorney-client relationship. 
                DreamCardAI is not affiliated with or endorsed by United States Citizenship and Immigration Services (USCIS) or any other government agency. 
                Use of this site is subject to our Privacy Policy and Terms of Use. 
                If you have any questions, please contact us at{' '}
                <a href="mailto:legal@dreamcardai.com" className="text-white hover:text-white/80 transition-colors underline">
                  support@dreamcardai.com
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section - Contact Info Only */}
        <div className="flex justify-center items-center gap-6 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 text-xs text-white/70">
            <span>Los Angeles, CA</span>
            <span className="hidden md:inline text-white/30">|</span>
            <a href="tel:+14155551234" className="hover:text-white transition-colors">
              (415) 555-1234
            </a>
            <span className="hidden md:inline text-white/30">|</span>
            <a href="mailto:hello@dreamcardai.com" className="hover:text-white transition-colors">
              hello@dreamcardai.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}