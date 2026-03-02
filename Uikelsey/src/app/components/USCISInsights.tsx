import { ArrowRight, CheckCircle2, FileSearch, Sparkles, Target, Upload, FileText, AlertCircle, Database, TrendingUp, Send, FolderCheck } from 'lucide-react';

export function USCISInsights() {
  return (
    <section className="bg-white px-4 sm:px-6 md:px-[24px] py-12 sm:py-16 md:py-[33px]">
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-normal tracking-tighter text-gray-900 m-[0px] text-2xl sm:text-3xl md:text-4xl px-4" style={{ fontFamily: 'var(--font-serif-display)' }}>
            How DreamCard works
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-base sm:text-lg px-4 py-3 sm:py-[9px]">
            3-steps to build your first petition backed by 4,000+ USCIS case data
          </p>
        </div>

        {/* Visual Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Step 1: Tell Us About You */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 relative hover:border-gray-300 transition-all shadow-sm">
            <div className="absolute -top-3 left-8 bg-gray-900 text-white font-bold px-3 py-1 rounded-full font-[Playfair] text-[15px]">
              Step 1
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Structure your background
              </h3>
              <p className="text-gray-600 mb-6 text-base">
                Any formate, Any language<br></br> Organize your materials into petition-ready structure
              </p>
              <div className="space-y-2.5 w-full text-left">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-sm">Upload documents</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-sm">Criteria Mapping</span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-700 font-medium text-sm">Basic info & profession</span>
                </div>
              </div>
            </div>

            {/* Arrow for desktop */}
            <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
              <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center shadow-lg">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Step 2: Match & Generate - EMPHASIZED */}
          <div className="bg-gradient-to-br from-blue-50 via-white to-white border-1 border-blue-100 rounded-xl p-8 relative shadow-md hover:shadow-lg transition-all">
            <div className="absolute -top-3 left-8 bg-black text-white font-bold px-3 py-1 rounded-full shadow-md font-[Playfair] text-[15px]">
              Step 2 • Key Step
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center mb-4">
                <Database className="w-8 h-8 text-gray-700" strokeWidth={1.5} />
              </div>
             
              <h3 className="text-xl font-bold text-gray-900 mb-2">
               Petition Letter Back by Case
              </h3>
              <p className="text-indigo-700 font-regular mb-6 text-base">
                 Match similar petitioners case
              </p>
              
              {/* Key Benefits */}
              <div className="w-full mx-[0px] mt-[31px] mb-[20px]">
                <div className="bg-white border border-blue-100 rounded-lg px-3 py-2.5 text-left hover:border-blue-200 transition-colors">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="text-sm font-semibold text-gray-900">Craft stronger arguments</p>
                  </div>
                </div>
                
                <div className="bg-white border border-blue-100 rounded-lg px-3 py-2.5 text-left hover:border-blue-200 transition-colors">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                    <p className="font-semibold text-gray-900 text-sm">Predict RFE concerns</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg px-4 py-2.5 w-full">
                <p className="text-xs font-bold text-indigo-700">4,000+ USCIS cases analyzed</p>
              </div>
            </div>

            {/* Arrow for desktop */}
            <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Step 3: Revise & Export */}
          <div className="bg-white border border-gray-200 rounded-xl p-8 relative hover:border-gray-300 transition-all shadow-sm">
            <div className="absolute -top-3 left-8 bg-gray-900 text-white px-3 py-1 rounded-full font-[Playfair] text-[15px]">
              Step 3
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Send className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Revise & export filing packet
              </h3>
              <p className="text-gray-600 mb-6 text-base">
                Fine-tune your petition and export USCIS-ready documents in order
              </p>
              <div className="space-y-3 w-full text-left">
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Evidence Development Advisory Avaliable</p>
                      <p className="text-xs text-gray-600">Ethical and Compliant</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <FolderCheck className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Export filing packet</p>
                      <p className="text-xs text-gray-600">All documents organized & numbered</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="font-semibold text-green-900 text-sm">Ready to mail to USCIS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}