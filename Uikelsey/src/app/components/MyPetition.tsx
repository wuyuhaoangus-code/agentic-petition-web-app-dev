import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Upload, 
  Sparkles,
  Clock,
  Edit3,
  Eye,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Info,
  ArrowRight,
  Loader2,
  Check,
  X,
  GripVertical,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { CRITERIA } from './CriteriaSidebar';
import { PetitionEditor } from './PetitionEditor';
import { GenerateNewDocument } from './GenerateNewDocument';
import { ExhibitReview } from './ExhibitReview';
import {
  draftPetitionSection,
  synthesizeSectionConclusion,
  downloadPetitionSection,
  generateFinalDocument,
  getCurrentUser,
} from '../../lib/backend';
import { queryKeys } from '../../lib/queryKeys';
import { fetchUserExhibits } from '../services/exhibitService';
import { fetchUserPetitionDocuments, fetchPetitionRuns, downloadPetitionDocument, deletePetitionByRunId } from '../services/petitionService'; // ✅ Import delete function
import { toast } from 'sonner';

// ✅ New interfaces for backend exhibit structure
interface ExhibitItem {
  file_id: string | null;
  content_id: string | null;
  item_suffix: string;
  // Additional FE-only fields
  file_name?: string;
  content_title?: string;
}

interface UserExhibit {
  id: string;
  criteria_id: string;
  title: string;
  exhibit_number: number;
  summary: string | null;
  created_at: string;
  items: ExhibitItem[];
}

interface Document {
  id: string;
  name: string;
  category: string;
  size: number;
  included: boolean;
}

// New structure: Evidence item under each criterion
interface EvidenceItem {
  id: string;
  title: string; // e.g., "Nobel Prize award 2025", "CEO recommendation"
  generatedByBackend: boolean;
  materials: Document[];
}

interface CriteriaWithEvidence {
  criteriaId: string;
  evidenceItems: EvidenceItem[];
}

interface PetitionVersion {
  id: string;
  version: number;
  type: 'ai_generated' | 'edited' | 'user_uploaded';
  generatedAt: Date;
  title: string;
  status: 'generating' | 'ready' | 'error';
  runId?: string;
  runIds?: string[];
  usedDocuments?: string[];
  sectionDocuments?: { [section: string]: string[] };
  content?: string; // JSON serialized editor state
  generatedDocumentId?: string; // Persisted backend-generated final document ID
  coverLetterDocumentId?: string; // Persisted cover letter document ID for download
}

interface MyPetitionProps {
  personalInfoDocs: Document[];
  criteriaDocs: { criteriaId: string; docs: Document[] }[];
  metCriteriaCount: number;
  initialStep?: 'versions' | 'generating' | 'review' | 'editing' | 'preview';
  isPaidUser?: boolean;
  onUpgradeClick?: () => void;
  applicationId?: string; // ✅ Add applicationId prop
}

