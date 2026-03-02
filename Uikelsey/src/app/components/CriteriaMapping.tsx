import React, { useState, useCallback, useEffect } from "react";
import {
  IconUpload,
  IconCircleCheck,
  IconFileText,
  IconTrash,
  IconX,
  IconArrowRight,
  IconEdit,
  IconFileDescription,
  IconPlus,
  IconFileQuestion,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";
import {
  Criterion,
  CRITERIA,
  ALL_MAPPING_ITEMS,
} from "./CriteriaSidebar";
import { NIWRequirementsMapping } from "./NIWRequirementsMapping";
import { criteriaService } from "../services/criteriaService"; // ✅ Import criteriaService
import { generateExhibits } from "../../lib/backend";
import { Loader2 } from "lucide-react"; // ✅ Import Loader2 for loading state

const CRITERIA_GENERATION_ORDER = [
  ...CRITERIA.map((c) => c.id),
  "recommendation",
  "future_work",
];

const criteriaOrderIndex = (criteriaId: string): number => {
  const idx = CRITERIA_GENERATION_ORDER.indexOf(criteriaId);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
};

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: Date;
  criteria: string[];
  file?: File; // Optional because fetched files won't have it
  url?: string; // Signed URL or public URL
}

export interface SensitiveDescription {
  id: string;
  title: string;
  description: string;
  criteria: string[];
  createdDate: Date;
}

interface CriteriaMappingProps {
  files: UploadedFile[];
  selectedFileId: string | null;
  onAddFiles: (files: UploadedFile[]) => void;
  onDeleteFile: (id: string) => void;
  onSelectFile: (id: string | null) => void;
  onToggleCriterion: (criterionId: string) => void;
  metCriteriaCount: number;
  sensitiveDescriptions: SensitiveDescription[];
  onAddSensitiveDescription: (
    description: SensitiveDescription,
  ) => void;
  onDeleteSensitiveDescription: (id: string) => void;
  onToggleSensitiveDescriptionCriterion: (
    descriptionId: string,
    criterionId: string,
  ) => void;
  criteriaList?: Criterion[];
  mode?: "eb1a" | "niw";
  onNavigateToPetition?: () => void;
  isPaidUser?: boolean;
  applicationId?: string;
  onSaveSuccess?: () => void; // ✅ Add onSaveSuccess callback
}

