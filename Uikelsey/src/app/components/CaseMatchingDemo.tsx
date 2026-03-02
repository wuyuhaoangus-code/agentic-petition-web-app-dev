import {
  CheckCircle2,
  Award,
  Users,
  Newspaper,
  Scale,
  Database,
  ArrowRight,
  Sparkles,
  Loader2,
  TrendingUp,
  ShieldCheck,
  Target,
  AlertCircle,
  FileText,
  DollarSign,
  Lightbulb,
  CheckCheck,
  Mail,
  BookOpen,
  FileCheck,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ASSETS } from "../config/assets";

interface Case {
  id: number;
  field: string;
  publications: number;
  citations: number;
  awards?: string[];
  judging?: string;
  media?: string;
  membership?: string;
  outcome: "approved" | "approved-after-rfe";
  matchScore: number;
  rfeRequest?: string;
  approvalReasons?: string[];
  uscisGuidance?: string[];
  year: string;
}

const topMatches: Case[] = [
  {
    id: 1,
    field: "Machine Learning Research",
    publications: 18,
    citations: 1200,
    awards: [
      "Best Paper Award - NeurIPS 2023",
      "Google Research Scholar Award",
    ],
    judging: "Reviewer for ICML, NeurIPS (5+ years)",
    media: "Featured in MIT Technology Review",
    outcome: "approved",
    matchScore: 96,
    approvalReasons: [
      "Strong evidence of sustained national acclaim through 1,200+ citations",
      "Prestigious awards from recognized academic institutions (NeurIPS, Google)",
      "Peer review work demonstrates critical assessment role in the field",
    ],
    year: "2024",
  },
  {
    id: 2,
    field: "Deep Learning Engineering",
    publications: 11,
    citations: 520,
    awards: ["Outstanding Contributor Award - ACM"],
    membership: "Senior Member, IEEE",
    outcome: "approved-after-rfe",
    matchScore: 89,
    rfeRequest:
      "Provide evidence demonstrating how your contributions constitute original work of major significance in the field",
    uscisGuidance: [
      "Submit independent expert letters detailing the impact of your work",
      "Provide evidence of how your techniques are adopted by others",
      "Include downstream citations showing your work enabled new research",
    ],
    year: "2023",
  },
  {
    id: 3,
    field: "Computer Vision Research",
    publications: 15,
    citations: 980,
    awards: ["Best Paper Award - CVPR 2024"],
    judging: "Program Committee - ICCV, CVPR",
    media: "Cited by TechCrunch, VentureBeat",
    membership: "ACM Distinguished Member",
    outcome: "approved-after-rfe",
    matchScore: 91,
    rfeRequest:
      "Clarify the national scope and sustained acclaim of your contributions to computer vision research",
    uscisGuidance: [
      "Demonstrate geographic reach of your work's impact across the United States",
      "Provide timeline showing sustained recognition over multiple years",
      "Include evidence of adoption by major US-based companies and institutions",
    ],
    year: "2024",
  },
];

