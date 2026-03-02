import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  ArrowLeft,
  Loader2,
  Save,
  X,
  Folder,
  ChevronDown,
  ChevronRight,
  GripVertical,
  File,
  Sparkles,
  Plus
} from 'lucide-react';
import { Button } from './ui/button';
import { CRITERIA } from './CriteriaSidebar';
import { fetchUserExhibits, UserExhibit, ExhibitItem } from '../services/exhibitService';
import { confirmExhibits as confirmExhibitsApi } from '../../lib/backend';

const CRITERIA_CONFIRM_ORDER = [
  'personal_info',
  ...CRITERIA.map((c) => c.id),
  'recommendation',
  'future_work',
];

const criteriaOrderIndex = (criteriaId: string): number => {
  const idx = CRITERIA_CONFIRM_ORDER.indexOf(criteriaId);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

interface ExhibitReviewProps {
  applicationId: string;
  onCancel: () => void;
  onConfirmAndGenerate: (payload: { runId: string; exhibitIds: string[]; criteriaIds: string[] }) => Promise<void> | void;
}

export function ExhibitReview({
  applicationId,
  onCancel,
  onConfirmAndGenerate
}: ExhibitReviewProps) {
  // ✅ State management
  const [exhibits, setExhibits] = useState<UserExhibit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Editing state
  const [editingExhibitId, setEditingExhibitId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingSummary, setEditingSummary] = useState('');
  
  // Collapse state for criteria sections
  const [collapsedCriteria, setCollapsedCriteria] = useState<Set<string>>(new Set());
  const [collapsedExhibits, setCollapsedExhibits] = useState<Set<string>>(new Set());

  // Add new exhibit modal state
  const [isAddingExhibit, setIsAddingExhibit] = useState(false);
  const [newExhibitCriteriaId, setNewExhibitCriteriaId] = useState<string | null>(null);
  const [newExhibitTitle, setNewExhibitTitle] = useState('');

  // Delete confirmation modal state
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [exhibitToDelete, setExhibitToDelete] = useState<string | null>(null);

  // ✅ Load suggested exhibits on mount - using Supabase directly
  useEffect(() => {
    loadSuggestedExhibits();
  }, [applicationId]);

  const loadSuggestedExhibits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchUserExhibits(applicationId, true);
      console.log('📊 Loaded exhibits:', data);
      console.log('📊 Exhibits by criteria:', data.reduce((acc, ex) => {
        acc[ex.criteria_id] = (acc[ex.criteria_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      
      setExhibits(data);
      setIsLoading(false);
    } catch (e: any) {
      console.error('❌ Failed to load exhibits:', e);
      setError(e.message || 'Failed to load suggested exhibits');
      setIsLoading(false);
    }
  };

  // ✅ Edit handlers
  const handleStartEdit = (exhibit: UserExhibit) => {
    setEditingExhibitId(exhibit.id);
    setEditingTitle(exhibit.title);
    setEditingSummary(exhibit.summary || '');
  };

  const handleCancelEdit = () => {
    setEditingExhibitId(null);
    setEditingTitle('');
    setEditingSummary('');
  };

  const handleSaveEdit = (exhibitId: string) => {
    setExhibits(prev => prev.map(ex => 
      ex.id === exhibitId
        ? { ...ex, title: editingTitle, summary: editingSummary }
        : ex
    ));
    handleCancelEdit();
  };

  const handleDeleteExhibit = (exhibitId: string) => {
    setExhibitToDelete(exhibitId);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    if (exhibitToDelete) {
      setExhibits(prev => prev.filter(ex => ex.id !== exhibitToDelete));
    }
    setIsConfirmingDelete(false);
    setExhibitToDelete(null);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
    setExhibitToDelete(null);
  };

  const handleRemoveItem = (exhibitId: string, itemSuffix: string) => {
    setExhibits(prev => prev.map(ex => {
      if (ex.id !== exhibitId) return ex;
      const itemIndex = ex.items.findIndex(item => item.item_suffix === itemSuffix);
      if (itemIndex === -1) return ex;
      const nextItems = ex.items.filter((_, idx) => idx !== itemIndex);
      return { ...ex, items: renumberItems(nextItems) };
    }));
  };

  // ✅ Add new exhibit handlers
  const handleStartAddExhibit = (criteriaId: string) => {
    console.log('🆕 Opening modal to add exhibit for criteria:', criteriaId);
    setNewExhibitCriteriaId(criteriaId);
    setNewExhibitTitle('');
    setIsAddingExhibit(true);
  };

  const handleConfirmAddExhibit = () => {
    if (!newExhibitTitle.trim() || !newExhibitCriteriaId) {
      console.log('❌ Empty title or missing criteria');
      return;
    }

    const newExhibit: UserExhibit = {
      id: `new-exhibit-${Date.now()}`,
      criteria_id: newExhibitCriteriaId,
      title: newExhibitTitle.trim(),
      exhibit_number: 0,
      summary: null,
      created_at: new Date().toISOString(),
      items: []
    };

    console.log('✅ Creating new exhibit:', newExhibit);

    setExhibits(prev => [...prev, newExhibit]);
    
    // Auto-expand
    setCollapsedExhibits(prev => {
      const next = new Set(prev);
      next.delete(newExhibit.id);
      return next;
    });
    
    setCollapsedCriteria(prev => {
      const next = new Set(prev);
      next.delete(newExhibitCriteriaId);
      return next;
    });

    // Close modal
    setIsAddingExhibit(false);
    setNewExhibitTitle('');
    setNewExhibitCriteriaId(null);
    
    console.log('✅ New exhibit created');
  };

  const handleCancelAddExhibit = () => {
    setIsAddingExhibit(false);
    setNewExhibitTitle('');
    setNewExhibitCriteriaId(null);
  };

  // ✅ Drag and drop state for reordering
  const [draggedItem, setDraggedItem] = useState<{
    exhibitId: string;
    itemSuffix: string;
  } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{
    exhibitId: string;
    itemSuffix: string;
  } | null>(null);

  // ✅ Helper functions for item suffix management
  const indexToSuffix = (index: number) => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let n = index;
    let suffix = '';
    do {
      suffix = letters[n % 26] + suffix;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return suffix;
  };

  const renumberItems = (items: ExhibitItem[]) =>
    items.map((item, idx) => ({ ...item, item_suffix: indexToSuffix(idx) }));

  // ✅ Drag handlers for reordering items
  const handleItemDragStart = (e: React.DragEvent, exhibitId: string, itemSuffix: string) => {
    setDraggedItem({ exhibitId, itemSuffix });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragOver = (e: React.DragEvent, exhibitId: string, itemSuffix: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!draggedItem || 
        (draggedItem.exhibitId === exhibitId && draggedItem.itemSuffix === itemSuffix)) {
      return;
    }
    
    setDragOverItem({ exhibitId, itemSuffix });
  };

  const handleItemDragLeave = () => {
    setDragOverItem(null);
  };

  const handleItemDrop = (e: React.DragEvent, targetExhibitId: string, targetItemSuffix: string) => {
    e.preventDefault();
    setDragOverItem(null);

    if (!draggedItem) return;

    const sourceExhibitId = draggedItem.exhibitId;
    const sourceItemSuffix = draggedItem.itemSuffix;

    // If dropping in the same position, do nothing
    if (sourceExhibitId === targetExhibitId && sourceItemSuffix === targetItemSuffix) {
      setDraggedItem(null);
      return;
    }

    setExhibits(prev => {
      const newExhibits = [...prev];
      
      // Find source and target exhibits
      const sourceExhibit = newExhibits.find(ex => ex.id === sourceExhibitId);
      const targetExhibit = newExhibits.find(ex => ex.id === targetExhibitId);
      
      if (!sourceExhibit || !targetExhibit) return prev;

      // Find the dragged item
      const sourceItemIndex = sourceExhibit.items.findIndex(item => item.item_suffix === sourceItemSuffix);
      if (sourceItemIndex === -1) return prev;
      
      const draggedItemData = sourceExhibit.items[sourceItemIndex];

      // If moving within the same exhibit
      if (sourceExhibitId === targetExhibitId) {
        const targetItemIndex = sourceExhibit.items.findIndex(item => item.item_suffix === targetItemSuffix);
        if (targetItemIndex === -1) return prev;

        // Remove from old position
        const newItems = [...sourceExhibit.items];
        newItems.splice(sourceItemIndex, 1);
        
        // Insert at new position (adjust index if moving down)
        const insertIndex = sourceItemIndex < targetItemIndex ? targetItemIndex - 1 : targetItemIndex;
        newItems.splice(insertIndex, 0, draggedItemData);

        // Update exhibit with renumbered items
        return newExhibits.map(ex =>
          ex.id === sourceExhibitId ? { ...ex, items: renumberItems(newItems) } : ex
        );
      } else {
        // Moving between different exhibits
        const targetItemIndex = targetExhibit.items.findIndex(item => item.item_suffix === targetItemSuffix);
        
        // Remove from source
        const newSourceItems = sourceExhibit.items.filter((_, idx) => idx !== sourceItemIndex);
        
        // Add to target
        const newTargetItems = [...targetExhibit.items];
        const insertIndex = Math.min(Math.max(targetItemIndex, 0), newTargetItems.length);
        newTargetItems.splice(insertIndex, 0, draggedItemData);

        // Update both exhibits with renumbered items
        return newExhibits.map(ex => {
          if (ex.id === sourceExhibitId) return { ...ex, items: renumberItems(newSourceItems) };
          if (ex.id === targetExhibitId) return { ...ex, items: renumberItems(newTargetItems) };
          return ex;
        });
      }
    });

    setDraggedItem(null);
  };

  const handleItemDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // ✅ Confirm and generate
  const handleConfirmAndGenerate = async () => {
    setIsConfirming(true);
    setError(null);
    
    console.log('💾 Confirming and generating petition with exhibits...');
    
    try {
      // Group exhibits by criteria
      const exhibitsByCriteria = exhibits.reduce((acc, exhibit) => {
        if (!acc[exhibit.criteria_id]) {
          acc[exhibit.criteria_id] = [];
        }
        acc[exhibit.criteria_id].push(exhibit);
        return acc;
      }, {} as Record<string, UserExhibit[]>);

      // Start a NEW finalized run on each confirm/generate action.
      // This mirrors previous behavior and prevents numbering from continuing
      // on top of stale suggested-mapping runs.
      let effectiveRunId: string | undefined = undefined;
      const confirmedExhibitIds: string[] = [];
      const confirmedCriteriaIds: string[] = [];

      // Confirm each criterion in canonical order so section generation follows legacy ordering.
      const orderedCriteriaEntries = Object.entries(exhibitsByCriteria).sort(
        ([a], [b]) => criteriaOrderIndex(a) - criteriaOrderIndex(b)
      );

      // Confirm each criterion sequentially so we can reuse the returned run_id.
      for (const [criteriaId, criteriaExhibits] of orderedCriteriaEntries) {
        const payloadExhibits = criteriaExhibits.map(ex => ({
            title: ex.title,
            summary: ex.summary || '',
            doc_ids: ex.items.map(item => item.file_id || item.content_id).filter(Boolean) as string[]
          }));

        console.log(`📤 Confirming exhibits for criterion: ${criteriaId}`, {
          criteria_id: criteriaId,
          application_id: applicationId,
          run_id: effectiveRunId,
          exhibits: payloadExhibits
        });

        const result = await confirmExhibitsApi(
          criteriaId,
          payloadExhibits,
          effectiveRunId,
          applicationId
        );

        console.log(`✅ Confirmed exhibits for criterion ${criteriaId}:`, result);
        effectiveRunId = result.run_id || effectiveRunId;
        confirmedCriteriaIds.push(criteriaId);
        confirmedExhibitIds.push(...(result.exhibits || []).map(ex => ex.id));
      }
      
      console.log('✅ All exhibits confirmed successfully');

      if (!effectiveRunId) {
        throw new Error('No run_id returned from confirm-exhibits.');
      }
      
      setIsConfirming(false);
      await onConfirmAndGenerate({
        runId: effectiveRunId,
        exhibitIds: [...new Set(confirmedExhibitIds)],
        criteriaIds: [...new Set(confirmedCriteriaIds)],
      });
    } catch (e: any) {
      console.error('❌ Failed to confirm exhibits:', e);
      setError(e.message || 'Failed to confirm exhibits');
      setIsConfirming(false);
    }
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

  const toggleExhibit = (exhibitId: string) => {
    setCollapsedExhibits(prev => {
      const next = new Set(prev);
      if (next.has(exhibitId)) {
        next.delete(exhibitId);
      } else {
        next.add(exhibitId);
      }
      return next;
    });
  };

  // Group exhibits by criteria
  const exhibitsByCriteria = exhibits.reduce((acc, exhibit) => {
    // ✅ Skip personal_info - it's not part of the evidence review
    if (exhibit.criteria_id === 'personal_info') {
      return acc;
    }
    
    if (!acc[exhibit.criteria_id]) {
      acc[exhibit.criteria_id] = [];
    }
    acc[exhibit.criteria_id].push(exhibit);
    return acc;
  }, {} as Record<string, UserExhibit[]>);

  const totalExhibits = exhibits.length;
  const totalFiles = exhibits.reduce((sum, ex) => sum + ex.items.length, 0);

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
              <span className="font-semibold text-gray-900">{totalExhibits}</span> exhibits • 
              <span className="font-semibold text-gray-900 ml-1">{totalFiles}</span> files
            </div>
            
            <Button
              onClick={handleConfirmAndGenerate}
              disabled={isConfirming}
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Confirm & Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Suggested Exhibits
              </h3>
              <p className="text-sm text-gray-600">
                Fetching your evidence groupings...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">
                  Failed to Load Exhibits
                </h3>
                <p className="text-sm text-red-700 mb-3">
                  {error}
                </p>
                <Button
                  onClick={loadSuggestedExhibits}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && exhibits.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Exhibits Found
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                No suggested exhibits were found. Please make sure you have completed the Criteria Mapping step.
              </p>
              <Button onClick={onCancel} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        )}

        {/* Exhibits List */}
        {!isLoading && !error && exhibits.length > 0 && (
          <div className="max-w-5xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Review Suggested Exhibits
              </h1>
              <p className="text-sm text-gray-600">
                Review and edit the suggested exhibit groupings. You can modify titles, summaries, or remove files before confirming.
              </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  AI-Generated Exhibits
                </h4>
                <p className="text-sm text-blue-700">
                  These exhibits were automatically organized based on your criteria mappings. 
                  Review each exhibit and make any necessary adjustments.
                </p>
              </div>
            </div>

            {/* Criteria with Exhibits */}
            <div className="bg-white rounded-lg border-2 border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Exhibits by Criteria
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(exhibitsByCriteria).map(([criteriaId, criteriaExhibits]) => {
                  const criteria = CRITERIA.find(c => c.id === criteriaId);
                  // ✅ Show all criteria, even if not in standard CRITERIA list
                  const criteriaName = criteria?.name || criteriaId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                  
                  const isCollapsed = collapsedCriteria.has(criteriaId);

                  return (
                    <div key={criteriaId} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Criterion Header */}
                      <div className="px-3 py-2 bg-green-50/50 border-b border-green-100">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleCriteria(criteriaId)}
                            className="flex items-center gap-2 text-left flex-1"
                          >
                            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            <span className="text-sm font-semibold text-gray-900">{criteriaName}</span>
                          </button>
                          <span className="text-xs text-gray-500">
                            {criteriaExhibits.length} {criteriaExhibits.length === 1 ? 'exhibit' : 'exhibits'}
                          </span>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="p-3 space-y-2 bg-gray-50/30">
                          {criteriaExhibits.map((exhibit) => {
                            const isExhibitCollapsed = collapsedExhibits.has(exhibit.id);

                            return (
                              <div key={exhibit.id} className="border border-gray-200 rounded overflow-hidden bg-white">
                                {/* Exhibit Header */}
                                <button
                                  onClick={() => toggleExhibit(exhibit.id)}
                                  className="w-full px-3 py-2 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {isExhibitCollapsed ? <ChevronRight className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />}
                                    {editingExhibitId === exhibit.id ? (
                                      <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                          type="text"
                                          value={editingTitle}
                                          onChange={(e) => setEditingTitle(e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                          placeholder="Exhibit title"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium text-gray-700 truncate block">{exhibit.title}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-xs text-gray-500">{exhibit.items.length}</span>
                                    {editingExhibitId === exhibit.id ? (
                                      <>
                                        <button
                                          onClick={() => handleSaveEdit(exhibit.id)}
                                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                          title="Save changes"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                                          title="Cancel editing"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(exhibit);
                                          }}
                                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                          title="Edit exhibit"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteExhibit(exhibit.id);
                                          }}
                                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                          title="Delete exhibit"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </button>

                                {/* Exhibit Items */}
                                {!isExhibitCollapsed && (
                                  <div className="p-2 bg-white border-t border-gray-100">
                                    {exhibit.items.length === 0 ? (
                                      <div className="text-center py-4 text-gray-400 text-xs">
                                        No files in this exhibit
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        {exhibit.items.map((item) => {
                                          const isDragging = draggedItem?.exhibitId === exhibit.id && draggedItem?.itemSuffix === item.item_suffix;
                                          const isDragOver = dragOverItem?.exhibitId === exhibit.id && dragOverItem?.itemSuffix === item.item_suffix;
                                          
                                          return (
                                            <div
                                              key={item.item_suffix}
                                              className={`flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-white border-2 transition-all group cursor-grab active:cursor-grabbing ${
                                                isDragging ? 'opacity-50 border-primary' : 
                                                isDragOver ? 'border-primary bg-primary/5' :
                                                'border-transparent hover:border-gray-200'
                                              }`}
                                              draggable
                                              onDragStart={(e) => handleItemDragStart(e, exhibit.id, item.item_suffix)}
                                              onDragOver={(e) => handleItemDragOver(e, exhibit.id, item.item_suffix)}
                                              onDragLeave={handleItemDragLeave}
                                              onDrop={(e) => handleItemDrop(e, exhibit.id, item.item_suffix)}
                                              onDragEnd={handleItemDragEnd}
                                            >
                                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                <GripVertical className={`w-3.5 h-3.5 text-gray-400 transition-opacity ${
                                                  isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                }`} />
                                                <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors">
                                                  {item.item_suffix}
                                                </div>
                                                <File className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                                                <span className="text-xs text-gray-700 truncate group-hover:text-gray-900 font-medium transition-colors">
                                                  {item.file_name || item.content_title || 'Unnamed item'}
                                                </span>
                                              </div>
                                              {/* Action Button */}
                                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                  onClick={() => handleRemoveItem(exhibit.id, item.item_suffix)}
                                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                                  title="Remove from exhibit"
                                                >
                                                  <X className="w-3.5 h-3.5 text-red-600" />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {/* Add New Exhibit Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔘 Button clicked for criteria:', criteriaId);
                              handleStartAddExhibit(criteriaId);
                            }}
                            className="w-full px-3 py-2 bg-white border-2 border-dashed border-gray-300 rounded flex items-center gap-2 hover:bg-gray-50 hover:border-primary transition-colors text-left"
                          >
                            <Plus className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-gray-700">Add New Exhibit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add New Exhibit Modal */}
      {isAddingExhibit && (
        <>
          {/* Very subtle backdrop */}
          <div 
            className="fixed inset-0 z-60" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            onClick={handleCancelAddExhibit}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-300 p-6 w-96 pointer-events-auto">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Add New Exhibit
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exhibit Title
                </label>
                <input
                  type="text"
                  value={newExhibitTitle}
                  onChange={(e) => setNewExhibitTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmAddExhibit();
                    }
                  }}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter exhibit title"
                />
              </div>
              <div className="flex items-center justify-end gap-4">
                <Button
                  onClick={handleCancelAddExhibit}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAddExhibit}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  disabled={!newExhibitTitle.trim()}
                >
                  Add Exhibit
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <>
          {/* Very subtle backdrop */}
          <div 
            className="fixed inset-0 z-60" 
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            onClick={handleCancelDelete}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-300 p-6 w-96 pointer-events-auto">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-1">
                    Delete Exhibit
                  </h2>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete this exhibit?
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  onClick={handleCancelDelete}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}