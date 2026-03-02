import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ASSETS } from '@/app/config/assets';
import { Button } from './ui/button';
import { SafeQueryProvider } from '@/lib/QueryProvider';
import { BookingButton } from './BookingButton';
import { DEFAULT_FORMS, TOTAL_FORMS_COUNT } from '../constants/forms';
import { 
  IconFileText,
  IconUpload,
  IconCircleCheck,
  IconCircle,
  IconClock,
  IconChevronRight,
  IconAlertCircle,
  IconExternalLink,
  IconChevronDown,
  IconPlus,
  IconHome,
  IconLogout,
  IconNews,
  IconUser,
  IconFile,
  IconTarget,
  IconEdit,
  IconFolder,
  IconPackage,
  IconTrendingUp,
  IconLayoutDashboard,
  IconScale,
  IconSettings,
  IconSparkles,
  IconDeviceHeartMonitor,
  IconX
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'motion/react';
import { PersonalInformation } from './PersonalInformation';
import { OverviewDashboard } from './OverviewDashboard';
import { DocumentPrep } from './DocumentPrep';
import { Forms } from './Forms';
import { CriteriaMapping, UploadedFile as CriteriaMappingFile, SensitiveDescription } from './CriteriaMapping';
import { CriteriaSidebar, CRITERIA as EB1A_CRITERIA, NIW_CRITERIA } from './CriteriaSidebar';
import { MyPetition } from './MyPetition';
import { ApplicationTracker } from './ApplicationTracker';
import { ExportPackage } from './ExportPackage';
import { ExportPackageDetails } from './ExportPackageDetails';
import { UserAccountPage } from '../pages/UserAccountPage';
import { applicationsService } from '../services/applicationsService';
import { criteriaService } from '../services/criteriaService';
import { formsService } from '../services/formsService';
import { fetchUserExhibits } from '../services/exhibitService';
import { fetchUserPetitionDocuments, fetchPetitionRuns } from '../services/petitionService';
import { Application } from '../types/application';
import { toast } from 'sonner';
import { queryKeys } from '../../lib/queryKeys';
import { profileService } from '../admin/services/profileService';
import { fetchPersonalFilesForApplication } from './PersonalInformation';
import { listUserPetitionDocuments, getCurrentUser } from '../../lib/backend';

interface UploadedFile {
  id: string;
  file: File;
  category: string;
  uploadedAt: Date;
}

interface ApplicationOverviewProps {
  user: {
    email: string;
    name?: string;
    isPaidUser?: boolean;
  };
  applicationType: 'niw' | 'eb1a' | null;
  onSignOut: () => void;
  onBackToHome?: () => void;
  onCreateNew?: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

// Initial mock data foundation - will be enriched with dynamic criteria
const baseMockData = {
  currentApplicationId: null,
  petitionLetterGenerated: false,
  coverLetterGenerated: false,
  completedForms: 0,
  totalForms: TOTAL_FORMS_COUNT,
  exportStatus: 'not_ready' as 'not_ready' | 'ready' | 'submitted',
  forms: DEFAULT_FORMS
};

export function EB1AOverview({ user, applicationType, onSignOut, onBackToHome, onCreateNew, initialTab, onTabChange }: ApplicationOverviewProps) {
  return (
    <SafeQueryProvider>
      <EB1AOverviewContent 
        user={user}
        applicationType={applicationType}
        onSignOut={onSignOut}
        onBackToHome={onBackToHome}
        onCreateNew={onCreateNew}
        initialTab={initialTab}
        onTabChange={onTabChange}
      />
    </SafeQueryProvider>
  );
}

// Extract the main component logic into a separate component
function EB1AOverviewContent({ user, applicationType, onSignOut, onBackToHome, onCreateNew, initialTab, onTabChange }: ApplicationOverviewProps) {
  const queryClient = useQueryClient();
  
  const [currentAppId, setCurrentAppId] = useState<string | null>(null);

  // ✅ Use React Query for applications - enables instant loading with cache
  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: queryKeys.applications(),
    queryFn: () => applicationsService.getApplications(),
    staleTime: 5 * 60 * 1000,   // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,     // 10 minutes - keep in cache for 10 min
    placeholderData: (previousData) => previousData, // ✅ Show cached data immediately
  });

  // ✅ Set currentAppId when applications load
  useEffect(() => {
    if (applications.length > 0 && !currentAppId) {
      // ✅ Read from localStorage first to maintain application type consistency
      const savedAppType = localStorage.getItem('dreamcard-app-type');
      console.log('📱 Loaded applications:', applications.map(a => a.type), '| Saved type in localStorage:', savedAppType);
      
      // If we have a saved type in localStorage, try to use it
      if (savedAppType === 'niw' || savedAppType === 'eb1a') {
        const typeLabel = savedAppType === 'niw' ? 'NIW' : 'EB-1A';
        const matching = applications.find(a => a.type === typeLabel);
        if (matching) {
          console.log('✅ Using saved application type:', savedAppType);
          setCurrentAppId(matching.id);
        } else {
          console.log('⚠️ Saved type not found, using first app');
          setCurrentAppId(applications[0].id);
        }
      } else if (applicationType) {
        // Fallback to prop if no localStorage
        const typeLabel = applicationType === 'niw' ? 'NIW' : 'EB-1A';
        const matching = applications.find(a => a.type === typeLabel);
        if (matching) setCurrentAppId(matching.id);
        else setCurrentAppId(applications[0].id);
      } else {
        setCurrentAppId(applications[0].id);
      }
    }
  }, [applications, currentAppId, applicationType]);

  // ✅ Use React Query for Criteria Mapping data - enables prefetch caching
  const {
    data: criteriaFilesData = [],
    isLoading: isLoadingCriteriaFiles,
  } = useQuery({
    queryKey: queryKeys.criteriaFiles(currentAppId || ''),
    queryFn: () => criteriaService.getFiles(currentAppId!, 'evidence'),
    enabled: !!currentAppId,
    staleTime: 5 * 60 * 1000,   // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,     // 10 minutes - keep in cache for 10 min
  });

  const {
    data: sensitiveDescriptionsData = [],
    isLoading: isLoadingSensitiveDescriptions,
  } = useQuery({
    queryKey: queryKeys.sensitiveDescriptions(currentAppId || ''),
    queryFn: () => criteriaService.getSensitiveDescriptions(currentAppId!),
    enabled: !!currentAppId,
    staleTime: 5 * 60 * 1000,   // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,     // 10 minutes - keep in cache for 10 min
  });

  // Local state for criteria mapping (for unsaved changes)
  const [criteriaFiles, setCriteriaFiles] = useState<CriteriaMappingFile[]>([]);
  const [sensitiveDescriptions, setSensitiveDescriptions] = useState<SensitiveDescription[]>([]);

  // Sync query data with local state - use a ref to avoid infinite loops
  const prevAppIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only sync when app changes or when data first loads
    if (currentAppId !== prevAppIdRef.current || (criteriaFiles.length === 0 && criteriaFilesData.length > 0)) {
      const transformed = criteriaFilesData.map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        uploadDate: new Date(f.upload_date),
        criteria: f.criteria || [],
        url: f.url
      }));
      setCriteriaFiles(transformed);
      prevAppIdRef.current = currentAppId;
    }
  }, [currentAppId, criteriaFilesData.length]); // Only depend on length, not the entire array

  useEffect(() => {
    // Only sync when app changes or when data first loads  
    if (currentAppId !== prevAppIdRef.current || (sensitiveDescriptions.length === 0 && sensitiveDescriptionsData.length > 0)) {
      const transformed = sensitiveDescriptionsData.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        criteria: d.criteria || [],
        createdDate: new Date(d.created_date)
      }));
      setSensitiveDescriptions(transformed);
    }
  }, [currentAppId, sensitiveDescriptionsData.length]); // Only depend on length, not the entire array

  const [activeNav, setActiveNav] = useState<string>('overview');
  const [showAppDropdown, setShowAppDropdown] = useState(false);
  
  // ✅ Sync activeNav with URL via initialTab prop
  useEffect(() => {
    if (initialTab) {
      setActiveNav(initialTab);
    }
  }, [initialTab]);
  
  const [showLearnPanel, setShowLearnPanel] = useState(false);
  
  // Petition initial step state
  const [petitionInitialStep, setPetitionInitialStep] = useState<'versions' | 'generating' | 'review' | 'editing' | 'preview'>('versions');
  
  // ✅ REMOVED: Local isPaidUser state - use user.isPaidUser from props instead
  // const [isPaidUser, setIsPaidUser] = useState(false);
  const [activationCode, setActivationCode] = useState<string | null>(null);
  
  // Personal Information state
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    countryOfBirth: '',
    currentCountry: '',
    email: '',
    phone: ''
  });
  
  // Petition letter generation state
  const [hasPetitionLetter, setHasPetitionLetter] = useState(false);
  const [petitionLetterGeneratedAt, setPetitionLetterGeneratedAt] = useState<Date | null>(null);
  
  // Tracking number state
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  
  // Determine current application type and criteria
  const currentApp = applications.find(app => app.id === currentAppId) || applications[0];
  const isNIW = currentApp?.type === 'NIW';
  const activeCriteriaList = isNIW ? NIW_CRITERIA : EB1A_CRITERIA;

  // Function to upgrade user to paid version
  const handleUpgradeToPaid = (activationCode?: string) => {
    // Validate activation code if provided
    if (activationCode) {
      // TODO: Validate with backend
      console.log('Validating activation code:', activationCode);
    }
    
    // ✅ REMOVED: Don't modify local state - this should be handled by parent/backend
    // User paid status should come from user prop, not local state
    // setIsPaidUser(true);
    // localStorage.setItem('dreamcard-paid-status', 'true');
  };

  // Function to handle upgrade click - navigate to account page
  const handleUpgradeClick = () => {
    setActiveNav('account');
  };

  // Uploaded files state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Criteria mapping state
  const [selectedCriteriaFile, setSelectedCriteriaFile] = useState<string | null>(null);
  
  // ✅ Add state to track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // ✅ Add state for confirmation dialog
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // ✅ Handle navigation with unsaved changes confirmation
  const handleNavigation = (newNav: string) => {
    // ✅ Reset petitionInitialStep to 'versions' when navigating to My Petition via nav button
    // Only from Criteria Mapping's "Go to My Petition" should it be 'review'
    if (newNav === 'petition_letter_editor') {
      setPetitionInitialStep('versions');
    }
    
    if (activeNav === 'criteria_mapping' && hasUnsavedChanges) {
      setPendingNavigation(newNav);
      setShowUnsavedDialog(true);
    } else {
      setActiveNav(newNav);
      // Call parent navigation handler if provided
      if (onTabChange) {
        onTabChange(newNav);
      }
    }
  };
  
  // ✅ Confirm navigation and discard changes
  const confirmNavigation = () => {
    if (pendingNavigation) {
      // ✅ Reset petitionInitialStep when navigating to My Petition
      if (pendingNavigation === 'petition_letter_editor') {
        setPetitionInitialStep('versions');
      }
      setHasUnsavedChanges(false);
      setActiveNav(pendingNavigation);
      // Call parent navigation handler if provided
      if (onTabChange) {
        onTabChange(pendingNavigation);
      }
      setPendingNavigation(null);
    }
    setShowUnsavedDialog(false);
  };
  
  // ✅ Cancel navigation and stay on page
  const cancelNavigation = () => {
    setPendingNavigation(null);
    setShowUnsavedDialog(false);
  };

  // Calculate met criteria count (from both files and sensitive descriptions)
  const metCriteriaIds = activeCriteriaList.filter(criterion => 
    criteriaFiles.some(file => file.criteria.includes(criterion.id)) ||
    sensitiveDescriptions.some(desc => desc.criteria.includes(criterion.id))
  ).map(c => c.id);
  const metCriteriaCount = metCriteriaIds.length;

  // Generate dynamic mock data for dashboard
  const mockData = useMemo(() => {
    // Generate criteria items with material counts
    const dynamicCriteria = activeCriteriaList.map(criterion => {
      const fileCount = criteriaFiles.filter(f => f.criteria.includes(criterion.id)).length;
      const descCount = sensitiveDescriptions.filter(d => d.criteria.includes(criterion.id)).length;
      
      // Add some fake notes for demo purposes if files exist
      let notes = '';
      if (fileCount > 0) {
         if (criterion.id === 'awards') notes = 'Best Paper Award 2023';
         else if (criterion.id === 'leading') notes = 'Tech Lead at Company';
         else if (criterion.id === 'judging') notes = 'Conference PC member';
         else if (criterion.id === 'prong2') notes = 'Masters Degree & experience';
      }

      return {
        name: criterion.name,
        materials: fileCount + descCount,
        notes
      };
    });

    return {
      ...baseMockData,
      criteria: dynamicCriteria,
      criteriaWithMaterials: dynamicCriteria.filter(c => c.materials > 0).length
    };
  }, [activeCriteriaList, criteriaFiles, sensitiveDescriptions]);

  // Handlers for criteria mapping
  const handleAddCriteriaFiles = async (newFiles: CriteriaMappingFile[]) => {
    if (!currentAppId) return;

    // Filter out files that don't have the File object (e.g. from existing DB records, shouldn't happen here usually)
    const filesToUpload = newFiles.filter(f => f.file);

    if (filesToUpload.length === 0) {
        // If no files to upload (e.g. maybe just metadata change? rare here), just return
        return;
    }

    const toastId = toast.loading(`Uploading ${filesToUpload.length} files...`);
    const savedFiles: CriteriaMappingFile[] = [];
    let successCount = 0;
    let failCount = 0;

    for (const fileItem of filesToUpload) {
        try {
            if (!fileItem.file) continue;

            const saved = await criteriaService.uploadAndSaveFile(
                fileItem.file, 
                currentAppId, 
                fileItem.criteria
            );

            savedFiles.push({
                id: saved.id,
                name: saved.name,
                size: saved.size,
                uploadDate: new Date(saved.upload_date),
                criteria: saved.criteria || [],
                // We don't need to keep the File object in state after upload
            });
            successCount++;
        } catch (e: any) {
            console.error("Failed to save file:", e);
            failCount++;
            toast.error(`Failed to upload ${fileItem.name}: ${e.message}`, { id: toastId });
        }
    }
    
    if (successCount > 0) {
        setCriteriaFiles(prev => [...prev, ...savedFiles]);
        toast.success(`Successfully uploaded ${successCount} files`, { id: toastId });
    } else if (failCount > 0) {
        // Only dismiss if we showed success or error explicitly, but let's update the main toast
        toast.error(`Failed to upload ${failCount} files`, { id: toastId });
    } else {
        toast.dismiss(toastId);
    }
  };

  const handleDeleteCriteriaFile = async (id: string) => {
    if (!currentAppId) return;
    try {
        await criteriaService.deleteFile(id, currentAppId);
        setCriteriaFiles(prev => prev.filter(file => file.id !== id));
        if (selectedCriteriaFile === id) {
          setSelectedCriteriaFile(null);
        }
    } catch(e) {
        console.error("Failed to delete file:", e);
        toast.error("Failed to delete file");
    }
  };

  const handleToggleCriterion = async (criterionId: string) => {
    if (!selectedCriteriaFile || !currentAppId) return;
    
    // ✅ Only update local state, do NOT save to backend
    const file = criteriaFiles.find(f => f.id === selectedCriteriaFile);
    if (!file) return;

    const newCriteria = file.criteria.includes(criterionId)
        ? file.criteria.filter(c => c !== criterionId)
        : [...file.criteria, criterionId];

    // Update local state only
    setCriteriaFiles(prev => prev.map(f => f.id === selectedCriteriaFile ? { ...f, criteria: newCriteria } : f));
    setHasUnsavedChanges(true);
  };

  const handleToggleSensitiveDescriptionCriterion = async (descId: string, criterionId: string) => {
    if (!currentAppId) return;

    const desc = sensitiveDescriptions.find(d => d.id === descId);
    if (!desc) return;

    const newCriteria = desc.criteria.includes(criterionId)
        ? desc.criteria.filter(c => c !== criterionId)
        : [...desc.criteria, criterionId];

    setSensitiveDescriptions(prev => prev.map(d => d.id === descId ? { ...d, criteria: newCriteria } : d));

    try {
        await criteriaService.updateSensitiveDescriptionCriteria(descId, newCriteria, currentAppId);
    } catch (e) {
        console.error("Failed to update description criteria:", e);
        toast.error("Failed to save changes");
        setSensitiveDescriptions(prev => prev.map(d => d.id === descId ? desc : d));
    }
  };

  const handleAddSensitiveDescription = async (desc: SensitiveDescription) => {
    if (!currentAppId) return;
    try {
        const saved = await criteriaService.addSensitiveDescription({
            application_id: currentAppId,
            title: desc.title,
            description: desc.description,
            criteria: desc.criteria
        });
        setSensitiveDescriptions(prev => [...prev, {
            id: saved.id,
            title: saved.title,
            description: saved.description,
            criteria: saved.criteria || [],
            createdDate: new Date(saved.created_date)
        }]);
    } catch (e) {
        console.error("Failed to save description:", e);
        toast.error("Failed to save description");
    }
  };

  const handleDeleteSensitiveDescription = async (id: string) => {
    if (!currentAppId) return;
    try {
        await criteriaService.deleteSensitiveDescription(id, currentAppId);
        setSensitiveDescriptions(prev => prev.filter(d => d.id !== id));
    } catch (e) {
        console.error("Failed to delete description:", e);
        toast.error("Failed to delete description");
    }
  };

  // File management functions
  const handleAddFiles = (files: File[], category: string) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      category,
      uploadedAt: new Date()
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const handleRemoveFileByName = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  // Empty State: No applications found
  if (!isLoadingApps && applications.length === 0) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-6">
              <img src={ASSETS.logo} alt="DreamCardAI" className="h-5.5 w-auto mx-[10px] my-[0px]" />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToHome}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <IconHome size={16} />
                <span className="hidden sm:inline">Home</span>
              </button>
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <IconLogout size={16} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-xl shadow-sm border border-gray-200">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 mb-6">
              <IconFileText size={40} strokeWidth={1.5} />
            </div>
            
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Start Your Journey</h2>
                <p className="text-gray-500 leading-relaxed">
                    You haven't created any immigration applications yet. Select an application type to begin your case.
                </p>
            </div>
            
            <div className="pt-4">
                <Button 
                    onClick={() => onCreateNew && onCreateNew()} 
                    className="w-full h-12 text-base font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                    Create New Application
                </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Left */}
          <div className="flex items-center gap-6">
            <img src={ASSETS.logo} alt="DreamCardAI" className="h-5.5 w-auto mx-[10px] my-[0px]" />
            <div className="h-6 w-px bg-gray-300" />
            
            {/* Application Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAppDropdown(!showAppDropdown)}
                className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-primary transition-colors py-1.5 rounded-md hover:bg-gray-100 border border-gray-200 px-[25px] py-[5px]"
              >
                {currentApp?.name || 'Loading...'}
                <IconChevronDown size={16} className="text-grey-300"strokeWidth={1} />
              </button>
              
              {showAppDropdown && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Your Applications
                  </div>
                  {applications.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        setCurrentAppId(app.id);
                        setShowAppDropdown(false);
                        // ✅ FIX: Update localStorage when switching applications
                        const newAppType = app.type === 'NIW' ? 'niw' : 'eb1a';
                        localStorage.setItem('dreamcard-app-type', newAppType);
                        console.log('🔄 Switched to application:', app.type, '- saved to localStorage');
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        app.id === currentAppId ? 'bg-primary/5 text-primary font-medium' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{app.name}</span>
                        <span className="text-xs text-gray-500">{app.type}</span>
                      </div>
                      {app.id === currentAppId && <IconCircleCheck size={16} />}
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-2 pt-2">
                    <button 
                      onClick={() => {
                        setShowAppDropdown(false);
                        if (onCreateNew) onCreateNew();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors flex items-center gap-2"
                    >
                      <IconPlus size={16} />
                      Create New Application
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* 🔥 Book a Meeting Button - Only show for unpaid users */}
            {!user.isPaidUser && (
              <BookingButton onAuth={() => {}} currentUser={user} variant="inline" />
            )}
            
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <IconHome size={16} />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <IconLogout size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Disclaimer bar - Only show on My Petition page */}
        {activeNav === 'petition' && (
          <div className="bg-amber-50 border-t border-amber-100 px-6 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-800 flex items-center gap-2">
                <IconAlertCircle size={14} />
                Drafts are generated based on your uploads. DreamCardAI does not evaluate eligibility or approval outcomes.
              </p>
            </div>
          </div>
        )}
        
        {/* Free User Warning for Criteria Mapping */}
        {activeNav === 'criteria_mapping' && !user.isPaidUser && (
          <div className="bg-amber-50 border-t border-amber-100 px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <IconAlertCircle size={14} className="text-amber-600 flex-shrink-0" />
                <div className="text-xs text-gray-700">
                  You're on the <span className="font-semibold text-gray-900">Free Plan</span> — Upload limit: <span className="font-bold text-amber-700">5 evidence files</span>
                </div>
              </div>
              <button 
                onClick={handleUpgradeClick}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-md transition-colors flex-shrink-0"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
          <nav className="p-5 space-y-8">
            
            {/* Main navigation */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Workspace
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleNavigation('overview')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'overview'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconLayoutDashboard size={16} className="flex-shrink-0" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => handleNavigation('criteria_mapping')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'criteria_mapping'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconDeviceHeartMonitor size={16} className="flex-shrink-0" />
                  <span>
                    {isNIW ? 'Requirements Mapping' : 'Criteria Mapping'}
                  </span>
                </button>
                <button
                  onClick={() => handleNavigation('personal_information')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'personal_information'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconUser size={16} className="flex-shrink-0" />
                  <span>Personal Information</span>
                </button>
                <button
                  onClick={() => handleNavigation('forms')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'forms'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconFile size={16} className="flex-shrink-0" />
                  <span>Forms</span>
                </button>
                
              </div>
            </div>

            {/* Editors section */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Editors
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleNavigation('petition_letter_editor')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'petition_letter_editor'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconEdit size={16} className="flex-shrink-0" />
                  <span className="flex-1">My Petition</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Ver.2.1
                  </span>
                </button>
                <button
                  onClick={() => handleNavigation('export_package')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'export_package'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconPackage size={16} className="flex-shrink-0" />
                  <span className="flex-1">Export Package</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Ver.2.1
                  </span>
                </button>
              </div>
            </div>

            {/* Tools section */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Tools
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleNavigation('document_organizer')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'document_organizer'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconFolder size={16} className="flex-shrink-0" />
                  <span>All Documents</span>
                </button>
                <button
                  onClick={() => handleNavigation('application_tracker')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'application_tracker'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconTrendingUp size={16} className="flex-shrink-0" />
                  <span>Tracker</span>
                </button>
              </div>
            </div>

            {/* Settings section */}
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                Settings
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleNavigation('account')}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-md transition-colors flex items-center gap-3 ${
                    activeNav === 'account'
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconSettings size={16} className="flex-shrink-0" />
                  <span>Account & Billing</span>
                </button>
              </div>
            </div>

            {/* Free User Upgrade Prompt - At Bottom */}
            {!user.isPaidUser && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200/50">
                <div className="flex items-start gap-2 mb-2">
                  <IconSparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Unlock Full Power</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Unlimited AI petitions, upload unlimited files, export full package and more.
                    </p>
                    <button
                      onClick={() => setActiveNav('account')}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <IconSparkles className="w-3.5 h-3.5" />
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            )}


          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          {activeNav === 'personal_information' ? (
             <PersonalInformation 
               onAddFiles={handleAddFiles} 
               onRemoveFile={handleRemoveFileByName} 
               isNIW={isNIW}
               applicationId={currentAppId}  // ✅ Add applicationId prop
             />
          ) : activeNav === 'document_organizer' ? (
             <DocumentPrep applicationId={currentAppId} />
          ) : activeNav === 'forms' ? (
             <Forms 
               applicationId={currentAppId || undefined}
             />
          ) : activeNav === 'criteria_mapping' ? (
             <CriteriaMapping 
               files={criteriaFiles} 
               selectedFileId={selectedCriteriaFile}
               onAddFiles={handleAddCriteriaFiles} 
               onDeleteFile={handleDeleteCriteriaFile} 
               onSelectFile={setSelectedCriteriaFile}
               onToggleCriterion={handleToggleCriterion}
               metCriteriaCount={metCriteriaCount}
               sensitiveDescriptions={sensitiveDescriptions}
               onAddSensitiveDescription={handleAddSensitiveDescription}
               onDeleteSensitiveDescription={handleDeleteSensitiveDescription}
               onToggleSensitiveDescriptionCriterion={handleToggleSensitiveDescriptionCriterion}
               criteriaList={activeCriteriaList}
               mode={isNIW ? 'niw' : 'eb1a'}
               onNavigateToPetition={() => {
                 setPetitionInitialStep('review');
                 handleNavigation('petition_letter_editor');
               }}
               isPaidUser={user.isPaidUser || false}
               applicationId={currentAppId}
               onSaveSuccess={() => setHasUnsavedChanges(false)}
             />
          ) : activeNav === 'petition_letter_editor' ? (
             <MyPetition
               personalInfoDocs={uploadedFiles.map(f => ({
                 id: f.id,
                 name: f.file.name,
                 category: f.category,
                 size: f.file.size,
                 included: true
               }))}
               criteriaDocs={activeCriteriaList.map(criterion => ({
                 criteriaId: criterion.id,
                 docs: criteriaFiles
                   .filter(file => file.criteria.includes(criterion.id))
                   .map(file => ({
                     id: file.id,
                     name: file.name,
                     category: criterion.name, // Use name instead of title if needed, or update interface
                     size: file.size,
                     included: true
                   }))
               })).filter(cd => cd.docs.length > 0)}
               metCriteriaCount={metCriteriaCount}
               initialStep={petitionInitialStep}
               isPaidUser={user.isPaidUser || false}
               onUpgradeClick={() => setActiveNav('account')}
               applicationId={currentAppId || undefined}  // ✅ Pass currentAppId to MyPetition
             />
          ) : activeNav === 'application_tracker' ? (
             <ApplicationTracker />
          ) : activeNav === 'export_package' ? (
             <ExportPackage 
               isPaidUser={user.isPaidUser || false} 
               onUpgradeClick={() => setActiveNav('account')} 
               applicationId={currentAppId || undefined}
             />
          ) : activeNav === 'export_package_details' ? (
             <ExportPackageDetails 
               applicationId={currentAppId || undefined}
             />
          ) : activeNav === 'account' ? (
             <UserAccountPage isPaidUser={user.isPaidUser || false} onActivateCode={handleUpgradeToPaid} />
          ) : (
             <OverviewDashboard 
               mockData={mockData} 
               metCriteriaCount={metCriteriaCount}
               mode={isNIW ? 'niw' : 'eb1a'}
               personalInfoComplete={!!(personalInfo.firstName && personalInfo.lastName && personalInfo.email)}
               hasPersonalStatementFile={uploadedFiles.some(f => f.category === 'Personal Statement')}
               hasSupportingDocIndex={uploadedFiles.some(f => f.category === 'Supporting Documentation Index')}
               hasPetitionLetter={hasPetitionLetter}
               hasTrackingNumber={!!trackingNumber}
               trackingNumber={trackingNumber}
               petitionLetterGeneratedAt={petitionLetterGeneratedAt}
               onNavigateTo={(nav) => handleNavigation(nav)}
               onNavigateToCriteria={() => handleNavigation('criteria_mapping')}
               onNavigateToForms={() => handleNavigation('forms')}
               onNavigateToPetition={() => handleNavigation('petition_letter_editor')}
               onNavigateToExport={() => handleNavigation('export_package')}
               onNavigateToTracker={() => handleNavigation('application_tracker')}
               onNavigateToAccount={() => handleNavigation('account')}
             />
          )}
        </main>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      <AnimatePresence>
        {showUnsavedDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                cancelNavigation();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <IconAlertCircle className="w-6 h-6 text-amber-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Unsaved Changes
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      You have unsaved changes in Criteria Mapping. These changes will be lost if you leave without saving.
                    </p>
                  </div>
                  <button
                    onClick={cancelNavigation}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  onClick={cancelNavigation}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Stay on Page
                </button>
                <button
                  onClick={confirmNavigation}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
                >
                  Leave Without Saving
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}