export function MyPetition({ 
  personalInfoDocs, 
  criteriaDocs, 
  metCriteriaCount, 
  initialStep = 'versions',
  isPaidUser = false,
  onUpgradeClick,
  applicationId // ✅ Receive applicationId
}: MyPetitionProps) {
  const [step, setStep] = useState<'versions' | 'generating' | 'review' | 'editing' | 'preview'>(initialStep);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLearnPanel, setShowLearnPanel] = useState(true);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);
  const [viewingDocumentsVersionId, setViewingDocumentsVersionId] = useState<string | null>(null);
  const [versionExhibits, setVersionExhibits] = useState<Record<string, UserExhibit[]>>({});
  const [isLoadingVersionDocs, setIsLoadingVersionDocs] = useState(false);
  const [versionDocsError, setVersionDocsError] = useState<string | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<string | null>(null); // ✅ Track which version is being deleted
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // ✅ Show custom delete confirmation modal
  const [versionToDelete, setVersionToDelete] = useState<PetitionVersion | null>(null); // ✅ Track version to delete
  
  // Documents state
  const [documents, setDocuments] = useState<Document[]>([...personalInfoDocs]);
  const [criteriaDocuments, setCriteriaDocuments] = useState(criteriaDocs);
  
  // Generation state
  const [generationStartTime, setGenerationStartTime] = useState<Date | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // ✅ New state for backend exhibit management
  const [suggestedExhibits, setSuggestedExhibits] = useState<UserExhibit[]>([]);
  const [isLoadingExhibits, setIsLoadingExhibits] = useState(false);
  const [exhibitsError, setExhibitsError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Set when we land on versions right after generating; used to show success message
  const [justGeneratedVersionId, setJustGeneratedVersionId] = useState<string | null>(null);

  // Stuck/failed runs (generation started but no document saved) and last generation error
  const [generationError, setGenerationError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  
  // ✅ Use React Query to fetch petition documents from backend (using petitionService)
  const { data: petitionDocs, isLoading: isLoadingVersions, isError: versionsQueryError, error: versionsQueryErr } = useQuery({
    queryKey: queryKeys.petitionDocuments(applicationId!),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user || !applicationId) return [];
      return fetchUserPetitionDocuments(applicationId, user.id);
    },
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000,   // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,     // 10 minutes - keep in cache for 10 min
    placeholderData: (previousData) => previousData, // ✅ Show cached data immediately
  });

  // ✅ NEW: Query petition runs using direct Supabase service
  const { data: petitionRuns } = useQuery({
    queryKey: ['petitionRuns', applicationId],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user || !applicationId) return [];
      return fetchPetitionRuns(applicationId, user.id);
    },
    enabled: !!applicationId && step === 'versions',
    staleTime: 5 * 60 * 1000,   // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,     // 10 minutes - keep in cache for 10 min
    placeholderData: (previousData) => previousData, // ✅ Show cached data immediately
  });

  // 🔍 DEBUG: Log raw petition docs data
  useEffect(() => {
    if (petitionDocs) {
      console.log('🔍 RAW petitionDocs from Supabase:', {
        count: Array.isArray(petitionDocs) ? petitionDocs.length : 'NOT AN ARRAY',
        data: petitionDocs
      });
    }
  }, [petitionDocs]);

  // 🔍 DEBUG: Log raw petition runs data
  useEffect(() => {
    if (petitionRuns) {
      console.log('🔍 RAW petitionRuns from Supabase:', {
        count: Array.isArray(petitionRuns) ? petitionRuns.length : 'NOT AN ARRAY',
        statusBreakdown: Array.isArray(petitionRuns) 
          ? petitionRuns.reduce((acc: any, run: any) => {
              acc[run.status] = (acc[run.status] || 0) + 1;
              return acc;
            }, {})
          : 'N/A',
        data: petitionRuns
      });
    }
  }, [petitionRuns]);

  const versions: PetitionVersion[] = useMemo(() => {
    if (!petitionDocs || !Array.isArray(petitionDocs)) return [];
    
    // Filter to only 'ready' documents
    const readyDocs = petitionDocs.filter((d) => d.status === 'ready');
    
    // Separate petition and cover letter documents
    const petitionDocuments = readyDocs.filter((d) => d.document_type === 'petition');
    const coverLetterDocs = readyDocs.filter((d) => d.document_type === 'cover_letter');
    
    // Map cover letters by run_id for easy lookup
    const runIdToCoverLetterId: Record<string, string> = {};
    coverLetterDocs.forEach((d) => {
      runIdToCoverLetterId[d.run_id] = d.id;
    });
    
    // Convert to PetitionVersion format
    return petitionDocuments.map((d, idx) => ({
      id: d.id,
      version: idx + 1,
      type: 'ai_generated' as const,
      generatedAt: new Date(d.created_at),
      title: `Petition v${idx + 1}`, // ✅ Use simple "Petition v1", "Petition v2" naming
      status: 'ready' as const,
      runId: d.run_id,
      runIds: [d.run_id],
      generatedDocumentId: d.id,
      coverLetterDocumentId: runIdToCoverLetterId[d.run_id],
    }));
  }, [petitionDocs]);

  const versionsError = versionsQueryError && versionsQueryErr ? (versionsQueryErr instanceof Error ? versionsQueryErr.message : 'Failed to load petition versions') : null;

  // When versions load, select the latest if none selected
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[versions.length - 1].id);
    }
    if (versions.length === 0) setSelectedVersion(null);
  }, [versions, selectedVersion]);

  // Timer for generation
  useEffect(() => {
    if (step === 'generating' && generationStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - generationStartTime.getTime()) / 60000);
        setElapsedMinutes(diff);
        
        // Progress bar logic
        if (diff < 20) {
          setProgress((diff / 20) * 100);
        } else {
          setProgress(95); // Stop at 95% after 20 min
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [step, generationStartTime]);

  // Auto-dismiss "just generated" banner after a short delay
  useEffect(() => {
    if (!justGeneratedVersionId) return;
    const t = setTimeout(() => setJustGeneratedVersionId(null), 6000);
    return () => clearTimeout(t);
  }, [justGeneratedVersionId]);

  // ✅ NEW: Compute stuck/failed runs from petitionRuns instead of fetching separately
  const stuckOrFailedRuns = useMemo(() => {
    if (!petitionRuns || !Array.isArray(petitionRuns)) return [];
    // Filter runs that are not completed (stuck in generating or failed)
    return petitionRuns
      .filter(run => run.status !== 'completed')
      .map(r => ({ id: r.id, status: r.status, created_at: r.created_at }));
  }, [petitionRuns]);

  const handleToggleDocument = (docId: string, isCriteria: boolean, criteriaId?: string) => {
    if (isCriteria && criteriaId) {
      setCriteriaDocuments(prev => 
        prev.map(cd => 
          cd.criteriaId === criteriaId 
            ? {
                ...cd,
                docs: cd.docs.map(doc => 
                  doc.id === docId ? { ...doc, included: !doc.included } : doc
                )
              }
            : cd
        )
      );
    } else {
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === docId ? { ...doc, included: !doc.included } : doc
        )
      );
    }
  };

  const handleGenerate = () => {
    setGenerationStartTime(new Date());
    setElapsedMinutes(0);
    setProgress(0);
    setStep('generating');
    
    // Simulate completion after 3 seconds for demo
    setTimeout(() => {
      const newVersion: PetitionVersion = {
        id: Date.now().toString(),
        version: versions.length + 1,
        type: 'ai_generated',
        generatedAt: new Date(),
        title: `AI Generation ${versions.length + 1}`,
        status: 'ready',
        sectionDocuments: {
          'Introduction & Background': ['doc1', 'doc2'],
          'Awards for Excellence': ['doc3', 'doc4'],
          'Published Material': ['doc5', 'doc6', 'doc7'],
          'Judging the Work of Others': ['doc8', 'doc9'],
          'Original Contributions': ['doc10', 'doc11', 'doc12'],
          'Conclusion': ['doc13']
        }
      };
      setStep('versions');
    }, 3000);
  };

  const handleConfirmAndGenerate = async ({
    runId,
    exhibitIds,
    criteriaIds,
  }: {
    runId: string;
    exhibitIds: string[];
    criteriaIds: string[];
  }) => {
    setGenerationError(null);
    setGenerationStartTime(new Date());
    setElapsedMinutes(0);
    setProgress(0);
    setStep('generating');

    try {
      // Draft every confirmed exhibit section.
      for (const exhibitId of exhibitIds) {
        await draftPetitionSection(exhibitId);
      }

      // Synthesize intro/conclusion for each criteria in this run.
      for (const criteriaId of criteriaIds) {
        await synthesizeSectionConclusion(runId, criteriaId);
      }

      // Build and persist the final full Word document now.
      const generatedDoc = await generateFinalDocument(
        [runId],
        applicationId,
        `AI Generation ${versions.length + 1}`
      );

      if (applicationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.petitionDocuments(applicationId) });
        queryClient.invalidateQueries({ queryKey: ['petitionRuns', applicationId] }); // ✅ Also invalidate petition runs
      }
      setProgress(100);
      setJustGeneratedVersionId(generatedDoc.document_id);
      setStep('versions');
      setSelectedVersion(generatedDoc.document_id);
    } catch (e: any) {
      console.error('❌ Confirm & Generate pipeline failed:', e);
      const message = e?.message || (typeof e?.detail === 'string' ? e.detail : 'Unknown error');
      setGenerationError(message);
      toast.error(`Generation failed: ${message}`);
      setStep('review');
    }
  };

  const handleUploadVersion = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Upload adds a user_uploaded version; list is from API - invalidate to refetch if backend supports it
      if (applicationId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.petitionDocuments(applicationId) });
      }
    }
  };

  const handleDownload = async (version: PetitionVersion) => {
    if (version.generatedDocumentId) {
      try {
        console.log('📥 Downloading petition document:', version.generatedDocumentId);
        
        // ✅ Use backend API download (secure - uses service role key)
        const blob = await downloadPetitionDocument(version.generatedDocumentId);
        
        console.log('✅ Downloaded blob:', {
          size: blob.size,
          type: blob.type,
        });
        
        // Verify blob is not empty
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Petition_v${version.version}.docx`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up after a short delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);
        
        toast.success('Petition downloaded successfully');
        return;
      } catch (error: any) {
        console.error('❌ Failed to download petition document:', error);
        toast.error(`Failed to download petition: ${error?.message || 'Unknown error'}`);
        return;
      }
    }

    // Fallback to old method if no generatedDocumentId
    const idsToDownload = version.runIds || (version.runId ? [version.runId] : []);
    if (idsToDownload.length === 0) {
      toast.error('No generation data found for this version.');
      return;
    }

    try {
      const blob = await downloadPetitionSection(idsToDownload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Petition_v${version.version}.docx`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success('Petition downloaded successfully');
    } catch (error: any) {
      console.error('❌ Failed to download petition:', error);
      toast.error(`Failed to download petition: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleDownloadCoverLetter = async (documentId: string) => {
    try {
      console.log('📥 Downloading cover letter:', documentId);
      
      // ✅ Use backend API download (secure - uses service role key)
      const blob = await downloadPetitionDocument(documentId);
      
      console.log('✅ Downloaded blob:', {
        size: blob.size,
        type: blob.type,
      });
      
      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Cover_Letter.docx';
      document.body.appendChild(a);
      a.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast.success('Cover letter downloaded successfully');
    } catch (error: any) {
      console.error('❌ Failed to download cover letter:', error);
      toast.error(`Failed to download cover letter: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleViewDocuments = async (version: PetitionVersion) => {
    setViewingDocumentsVersionId(version.id);
    setVersionDocsError(null);

    if (!applicationId || !version.runId || versionExhibits[version.id]) {
      return;
    }

    try {
      setIsLoadingVersionDocs(true);
      const exhibits = await fetchUserExhibits(applicationId, false, version.runId);
      setVersionExhibits((prev) => ({ ...prev, [version.id]: exhibits }));
    } catch (error: any) {
      console.error('Failed to load version documents:', error);
      setVersionDocsError(error?.message || 'Failed to load documents for this version.');
    } finally {
      setIsLoadingVersionDocs(false);
    }
  };

  const handleDeletePetition = async (version: PetitionVersion) => {
    if (!version.runId || !applicationId) {
      toast.error('Cannot delete: missing run ID or application ID');
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      toast.loading('Deleting petition...', { id: 'delete-petition' });

      // Call the delete function
      await deletePetitionByRunId(version.runId, user.id);

      // Refresh the queries with refetchType: 'all' to force refetch
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.petitionDocuments(applicationId),
          refetchType: 'all' 
        }),
        queryClient.invalidateQueries({ 
          queryKey: ['petitionRuns', applicationId],
          refetchType: 'all' 
        })
      ]);

      // Wait a bit for the invalidation to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      toast.success('Petition deleted successfully', { id: 'delete-petition' });

      // If the deleted version was selected, clear selection
      if (selectedVersion === version.id) {
        setSelectedVersion(null);
      }
    } catch (error: any) {
      console.error('❌ Failed to delete petition:', error);
      toast.error(`Failed to delete petition: ${error?.message || 'Unknown error'}`, { 
        id: 'delete-petition' 
      });
    }
  };

  const getIncludedCount = () => {
    const basicCount = documents.filter(d => d.included).length;
    const criteriaCount = criteriaDocuments.reduce((sum, cd) => 
      sum + cd.docs.filter(d => d.included).length, 0
    );
    return basicCount + criteriaCount;
  };

  const getTotalCount = () => {
    return documents.length + criteriaDocuments.reduce((sum, cd) => sum + cd.docs.length, 0);
  };

  if (step === 'generating') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-serif-display)' }}>
              Generating Your Petition Letter
            </h2>
            <p className="text-gray-600">
              {elapsedMinutes < 20 
                ? `Come back in about ${20 - elapsedMinutes} minutes`
                : "We're just wrapping things up..."}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{elapsedMinutes} min elapsed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>Analyzing your documents and achievements</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span>Mapping evidence to requirements</span>
            </div>
            <div className="flex items-center gap-3">
              {progress >= 60 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-primary flex-shrink-0 animate-spin" />
              )}
              <span>Crafting persuasive arguments</span>
            </div>
            <div className="flex items-center gap-3">
              {progress >= 90 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <span>Finalizing your petition letter</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> You'll receive an email notification when your petition letter is ready. 
              Feel free to close this page and return later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'versions') {
    const currentVersion = versions.find(v => v.id === selectedVersion);
    const justGeneratedVersion = justGeneratedVersionId
      ? versions.find(v => v.id === justGeneratedVersionId)
      : null;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-0">
        <div className="flex flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Petition Letter</h1>
              <p className="text-sm text-gray-500">
                Manage and review all versions of your petition letter
              </p>
            </div>

            {/* Success banner when we just finished generating */}
            {justGeneratedVersion && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    Your petition is ready — {justGeneratedVersion.title} has been saved. Download or review below.
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:bg-green-100 shrink-0"
                  onClick={() => setJustGeneratedVersionId(null)}
                >
                  Dismiss
                </Button>
              </motion.div>
            )}

            {/* Stuck or failed generation banner */}
            {stuckOrFailedRuns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="text-sm font-medium">
                    {stuckOrFailedRuns.length === 1
                      ? stuckOrFailedRuns[0].status === 'failed'
                        ? 'A previous generation failed and no document was saved.'
                        : 'A previous generation did not complete.'
                      : `${stuckOrFailedRuns.length} previous generations did not complete or failed.`}{' '}
                    Click &quot;Try again&quot; to start a new generation.
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0"
                  onClick={() => {
                    setGenerationError(null);
                    setStep('review');
                  }}
                >
                  Try again
                </Button>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <Button 
                onClick={() => {
                  setGenerationError(null);
                  setStep('review');
                }}
                className="bg-primary hover:bg-primary/90 gap-2 justify-center"
              >
                <Sparkles className="w-4 h-4" />
                <span className="truncate">Generate New Version</span>
              </Button>
            </div>

            {/* Versions List */}
            {isLoadingVersions && (
              <div className="py-8 text-center text-gray-500">Loading petition versions…</div>
            )}
            {versionsError && (
              <div className="py-4 px-4 rounded-lg bg-red-50 text-red-700 text-sm">{versionsError}</div>
            )}
            {!isLoadingVersions && versions.length === 0 && !versionsError && (
              <div className="py-8 text-center text-gray-500">
                No generated petition yet. Click &quot;Generate New Version&quot; to create your first version.
              </div>
            )}
            <div className="space-y-3">
              {versions.map((version) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-lg border-2 transition-all cursor-pointer ${
                    selectedVersion === version.id
                      ? 'border-primary shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          version.type === 'ai_generated'
                            ? 'bg-purple-100'
                            : version.type === 'edited'
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}>
                          {version.type === 'ai_generated' ? (
                            <Sparkles className="w-5 h-5 text-purple-600" />
                          ) : version.type === 'edited' ? (
                            <Edit3 className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Upload className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{version.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                              version.type === 'ai_generated'
                                ? 'bg-purple-100 text-purple-700'
                                : version.type === 'edited'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {version.type === 'ai_generated'
                                ? 'AI Generated'
                                : version.type === 'edited'
                                ? 'Edited'
                                : 'User Uploaded'}
                            </span>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              Ver {version.version} • {version.generatedAt.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
                        {/* Edit button hidden per user request */}
                        {/* <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1 sm:gap-2 flex-1 sm:flex-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVersionId(version.id);
                            setStep('editing');
                          }}
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button> */}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1 sm:gap-2 flex-1 sm:flex-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(version);
                          }}
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                        {version.coverLetterDocumentId && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-1 sm:gap-2 flex-1 sm:flex-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadCoverLetter(version.coverLetterDocumentId!);
                            }}
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Cover letter</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete
                            setVersionToDelete(version);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {version.type === 'ai_generated' && version.runId && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {versionExhibits[version.id]
                              ? `Used ${versionExhibits[version.id].reduce((sum, exhibit) => sum + exhibit.items.length, 0)} supporting files across ${versionExhibits[version.id].length} exhibits`
                              : 'View supporting exhibits and files used in this version'}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-primary hover:text-primary/80 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleViewDocuments(version);
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Documents
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Always visible, only content toggles */}
          <aside className="w-80 bg-gray-50/50 border-l border-gray-200/60 flex-shrink-0 p-5 overflow-auto hidden lg:block">
            {/* Toggle Button */}
            <button
              onClick={() => setShowLearnPanel(!showLearnPanel)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-md transition-colors mb-3"
            >
              <span className="flex items-center gap-2">
                <Info size={14} />
                Helpful Information
              </span>
              <ChevronDown
                size={14}
                className={`transform transition-transform ${showLearnPanel ? 'rotate-180' : ''}`}
              />
            </button>

            {showLearnPanel && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Reminder Card */}
                <div className="bg-white/60 rounded-md p-3 border border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <AlertCircle size={14} className="text-amber-600" />
                    Always Review Before Use
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Please carefully review and revise the AI-generated petition letter to ensure it accurately 
                    covers all your achievements and provides strong reasoning for your personal accomplishments.
                  </p>
                </div>

                {/* Professional Review Upgrade */}
                <div className="bg-white/60 rounded-md p-3 border border-gray-100">
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <Sparkles size={14} className="text-indigo-600" />
                      Professional Review
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">
                      Have our immigration experts review your petition letter for completeness, 
                      legal accuracy, and persuasiveness.
                    </p>
                    <div className="space-y-1.5 mb-3">
                      <div className="text-xs text-gray-700 border-l-2 border-indigo-400 pl-2">
                        <strong>Expert review within 48 hours</strong>
                      </div>
                      <div className="text-xs text-gray-700 border-l-2 border-indigo-400 pl-2">
                        <strong>Detailed feedback & suggestions</strong>
                      </div>
                      <div className="text-xs text-gray-700 border-l-2 border-indigo-400 pl-2">
                        <strong>One round of revisions included</strong>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs h-8"
                    size="sm"
                  >
                    <span className="truncate">Upgrade for $499</span>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                  </Button>
                </div>
              </div>
            )}

            {/* Subtle helper text when collapsed */}
            {!showLearnPanel && (
              <div className="px-3 py-2">
                <p className="text-xs text-gray-400 italic">
                  Click above for helpful information
                </p>
              </div>
            )}
          </aside>
        </div>

        {/* Document View Modal */}
        <AnimatePresence>
          {viewingDocumentsVersionId && (() => {
            const viewingVersion = versions.find(v => v.id === viewingDocumentsVersionId);
            if (!viewingVersion) return null;
            const exhibitsForVersion = versionExhibits[viewingVersion.id] || [];
            const totalFiles = exhibitsForVersion.reduce((sum, ex) => sum + ex.items.length, 0);
            const getCriteriaLabel = (criteriaId: string) =>
              CRITERIA.find(c => c.id === criteriaId)?.name || criteriaId;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setViewingDocumentsVersionId(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Documents Used</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {viewingVersion.title} • {totalFiles} {totalFiles === 1 ? 'file' : 'files'}
                      </p>
                    </div>
                    <button
                      onClick={() => setViewingDocumentsVersionId(null)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                    <div className="space-y-4">
                      {isLoadingVersionDocs && exhibitsForVersion.length === 0 && (
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading exhibits and files...
                        </div>
                      )}
                      {versionDocsError && (
                        <div className="text-sm text-red-600">{versionDocsError}</div>
                      )}
                      {!isLoadingVersionDocs && !versionDocsError && exhibitsForVersion.length === 0 && (
                        <div className="text-sm text-gray-500">
                          No exhibit-file mapping found for this version yet.
                        </div>
                      )}
                      {exhibitsForVersion
                        .slice()
                        .sort((a, b) => a.exhibit_number - b.exhibit_number)
                        .map((exhibit) => (
                          <div key={exhibit.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-primary/10 to-purple-50 px-4 py-3 border-b border-gray-200">
                              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                {`Exhibit ${exhibit.exhibit_number}: ${exhibit.title}`}
                              </h3>
                              <p className="text-xs text-gray-600 mt-1">
                                {getCriteriaLabel(exhibit.criteria_id)} • {exhibit.items.length} {exhibit.items.length === 1 ? 'file' : 'files'}
                              </p>
                            </div>
                            <div className="bg-white divide-y divide-gray-100">
                              {exhibit.items.map((item, index) => (
                                <div
                                  key={`${exhibit.id}-${item.item_suffix}-${index}`}
                                  className="px-4 py-3 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="text-sm text-gray-900">
                                    {item.file_name || item.content_title || `Supporting document ${item.item_suffix}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && versionToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon */}
                <div className="pt-6 px-6 pb-4 text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Petition?</h2>
                  <p className="text-sm text-gray-600 mb-1">
                    {versionToDelete.title}
                  </p>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-900">
                      This will permanently remove both the petition and cover letter documents from the database and storage. This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-end gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => {
                        void handleDeletePetition(versionToDelete);
                        setShowDeleteConfirm(false);
                      }}
                    >
                      Delete Petition
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (step === 'editing') {
    const currentVersion = versions.find(v => v.id === editingVersionId);
    if (!currentVersion) return null;

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
        <PetitionEditor
          version={currentVersion}
          onSave={(updatedVersion) => {
            if (applicationId) {
              queryClient.invalidateQueries({ queryKey: queryKeys.petitionDocuments(applicationId) });
            }
            setStep('versions');
          }}
          onCancel={() => setStep('versions')}
          previewMode={false}
        />
      </div>
    );
  }

  if (step === 'preview') {
    const currentVersion = versions.find(v => v.id === previewVersionId);
    if (!currentVersion) return null;

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden">
        <PetitionEditor
          version={currentVersion}
          onCancel={() => setStep('versions')}
          onDownload={() => {
            handleDownload(currentVersion);
          }}
          onEdit={() => {
            setEditingVersionId(currentVersion.id);
            setStep('editing');
          }}
          previewMode={true}
        />
      </div>
    );
  }

  // Review/Generate New Step
  if (step === 'review') {
    // ✅ Use real applicationId from props, fallback to null if not provided
    if (!applicationId) {
      return (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Application Found</h2>
              <p className="text-gray-600 mb-4">
                Please create or select an application before generating a petition letter.
              </p>
              <Button onClick={() => setStep('versions')} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-0">
        {generationError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Previous generation failed</p>
              <p className="text-sm text-red-700 mt-1">{generationError}</p>
              <p className="text-xs text-red-600 mt-2">Review your exhibits below and click Confirm &amp; Generate to try again.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-700 hover:bg-red-100 shrink-0"
              onClick={() => setGenerationError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}
        <ExhibitReview
          applicationId={applicationId}
          onCancel={() => setStep('versions')}
          onConfirmAndGenerate={handleConfirmAndGenerate}
        />
      </div>
    );
  }

  // Default: versions view (should not reach here, but keeping old code as fallback)
  const needsMoreCriteria = metCriteriaCount < 3;
}