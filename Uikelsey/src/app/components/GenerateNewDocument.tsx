import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Folder,
  File,
  AlertCircle,
  Files,
  Plus,
  RotateCcw,
  Check,
  X,
  Eye
} from 'lucide-react';
import { Button } from './ui/button';
import { CRITERIA } from './CriteriaSidebar';

interface Document {
  id: string;
  name: string;
  category: string;
  size: number;
  included: boolean;
  uploadedAt?: Date; // For sorting by upload order
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

interface GenerateNewDocumentProps {
  personalDocs: Document[]; // Personal Information documents
  recommendationDocs: Document[]; // Recommendation Letters
  criteriaDocs: CriteriaWithEvidence[]; // Criteria with evidence items
  uncategorizedDocs?: Document[]; // Uncategorized documents that need manual mapping
  metCriteriaCount: number;
  onCancel: () => void;
  onGenerate: (
    selectedPersonalDocs: Document[], 
    selectedRecommendationDocs: Document[],
    selectedCriteriaDocs: CriteriaWithEvidence[]
  ) => void;
  isPaidUser?: boolean;
  onUpgradeClick?: () => void;
}

export function GenerateNewDocument({ 
  personalDocs, 
  recommendationDocs, 
  criteriaDocs, 
  uncategorizedDocs = [],
  metCriteriaCount, 
  onCancel,
  onGenerate,
  isPaidUser = false,
  onUpgradeClick
}: GenerateNewDocumentProps) {
  // State for categorized documents
  const [documents, setDocuments] = useState<Document[]>([...personalDocs]);
  const [recommendationDocuments, setRecommendationDocuments] = useState<Document[]>([...recommendationDocs]);
  const [criteriaDocuments, setCriteriaDocuments] = useState(criteriaDocs);
  
  // All uploaded files (never changes in count, but we track which are categorized)
  const [allUploadedFiles] = useState<Document[]>(() => {
    const allFiles: Document[] = [];
    const seenIds = new Set<string>();
    
    const addUniqueFile = (doc: Document) => {
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        allFiles.push(doc);
      }
    };
    
    // Collect all unique files from initial props
    personalDocs.forEach(doc => addUniqueFile(doc));
    recommendationDocs.forEach(doc => addUniqueFile(doc));
    criteriaDocs.forEach(cd => {
      cd.evidenceItems.forEach(ei => {
        ei.materials.forEach(doc => addUniqueFile(doc));
      });
    });
    uncategorizedDocs.forEach(doc => addUniqueFile(doc));
    
    // Sort by upload date if available
    return allFiles.sort((a, b) => {
      if (a.uploadedAt && b.uploadedAt) {
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      }
      return 0;
    });
  });
  
  // Track which files are system-flagged as uncategorizable
  const [uncategorizableFileIds] = useState<Set<string>>(
    new Set(uncategorizedDocs.map(d => d.id))
  );
  
