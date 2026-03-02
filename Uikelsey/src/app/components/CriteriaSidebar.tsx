import React, { useState } from 'react';
import { CheckCircle2, Award, Users, Newspaper, Gavel, Lightbulb, BookOpen, Palette, Crown, DollarSign, TrendingUp, Mail, Star, User, Target, Scale, ChevronDown, ChevronUp } from 'lucide-react';

export interface Criterion {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  examples?: string[];
  isRecommended?: boolean; // Mark as highly recommended but not a formal criterion
}

// Recommendation Letters - NOT one of the 10 official criteria, but highly recommended
export const RECOMMENDATION_LETTER: Criterion = {
  id: 'recommendation',
  name: 'Recommendation Letters',
  description: 'Letters of recommendation from experts in your field attesting to your extraordinary ability (ideally 5-8 recommenders). While not one of the 10 official criteria, these letters are HIGHLY RECOMMENDED and often critical for approval.',
  icon: Mail,
  examples: [
    'Letters from professors or academic advisors',
    'Letters from industry leaders or executives',
    'Letters from government officials or policymakers',
    'Letters from conference organizers or journal editors',
    'Letters from clients, collaborators, or investors'
  ],
  isRecommended: true
};

// Official 10 EB-1A Criteria (Recommendation Letters NOT included)
export const CRITERIA: Criterion[] = [
  {
    id: 'awards',
    name: 'Awards',
    description: 'Receipt of nationally or internationally recognized prizes or awards for excellence in your field of endeavor. The award should demonstrate recognition of your achievements by experts in your field.',
    icon: Award,
    examples: [
      'Nobel Prize, Pulitzer Prize, Academy Award',
      'National Medal of Science or Technology',
      'Industry-specific national/international awards',
      'Best Paper/Dissertation awards at major conferences',
      'Government honors or recognitions'
    ]
  },
  {
    id: 'membership',
    name: 'Membership',
    description: 'Membership in associations that require outstanding achievements of their members, as judged by recognized national or international experts. Regular memberships that only require payment do NOT qualify.',
    icon: Users,
    examples: [
      'IEEE Fellow or Senior Member (requires nomination)',
      'National Academy of Sciences membership',
      'Exclusive professional guilds or societies',
      'Invitation-only industry councils',
      'Honorary memberships in prestigious organizations'
    ]
  },
  {
    id: 'published_material',
    name: 'Published Material',
    description: 'Published material about you in professional or major trade publications or other major media. This must be about YOU and your work, not articles authored BY you. The publication should discuss your achievements and contributions.',
    icon: Newspaper,
    examples: [
      'Feature articles in major newspapers (NYT, WSJ)',
      'Interviews in industry publications (TechCrunch, Forbes)',
      'TV or radio interviews about your work',
      'Magazine profiles or cover stories',
      'Documentary features about your achievements'
    ]
  },
  {
    id: 'judging',
    name: 'Judging',
    description: 'Participation as a judge of the work of others in the same or allied field. This demonstrates that you are recognized as an expert whose opinion is valued by peers.',
    icon: Gavel,
    examples: [
      'Peer reviewer for academic journals',
      'Program committee member for conferences',
      'Grant proposal reviewer for NSF, NIH, etc.',
      'Judge for competitions, hackathons, or contests',
      'Editorial board member for publications'
    ]
  },
  {
    id: 'contributions',
    name: 'Original Contributions',
    description: 'Evidence of your original scientific, scholarly, artistic, athletic, or business-related contributions of major significance in your field. This should show that your work has had a substantial impact.',
    icon: Lightbulb,
    examples: [
      'Patents with significant commercial adoption',
      'Groundbreaking research with high citations',
      'New methodologies or frameworks widely used',
      'Business innovations that transformed industries',
      'Open-source projects with massive adoption'
    ]
  },
  {
    id: 'scholarly',
    name: 'Scholarly Articles',
    description: 'Authorship of scholarly articles in professional or major trade publications or other major media in your field. Quality and impact matter more than quantity - include citation metrics.',
    icon: BookOpen,
    examples: [
      'Papers in top-tier journals (Nature, Science, Cell)',
      'Conference papers at flagship venues',
      'Book chapters in established academic publishers',
      'High-impact review articles',
      'Papers with significant citation counts'
    ]
  },
  {
    id: 'exhibitions',
    name: 'Artistic Exhibitions',
    description: 'Display of your work at artistic exhibitions or showcases. Primarily for artists, designers, architects, and creative professionals. Must be significant exhibitions, not local gallery shows.',
    icon: Palette,
    examples: [
      'Solo exhibitions at major galleries or museums',
      'Group shows at prestigious art institutions',
      'Film festival screenings (Cannes, Sundance)',
      'Architecture biennales or design weeks',
      'Major public art installations'
    ]
  },
  {
    id: 'leading',
    name: 'Leading Role',
    description: 'Performance of a leading or critical role for organizations with a distinguished reputation. You must show that the organization is distinguished and that your role was critical.',
    icon: Crown,
    examples: [
      'C-level executive (CEO, CTO, CFO)',
      'VP or Director at major corporations',
      'Principal Investigator on major grants',
      'Department head at research institutions',
      'Founding member or technical lead of successful startups'
    ]
  },
  {
    id: 'salary',
    name: 'High Salary',
    description: 'Evidence that you command a high salary or significantly higher remuneration than others in your field. Must provide comparative data showing you are in the top tier.',
    icon: DollarSign,
    examples: [
      'W-2 forms or tax returns showing high income',
      'Employment contracts with compensation details',
      'Offer letters from multiple companies',
      'Salary surveys showing you are in top percentile',
      'Stock options, bonuses, or equity compensation'
    ]
  },
  {
    id: 'commercial',
    name: 'Commercial Success',
    description: 'Evidence of commercial success in the performing arts. Primarily for entertainers, athletes, and performing artists. Must show financial success through box office, sales, or attendance figures.',
    icon: TrendingUp,
    examples: [
      'Box office records for films or shows',
      'Album sales or streaming numbers',
      'Ticket sales data for performances',
      'Merchandise revenue figures',
      'Licensing deals or royalty statements'
    ]
  }
];