export function CaseMatchingDemo() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const [visibleCases, setVisibleCases] = useState<number[]>(
    [],
  );
  const [showInsights, setShowInsights] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);

            // Step 1: Show arrow animation (300ms)
            setTimeout(() => {
              setShowArrow(true);
            }, 300);

            // Step 2: Start calculating animation (500ms after arrow)
            setTimeout(() => {
              setIsCalculating(true);
            }, 800);

            // Step 3: Show results (1.5s calculation time)
            setTimeout(() => {
              setIsCalculating(false);
              setShowResults(true);

              // Reveal cases one by one
              topMatches.forEach((_, index) => {
                setTimeout(() => {
                  setVisibleCases((prev) => [...prev, index]);
                }, index * 250);
              });

              // Show insights after all cases
              setTimeout(
                () => {
                  setShowInsights(true);
                },
                topMatches.length * 250 + 400,
              );
            }, 2300);
          }
        });
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="font-normal tracking-tighter text-gray-900 mb-4 text-2xl sm:text-3xl md:text-5xl px-4" style={{ fontFamily: 'var(--font-serif-display)' }}>
            See how we match your case
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-base md:text-lg px-4">
            Our database of 4,000+ USCIS decisions helps predict
            approval chances and identify petition strengths
          </p>
        </div>

        {/* Example Profile + Arrow + Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-start">
          {/* Left: Example Profile */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-8">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 hover:border-gray-300 transition-all shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-sm font-semibold text-gray-700 font-[Lato]">
                    Example Profile
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                    EB-1A
                  </span>
                </div>

                {/* Profile Header with Larger Avatar */}
                <div className="flex items-center gap-4 sm:gap-5 mb-6 pb-6 border-b border-gray-200">
                  <img
                    src={ASSETS.demoProfileAvatar}
                    alt="Marcus Thompson"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-gray-100 shadow-md"
                  />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 font-[Playfair_Display]">
                      Marcus Thompson
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      Machine Learning Engineer
                    </p>
                    <p className="text-xs text-gray-500">
                      AI/ML Industry
                    </p>
                  </div>
                </div>

                {/* Evidence Documents - Aligned Row */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Supporting Documents
                    </h4>
                    <span className="text-xs text-gray-500">
                      12 evidence files uploaded
                    </span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide mask-fade-right">
                    {[
                      { icon: FileText, label: "Resume", color: "text-red-500", bg: "bg-red-50" },
                      { icon: Award, label: "Awards", color: "text-amber-500", bg: "bg-amber-50" },
                      { icon: BookOpen, label: "Publish", color: "text-blue-500", bg: "bg-blue-50" },
                      { icon: DollarSign, label: "Pay Stubs", color: "text-green-500", bg: "bg-green-50" },
                      { icon: FileCheck, label: "Recommandation", color: "text-purple-500", bg: "bg-purple-50" },
                    ].map((doc, i) => (
                      <div key={i} className="flex-shrink-0 w-16 h-20 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 shadow-sm hover:border-blue-300 transition-colors">
                        <div className={`p-2 rounded-full ${doc.bg}`}>
                             <doc.icon className={`w-4 h-4 ${doc.color}`} strokeWidth={1.5} />
                        </div>
                        <span className="text-xs text-gray-600 font-thin text-center leading-tight truncate w-full px-1">{doc.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Criteria Met */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-gray-900">
                      EB-1A Criteria Met
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        3
                      </span>
                      <span className="text-sm text-gray-500">
                        / 10 criteria
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Criteria 1 - Awards */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2
                          className="w-3 h-3 text-white"
                          strokeWidth={3}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-3.5 h-3.5 text-gray-600" />
                          <p className="text-xs font-semibold text-gray-900">
                            Awards & Prizes
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 leading-tight">
                          Best Paper Award (NeurIPS 2023), ACM
                          Outstanding Contributor Award
                        </p>
                      </div>
                    </div>

                    {/* Criteria 2 - Publications */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2
                          className="w-3 h-3 text-white"
                          strokeWidth={3}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Newspaper className="w-3.5 h-3.5 text-gray-600" />
                          <p className="text-xs font-semibold text-gray-900">
                            Scholarly Articles
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 leading-tight">
                          12 publications, 680 citations -
                          Nature, ICML, NeurIPS
                        </p>
                      </div>
                    </div>

                    {/* Criteria 3 - High Salary */}
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2
                          className="w-3 h-3 text-white"
                          strokeWidth={3}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-3.5 h-3.5 text-gray-600" />
                          <p className="text-xs font-semibold text-gray-900">
                            High Salary
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 leading-tight">
                          Annual compensation $285K - Top 10% in
                          AI/ML field
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Badge */}
                <div className="flex items-center justify-center gap-2 p-3 bg-gray-900 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-white flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white text-center">
                    Meets EB-1A Requirements (3 out of 10 criteria met)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Animated Arrow */}
          <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
            <div
              className={`transition-all duration-700 ${showArrow ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <ArrowRight className="w-8 h-8 text-indigo-600 animate-pulse-arrow" />
                  <div className="absolute inset-0 bg-indigo-400 rounded-full blur-lg opacity-30 animate-pulse"></div>
                </div>
                <span className="text-xs font-medium text-indigo-600 whitespace-nowrap">
                  Searching
                </span>
              </div>
            </div>
          </div>

          {/* Right: Matching Results */}
          <div className="lg:col-span-6">
            {/* Calculating State */}
            {isCalculating && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Database className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <Loader2 className="w-20 h-20 text-indigo-600 animate-spin absolute -top-2 -left-2" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  Searching database
                </p>
                <p className="text-sm text-gray-600">
                  4,000+ EB-1A cases...
                </p>
              </div>
            )}

            {/* Results State */}
            {showResults && (
              <>
                {/* Database Result Header */}
                <div
                  className="flex items-center gap-3 mb-6 opacity-0 animate-fadeIn"
                  style={{
                    animationDelay: "0ms",
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      15 matching cases found
                    </div>
                    <div className="text-sm text-gray-600">
                      From our AAO database of 4,000+ EB-1A
                      decisions
                    </div>
                  </div>
                </div>

                {/* Simplified Case Cards */}
                <div className="space-y-3">
                  {topMatches.map((caseItem, index) => (
                    <div
                      key={caseItem.id}
                      className={`bg-white border-2 rounded-xl p-5 transition-all hover:shadow-md opacity-0 ${
                        visibleCases.includes(index)
                          ? "animate-slideUp"
                          : ""
                      } border-gray-200 hover:border-indigo-300`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: "forwards",
                      }}
                    >
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                              caseItem.outcome === "approved"
                                ? "bg-indigo-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <CheckCircle2
                              className={`w-5 h-5 ${
                                caseItem.outcome === "approved"
                                  ? "text-indigo-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                EB-1A
                              </span>
                              <span className="font-semibold text-gray-900 truncate text-[20px] font-[Lato]">
                                {caseItem.field}
                              </span>
                              <span className="text-xs text-gray-400">
                                {caseItem.year}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-indigo-600 font-[Playfair_Display] text-[20px]">
                            {caseItem.matchScore}%
                          </div>
                          <div className="text-xs text-gray-400">
                            match
                          </div>
                        </div>
                      </div>

                      {/* Criteria Icons - More Compact */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {caseItem.awards &&
                          caseItem.awards.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs bg-indigo-50 px-2.5 py-1 rounded-full">
                              <Award className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                              <span className="text-indigo-900 font-medium">
                                Awards
                              </span>
                            </div>
                          )}
                        {caseItem.judging && (
                          <div className="flex items-center gap-1.5 text-xs bg-indigo-50 px-2.5 py-1 rounded-full">
                            <Scale className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                            <span className="text-indigo-900 font-medium">
                              Judging
                            </span>
                          </div>
                        )}
                        {caseItem.media && (
                          <div className="flex items-center gap-1.5 text-xs bg-indigo-50 px-2.5 py-1 rounded-full">
                            <Newspaper className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                            <span className="text-indigo-900 font-medium">
                              Media
                            </span>
                          </div>
                        )}
                        {caseItem.membership && (
                          <div className="flex items-center gap-1.5 text-xs bg-indigo-50 px-2.5 py-1 rounded-full">
                            <Users className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                            <span className="text-indigo-900 font-medium">
                              Membership
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Outcome - Expanded with Details */}
                      <div
                        className={`rounded-lg ${caseItem.outcome === "approved" ? "bg-indigo-50" : "bg-gray-50"}`}
                      >
                        

                        {caseItem.outcome === "approved" &&
                          caseItem.approvalReasons && (
                            <div className="px-3 pb-3">
                              <div className="flex items-center gap-1.5 mb-2">
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-xs font-semibold text-indigo-900">
                                  Why this case was sustained:
                                </span>
                              </div>
                              <ul className="space-y-1.5">
                                {caseItem.approvalReasons.map(
                                  (reason, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2"
                                    >
                                      <div className="w-1 h-1 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0"></div>
                                      <span className="text-xs text-indigo-800 leading-tight">
                                        {reason}
                                      </span>
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}

                        {caseItem.outcome ===
                          "approved-after-rfe" && (
                          <div className="px-3 pb-3">
                            {caseItem.rfeRequest && (
                              <div className="mb-3">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 text-gray-600" />
                                  <span className="text-xs font-semibold text-gray-900">
                                    USCIS Concern:
                                  </span>
                                </div>
                                <p className="text-xs text-gray-700 italic leading-tight pl-5">
                                  "{caseItem.rfeRequest}"
                                </p>
                              </div>
                            )}

                            {caseItem.uscisGuidance && (
                              <div>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <Lightbulb className="w-3.5 h-3.5 text-gray-600" />
                                  <span className="text-xs font-semibold text-gray-900">
                                    How to address:
                                  </span>
                                </div>
                                <ul className="space-y-1.5">
                                  {caseItem.uscisGuidance.map(
                                    (guidance, idx) => (
                                      <li
                                        key={idx}
                                        className="flex items-start gap-2"
                                      >
                                        <div className="w-1 h-1 rounded-full bg-gray-600 mt-1.5 flex-shrink-0"></div>
                                        <span className="text-xs text-gray-700 leading-tight">
                                          {guidance}
                                        </span>
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* View All Indicator */}
                <div
                  className="mt-4 text-center opacity-0 animate-fadeIn"
                  style={{
                    animationDelay: "750ms",
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                    <span>Showing top 3 of 15 matches</span>
                   
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* New Insights Section - How We Use These Cases */}
        {showInsights && (
          <div
            className="mt-16 opacity-0 animate-fadeIn"
            style={{
              animationDelay: "0ms",
              animationFillMode: "forwards",
            }}
          >
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 rounded-2xl p-10 border border-indigo-100 shadow-lg">
              

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Strength Points */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-indigo-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Identify Strengths
                  </h4>
                  <p className="text-sm text-gray-700">
                    Find the criteria where your profile exceeds
                    similar approved cases — these become your
                    strongest bargaining points in the petition.
                  </p>
                </div>

                {/* Weakness Detection */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-purple-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Predict Weak Points
                  </h4>
                  <p className="text-sm text-gray-700">
                    Identify areas where USCIS might question
                    your qualifications based on RFE patterns,
                    so you can proactively address them.
                  </p>
                </div>

                {/* Strategic Reinforcement */}
                <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-indigo-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Strengthen Arguments
                  </h4>
                  <p className="text-sm text-gray-700">
                    Preemptively reinforce weak areas in your
                    initial petition with targeted evidence and
                    stronger narratives.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-arrow {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(8px);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .animate-pulse-arrow {
          animation: pulse-arrow 1.5s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}