function EB1ACriteriaMapping({
  files,
  onAddFiles,
  onDeleteFile,
  onSelectFile,
  onToggleCriterion,
  metCriteriaCount,
  sensitiveDescriptions,
  onAddSensitiveDescription,
  onDeleteSensitiveDescription,
  criteriaList = CRITERIA,
  onNavigateToPetition,
  isPaidUser = false,
  applicationId,
  onSaveSuccess,
}: CriteriaMappingProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showMappingModal, setShowMappingModal] =
    useState(false);
  const [pendingFiles, setPendingFiles] = useState<
    UploadedFile[]
  >([]);
  const [currentMappingIndex, setCurrentMappingIndex] =
    useState(0);
  const [editingFileId, setEditingFileId] = useState<
    string | null
  >(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<
    string | null
  >(null);

  // ✅ Add state to track pending criterion toggle
  const [pendingCriterionToggle, setPendingCriterionToggle] =
    useState<string | null>(null);

  // Track unsaved changes and saving state
  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // ✅ Add saving state

  // Free user limits
  const FREE_FILE_LIMIT = 5;
  const canUploadMore =
    isPaidUser || files.length < FREE_FILE_LIMIT;

  // Sensitive description states
  const [showSensitiveModal, setShowSensitiveModal] =
    useState(false);
  const [sensitiveTitle, setSensitiveTitle] = useState("");
  const [sensitiveDescription, setSensitiveDescription] =
    useState("");
  const [sensitiveCriteria, setSensitiveCriteria] = useState<
    string[]
  >([]);
  const [editingSensitiveId, setEditingSensitiveId] = useState<
    string | null
  >(null);
  const [viewingSensitiveId, setViewingSensitiveId] = useState<
    string | null
  >(null);

  // EB-1A Specific logic
  const minRequired = 3; // EB-1A minimum requirement
  const hasMetMinimum = metCriteriaCount >= minRequired;

  // ✅ Add beforeunload event listener to warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
        return ""; // Some browsers display this message
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, [hasUnsavedChanges]);

  // Combine files and sensitive descriptions for unified display
  const allItems = [
    ...files.map((f) => ({ ...f, type: "file" as const })),
    ...sensitiveDescriptions.map((d) => ({
      ...d,
      type: "sensitive" as const,
      size: 0,
      uploadDate: d.createdDate,
      name: d.title,
    })),
  ].sort((a, b) => {
    // Handle undefined dates
    const aTime = a.uploadDate?.getTime() || 0;
    const bTime = b.uploadDate?.getTime() || 0;
    return bTime - aTime;
  });

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (fileList: File[]) => {
    // Check free user file limit
    if (!isPaidUser && files.length >= FREE_FILE_LIMIT) {
      alert(
        `Free plan is limited to ${FREE_FILE_LIMIT} files. Please upgrade to upload more files.`,
      );
      return;
    }

    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      uploadDate: new Date(),
      criteria: [],
      file,
    }));

    // Show mapping modal for uploaded files
    setPendingFiles(newFiles);
    setCurrentMappingIndex(0);
    setEditingFileId(null);
    setShowMappingModal(true);
  };

  const handleEditFile = (fileId: string) => {
    const fileToEdit = files.find((f) => f.id === fileId);
    if (fileToEdit) {
      setEditingFileId(fileId);
      setPendingFiles([fileToEdit]);
      setCurrentMappingIndex(0);
      setShowMappingModal(true);
    }
  };

  const handleSkipMapping = () => {
    if (editingFileId) {
      // If editing, just close the modal
      setShowMappingModal(false);
      setEditingFileId(null);
      setPendingFiles([]);
    } else {
      // If uploading new files, add them without criteria
      onAddFiles(pendingFiles);
      setShowMappingModal(false);
      setPendingFiles([]);
    }
  };

  const handleNextFile = () => {
    const currentFile = pendingFiles[currentMappingIndex];

    if (editingFileId) {
      // If editing, use the toggle criterion handler from parent
      setShowMappingModal(false);
      setEditingFileId(null);
      setPendingFiles([]);
    } else if (currentMappingIndex < pendingFiles.length - 1) {
      // Move to next file
      setCurrentMappingIndex((prev) => prev + 1);
      // Add current file to the list
      onAddFiles([currentFile]);
    } else {
      // This was the last file, add it and close modal
      onAddFiles([currentFile]);
      setShowMappingModal(false);
      setPendingFiles([]);
      setCurrentMappingIndex(0);
    }
  };

  const toggleCriterionForPendingFile = async (
    criterionId: string,
  ) => {
    if (editingFileId) {
      // ✅ For editing mode: Direct backend update without relying on parent state
      if (!applicationId) {
        console.error(
          "❌ No applicationId for editing file criteria",
        );
        return;
      }

      const fileToEdit = files.find(
        (f) => f.id === editingFileId,
      );
      if (!fileToEdit) {
        console.error("❌ File to edit not found");
        return;
      }

      // Calculate new criteria
      const hasCriterion =
        fileToEdit.criteria.includes(criterionId);
      const newCriteria = hasCriterion
        ? fileToEdit.criteria.filter((c) => c !== criterionId)
        : [...fileToEdit.criteria, criterionId];

      console.log(
        `🔄 Toggling criterion "${criterionId}" for file "${fileToEdit.name}"`,
        {
          oldCriteria: fileToEdit.criteria,
          newCriteria: newCriteria,
        },
      );

      // ✅ Update pendingFiles immediately for UI responsiveness
      setPendingFiles((prev) =>
        prev.map((file) =>
          file.id === editingFileId
            ? { ...file, criteria: newCriteria }
            : file,
        ),
      );

      // ✅ Also notify parent to update the main files list
      onSelectFile(editingFileId);
      onToggleCriterion(criterionId);

      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
    } else {
      // If mapping new files, update pending files
      setPendingFiles((prev) =>
        prev.map((file, index) => {
          if (index === currentMappingIndex) {
            const hasCriterion =
              file.criteria.includes(criterionId);
            return {
              ...file,
              criteria: hasCriterion
                ? file.criteria.filter((c) => c !== criterionId)
                : [...file.criteria, criterionId],
            };
          }
          return file;
        }),
      );
    }
  };

  const handleSaveMappingChanges = async () => {
    if (!applicationId) {
      console.error("❌ No applicationId for saving changes");
      return;
    }

    setIsSaving(true);
    console.log(
      "💾 Saving all criteria mapping changes to backend...",
    );

    try {
      // Step 1: Save all files' criteria to backend
      const savePromises = files.map(async (file) => {
        try {
          await criteriaService.updateFileCriteria(
            file.id,
            file.criteria,
            applicationId,
          );
          console.log(
            `✅ Saved criteria for file "${file.name}":`,
            file.criteria,
          );
        } catch (e) {
          console.error(
            `❌ Failed to save criteria for file "${file.name}":`,
            e,
          );
          throw e;
        }
      });

      await Promise.all(savePromises);

      console.log(
        "✅ All criteria mappings saved successfully",
      );

      // Step 2: Trigger exhibit grouping in background (do not block Save UX)
      const uniqueCriteria = Array.from(
        new Set(files.flatMap((file) => file.criteria)),
      ).sort(
        (a, b) => criteriaOrderIndex(a) - criteriaOrderIndex(b),
      );
      // Always try personal_info first so Exhibit 1 is created when user has Personal Information uploads
      const criteriaToRun = [
        "personal_info",
        ...uniqueCriteria.filter((c) => c !== "personal_info"),
      ];

      const triggerGroupingInBackground = async (
        criteriaIds: string[],
      ) => {
        if (!criteriaIds.length || !applicationId) return;
        try {
          console.log(
            `🔬 Background exhibit generation for ${criteriaIds.length} criteria:`,
            criteriaIds,
          );
          const [firstCriteria, ...remainingCriteria] =
            criteriaIds;

          // First call creates/returns a valid petition run_id from backend.
          const firstResult = await generateExhibits(
            firstCriteria,
            undefined,
            applicationId,
          );
          const runId = firstResult.run_id;
          console.log(`📋 Using backend run_id: ${runId}`);

          // Continue remaining criteria under the same run, sequentially to avoid
          // run-level exhibit_number race conditions on concurrent inserts.
          const failures: Array<{
            criteriaId: string;
            error: unknown;
          }> = [];
          for (const criterionId of remainingCriteria) {
            try {
              await generateExhibits(
                criterionId,
                runId,
                applicationId,
              );
            } catch (error) {
              failures.push({ criteriaId: criterionId, error });
            }
          }

          if (failures.length > 0) {
            console.error(
              `⚠️ ${failures.length} criteria failed during background grouping`,
              failures,
            );
          } else {
            console.log(
              `✅ Background exhibit grouping finished for run_id: ${runId}`,
            );
          }
        } catch (e: any) {
          console.error(
            "❌ Background exhibit grouping failed:",
            e,
          );
        }
      };

      setIsSaving(false);
      setHasUnsavedChanges(false);
      setShowSaveSuccess(true);
      void triggerGroupingInBackground(criteriaToRun);

      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 2000);

      // ✅ Call onSaveSuccess callback if provided
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (e: any) {
      setIsSaving(false);
      console.error("❌ Failed to save criteria mappings:", e);
      alert(
        `Failed to save changes: ${e.message || "Unknown error"}`,
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024)
      return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const currentPendingFile = pendingFiles[currentMappingIndex];

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Criteria Mapping
          </h1>
          <p className="text-sm text-gray-500">
            Upload your evidence files and tell us which EB-1A
            criteria they support. You need at least 3 out of 10
            criteria.
          </p>
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
              <IconAlertCircle size={16} />
              <span>You have unsaved changes</span>
            </div>
          )}
        </div>

        {/* Save File Button - Always visible when there are files */}
        {allItems.length > 0 && (
          <Button
            onClick={handleSaveMappingChanges}
            disabled={isSaving}
            className={`shadow-sm h-9 ${
              hasUnsavedChanges
                ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                : "bg-[#434E87] hover:bg-[#323b6b] text-white"
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : hasUnsavedChanges ? (
              <>
                <IconAlertCircle className="w-4 h-4 mr-2" />
                Save Changes
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3
            className="text-lg font-semibold text-gray-900"
            style={{ fontFamily: "var(--font-serif-display)" }}
          >
            Criteria Progress
          </h3>
          <span
            className={`text-sm font-bold ${hasMetMinimum ? "text-green-600" : "text-gray-500"}`}
          >
            {metCriteriaCount} / {minRequired} criteria met
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${(metCriteriaCount / minRequired) * 100}%`,
            }} // Scale based on requirement
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`absolute left-0 top-0 h-full rounded-full ${
              hasMetMinimum ? "bg-green-500" : "bg-[#434E87]"
            }`}
            style={{ maxWidth: "100%" }}
          />
          {/* Minimum threshold indicator (if applicable, e.g. 4/11) */}
          <div className="absolute left-[36.36%] top-0 h-full w-0.5 bg-gray-300" />
        </div>

        {/* Status Message */}
        <AnimatePresence mode="wait">
          {hasMetMinimum ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                <IconCircleCheck className="w-4 h-4" />
                <span>
                  Excellent! You've met the minimum requirement
                  of 3 criteria.
                </span>
              </div>

              {/* Confirm Criteria Button */}
              {allItems.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        Ready to move forward?
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        You've successfully mapped your evidence
                        to {metCriteriaCount} criteria. You can
                        now proceed to My Petition to review and
                        generate your petition documents.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        // Navigate to My Petition page and trigger generate
                        if (onNavigateToPetition) {
                          onNavigateToPetition();
                        } else {
                          window.location.href =
                            "#petition_letter_editor";
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
                    >
                      <IconCircleCheck className="w-4 h-4 mr-2" />
                      Go to My Petition
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded"
            >
              You need to satisfy at least{" "}
              {minRequired - metCriteriaCount} more{" "}
              {minRequired - metCriteriaCount === 1
                ? "criterion"
                : "criteria"}{" "}
              to meet the minimum requirement.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mapping Modal */}
      <AnimatePresence>
        {showMappingModal && currentPendingFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleSkipMapping();
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Map File to Criteria
                  </h3>
                  <button
                    onClick={handleSkipMapping}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <IconFileText className="w-4 h-4" />
                  <span className="font-medium truncate">
                    {currentPendingFile.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({formatFileSize(currentPendingFile.size)})
                  </span>
                </div>
                {pendingFiles.length > 1 && (
                  <div className="mt-3 text-xs text-gray-500">
                    File {currentMappingIndex + 1} of{" "}
                    {pendingFiles.length}
                  </div>
                )}
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
                <p className="text-sm text-gray-600 mb-4">
                  Select all criteria that this file supports as
                  evidence.
                </p>

                <div className="space-y-2">
                  {ALL_MAPPING_ITEMS.map((criterion) => {
                    const Icon = criterion.icon;
                    // When editing, check actual file criteria; when uploading, check pending file criteria
                    const isSelected = editingFileId
                      ? files
                          .find((f) => f.id === editingFileId)
                          ?.criteria.includes(criterion.id) ||
                        false
                      : currentPendingFile.criteria.includes(
                          criterion.id,
                        );

                    const isRecommendation =
                      criterion.isRecommended;

                    return (
                      <button
                        key={criterion.id}
                        onClick={() =>
                          toggleCriterionForPendingFile(
                            criterion.id,
                          )
                        }
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isRecommendation
                            ? isSelected
                              ? "border-amber-500 bg-amber-50 shadow-sm"
                              : "border-amber-300 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50"
                            : isSelected
                              ? "border-[#434E87] bg-[#434E87]/5 shadow-sm"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                              isRecommendation
                                ? isSelected
                                  ? "bg-amber-500 text-white"
                                  : "bg-amber-200 text-amber-700"
                                : isSelected
                                  ? "bg-[#434E87] text-white"
                                  : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={`text-sm font-semibold ${
                                  isRecommendation
                                    ? isSelected
                                      ? "text-amber-900"
                                      : "text-amber-800"
                                    : isSelected
                                      ? "text-[#434E87]"
                                      : "text-gray-900"
                                }`}
                              >
                                {criterion.name}
                              </h4>
                              {isRecommendation && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                                  HIGHLY RECOMMENDED
                                </span>
                              )}
                              {isSelected && (
                                <IconCircleCheck
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    isRecommendation
                                      ? "text-amber-600"
                                      : "text-[#434E87]"
                                  }`}
                                />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              {criterion.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
                <button
                  onClick={handleSkipMapping}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Skip for now
                </button>
                <div className="flex items-center gap-3">
                  {currentPendingFile.criteria.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {currentPendingFile.criteria.length}{" "}
                      {currentPendingFile.criteria.length === 1
                        ? "item"
                        : "items"}{" "}
                      selected
                    </span>
                  )}
                  <Button
                    onClick={handleNextFile}
                    className="bg-[#434E87] hover:bg-[#434E87]/90 gap-2"
                  >
                    {currentMappingIndex <
                    pendingFiles.length - 1
                      ? "Next File"
                      : "Done"}
                    <IconArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Upload Dropbox */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative bg-white rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-[#434E87] bg-[#434E87]/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <div className="p-12 text-center">
            <IconUpload
              className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-[#434E87]" : "text-gray-400"}`}
            />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Upload Evidence Files
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop files here, or click to browse
            </p>

            <input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              disabled={!canUploadMore}
            />
            <Button
              type="button"
              onClick={() =>
                !canUploadMore
                  ? null
                  : document
                      .getElementById("file-upload")
                      ?.click()
              }
              className={
                canUploadMore
                  ? "bg-[#434E87] hover:bg-[#434E87]/90"
                  : "bg-gray-300 cursor-not-allowed"
              }
              disabled={!canUploadMore}
            >
              {canUploadMore
                ? "Browse Files"
                : "Upload Limit Reached (5 files)"}
            </Button>
            <p className="text-xs text-gray-400 mt-3">
              Supported formats: PDF, DOC, DOCX, JPG, PNG
            </p>
          </div>
        </div>

        {/* Files Table */}
        {allItems.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Uploaded Files ({allItems.length})
              </h3>

              {/* Save Mapping Changes Button */}
              <div className="flex items-center gap-3">
                <AnimatePresence>
                  {showSaveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 text-sm text-green-700"
                    >
                      <IconCircleCheck className="w-4 h-4" />
                      <span>Saved!</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasUnsavedChanges && (
                  <Button
                    onClick={handleSaveMappingChanges}
                    disabled={isSaving}
                    className={`shadow-sm ${
                      hasUnsavedChanges
                        ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                        : "bg-[#434E87] hover:bg-[#323b6b] text-white"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <IconCircleCheck className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criteria Matched
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.type === "file" ? (
                            <IconFileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          ) : (
                            <div className="relative">
                              <IconFileDescription className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {item.type === "sensitive" ? (
                              <button
                                onClick={() =>
                                  setViewingSensitiveId(item.id)
                                }
                                className="text-sm text-gray-900 hover:text-[#434E87] hover:underline truncate max-w-xs text-left transition-colors"
                              >
                                {item.name}
                              </button>
                            ) : (
                              <span className="text-sm text-gray-900 truncate max-w-xs">
                                {item.name}
                              </span>
                            )}
                            {item.type === "sensitive" && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 flex-shrink-0">
                                Description Only
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {item.type === "file"
                          ? formatFileSize(item.size)
                          : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {Array.isArray(item.criteria) &&
                        item.criteria.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.criteria.map(
                              (criterionId) => {
                                const criterion =
                                  ALL_MAPPING_ITEMS.find(
                                    (c) => c.id === criterionId,
                                  );
                                if (!criterion) {
                                  // ✅ Debug: Log unmatched criteria
                                  console.warn(
                                    `⚠️ Criterion not found: "${criterionId}"`,
                                    item,
                                  );
                                  return null;
                                }
                                return (
                                  <span
                                    key={criterionId}
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                      criterion.isRecommended
                                        ? "bg-amber-100 text-amber-800"
                                        : item.type ===
                                            "sensitive"
                                          ? "bg-indigo-100 text-indigo-700"
                                          : "bg-[#434E87]/10 text-[#434E87]"
                                    }`}
                                  >
                                    {criterion.name}
                                  </span>
                                );
                              },
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            Not mapped yet
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            onClick={() => {
                              if (item.type === "file") {
                                handleEditFile(item.id);
                              } else {
                                onDeleteSensitiveDescription(
                                  item.id,
                                ); // Fixed: handle sensitive descriptions correctly
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title={
                              item.type === "sensitive"
                                ? "Edit description"
                                : "Edit criteria"
                            }
                          >
                            <IconEdit className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setDeleteConfirmId(item.id)
                              }
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>

                            {/* Delete Confirmation Popup */}
                            {deleteConfirmId === item.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-48">
                                <p className="text-xs text-gray-700 mb-2">
                                  Delete this{" "}
                                  {item.type === "file"
                                    ? "file"
                                    : "description"}
                                  ?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      if (
                                        item.type === "file"
                                      ) {
                                        onDeleteFile(item.id);
                                      } else {
                                        onDeleteSensitiveDescription(
                                          item.id,
                                        );
                                      }
                                      setDeleteConfirmId(null);
                                    }}
                                    className="flex-1 px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeleteConfirmId(null)
                                    }
                                    className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State - Removed per user request */}
        {/* {allItems.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center bg-[#f1f1f1]">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconUpload className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No files uploaded yet
              </h3>
              <p className="text-sm text-gray-500">
                Upload your evidence files to get started. After each upload, you'll be guided to select which EB-1A criteria the file supports.
              </p>
            </div>
          </div>
        )} */}

        {/* Sensitive Document Description Section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200/50 overflow-hidden">
          <div className="p-8">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-lg flex-shrink-0">
                <IconFileDescription className="w-7 h-7 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Sensitive information Upload
                  </h3>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  Can't upload the actual file?
                  <br />
                  If a document is sensitive or confidential,
                  you may input evidences information here
                  instead. Just Make sure to include{" "}
                  <strong className="text-indigo-700">
                    specific figures, dates, and outcomes
                  </strong>{" "}
                  to support your petition.
                </p>

                <Button
                  onClick={() => {
                    setSensitiveTitle("");
                    setSensitiveDescription("");
                    setSensitiveCriteria([]);
                    setEditingSensitiveId(null);
                    setShowSensitiveModal(true);
                  }}
                  className="bg-[#434E87] hover:bg-[#434E87]/90 gap-2"
                >
                  <IconPlus className="w-4 h-4" />
                  Describe Sensitive Evidence
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitive Evidence Modal */}
      <AnimatePresence>
        {showSensitiveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSensitiveModal(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-indigo-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Describe Sensitive Evidence
                  </h3>
                  <button
                    onClick={() => setShowSensitiveModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  Provide a detailed description of the evidence
                  you cannot upload.
                </p>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
                {/* Title Input */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Title{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={sensitiveTitle}
                    onChange={(e) =>
                      setSensitiveTitle(e.target.value)
                    }
                    placeholder="e.g., Confidential Employment Contract"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Description Textarea */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={sensitiveDescription}
                    onChange={(e) =>
                      setSensitiveDescription(e.target.value)
                    }
                    rows={6}
                    placeholder="Include specific details: dates, figures, outcomes, parties involved, etc. The more specific, the better for your petition."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Criteria Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Which criteria does this support?
                  </label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ALL_MAPPING_ITEMS.map((criterion) => {
                      const Icon = criterion.icon;
                      const isSelected =
                        sensitiveCriteria.includes(
                          criterion.id,
                        );
                      const isRecommendation =
                        criterion.isRecommended;

                      return (
                        <button
                          key={criterion.id}
                          onClick={() => {
                            if (isSelected) {
                              setSensitiveCriteria(
                                sensitiveCriteria.filter(
                                  (c) => c !== criterion.id,
                                ),
                              );
                            } else {
                              setSensitiveCriteria([
                                ...sensitiveCriteria,
                                criterion.id,
                              ]);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                            isRecommendation
                              ? isSelected
                                ? "border-amber-500 bg-amber-50"
                                : "border-amber-200 bg-amber-50/50 hover:border-amber-400"
                              : isSelected
                                ? "border-indigo-500 bg-indigo-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 ${
                                isRecommendation
                                  ? isSelected
                                    ? "bg-amber-500 text-white"
                                    : "bg-amber-200 text-amber-700"
                                  : isSelected
                                    ? "bg-indigo-500 text-white"
                                    : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-semibold ${
                                    isRecommendation
                                      ? isSelected
                                        ? "text-amber-900"
                                        : "text-amber-800"
                                      : isSelected
                                        ? "text-indigo-900"
                                        : "text-gray-900"
                                  }`}
                                >
                                  {criterion.name}
                                </span>
                                {isSelected && (
                                  <IconCircleCheck
                                    className={`w-4 h-4 ${
                                      isRecommendation
                                        ? "text-amber-600"
                                        : "text-indigo-600"
                                    }`}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowSensitiveModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  onClick={() => {
                    if (
                      sensitiveTitle.trim() &&
                      sensitiveDescription.trim()
                    ) {
                      // Create new sensitive description
                      const newDescription: SensitiveDescription =
                        {
                          id: Math.random()
                            .toString(36)
                            .substr(2, 9),
                          title: sensitiveTitle,
                          description: sensitiveDescription,
                          criteria: sensitiveCriteria,
                          createdDate: new Date(),
                        };

                      onAddSensitiveDescription(newDescription);

                      // Reset and close
                      setSensitiveTitle("");
                      setSensitiveDescription("");
                      setSensitiveCriteria([]);
                      setShowSensitiveModal(false);
                    } else {
                      alert(
                        "Please fill in both title and description",
                      );
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  disabled={
                    !sensitiveTitle.trim() ||
                    !sensitiveDescription.trim()
                  }
                >
                  <IconCircleCheck className="w-4 h-4" />
                  Save Description
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main Switcher Component
export function CriteriaMapping(props: CriteriaMappingProps) {
  if (props.mode === "niw") {
    return (
      <NIWRequirementsMapping
        files={props.files}
        onAddFiles={props.onAddFiles}
        onDeleteFile={props.onDeleteFile}
        onSelectFile={props.onSelectFile}
        selectedFileId={props.selectedFileId}
      />
    );
  }
  return <EB1ACriteriaMapping {...props} />;
}