  // Drag state
  const [draggedItem, setDraggedItem] = useState<{
    type: 'personal' | 'recommendation' | 'criteria' | 'library';
    docId: string;
    doc: Document;
    sourceLocation: { criteriaId?: string; evidenceItemId?: string };
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  
  // Collapse state for criteria sections
  const [collapsedCriteria, setCollapsedCriteria] = useState<Set<string>>(new Set());
  const [collapsedEvidence, setCollapsedEvidence] = useState<Set<string>>(new Set());

  // Track if user has made any changes to classification
  const [hasUserModifications, setHasUserModifications] = useState(false);

  // Store initial state for reset functionality
  const [initialDocuments] = useState<Document[]>([...personalDocs]);
  const [initialRecommendationDocuments] = useState<Document[]>([...recommendationDocs]);
  const [initialCriteriaDocuments] = useState(criteriaDocs);
  
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Preview modal state
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  // Check if a file is in any category
  const isFileInCategory = (docId: string): boolean => {
    const inPersonal = documents.some(d => d.id === docId);
    const inRecommendation = recommendationDocuments.some(d => d.id === docId);
    const inCriteria = criteriaDocuments.some(cd => 
      cd.evidenceItems.some(ei => ei.materials.some(d => d.id === docId))
    );
    return inPersonal || inRecommendation || inCriteria;
  };

  // Check if file is system-flagged as uncategorizable
  const isFileUncategorizable = (docId: string): boolean => {
    return uncategorizableFileIds.has(docId);
  };

  // Count categorized files (unique files that are in at least one category)
  const getCategorizedCount = () => {
    return allUploadedFiles.filter(file => isFileInCategory(file.id)).length;
  };

  // Count total evidence categories that have files
  const getTotalEvidenceCategories = () => {
    let count = 0;
    if (documents.length > 0) count++;
    if (recommendationDocuments.length > 0) count++;
    criteriaDocuments.forEach(cd => {
      cd.evidenceItems.forEach(ei => {
        if (ei.materials.length > 0) count++;
      });
    });
    return count;
  };

  // Count uncategorized files
  const getUncategorizedCount = () => {
    return allUploadedFiles.filter(file => !isFileInCategory(file.id)).length;
  };

  // Drag handlers
  const handleDragStart = (
    e: React.DragEvent, 
    type: 'personal' | 'recommendation' | 'criteria' | 'library',
    doc: Document,
    criteriaId?: string,
    evidenceItemId?: string
  ) => {
    setDraggedItem({ type, docId: doc.id, doc, sourceLocation: { criteriaId, evidenceItemId } });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(targetId);
  };

  const handleDragLeave = () => {
    setDragOverTarget(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    targetType: 'personal' | 'recommendation' | 'criteria' | 'allfiles',
    criteriaId?: string,
    evidenceItemId?: string
  ) => {
    e.preventDefault();
    setDragOverTarget(null);

    if (!draggedItem) return;

    // Mark that user has made modifications
    setHasUserModifications(true);

    // Track if the file was uncategorized before dragging
    const wasUncategorized = isFileUncategorizable(draggedItem.docId);

    // Special case: dropping to 'allfiles' means removing from all categories
    if (targetType === 'allfiles') {
      // Remove from all categories
      if (draggedItem.type === 'personal') {
        setDocuments(prev => prev.filter(d => d.id !== draggedItem.docId));
      } else if (draggedItem.type === 'recommendation') {
        setRecommendationDocuments(prev => prev.filter(d => d.id !== draggedItem.docId));
      } else if (draggedItem.type === 'criteria' && draggedItem.sourceLocation.criteriaId && draggedItem.sourceLocation.evidenceItemId) {
        setCriteriaDocuments(prev => prev.map(cd => 
          cd.criteriaId === draggedItem.sourceLocation.criteriaId
            ? {
                ...cd,
                evidenceItems: cd.evidenceItems.map(ei => 
                  ei.id === draggedItem.sourceLocation.evidenceItemId
                    ? { ...ei, materials: ei.materials.filter(d => d.id !== draggedItem.docId) }
                    : ei
                )
              }
            : cd
        ));
      }
      setDraggedItem(null);
      return;
    }

    // If dragging from library, just add to target (don't remove from source)
    if (draggedItem.type === 'library') {
      if (targetType === 'personal') {
        // Check if already exists
        if (!documents.some(d => d.id === draggedItem.docId)) {
          setDocuments(prev => [...prev, { ...draggedItem.doc, category: 'Personal Information' }]);
        }
      } else if (targetType === 'recommendation') {
        if (!recommendationDocuments.some(d => d.id === draggedItem.docId)) {
          setRecommendationDocuments(prev => [...prev, { ...draggedItem.doc, category: 'Recommendation Letters' }]);
        }
      } else if (targetType === 'criteria' && criteriaId && evidenceItemId) {
        const criteriaInfo = CRITERIA.find(c => c.id === criteriaId);
        setCriteriaDocuments(prev => prev.map(cd => 
          cd.criteriaId === criteriaId
            ? {
                ...cd,
                evidenceItems: cd.evidenceItems.map(ei => 
                  ei.id === evidenceItemId && !ei.materials.some(d => d.id === draggedItem.docId)
                    ? { ...ei, materials: [...ei.materials, { ...draggedItem.doc, category: criteriaInfo?.name || 'Unknown' }] }
                    : ei
                )
              }
            : cd
        ));
      }
      
      // Files are always in the allUploadedFiles list, we don't need to track uncategorized separately
    } else {
      // Moving between categories - remove from source and add to target
      // First, remove from source
      if (draggedItem.type === 'personal') {
        setDocuments(prev => prev.filter(d => d.id !== draggedItem.docId));
      } else if (draggedItem.type === 'recommendation') {
        setRecommendationDocuments(prev => prev.filter(d => d.id !== draggedItem.docId));
      } else if (draggedItem.type === 'criteria' && draggedItem.sourceLocation.criteriaId && draggedItem.sourceLocation.evidenceItemId) {
        setCriteriaDocuments(prev => prev.map(cd => 
          cd.criteriaId === draggedItem.sourceLocation.criteriaId
            ? {
                ...cd,
                evidenceItems: cd.evidenceItems.map(ei => 
                  ei.id === draggedItem.sourceLocation.evidenceItemId
                    ? { ...ei, materials: ei.materials.filter(d => d.id !== draggedItem.docId) }
                    : ei
                )
              }
            : cd
        ));
      }

      // Then, add to target
      if (targetType === 'personal') {
        if (!documents.some(d => d.id === draggedItem.docId)) {
          setDocuments(prev => [...prev, { ...draggedItem.doc, category: 'Personal Information' }]);
        }
      } else if (targetType === 'recommendation') {
        if (!recommendationDocuments.some(d => d.id === draggedItem.docId)) {
          setRecommendationDocuments(prev => [...prev, { ...draggedItem.doc, category: 'Recommendation Letters' }]);
        }
      } else if (targetType === 'criteria' && criteriaId && evidenceItemId) {
        const criteriaInfo = CRITERIA.find(c => c.id === criteriaId);
        setCriteriaDocuments(prev => prev.map(cd => 
          cd.criteriaId === criteriaId
            ? {
                ...cd,
                evidenceItems: cd.evidenceItems.map(ei => 
                  ei.id === evidenceItemId && !ei.materials.some(d => d.id === draggedItem.docId)
                    ? { ...ei, materials: [...ei.materials, { ...draggedItem.doc, category: criteriaInfo?.name || 'Unknown' }] }
                    : ei
                )
              }
            : cd
        ));
      }
    }

    setDraggedItem(null);
  };

  const toggleCriteria = (criteriaId: string) => {
    setCollapsedCriteria(prev => {
      const next = new Set(prev);
      if (next.has(criteriaId)) {
        next.delete(criteriaId);
      } else {
        next.add(criteriaId);
      }
      return next;
    });
  };

  const toggleEvidence = (evidenceId: string) => {
    setCollapsedEvidence(prev => {
      const next = new Set(prev);
      if (next.has(evidenceId)) {
        next.delete(evidenceId);
      } else {
        next.add(evidenceId);
      }
      return next;
    });
  };

  const handleAddEvidenceItem = (criteriaId: string) => {
    // Prompt user for the evidence category name
    const categoryName = prompt('Enter the name for this evidence category:');
    
    // If user cancels or enters empty string, don't create the category
    if (!categoryName || categoryName.trim() === '') {
      return;
    }

    const newEvidenceId = `evidence-${Date.now()}`;
    const newEvidenceItem: EvidenceItem = {
      id: newEvidenceId,
      title: categoryName.trim(),
      generatedByBackend: false,
      materials: []
    };

    setCriteriaDocuments(prev => prev.map(cd => 
      cd.criteriaId === criteriaId
        ? {
            ...cd,
            evidenceItems: [...cd.evidenceItems, newEvidenceItem]
          }
        : cd
    ));

    // Automatically expand the new evidence item
    setCollapsedEvidence(prev => {
      const next = new Set(prev);
      next.delete(newEvidenceId);
      return next;
    });
  };

  const handleGenerateClick = () => {
    onGenerate(documents, recommendationDocuments, criteriaDocuments);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all changes? This will restore the original AI classification.')) {
      setDocuments([...initialDocuments]);
      setRecommendationDocuments([...initialRecommendationDocuments]);
      setCriteriaDocuments(initialCriteriaDocuments);
      setHasUserModifications(false);
    }
  };

  // Remove file from specific category (same effect as dragging to All Files)
  const handleRemoveFile = (
    docId: string,
    type: 'personal' | 'recommendation' | 'criteria',
    criteriaId?: string,
    evidenceItemId?: string
  ) => {
    if (!window.confirm('Remove this file from this category?')) {
      return;
    }
    
    setHasUserModifications(true);
    
    if (type === 'personal') {
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } else if (type === 'recommendation') {
      setRecommendationDocuments(prev => prev.filter(d => d.id !== docId));
    } else if (type === 'criteria' && criteriaId && evidenceItemId) {
      setCriteriaDocuments(prev => prev.map(cd => 
        cd.criteriaId === criteriaId
          ? {
              ...cd,
              evidenceItems: cd.evidenceItems.map(ei => 
                ei.id === evidenceItemId
                  ? { ...ei, materials: ei.materials.filter(d => d.id !== docId) }
                  : ei
              )
            }
          : cd
      ));
    }
  };

  const uncategorizedCount = getUncategorizedCount();

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{getCategorizedCount()}</span> / {allUploadedFiles.length} categorized
            </div>
            
            {/* Free User Upgrade Prompt */}
            {!isPaidUser ? (
              <div className="flex items-center gap-3">
                <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <strong>Free Plan:</strong> Upgrade to generate
                </div>
                <Button
                  onClick={() => {
                    if (onUpgradeClick) {
                      onUpgradeClick();
                    } else {
                      alert('Please upgrade to Pro plan to generate petition letters.');
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade to Generate
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleGenerateClick}
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Petition
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Categories */}
        <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
          {/* Page Title and Subtitle */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Review Your Evidence Before Generation
            </h1>
            <p className="text-sm text-gray-600">
              Currently, <span className="font-semibold text-gray-900">{getCategorizedCount()}</span> {getCategorizedCount() === 1 ? 'document' : 'documents'} {getCategorizedCount() === 1 ? 'is' : 'are'} organized across <span className="font-semibold text-gray-900">{getTotalEvidenceCategories()}</span> evidence {getTotalEvidenceCategories() === 1 ? 'category' : 'categories'}.
            </p>
          </div>
          
          {/* Warning Banner for Uncategorized Files */}
          {uncategorizedCount > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-1">Action Required</h4>
                <p className="text-sm text-amber-800">
                  <strong>{uncategorizedCount} {uncategorizedCount === 1 ? 'file' : 'files'}</strong> not categorized. 
                  Drag files from the right panel into categories below.
                </p>
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div 
            className={`bg-white rounded-lg border-2 transition-all ${
              dragOverTarget === 'personal' 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200'
            }`}
            onDragOver={(e) => handleDragOver(e, 'personal')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'personal')}
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" />
                  Personal Information
                </h3>
                <span className="text-xs text-gray-500">{documents.length}</span>
              </div>
            </div>
            <div className="p-4 min-h-[80px]">
              {documents.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Drag files here
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'personal', doc)}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-white border-2 border-transparent hover:border-primary/30 hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 group"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                      <File className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-sm text-gray-700 flex-1 truncate group-hover:text-gray-900 font-medium transition-colors">{doc.name}</span>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDocument(doc);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Preview file"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(doc.id, 'personal');
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Remove from category"
                        >
                          <X className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommendation Letters */}
          <div 
            className={`bg-white rounded-lg border-2 transition-all ${
              dragOverTarget === 'recommendation' 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200'
            }`}
            onDragOver={(e) => handleDragOver(e, 'recommendation')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'recommendation')}
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" />
                  Recommendation Letters
                </h3>
                <span className="text-xs text-gray-500">{recommendationDocuments.length}</span>
              </div>
            </div>
            <div className="p-4 min-h-[80px]">
              {recommendationDocuments.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Drag files here
                </div>
              ) : (
                <div className="space-y-2">
                  {recommendationDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'recommendation', doc)}
                      className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-white border-2 border-transparent hover:border-primary/30 hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 group"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                      <File className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                      <span className="text-sm text-gray-700 flex-1 truncate group-hover:text-gray-900 font-medium transition-colors">{doc.name}</span>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDocument(doc);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Preview file"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(doc.id, 'recommendation');
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Remove from category"
                        >
                          <X className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Criteria */}
          <div className="bg-white rounded-lg border-2 border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Criteria Evidence
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {criteriaDocuments.map((cd) => {
                const criteria = CRITERIA.find(c => c.id === cd.criteriaId);
                if (!criteria) return null;
                
                const isCollapsed = collapsedCriteria.has(cd.criteriaId);

                return (
                  <div key={cd.criteriaId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Criterion Header */}
                    <div className="px-3 py-2 bg-green-50/50 border-b border-green-100">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleCriteria(cd.criteriaId)}
                          className="flex items-center gap-2 text-left flex-1"
                        >
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="text-sm font-semibold text-gray-900">{criteria.name}</span>
                        </button>
                        <span className="text-xs text-gray-500">
                          {cd.evidenceItems.reduce((sum, ei) => sum + ei.materials.length, 0)}
                        </span>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="p-3 space-y-2 bg-gray-50/30">
                        {cd.evidenceItems.map((ei) => {
                          const isEvidenceCollapsed = collapsedEvidence.has(ei.id);
                          const dropTargetId = `${cd.criteriaId}-${ei.id}`;

                          return (
                            <div key={ei.id} className="border border-gray-200 rounded overflow-hidden bg-white">
                              <button
                                onClick={() => toggleEvidence(ei.id)}
                                className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors text-left"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {isEvidenceCollapsed ? <ChevronRight className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
                                  <span className="text-xs font-medium text-gray-700 truncate">{ei.title}</span>
                                </div>
                                <span className="text-xs text-gray-500 ml-2">{ei.materials.length}</span>
                              </button>

                              {!isEvidenceCollapsed && (
                                <div
                                  className={`p-2 transition-all min-h-[60px] ${
                                    dragOverTarget === dropTargetId 
                                      ? 'bg-primary/5 border-t-2 border-primary' 
                                      : 'bg-white border-t border-gray-100'
                                  }`}
                                  onDragOver={(e) => handleDragOver(e, dropTargetId)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, 'criteria', cd.criteriaId, ei.id)}
                                >
                                  {ei.materials.length === 0 ? (
                                    <div className="text-center py-4 text-gray-400 text-xs">
                                      Drag files here
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {ei.materials.map((doc) => (
                                        <div
                                          key={doc.id}
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, 'criteria', doc, cd.criteriaId, ei.id)}
                                          className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-white border-2 border-transparent hover:border-primary/30 hover:shadow-md cursor-grab active:cursor-grabbing transition-all duration-200 group"
                                        >
                                          <GripVertical className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                                          <File className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                                          <span className="text-xs text-gray-700 flex-1 truncate group-hover:text-gray-900 font-medium transition-colors">{doc.name}</span>
                                          {/* Action Buttons */}
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewDocument(doc);
                                              }}
                                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                                              title="Preview file"
                                            >
                                              <Eye className="w-3.5 h-3.5 text-gray-600" />
                                            </button>
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFile(doc.id, 'criteria', cd.criteriaId, ei.id);
                                              }}
                                              className="p-1 hover:bg-red-100 rounded transition-colors"
                                              title="Remove from category"
                                            >
                                              <X className="w-3.5 h-3.5 text-red-600" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add New Evidence Item Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddEvidenceItem(cd.criteriaId);
                          }}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded flex items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all text-gray-600 hover:text-primary"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-xs font-medium">Add New Evidence Category</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - File Library */}
        <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Files className="w-4 h-4 text-primary" />
              All Files
            </h3>
            <p className="text-xs text-gray-500 mt-1">Drag files to categories</p>
          </div>
          <div 
            className={`flex-1 overflow-auto p-4 transition-all ${
              dragOverTarget === 'allfiles' ? 'bg-gray-100' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, 'allfiles')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'allfiles')}
          >
            <div className="space-y-2">
              {allUploadedFiles.map((doc) => {
                const isInCategory = isFileInCategory(doc.id);
                const isUncategorizable = isFileUncategorizable(doc.id);
                // Show as needing categorization if not in any category
                const needsCategorization = !isInCategory;
                
                return (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'library', doc)}
                    className={`flex items-center gap-2 p-3 rounded-lg cursor-move group transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                      isUncategorizable
                        ? 'bg-amber-50 border-2 border-amber-300 hover:border-amber-400 hover:shadow-md'
                        : isInCategory 
                          ? 'bg-green-50 border border-green-200 hover:border-green-300 hover:shadow-sm' 
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm'
                    } ${draggedItem?.docId === doc.id ? 'opacity-50' : ''}`}
                  >
                    <GripVertical className={`w-5 h-5 transition-all group-hover:opacity-100 ${
                      draggedItem?.docId === doc.id 
                        ? 'opacity-100 text-primary animate-pulse' 
                        : isUncategorizable 
                          ? 'opacity-70 text-amber-500 group-hover:text-amber-600' 
                          : isInCategory 
                            ? 'opacity-0 text-green-500 group-hover:text-green-600' 
                            : 'opacity-0 text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <File className={`w-5 h-5 ${
                      isUncategorizable ? 'text-amber-600' : isInCategory ? 'text-green-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        isUncategorizable 
                          ? 'text-amber-900 font-semibold' 
                          : isInCategory 
                            ? 'text-green-900 font-medium' 
                            : 'text-gray-700'
                      }`}>
                        {doc.name}
                      </p>
                      {isUncategorizable && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-xs text-amber-700 font-semibold">⚠️ Cannot classify</p>
                          <span className="text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">← Drag to categorize</span>
                        </div>
                      )}
                      {!isUncategorizable && isInCategory && (
                        <p className="text-xs text-green-600">✓ Categorized</p>
                      )}
                      {!isUncategorizable && needsCategorization && (
                        <p className="text-xs text-gray-500">Uncategorized</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Reset Button - Only show if user has made modifications */}
          {hasUserModifications && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={handleReset}
                className="w-full bg-gray-600 hover:bg-gray-700 gap-2"
                variant="default"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to AI Classification
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Restore original AI-generated classification
              </p>
            </div>
          )}

          {/* Confirm Classification Button - Always visible at bottom */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Button
              onClick={handleGenerateClick}
              className="w-full bg-green-600 hover:bg-green-700 gap-2"
              variant="default"
            >
              <Check className="w-4 h-4" />
              Confirm & Generate
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Proceed to generate petition with current classification
            </p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewDocument && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewDocument(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-gray-900">{previewDocument.name}</h3>
                  <p className="text-xs text-gray-500">{previewDocument.category}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDocument(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">File Preview</p>
                <p className="text-sm text-gray-500">
                  Preview functionality will be implemented with backend integration.
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>File: {previewDocument.name}</p>
                  <p>Size: {(previewDocument.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                onClick={() => setPreviewDocument(null)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}