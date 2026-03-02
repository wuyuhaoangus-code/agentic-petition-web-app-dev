import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  Layout,
  List,
  FileCheck,
  Printer,
  AlertTriangle,
  MessageSquare,
  Share2,
  CheckCircle2,
  File,
  Camera,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

export function ValueProposition() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Professional Gradient Background with Animated Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-blue-50/20 to-white -z-10"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent"></div>

      {/* Decorative Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-2xl animate-float"></div>
      <div className="absolute bottom-32 right-16 w-32 h-32 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl animate-float-delayed"></div>

      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header Section */}
        <div className="text-center mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-indigo-100 rounded-full shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
              Complete Toolkit
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-4" style={{ fontFamily: 'var(--font-serif-display)' }}>
            Tools to Address USCIS Expectations
          </h2>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Once you understand common rejection patterns, these
            tools help you build a case that responds to USCIS
            concerns
          </p>

          {/* Feature Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-full">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">
                Professional EB-1a & EB-2 NIW Filing Structures
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-purple-100 rounded-full">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                80% Ready Draft
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-indigo-100 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">
                USCIS Standards
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Petition Drafting (Primary) */}
          <FeatureCard
            title="Petition Drafting"
            description="Generate petition letters backed by 4,000+ public USCIS cases. Compare against similar profiles in your field to build a complete case that addresses potential USCIS concerns—even if you already have a draft, discover weaknesses you didn't know existed. The most powerful DIY tool for individual petitioners."
            isPrimary={true}
          >
            <PetitionDraftingVisual />
          </FeatureCard>

          {/* Card 2: Document Prep (Secondary) */}
          <FeatureCard
            title="Document Prep"
            description="Throw us anything—Word docs, PDFs, newspaper clips, screenshots. We handle the messy work of converting, translating, and formatting so you don't have to. No organizing required on your end."
            isPrimary={false}
          >
            <DocumentPrepVisual />
          </FeatureCard>

          {/* Card 3: Filing Packet (Secondary) */}
          <FeatureCard
            title="Filing Packet"
            description="Organize and order your entire submission package for USCIS. Every exhibit structured, every page numbered, everything ready to mail—so filing is stress-free."
            isPrimary={false}
          >
            <FilingPacketVisual />
          </FeatureCard>

          {/* Card 4: Expert Review (Primary) */}
          <FeatureCard
            title="Expert Review"
            description="Don't trust AI alone? Need full-service support? We're here for you. Upgrade to 1-on-1 legal consultation with experienced immigration attorneys who can guide you through every step."
            isPrimary={true}
          >
            <ExpertReviewVisual />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  children,
  isPrimary,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  isPrimary: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border-[1.5px] border-slate-200/80 overflow-hidden flex flex-col h-[600px] group hover:border-slate-300 hover:shadow-sm transition-all duration-300 relative">
      {/* Text Section */}
      <div className="p-8 pb-6 flex flex-col flex-shrink-0">
        <h3 className="text-2xl font-semibold text-slate-900 mb-3 font-[Playfair_Display]">
          {title}
        </h3>
        <p className="text-slate-600 text-[16px] leading-relaxed">
          {description}
        </p>
      </div>

      {/* Visual Section */}
      <div className="flex-1 w-full bg-slate-50/40 relative overflow-hidden border-t border-slate-100 flex items-center justify-center group-hover:bg-slate-50/60 transition-colors duration-300">
        <div className="w-full h-full p-6 flex items-center justify-center relative">
          {children}
        </div>
        {/* Subtle Inner Shadow/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
}

// --- Visual Components ---

function PetitionDraftingVisual() {
  return (
    <div className="relative w-full max-w-lg h-full flex items-center justify-center perspective-1000">
      {/* Panel C (Back - Evidence Map) */}
      <div className="absolute top-4 right-8 w-48 h-56 bg-white border-2 border-slate-200 rounded-xl shadow-sm transform rotate-6 hover:rotate-3 transition-transform duration-500 z-10 flex flex-col p-4 opacity-80 group-hover:opacity-100">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
          <List size={14} className="text-indigo-400" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Criteria Mapping
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="w-4 h-4 rounded-full bg-white border border-indigo-100 text-indigo-600 text-[9px] flex items-center justify-center font-bold shadow-sm">
              A
            </div>
            <div className="h-1.5 w-20 bg-slate-200/70 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="w-4 h-4 rounded-full bg-white border border-indigo-100 text-indigo-600 text-[9px] flex items-center justify-center font-bold shadow-sm">
              B
            </div>
            <div className="h-1.5 w-16 bg-slate-200/70 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
            <div className="w-4 h-4 rounded-full bg-white border border-indigo-100 text-indigo-600 text-[9px] flex items-center justify-center font-bold shadow-sm">
              C
            </div>
            <div className="h-1.5 w-14 bg-slate-200/70 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Panel B (Middle - Professional CV) */}
      <div className="absolute top-10 left-8 w-48 h-56 bg-white border-2 border-slate-200 rounded-xl shadow-sm transform -rotate-3 hover:-rotate-1 transition-transform duration-500 z-20 flex flex-col p-4 group-hover:translate-x-2">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
          <FileText size={14} className="text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Professional CV
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex gap-3 items-center mb-2">
            <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200/50"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-2 w-20 bg-slate-200 rounded-full"></div>
              <div className="h-1.5 w-12 bg-slate-100 rounded-full"></div>
            </div>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3"></div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
          <div className="h-1.5 w-3/4 bg-slate-100 rounded-full"></div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
          <div className="h-1.5 w-5/6 bg-slate-100 rounded-full"></div>
        </div>
      </div>

      {/* Panel A (Front - Petition Letter) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-72 h-48 bg-white border-2 border-indigo-100 ring-2 ring-indigo-50/50 rounded-xl shadow-lg z-30 flex flex-col overflow-hidden group-hover:scale-105 transition-transform duration-500">
        {/* Header */}
        <div className="h-10 bg-indigo-50/30 border-b border-indigo-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span className="text-[11px] font-semibold text-indigo-900 tracking-wide">
              Petition Letter (v1)
            </span>
          </div>
          <span className="text-[10px] text-indigo-600 font-medium bg-white px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm">
            82% complete
          </span>
        </div>
        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="flex gap-4">
            <div className="w-1/3 space-y-2.5">
              <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
              <div className="h-1.5 w-2/3 bg-slate-100 rounded-full"></div>
            </div>
            <div className="w-2/3 space-y-2.5">
              <div className="h-2.5 w-28 bg-slate-200 rounded-full mb-1.5"></div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full"></div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="h-4 w-0.5 bg-indigo-500 animate-pulse"></div>
                <div className="h-1.5 w-16 bg-slate-100 rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentPrepVisual() {
  return (
    <div className="relative w-full h-full flex items-center justify-center px-4">
      {/* Chaotic Mix of Documents - Left Side */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3 relative">
        <div className="absolute -top-3 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full tracking-wide z-20 shadow-sm">
          ACCEPT ALL FORMATS
        </div>

        {/* Scattered Documents Collage */}
        <div className="relative w-40 h-40">
          {/* Newspaper clipping */}
          <div className="absolute top-0 left-2 w-24 h-20 bg-white border-2 border-slate-300 shadow-sm transform -rotate-12 overflow-hidden">
            <div className="h-4 bg-slate-100 flex items-center justify-center border-b border-slate-200">
              <span className="text-[7px] font-bold text-slate-500 tracking-wider">
                NEWS
              </span>
            </div>
            <div className="p-2 space-y-1">
              <div className="h-1 w-full bg-slate-200 rounded-full"></div>
              <div className="h-1 w-4/5 bg-slate-200 rounded-full"></div>
              <div className="h-1 w-full bg-slate-200 rounded-full"></div>
            </div>
          </div>

          {/* PDF Document */}
          <div className="absolute top-8 right-0 w-20 h-24 bg-white border-2 border-red-200 shadow-sm transform rotate-6">
            <div className="h-3 bg-red-50 flex items-center justify-center border-b border-red-100">
              <span className="text-[7px] font-bold text-red-500">
                PDF
              </span>
            </div>
            <div className="p-1.5 space-y-1">
              <div className="h-0.5 w-full bg-red-100 rounded-full"></div>
              <div className="h-0.5 w-3/4 bg-red-100 rounded-full"></div>
            </div>
          </div>

          {/* Screenshot/Image */}
          <div className="absolute bottom-4 left-0 w-22 h-18 bg-white border-2 border-blue-200 shadow-sm transform rotate-3 flex items-center justify-center">
            <Camera
              size={18}
              className="text-blue-400"
              strokeWidth={1.5}
            />
            <span className="absolute bottom-0.5 text-[7px] font-bold text-blue-500">
              IMG
            </span>
          </div>

          {/* Word Doc */}
          <div className="absolute bottom-0 right-4 w-18 h-22 bg-white border-2 border-indigo-200 shadow-sm transform -rotate-6">
            <div className="h-3 bg-indigo-50 flex items-center justify-center border-b border-indigo-100">
              <span className="text-[7px] font-bold text-indigo-500">
                DOC
              </span>
            </div>
            <div className="p-1.5 space-y-1">
              <div className="h-0.5 w-full bg-indigo-100 rounded-full"></div>
              <div className="h-0.5 w-2/3 bg-indigo-100 rounded-full"></div>
            </div>
          </div>

          {/* Sticky Note */}
          <div className="absolute top-12 left-8 w-16 h-16 bg-yellow-50 border-2 border-yellow-200 shadow-sm transform rotate-12 p-2">
            <div className="space-y-1">
              <div className="h-0.5 w-full bg-yellow-300 rounded-full"></div>
              <div className="h-0.5 w-3/4 bg-yellow-300 rounded-full"></div>
              <div className="h-0.5 w-full bg-yellow-300 rounded-full"></div>
            </div>
          </div>
        </div>

        <span className="text-[10px] font-medium text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200 mt-4 shadow-sm text-center max-w-[180px] leading-tight">
          Drop files to workspace
        </span>
      </div>

      {/* Arrow */}
      <div className="text-slate-300 flex flex-col items-center justify-center z-10 mx-2">
        <ArrowRight size={28} strokeWidth={1.5} />
      </div>

      {/* Clean Output - Right Side */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="absolute top-0 right-8 bg-white border border-indigo-100 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full tracking-wide flex items-center gap-1 z-20 shadow-sm">
          CLEAN OUTPUT <Check size={10} strokeWidth={3} />
        </div>

        <div className="w-40 h-40 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm flex flex-col items-center justify-center relative group-hover:border-indigo-200 transition-colors duration-500">
          <div className="w-20 h-20 bg-indigo-50/50 rounded-full flex items-center justify-center mb-3 text-indigo-500 relative ring-1 ring-indigo-100">
            <FileText size={40} strokeWidth={1.2} />
            <div className="absolute -bottom-2 -right-1 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white">
              DOCX
            </div>
          </div>
          <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-full border border-indigo-100">
            Editable Word
          </span>
        </div>
      </div>
    </div>
  );
}

function FilingPacketVisual() {
  return (
    <div className="relative w-full max-w-lg h-full p-4 flex gap-4">
      {/* Sidebar / List */}
      <div className="hidden sm:flex flex-col w-1/3 h-full gap-2 pt-2">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Documents
        </div>
        {["Cover Letter", "Form-I140", "G1450"].map(
          (item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 shadow-sm"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
              <div className="text-[9px] font-medium text-slate-600 truncate">
                {item}
              </div>
            </div>
          ),
        )}
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Exhibits
        </div>
        {[
          "Exhibits 1a: Education Summary",
          "Exhibits 1b: Graduation Certificate",
          "Exhibit 1c: Transcript",
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 shadow-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
            <div className="text-[9px] font-medium text-slate-600 truncate">
              {item}
            </div>
          </div>
        ))}
        <div className="mt-auto p-2 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm border border-indigo-100">
            <FileCheck size={12} className="text-indigo-600" />
          </div>
          <div>
            <div className="text-[9px] font-bold text-indigo-900">
              Packet Ready
            </div>
            <div className="text-[8px] text-indigo-600">
              324 pages
            </div>
          </div>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-white border-2 border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
        <div className="h-9 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-4">
          <span className="text-[10px] font-medium text-slate-500">
            Packet Preview
          </span>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
          </div>
        </div>

        <div className="flex-1 p-5 bg-slate-50/50 flex flex-col items-center gap-4 overflow-hidden">
          {/* Document Page */}
          <div className="w-32 h-44 bg-white shadow-sm border border-slate-200 flex flex-col p-4 relative z-10">
            <div className="w-full h-8 bg-slate-100 mb-2 flex items-center justify-center">
              <span className="text-[7px] font-bold text-slate-400 tracking-wider">
                USCIS FORM
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="h-1 w-full bg-slate-100 rounded-full"></div>
              <div className="h-1 w-full bg-slate-100 rounded-full"></div>
              <div className="h-1 w-2/3 bg-slate-100 rounded-full"></div>
            </div>
            <div className="mt-auto pt-2 border-t border-slate-100 flex justify-between">
              <div className="h-1 w-8 bg-slate-200 rounded-full"></div>
              <div className="h-1 w-4 bg-slate-200 rounded-full"></div>
            </div>
          </div>

          {/* Stack effect */}
          <div className="absolute top-1/2 left-1/2 w-32 h-44 bg-white shadow-sm border border-slate-200 z-0 transform translate-x-3 translate-y-3 rotate-3 opacity-60 rounded-sm"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-44 bg-white shadow-sm border border-slate-200 -z-10 transform -translate-x-3 translate-y-5 -rotate-2 opacity-30 rounded-sm"></div>
        </div>

        {/* Action Bar */}
        <div className="p-3 border-t border-slate-100 bg-white flex justify-end">
          <div className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-[10px] font-medium flex items-center gap-1.5 shadow-sm hover:bg-indigo-700 transition-colors">
            <Printer size={12} />
            Print Ready
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertReviewVisual() {
  return (
    <div className="relative w-full max-w-sm bg-white border-2 border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col group-hover:border-slate-300 transition-colors duration-300">
      {/* Header / Cover */}
      <div className="h-24 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_25%,rgba(0,0,0,0.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.02)_75%,rgba(0,0,0,0.02)_100%)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Profile Pic area */}
      <div className="px-6 relative">
        <div className="w-20 h-20 rounded-full bg-white border-4 border-white ring-1 ring-slate-200 absolute -top-10 flex items-center justify-center overflow-hidden shadow-sm">
           <img 
             src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200" 
             alt="Attorney" 
             className="w-full h-full object-cover" 
           />
        </div>
      </div>
      
      {/* Content */}
      <div className="pt-12 pb-6 px-6 space-y-4">
        <div>
           <div className="h-4 w-32 bg-slate-700 rounded-full mb-2"></div>
           <div className="h-2.5 w-24 bg-slate-300 rounded-full"></div>
        </div>
        
        <div className="flex flex-wrap gap-2 pt-1">
           <div className="px-3 py-1 rounded-full border border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wide">Immigration Law</div>
           <div className="px-3 py-1 rounded-full border border-slate-200 text-[9px] font-bold text-slate-500 uppercase tracking-wide">15+ Years</div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="h-2 w-full bg-slate-100 rounded-full"></div>
          <div className="h-2 w-5/6 bg-slate-100 rounded-full"></div>
          <div className="h-2 w-4/6 bg-slate-100 rounded-full"></div>
        </div>

        <div className="pt-4 flex items-center gap-3 border-t border-slate-100 mt-2">
           <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
             <CheckCircle2 size={18} strokeWidth={2.5} />
           </div>
           <div>
             <div className="text-[10px] font-bold text-slate-900 uppercase tracking-wide">Verified Review</div>
             <div className="text-[10px] text-slate-500">Legal strategy assessment</div>
           </div>
        </div>
      </div>
    </div>
  );
}