// All items for mapping (includes recommendation letters at the end)
export const ALL_MAPPING_ITEMS: Criterion[] = [...CRITERIA, RECOMMENDATION_LETTER];

export const NIW_CRITERIA: Criterion[] = [
  {
    id: 'prong1',
    name: 'Prong I: Merit & Importance',
    description: 'Show that your proposed endeavor has both substantial merit and national importance.',
    icon: Target,
    examples: [
      'Government Reports (White House, NIH)',
      'Media articles about the field',
      'Letters from potential customers/investors',
      'Citations of your work by government'
    ]
  },
  {
    id: 'prong2',
    name: 'Prong II: Well Positioned',
    description: 'Demonstrate that you are well positioned to advance the proposed endeavor.',
    icon: User,
    examples: [
      'Advanced Degree (Master\'s/PhD)',
      'Record of success (Citations, Patents)',
      'Awards & Recognitions',
      'Current leading role in project',
      'Investment or Grant funding'
    ]
  },
  {
    id: 'prong3',
    name: 'Prong III: Balance of Interests',
    description: 'Prove it is beneficial to the U.S. to waive the job offer requirement.',
    icon: Scale,
    examples: [
      'Arguments of urgency (e.g. medical crisis)',
      'Self-employment / Entrepreneurship plan',
      'Evidence of U.S. labor shortage in field',
      'Letters attesting to unique skills'
    ]
  }
];

interface CriteriaSidebarProps {
  metCriteriaIds: string[];
  fileCount: number;
  criteriaList?: Criterion[];
  mode?: 'eb1a' | 'niw';
}

export function CriteriaSidebar({ metCriteriaIds, fileCount, criteriaList = CRITERIA, mode = 'eb1a' }: CriteriaSidebarProps) {
  const metCount = metCriteriaIds.length;
  // For EB-1A, show ALL_MAPPING_ITEMS (includes Recommendation Letters at the top)
  // For NIW, use the passed criteria list
  const activeCriteria = mode === 'eb1a' ? ALL_MAPPING_ITEMS : criteriaList;
  
  // State to track expanded items for examples
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          {mode === 'niw' ? 'NIW Criteria Overview' : 'EB-1A Criteria Overview'}
        </h3>
        <p className="text-xs text-gray-500">
          {mode === 'niw' ? (
            <>{metCount} of 3 prongs met • {fileCount} {fileCount === 1 ? 'file' : 'files'} uploaded</>
          ) : (
            <>{metCount} of 10 criteria met • {fileCount} {fileCount === 1 ? 'file' : 'files'} uploaded</>
          )}
        </p>
      </div>
      <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        <div className="space-y-2">
          {activeCriteria.map((criterion) => {
            const Icon = criterion.icon;
            const isMet = metCriteriaIds.includes(criterion.id);
            const isExpanded = expandedId === criterion.id;
            const isRecommendation = criterion.isRecommended;

            return (
              <div
                key={criterion.id}
                className={`rounded-lg border transition-all ${
                  isRecommendation
                    ? isMet
                      ? 'border-amber-300 bg-amber-50/50'
                      : 'border-amber-200 bg-amber-50/30'
                    : isMet
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-gray-200 bg-gray-50/30'
                }`}
              >
                <div 
                  className="p-3 cursor-pointer hover:bg-black/5 transition-colors rounded-lg flex items-start gap-3"
                  onClick={() => toggleExpand(criterion.id)}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    isRecommendation
                      ? isMet
                        ? 'text-amber-600'
                        : 'text-amber-500'
                      : isMet
                        ? 'text-green-600'
                        : 'text-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`text-sm font-medium ${
                          isRecommendation
                            ? isMet
                              ? 'text-amber-900'
                              : 'text-amber-800'
                            : isMet
                              ? 'text-green-900'
                              : 'text-gray-900'
                        }`}>
                          {criterion.name}
                        </h4>
                        {isRecommendation && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                            HIGHLY RECOMMENDED
                          </span>
                        )}
                        {isMet && (
                          <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                            isRecommendation ? 'text-amber-600' : 'text-green-600'
                          }`} />
                        )}
                      </div>
                      {criterion.examples && (
                        <button className="text-gray-400 hover:text-gray-600">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {criterion.description}
                    </p>
                  </div>
                </div>

                {/* Expandable Examples Section */}
                {isExpanded && criterion.examples && (
                  <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-1">
                    <div className="pl-8">
                      <div className="h-px bg-gray-200/60 mb-2" />
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Typical Evidence:
                      </p>
                      <ul className="space-y-1">
                        {criterion.examples.map((ex, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="block w-1 h-1 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Quick Guide Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Quick Tips</h4>
        {mode === 'niw' ? (
          <ul className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#434E87] font-bold mt-0.5">•</span>
              <span>Click items above to see evidence examples.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#434E87] font-bold mt-0.5">•</span>
              <span>Prong 2 is your personal qualifications.</span>
            </li>
          </ul>
        ) : (
          <ul className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-[#434E87] font-bold mt-0.5">•</span>
              <span>Click items above to see evidence examples.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#434E87] font-bold mt-0.5">•</span>
              <span>Recommendation letters not counted, but highly recommended.</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}