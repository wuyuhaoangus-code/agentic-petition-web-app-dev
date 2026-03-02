import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, BookOpen, Scale, Clock, Award, FileText, Layout, ChevronLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { ASSETS } from '@/app/config/assets';
import { BookingButton } from './BookingButton';

interface ServiceSelectionProps {
  onSelect: (path: 'niw' | 'eb1a') => void;
  onBack: () => void;
  currentUser?: { email: string; name?: string } | null;
}

export function ServiceSelection({ onSelect, onBack, currentUser }: ServiceSelectionProps) {
  const [selected, setSelected] = useState<'niw' | 'eb1a' | null>(null);

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col items-center pb-16 font-sans text-slate-900">
      
      {/* Top Navigation */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
         <Button 
           variant="ghost" 
           className="text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
           onClick={onBack}
         >
           <ChevronLeft className="w-5 h-5 mr-1" />
           Back
         </Button>
         
         <img src={ASSETS.logo} alt="DreamCardAI" className="h-6" />
         
         <div className="w-[70px]" /> {/* Spacer to balance the Back button */}
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 mt-4 px-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-3">
          Our Service
        </h1>
        <p className="text-lg text-slate-600">
          Choose the immigration petition path you plan to prepare.
        </p>
      </div>

      {/* SECTION 1: PATH SELECTION */}
      <div className="w-full max-w-4xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NIW Option */}
          <div
            className={`
              relative cursor-pointer rounded-2xl border-2 p-8 transition-all duration-300 ease-in-out overflow-hidden group h-[320px] flex flex-col
              ${selected === 'niw' 
                ? 'border-[#434E87] bg-white shadow-xl ring-2 ring-[#434E87] scale-[1.02]' 
                : 'border-slate-200 bg-white hover:border-[#434E87]/30 hover:shadow-lg hover:-translate-y-1'
              }
            `}
            onClick={() => setSelected('niw')}
          >
            {/* Background Pattern for NIW - Subtle Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                   backgroundImage: 'radial-gradient(#434E87 1px, transparent 1px)', 
                   backgroundSize: '20px 20px' 
                 }} 
            />
            
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className={`
                    inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase transition-colors
                    ${selected === 'niw' ? 'bg-[#434E87] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                  `}>
                    Option A
                  </span>
                  {selected === 'niw' && (
                    <div className="h-8 w-8 rounded-full bg-[#434E87] flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">NIW</h3>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  EB-2 National Interest Waiver
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-slate-600 text-base leading-relaxed">
                  Ideal for professionals whose work has substantial merit and national importance to the U.S.
                </p>
              </div>
            </div>
          </div>

          {/* EB-1A Option */}
          <div
            className={`
              relative cursor-pointer rounded-2xl border-2 p-8 transition-all duration-300 ease-in-out overflow-hidden group h-[320px] flex flex-col
              ${selected === 'eb1a' 
                ? 'border-[#434E87] bg-white shadow-xl ring-2 ring-[#434E87] scale-[1.02]' 
                : 'border-slate-200 bg-white hover:border-[#434E87]/30 hover:shadow-lg hover:-translate-y-1'
              }
            `}
            onClick={() => setSelected('eb1a')}
          >
            {/* Background Pattern for EB-1A - Subtle Diagonal Lines */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ 
                   backgroundImage: 'repeating-linear-gradient(45deg, #434E87 0, #434E87 1px, transparent 0, transparent 50%)', 
                   backgroundSize: '10px 10px' 
                 }} 
            />

             <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className={`
                    inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase transition-colors
                    ${selected === 'eb1a' ? 'bg-[#434E87] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}
                  `}>
                    Option B
                  </span>
                  {selected === 'eb1a' && (
                    <div className="h-8 w-8 rounded-full bg-[#434E87] flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">EB-1A</h3>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                  Extraordinary Ability
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-slate-600 text-base leading-relaxed">
                  For individuals who have risen to the very top of their field with sustained national or international acclaim.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-8 text-center h-16">
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button 
                size="lg"
                onClick={() => onSelect(selected)}
                className="bg-[#434E87] hover:bg-[#323b6b] text-white px-8 text-lg shadow-md"
              >
                Continue with {selected === 'niw' ? 'NIW' : 'EB-1A'} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-400">
          This selection determines how your workspace is structured.
          <br className="hidden sm:block" />
          It does not evaluate eligibility or predict outcomes.
        </p>
      </div>

      <div className="w-full h-px bg-slate-200 max-w-4xl mx-auto mb-16"></div>

      {/* SECTION 2: DETAILED EXPLANATION */}
      <div className="w-full max-w-4xl mx-auto mb-20 space-y-24">
        
        {/* NIW Section */}
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/3 flex-shrink-0">
             <div className="sticky top-8">
               <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#434E87] mb-4">
                 <Scale className="h-6 w-6" />
               </div>
               <h2 className="text-3xl font-bold text-slate-900 mb-4">NIW</h2>
               <p className="text-lg text-slate-600 font-medium leading-relaxed">
                 National Interest Waiver
               </p>
               <div className="mt-6 w-12 h-1 bg-[#434E87]/20 rounded-full"></div>
             </div>
          </div>
          
          <div className="w-full md:w-2/3 space-y-12">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Focus: the importance of the work</h3>
              <p className="text-slate-700 leading-relaxed text-lg">
                The National Interest Waiver (NIW) category is designed for individuals whose proposed endeavor has substantial merit and national importance, and who can demonstrate that they are well positioned to advance that endeavor.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-[#434E87]"></div>
                 How NIW cases are evaluated
              </h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                NIW petitions are analyzed under a three-prong framework, which considers:
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-slate-700">
                  <Check className="h-5 w-5 text-[#434E87] mt-0.5 flex-shrink-0" />
                  <span>Whether the proposed endeavor has substantial merit and national importance</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <Check className="h-5 w-5 text-[#434E87] mt-0.5 flex-shrink-0" />
                  <span>Whether the petitioner is well positioned to advance the endeavor</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <Check className="h-5 w-5 text-[#434E87] mt-0.5 flex-shrink-0" />
                  <span>Whether, on balance, it would benefit the United States to waive the job offer and labor certification requirement</span>
                </li>
              </ul>
              <p className="text-slate-600 text-sm italic border-t border-slate-200 pt-4">
                The analysis is holistic and forward-looking, with emphasis on projected impact and professional trajectory.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Common Evidence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   "Research output & technical work",
                   "Documentation of impact",
                   "Independent expert letters",
                   "Proof of future plans"
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 text-sm font-medium">
                     <FileText className="h-4 w-4 text-slate-400" />
                     {item}
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-slate-200"></div>

        {/* EB-1A Section */}
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/3 flex-shrink-0">
             <div className="sticky top-8">
               <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#434E87] mb-4">
                 <Award className="h-6 w-6" />
               </div>
               <h2 className="text-3xl font-bold text-slate-900 mb-4">EB-1A</h2>
               <p className="text-lg text-slate-600 font-medium leading-relaxed">
                 Extraordinary Ability
               </p>
               <div className="mt-6 w-12 h-1 bg-[#434E87]/20 rounded-full"></div>
             </div>
          </div>
          
          <div className="w-full md:w-2/3 space-y-12">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Focus: recognition of the individual</h3>
              <p className="text-slate-700 leading-relaxed text-lg">
                EB-1A is reserved for individuals who can demonstrate extraordinary ability through sustained national or international acclaim, and who are recognized as belonging to the small percentage at the very top of their field.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                 <div className="h-1.5 w-1.5 rounded-full bg-[#434E87]"></div>
                 How EB-1A cases are evaluated
              </h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                The review places significant weight on:
              </p>
              <ul className="space-y-3 mb-6">
                 <li className="flex items-start gap-3 text-slate-700">
                  <Check className="h-5 w-5 text-[#434E87] mt-0.5 flex-shrink-0" />
                  <span>Independent validation by peers or institutions</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <Check className="h-5 w-5 text-[#434E87] mt-0.5 flex-shrink-0" />
                  <span>Objective recognition (awards, roles, publications)</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <Check className="h-5 w-5 text-[#434E87] mt-0.5 flex-shrink-0" />
                  <span>Leadership or original contributions of major significance</span>
                </li>
              </ul>
              <p className="text-slate-600 text-sm italic border-t border-slate-200 pt-4">
                EB-1A preparation is typically evidence-intensive and documentation-heavy, requiring careful organization.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Common Evidence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   "National/International Awards",
                   "Selective Memberships",
                   "Published Material About You",
                   "Judging / Reviewing Work",
                   "Original Contributions",
                   "Scholarly Authorship"
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 text-sm font-medium">
                     <FileText className="h-4 w-4 text-slate-400" />
                     {item}
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: QUICK COMPARISON TABLE */}
      <div className="w-full max-w-4xl mx-auto mb-24">
        <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">NIW vs EB-1A — Key Differences</h2>
        
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-900 w-1/4">Feature</th>
                <th className="px-6 py-4 font-semibold text-slate-900 w-1/3">NIW (National Interest Waiver)</th>
                <th className="px-6 py-4 font-semibold text-slate-900 w-1/3">EB-1A (Extraordinary Ability)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Core focus</td>
                <td className="px-6 py-4 text-slate-600">Whether the proposed work or endeavor has substantial merit and national importance, and whether the petitioner is well positioned to advance it</td>
                <td className="px-6 py-4 text-slate-600">Whether the individual has demonstrated sustained national or international acclaim and belongs to the small percentage at the top of the field</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Primary question asked</td>
                <td className="px-6 py-4 text-slate-600">Why does this work matter to the United States, and why is this person suited to advance it?</td>
                <td className="px-6 py-4 text-slate-600">Has this person already achieved extraordinary recognition within their field?</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Evaluation approach</td>
                <td className="px-6 py-4 text-slate-600">Holistic analysis under a three-prong framework, with emphasis on future impact</td>
                <td className="px-6 py-4 text-slate-600">Evidence mapped to at least 4 of 11 regulatory criteria, focused on past achievements</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Orientation</td>
                <td className="px-6 py-4 text-slate-600">Forward-looking</td>
                <td className="px-6 py-4 text-slate-600">Retrospective, recognition-based</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Role of peer recognition</td>
                <td className="px-6 py-4 text-slate-600">Helpful but not always central</td>
                <td className="px-6 py-4 text-slate-600">Often a key component</td>
              </tr>
               <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Typical career stage</td>
                <td className="px-6 py-4 text-slate-600">Early to mid-career with a clear growth path</td>
                <td className="px-6 py-4 text-slate-600">Established or senior professionals</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Evidence style</td>
                <td className="px-6 py-4 text-slate-600">Narrative-driven, impact-oriented</td>
                <td className="px-6 py-4 text-slate-600">Criteria-driven, documentation-heavy</td>
              </tr>
               <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Preparation complexity</td>
                <td className="px-6 py-4 text-slate-600">Moderate</td>
                <td className="px-6 py-4 text-slate-600">High</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer / Disclaimer */}
      <div className="max-w-2xl mx-auto text-center border-t border-slate-200 pt-12 pb-8">
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          DreamCardAI provides tools for organizing materials and generating document drafts based on user-provided information.
          We do not provide legal advice, evaluate eligibility, or determine application outcomes.
        </p>
        <p className="text-xs text-slate-400">
          Users may explore or change petition paths later.
        </p>
      </div>
      
      <BookingButton onAuth={() => {}} currentUser={currentUser || null} />
    </div>
  );
}