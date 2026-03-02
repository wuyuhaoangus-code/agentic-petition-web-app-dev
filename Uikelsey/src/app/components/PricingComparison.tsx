import { Clock, CheckCircle2, Sparkles, DollarSign, FileText, Scale, Zap, FileInput, ShieldCheck } from 'lucide-react';

export function PricingComparison() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-gray-50/50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-normal tracking-tight text-gray-900 mb-6" style={{ fontFamily: 'var(--font-serif-display)' }}>
            Three ways to file. <span className="text-gray-400 block md:inline">Very different tradeoffs.</span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
            USCIS fees are the same regardless of how you file. <br className="hidden md:block"/>
            What you're really choosing is how much <span className="text-gray-900 font-medium">time</span>, <span className="text-gray-900 font-medium">uncertainty</span>, and <span className="text-gray-900 font-medium">money</span> you want to spend.
          </p>
        </div>

        {/* Mobile View (Cards) */}
        <div className="md:hidden space-y-6">
          {/* DreamCard Card (Highlighted) */}
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-indigo-600/20 overflow-hidden relative">
            <div className="absolute top-0 w-full h-1.5 bg-indigo-600"></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <div className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
                    Our Service
                  </div>
                  <h3 className="flex items-center">
                    <img src="https://ktwdsnuuqlffwnnajefe.supabase.co/storage/v1/object/public/dreamcard-assets/logo.png" alt="DreamCard" className="h-6 w-auto object-contain" />
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <FileInput className="w-4 h-4" />
                    <span>Cost</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-900">$1,015</div>
                    <div className="text-xs text-indigo-700/70">(+ ~$500 fees)</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>Time</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-700 flex items-center justify-end gap-1">
                      <Zap className="w-3 h-3 fill-indigo-700" />
                      ~20 mins
                    </div>
                    <div className="text-xs text-indigo-700/80">Immediate start</div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Strength</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-700">Precision</div>
                    <div className="text-xs text-indigo-700/80">Tailored arguments</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                   <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <DollarSign className="w-4 h-4" />
                    <span>Service Fee</span>
                  </div>
                   <div className="text-right">
                    <div className="font-bold text-indigo-700 text-xl font-[Lato]">$249–499</div>
                    <div className="text-xs text-indigo-600">One-time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Self-Prepared Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-90">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 text-lg">Self-Prepared</h3>
                 <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                  <FileText className="w-5 h-5" strokeWidth={1.5} />
                </div>
             </div>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Cost</span> <span className="font-medium text-gray-900">$1,015 <span className="text-gray-400 font-normal text-xs">(+fees)</span></span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span> <span className="font-medium text-gray-900">Months of research</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Strength</span> <span className="font-medium text-gray-900">Unverified</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-50"><span className="text-gray-500">Fee</span> <span className="font-medium text-gray-900">$0</span></div>
             </div>
          </div>

          {/* Law Firm Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 opacity-90">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-gray-900 text-lg">Law Firm</h3>
                 <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                  <Scale className="w-5 h-5" strokeWidth={1.5} />
                </div>
             </div>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Cost</span> <span className="font-medium text-gray-900">$1,015 <span className="text-gray-400 font-normal text-xs">(+fees)</span></span></div>
                <div className="flex justify-between"><span className="text-gray-500">Time</span> <span className="font-medium text-gray-900">Months to Years</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Strength</span> <span className="font-medium text-gray-900">Templates</span></div>
                <div className="flex justify-between pt-2 border-t border-gray-50"><span className="text-gray-500">Fee</span> <span className="font-medium text-gray-900">$8,000+</span></div>
             </div>
          </div>
        </div>

        {/* Desktop Comparison Matrix Container */}
        <div className="hidden md:block bg-white rounded-3xl shadow-xl ring-1 ring-gray-200/75 overflow-hidden">
          
          {/* Header Row */}
          <div className="grid grid-cols-4 border-b border-gray-100 relative">
            <div className="p-6 bg-white/50 backdrop-blur-sm"></div>
            
            {/* DIY Header */}
            <div className="p-6 text-center border-l border-gray-100 flex flex-col items-center justify-end pb-8 group">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
                <FileText className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Self-Prepared</h3>
            </div>

            {/* DreamCard Header - Highlighted */}
            <div className="p-6 text-center border-l border-indigo-100 bg-indigo-50/40 relative pb-8">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-b-lg shadow-sm tracking-wide uppercase">
                Our Service
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white shadow-sm ring-1 ring-indigo-100 flex items-center justify-center mb-4 text-indigo-600 mx-auto mt-4">
                <Sparkles className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="flex items-center justify-center">
                <img src="https://ktwdsnuuqlffwnnajefe.supabase.co/storage/v1/object/public/dreamcard-assets/logo.png" alt="DreamCard" className="h-8 w-auto object-contain" />
              </h3>
            </div>

            {/* Law Firm Header */}
            <div className="p-6 text-center border-l border-gray-100 flex flex-col items-center justify-end pb-8 group">
               <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
                <Scale className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Law Firm</h3>
            </div>
          </div>

          {/* Row 1: Filing & Material Cost */}
          <div className="grid grid-cols-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
            <div className="p-6 font-medium text-gray-700 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                 <FileInput className="w-5 h-5" />
              </div>
              <span className="leading-snug text-[15px]">Filing &<br/>Material Cost</span>
            </div>
            <div className="p-6 text-center border-l border-gray-100 text-gray-600 flex flex-col justify-center items-center font-medium">
              <span className="text-lg">$1,015</span>
              <span className="text-sm text-gray-400 font-normal">(+ ~$500 fees)</span>
              
            </div>
            <div className="p-6 text-center border-l border-indigo-100 bg-indigo-50/40 flex flex-col justify-center items-center">
              <span className="text-lg font-bold text-indigo-900">$1,015</span>
              <span className="text-sm text-indigo-700/70 font-medium">(+ ~$500 fees)</span>
              
            </div>
            <div className="p-6 text-center border-l border-gray-100 text-gray-600 flex flex-col justify-center items-center font-medium">
              <span className="text-lg">$1,015</span>
              <span className="text-sm text-gray-400 font-normal">(+ ~$2,300 fees)</span>
              <span className="text-[10px] text-gray-400 mt-1 max-w-[100px] leading-tight">Translation & Admin</span>
            </div>
          </div>

          {/* Row 2: Time to get started */}
          <div className="grid grid-cols-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
            <div className="p-6 font-medium text-gray-700 flex items-center gap-4">
               <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                 <Clock className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Time to get started</span>
            </div>
            <div className="p-6 text-center border-l border-gray-100 flex flex-col justify-center items-center">
              <span className="font-medium text-gray-900">Months of research</span>
              <span className="text-xs text-gray-500 mt-1 bg-gray-100 px-2 py-0.5 rounded-full">High learning curve</span>
            </div>
            <div className="p-6 text-center border-l border-indigo-100 bg-indigo-50/40 flex flex-col justify-center items-center relative">
              <span className="font-bold text-indigo-700 text-lg flex items-center gap-1.5">
                <Zap className="w-4 h-4 fill-indigo-700" />
                less than 20 minutes
              </span>
              <span className="text-xs text-indigo-700/80 mt-1 font-medium">Immediate start</span>
            </div>
            <div className="p-6 text-center border-l border-gray-100 flex flex-col justify-center items-center">
              <span className="font-medium text-gray-900">Months to Years</span>
              
            </div>
          </div>

          {/* Row 3: Petition Strength */}
          <div className="grid grid-cols-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors group">
            <div className="p-6 font-medium text-gray-700 flex items-center gap-4">
               <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                 <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Petition Strength</span>
            </div>
            <div className="p-6 text-center border-l border-gray-100 flex flex-col justify-center items-center">
              <span className="text-gray-900 font-medium">Unverified Strategy</span>
              
            </div>
            <div className="p-6 text-center border-l border-indigo-100 bg-indigo-50/40 flex flex-col justify-center items-center">
              <span className="font-bold text-indigo-700">Precision Drafting</span>
              <span className="text-[10px] text-indigo-700/90 mt-1 font-medium leading-tight max-w-[150px]">Arguments tailored to USCIS adjudication standards</span>
            </div>
            <div className="p-6 text-center border-l border-gray-100 flex flex-col justify-center items-center">
              <span className="text-gray-900 font-medium">Generic Templates</span>
              <span className="text-[10px] text-gray-500 mt-1 leading-tight max-w-[150px]">Reused boilerplate often ignores your unique merits</span>
            </div>
          </div>

          {/* Row 4: Service Fee (Footer) */}
          <div className="grid grid-cols-4 bg-gray-50/50">
            <div className="p-6 font-medium text-gray-900 flex items-center gap-4">
               <div className="p-2 rounded-lg bg-white shadow-sm text-gray-900">
                 <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[15px]">Service Fee</span>
            </div>
            
            <div className="p-6 text-center border-l border-gray-100 flex flex-col justify-center items-center">
              <div className="text-3xl font-medium text-gray-900 tracking-tight font-[Lato]">$0</div>
              <div className="text-xs text-gray-400 mt-1 font-medium">Self-service</div>
            </div>
            
            <div className="p-6 text-center border-l border-indigo-100 bg-indigo-50/40 flex flex-col justify-center items-center relative">
              <div className="text-indigo-700 tracking-tight font-[Lato] text-[32px]">$249–$499</div>
              <div className="text-xs text-indigo-600 mt-1 font-bold">One-time payment</div>
            </div>
            
            <div className="p-6 text-center border-l border-gray-100 flex flex-col justify-center items-center">
              <div className="text-3xl font-medium text-gray-900 tracking-tight font-[Lato] font-bold">$8,000+</div>
               <div className="text-xs text-gray-400 mt-1 font-medium">Retainer fee</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 md:mt-16 text-center">
          <div className="flex flex-col items-center gap-2">
            <button className="group hover:bg-700 text-white text-lg font-medium py-4 px-12 rounded-full transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3 mx-auto bg-primary">
              <span>Start with DreamCard</span>
              
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Are you a law firm? <a href="mailto:partners@dreamcard.ai" className="text-indigo-600 font-medium hover:underline">Contact us for business solutions</a>
            </p>
            <p className="md:hidden text-xs text-amber-600/80 mt-4 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
              Note: The DreamCard Workspace is optimized for desktop. Please visit on a laptop to file your petition.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}