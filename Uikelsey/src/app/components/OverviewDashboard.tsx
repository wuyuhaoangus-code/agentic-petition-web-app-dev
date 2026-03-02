import React from 'react';
import { Button } from './ui/button';
import { 
  IconFileText,
  IconUpload,
  IconCircleCheck,
  IconCircle,
  IconClock,
  IconChevronRight,
  IconAlertCircle,
  IconTarget,
  IconPackage,
  IconTrendingUp
} from '@tabler/icons-react';

interface OverviewDashboardProps {
  mockData: any;
  metCriteriaCount: number;
  mode?: 'eb1a' | 'niw';
  personalInfoComplete?: boolean;
  hasPersonalStatementFile?: boolean;
  hasSupportingDocIndex?: boolean;
  hasPetitionLetter?: boolean;
  hasTrackingNumber?: boolean;
  trackingNumber?: string;
  isPaidUser?: boolean;
  onNavigateToCriteria?: () => void;
  onNavigateToForms?: () => void;
  onNavigateToPetition?: () => void;
  onNavigateToExport?: () => void;
  onNavigateToTracker?: () => void;
  onNavigateToAccount?: () => void;
}

export function OverviewDashboard({ 
  mockData, 
  metCriteriaCount, 
  mode = 'eb1a',
  personalInfoComplete = false,
  hasPersonalStatementFile = false,
  hasSupportingDocIndex = false,
  hasPetitionLetter = false,
  hasTrackingNumber = false,
  trackingNumber,
  isPaidUser = false,
  onNavigateToCriteria,
  onNavigateToForms,
  onNavigateToPetition,
  onNavigateToExport,
  onNavigateToTracker,
  onNavigateToAccount
}: OverviewDashboardProps) {
  const getFormStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <IconCircleCheck size={16} className="text-green-600" />;
      case 'in_progress':
        return <IconClock size={16} className="text-amber-600" />;
      default:
        return <IconCircle size={16} className="text-gray-300" />;
    }
  };

  const getFormStatusText = (status: string, uploadOnly?: boolean) => {
    if (uploadOnly) {
      // For upload-only forms (Personal Statement, Supporting Documentation Index)
      switch (status) {
        case 'finished':
          return 'Uploaded';
        case 'in_progress':
          return 'In progress';
        default:
          return 'Not uploaded';
      }
    } else {
      // For editable forms (I-140, G-28, etc.)
      switch (status) {
        case 'finished':
          return 'Finished';
        case 'in_progress':
          return 'In progress';
        default:
          return 'Not started';
      }
    }
  };

  const isNIW = mode === 'niw';
  const criteriaTotal = isNIW ? 3 : 10;
  const criteriaMin = isNIW ? 3 : 3; // Changed to 3 for EB-1A

  // Check if ready to generate petition
  const hasEnoughCriteria = metCriteriaCount >= criteriaMin;
  const canGeneratePetition = hasEnoughCriteria && personalInfoComplete;

  // Count completed forms (only count non-upload-only forms)
  const completedFormsCount = mockData.forms.filter((f: any) => !f.uploadOnly && f.status === 'finished').length;
  const totalFormsCount = mockData.forms.filter((f: any) => !f.uploadOnly).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Progress</h1>
        <p className="text-sm text-gray-500">
          Track your application journey from preparation to approval.
        </p>
      </div>
      
      {/* Current Status Section - Improved */}
      <section>
        <div className="space-y-4">
          {/* PHASE 1 - Evidence & Criteria (PRIMARY - Most Prominent) */}
          <div className="bg-white border-l-4 border-primary border-t border-r border-b border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold">
                    1
                  </span>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide font-[Lato]">
                    Phase 1 · Evidence & {isNIW ? 'Requirements' : 'Criteria'}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {metCriteriaCount} / {isNIW ? 3 : 10}
                  </div>
                  <div className="text-base text-gray-700 font-medium">
                    {isNIW ? 'Prongs Satisfied' : 'Criteria Met'}
                  </div>
                </div>
                
                {hasEnoughCriteria ? (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <IconCircleCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-green-800 leading-relaxed">
                        Excellent! You've met the minimum requirement of {criteriaMin} {isNIW ? 'prongs' : 'criteria'}. You can now proceed to generate your petition letter.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {isNIW 
                      ? "NIW petitions must satisfy all 3 prongs of the Matter of Dhanasar test."
                      : `EB-1A petitions require evidence for at least ${criteriaMin} criteria. You need ${criteriaMin - metCriteriaCount} more.`
                    }
                  </p>
                )}
                
                <Button 
                  onClick={onNavigateToCriteria}
                  className="bg-primary hover:bg-primary/90 text-white h-11 px-6 rounded-md font-medium"
                >
                  <IconTarget size={18} className="mr-2" />
                  {hasEnoughCriteria ? 'Review Criteria Mapping' : 'Go to Criteria Mapping'}
                </Button>
              </div>
              
              {/* Visual Progress Indicator */}
              <div className="hidden lg:flex items-center justify-center w-32 h-32 flex-shrink-0">
                <div className="relative w-28 h-28">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(metCriteriaCount / criteriaTotal) * 314} 314`}
                      className={`${hasEnoughCriteria ? 'text-green-500' : 'text-primary'} transition-all duration-500`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 font-[Lato]">
                      {metCriteriaCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PHASE 2 - Petition Letter (SECONDARY) */}
          <div className="bg-white border-l-4 border-gray-200 border-t border-r border-b border-gray-200 rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-semibold">
                    2
                  </span>
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                    Phase 2 · Petition Letter
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="text-base font-semibold text-gray-900 mb-2">
                    Petition Letter Status
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {hasPetitionLetter ? (
                        <IconCircleCheck size={16} className="text-green-600" />
                      ) : (
                        <IconCircle size={16} className="text-gray-300" />
                      )}
                      <span className="text-gray-700">Petition letter</span>
                      <span className="text-xs text-gray-500">
                        {hasPetitionLetter ? '— generated' : '— not generated'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {canGeneratePetition ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      You're ready to generate your petition letter!
                    </p>
                    <Button 
                      onClick={onNavigateToPetition}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-md h-9 font-medium"
                    >
                      <IconFileText size={16} className="mr-2" />
                      {hasPetitionLetter ? 'View Petition' : 'Generate Petition Letter'}
                    </Button>
                  </>
                ) : (
                  <>
                    
                    <Button 
                      variant="outline" 
                      className="rounded-md h-9 font-medium border-gray-300 text-gray-700"
                      disabled
                    >
                      <IconFileText size={16} className="mr-2" />
                      Generate Petition Letter
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* PHASE 3-5 - Forms, Export & Tracking (TERTIARY - Three separate cards) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card A: Forms */}
            <div className="bg-white border-l-4 border-blue-400 border-t border-r border-b border-gray-200 rounded-lg p-5">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-semibold">
                  3
                </span>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Forms
                </span>
              </div>
              
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {completedFormsCount} / {totalFormsCount}
                </div>
                <div className="text-sm text-gray-700">
                  Completed
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                Administrative forms can be completed at any stage.
              </p>
              
              <Button 
                variant="outline" 
                className="rounded-md h-9 font-medium border-blue-300 text-blue-700 hover:bg-blue-50 w-full"
                onClick={onNavigateToForms}
              >
                <IconFileText size={16} className="mr-2" />
                Go to Forms
              </Button>
            </div>

            {/* Card B: Export */}
            <div className="bg-white border-l-4 border-emerald-400 border-t border-r border-b border-gray-200 rounded-lg p-5">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-semibold">
                  4
                </span>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  Export
                </span>
              </div>
              
              <div className="mb-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md border border-emerald-200">
                  {hasPetitionLetter ? 'Ready' : 'Not ready'}
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mt-3 mb-4 leading-relaxed">
                {hasPetitionLetter 
                  ? 'Package all materials into a submission-ready format.'
                  : 'We will organize your package in USCIS submission order once your petition is ready.'
                }
              </p>
              
              {hasPetitionLetter && (
                <Button 
                  variant="outline" 
                  className="rounded-md h-9 font-medium border-emerald-300 text-emerald-700 hover:bg-emerald-50 w-full"
                  onClick={onNavigateToExport}
                >
                  <IconPackage size={16} className="mr-2" />
                  Go to Export
                </Button>
              )}
            </div>

            {/* Card C: Tracking */}
            <div className="bg-white border-l-4 border-amber-400 border-t border-r border-b border-gray-200 rounded-lg p-5">
              <div className="inline-flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-semibold">
                  5
                </span>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Tracking
                </span>
              </div>
              
              <div className="mb-2">
                <div className="text-sm text-gray-700 font-medium">
                  {hasTrackingNumber ? `#${trackingNumber}` : 'Not submitted'}
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mt-3 mb-4 leading-relaxed">
                Monitor your application status after submission.
              </p>
              
              {hasTrackingNumber && (
                <Button 
                  variant="outline" 
                  className="rounded-md h-9 font-medium border-amber-300 text-amber-700 hover:bg-amber-50 w-full"
                  onClick={onNavigateToTracker}
                >
                  <IconTrendingUp size={16} className="mr-2" />
                  Go to Tracker
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Criteria Overview Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {isNIW ? 'Requirements Overview' : 'Criteria Overview'}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Materials are shown as uploaded. No quality or eligibility evaluation is performed.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                  {isNIW ? 'Prongs / Requirements' : 'Criteria'}
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                  Materials
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider px-6 py-3">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...mockData.criteria]
                .sort((a: any, b: any) => b.materials - a.materials)
                .map((criterion: any, index: number) => (
                  <tr 
                    key={index}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={onNavigateToCriteria}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">{criterion.name}</span>
                        <IconChevronRight size={14} className="text-gray-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${criterion.materials > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {criterion.materials} {criterion.materials === 1 ? 'file' : 'files'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {criterion.notes ? (
                        <div className="text-xs text-gray-600 max-w-xs truncate">
                          {criterion.notes}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No notes</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Forms Summary Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Forms</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click on any form to open the editor and complete it.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {mockData.forms.map((form: any, index: number) => {
              // For upload-only forms, only show uploaded/not uploaded status
              const displayStatus = form.uploadOnly 
                ? (form.status === 'finished' ? 'finished' : 'not_started')
                : form.status;
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (onNavigateToForms) onNavigateToForms();
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {getFormStatusIcon(displayStatus)}
                    <span className="text-sm text-gray-900 font-medium">{form.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{getFormStatusText(displayStatus, form.uploadOnly)}</span>
                    <IconChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Optional Support Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need extra support?</h2>

        <div className={`grid grid-cols-1 ${isPaidUser ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4`}>
          {/* $39 Plan - Only show if user is not paid */}
          {!isPaidUser && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">$39</span>
                <span className="text-sm text-gray-600">· AI Drafting Plan</span>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Generate unlimited AI petition drafts with smart document organization and export to PDF/Word.
              </p>
              <Button 
                variant="outline" 
                className="w-full rounded-md"
                onClick={onNavigateToAccount}
              >
                Upgrade to AI Drafting
              </Button>
            </div>
          )}

          {/* $499 Plan - Always show */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">$499</span>
              <span className="text-sm text-gray-600">· Expert Review Plan</span>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Get professional feedback on your petition materials and strategic guidance from immigration experts.
            </p>
            <Button 
              variant="outline" 
              className="w-full rounded-md"
              onClick={onNavigateToAccount}
            >
              {isPaidUser ? 'Upgrade to Expert Review' : 'Request Expert Review'}
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer Disclaimer */}
      <div className="max-w-5xl mx-auto mt-12 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          DreamCardAI organizes and generates documents based on user-provided information. It does not provide legal advice or determine application outcomes.
        </p>
      </div>
    </div>
  );
}