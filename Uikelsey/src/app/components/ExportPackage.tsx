import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Package, CheckCircle2, AlertCircle, FileText, ArrowRight } from "lucide-react";
import { queryKeys } from "../../lib/queryKeys";
import { fetchUserPetitionDocuments } from "../services/petitionService";
import { getCurrentUser, getExportPackageManifest } from "../../lib/backend";

interface PetitionRun {
  id: string;
  name: string;
  version: string;
  lastUpdated: string;
  isReady: boolean;
  fileCount: number;
  warningCount: number;
}

interface PackageFile {
  id: string;
  name: string;
  type: "form" | "letter" | "evidence" | "other";
  category: string;
}

interface ExportPackageProps {
  isPaidUser?: boolean;
  onUpgradeClick?: () => void;
  applicationId?: string;
}

const PLACEHOLDER_PACKAGE_FILES: PackageFile[] = [
  { id: "placeholder-form-1", name: "I-140 Petition", type: "form", category: "Forms" },
  { id: "placeholder-form-2", name: "G-28 Notice of Appearance", type: "form", category: "Forms" },
  { id: "placeholder-form-3", name: "G-1145 E-Notification", type: "form", category: "Forms" },
  { id: "placeholder-letter-1", name: "Cover Letter", type: "letter", category: "Letters" },
  { id: "placeholder-letter-2", name: "Petition Letter", type: "letter", category: "Letters" },
  { id: "placeholder-letter-3", name: "Supporting Documentation Index", type: "letter", category: "Letters" },
  { id: "placeholder-evidence-1", name: "Evidence file example.pdf", type: "evidence", category: "Exhibit 1: Sample Exhibit" },
];

export function ExportPackage({
  isPaidUser,
  onUpgradeClick,
  applicationId,
}: ExportPackageProps) {
  const navigate = useNavigate();
  const [petitionRuns, setPetitionRuns] = useState<PetitionRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [packageFiles, setPackageFiles] = useState<PackageFile[]>([]);
  const [previewRunNotice, setPreviewRunNotice] = useState<string | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [usePlaceholderPreview, setUsePlaceholderPreview] = useState(false);

  // Fetch petition documents from backend
  const { data: petitionDocsResponse, isLoading } = useQuery({
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

  const { data: manifestData, isLoading: isLoadingManifest, isError: isManifestError, error: manifestQueryError } = useQuery({
    queryKey: ['export-manifest', selectedRunId],
    queryFn: async () => {
      if (!selectedRunId) return null;
      return getExportPackageManifest(selectedRunId);
    },
    enabled: !!selectedRunId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (usePlaceholderPreview) return;
    if (!manifestData) {
      setPreviewRunNotice(null);
      return;
    }
    setPreviewRunNotice("Preview is sourced from immutable run-specific export manifest.");
  }, [manifestData, usePlaceholderPreview]);

  useEffect(() => {
    setManifestError(null);
    setUsePlaceholderPreview(false);
  }, [selectedRunId]);

  useEffect(() => {
    if (!isManifestError) return;
    const message = manifestQueryError instanceof Error
      ? manifestQueryError.message
      : "Failed to load export manifest.";
    setManifestError(message);
    const apiUnavailable =
      message.includes("API not available in preview environment") ||
      message.includes("Invalid JSON response from API") ||
      message.toLowerCase().includes("html");
    if (apiUnavailable) {
      setUsePlaceholderPreview(true);
      setPreviewRunNotice("Preview data shown from placeholder because backend API is unavailable in this environment.");
      setPackageFiles(PLACEHOLDER_PACKAGE_FILES);
    }
  }, [isManifestError, manifestQueryError]);

  // Transform petition documents into petition runs with ready status
  useEffect(() => {
    if (!petitionDocsResponse || !Array.isArray(petitionDocsResponse)) return;

    const petitionDocs = petitionDocsResponse.filter(
      (d) => (d.document_type || "petition") === "petition" && (d.status || "ready") === "ready",
    );

    const runs: PetitionRun[] = petitionDocs.map((doc, idx) => {
      return {
        id: doc.id,
        name: `Petition Run v${petitionDocs.length - idx}`,
        version: `v${petitionDocs.length - idx}`,
        lastUpdated: doc.created_at
          ? new Date(doc.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Unknown",
        isReady: true,
        fileCount: 0,
        warningCount: 0,
      };
    });

    setPetitionRuns(runs.reverse()); // Show latest first

    // Keep selected run if it still exists; otherwise select newest available.
    if (selectedRunId && runs.some((r) => r.id === selectedRunId)) {
      return;
    }
    if (runs.length > 0) {
      setSelectedRunId(runs[0].id);
    }
  }, [petitionDocsResponse, selectedRunId]);

  // Build package preview directly from backend manifest so UI matches ZIP output exactly.
  useEffect(() => {
    if (!selectedRunId) {
      setPackageFiles([]);
      setUsePlaceholderPreview(false);
      return;
    }
    if (usePlaceholderPreview) {
      setPackageFiles(PLACEHOLDER_PACKAGE_FILES);
      return;
    }
    if (isLoadingManifest) return;
    if (!manifestData || !manifestData.entries) {
      setPackageFiles([]);
      setManifestError("Manifest not found for this petition version. Regenerate this version to restore deterministic export mapping.");
      return;
    }

    const parsedFiles: PackageFile[] = manifestData.entries.map((entry, index) => {
      const full = entry.zip_entry_name || "";
      const segments = full.split(" - ");
      const filename = segments.length > 0 ? segments[segments.length - 1] : full;

      if (full.startsWith("02 - Form") || full.startsWith("03 - Form") || full.startsWith("04 - Form")) {
        return {
          id: `manifest-${index}`,
          name: filename.replace(/\.txt$/i, ""),
          type: "form",
          category: "Forms",
        };
      }
      if (full.startsWith("01 - Cover Letter") || full.startsWith("05 - Petition Letter")) {
        return {
          id: `manifest-${index}`,
          name: filename.replace(/\.docx$/i, ""),
          type: "letter",
          category: "Letters",
        };
      }

      if (/^\d+\s-\sExhibit\s+\d+\s-\s/i.test(full)) {
        const withoutPrefix = full.replace(/^\d+\s-\s/, "");
        const lastSep = withoutPrefix.lastIndexOf(" - ");
        const exhibitHeader = lastSep > 0 ? withoutPrefix.slice(0, lastSep) : "Exhibits";
        const exhibitFile = lastSep > 0 ? withoutPrefix.slice(lastSep + 3) : filename;
        return {
          id: `manifest-${index}`,
          name: exhibitFile,
          type: "evidence",
          category: exhibitHeader,
        };
      }

      return {
        id: `manifest-${index}`,
        name: filename,
        type: "other",
        category: "Other",
      };
    });

    setManifestError(null);
    setUsePlaceholderPreview(false);
    setPackageFiles(parsedFiles);
  }, [manifestData, isLoadingManifest, selectedRunId, usePlaceholderPreview]);

  const handleGeneratePackage = () => {
    if (!selectedRunId) return;
    navigate(`/dashboard/export-package/${selectedRunId}`);
  };

  // Group files by category
  const filesByCategory = packageFiles.reduce(
    (acc, file) => {
      if (!acc[file.category]) {
        acc[file.category] = [];
      }
      acc[file.category].push(file);
      return acc;
    },
    {} as Record<string, PackageFile[]>,
  );

  const selectedRun = petitionRuns.find((r) => r.id === selectedRunId);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">
          Export Package
        </h1>
        <p className="text-sm text-gray-600">
          Choose a petition letter run to generate your export package
        </p>
      </div>

      {/* Introduction Section */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-5">
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            Your complete export package includes <span className="font-semibold text-gray-900">professionally formatted cover letter, all required USCIS forms (I-140, G-28, G-1145), and comprehensive supporting documents</span> — automatically organized to USCIS submission standards. Everything you need for a successful petition, ready to print and submit.
          </p>
          
          <div className="pt-3 mt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">Disclaimer:</span> DreamCardAI is a document preparation service and does not provide legal advice. You are responsible for reviewing all documents for accuracy. We recommend consulting with an immigration attorney before submission.
            </p>
          </div>
        </div>
      </div>

      {/* Free User Upgrade Banner */}
      {!isPaidUser && (
        <div className="mb-8 p-5 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-start gap-4">
            <Package className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Upgrade to Export Your Package
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Export functionality is available for paid users. Upgrade now
                to download your complete petition package.
              </p>
              <Button
                onClick={onUpgradeClick}
                className="bg-primary hover:bg-primary/90 text-white text-sm h-9"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isLoading || (!!selectedRunId && isLoadingManifest)) && (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-primary mb-4" />
          <p className="text-sm text-gray-600">
            {isLoading ? "Loading petition runs..." : "Loading package manifest..."}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && petitionRuns.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Petition Runs Yet
          </h3>
          <p className="text-sm text-gray-600 mb-5">
            Generate a petition letter from the "My Petition" page first
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/my-petition")}
            className="text-sm"
          >
            Go to My Petition
          </Button>
        </div>
      )}

      {/* Main Content - Left/Right Layout */}
      {!isLoading && petitionRuns.length > 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* LEFT: Petition Runs Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-6">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Select Petition Run
                  </h2>
                </div>

                <div className="p-4 space-y-2.5 max-h-[600px] overflow-y-auto">
                  {petitionRuns.map((run) => (
                    <button
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      disabled={!isPaidUser}
                      className={`w-full px-4 py-4 rounded-lg border transition-all text-left ${
                        selectedRunId === run.id
                          ? "border-primary/30 bg-primary/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      } ${
                        isPaidUser
                          ? "cursor-pointer"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-base font-semibold text-gray-900">
                          {run.name}
                        </h3>
                        {selectedRunId === run.id ? (
                          <div className="flex-shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-4 h-4 rounded-full border border-gray-300" />
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Status</span>
                          {run.isReady ? (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary text-white">
                              Ready
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                              Processing
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Date</span>
                          <span className="font-medium text-gray-900">
                            {run.lastUpdated}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Files</span>
                          <span className="font-medium text-gray-900">
                            {run.fileCount}
                          </span>
                        </div>
                        {run.warningCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Warnings</span>
                            <span className="font-medium text-gray-900">
                              {run.warningCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Generate Button & File List Preview */}
            <div className="lg:col-span-3">
              {!selectedRunId ? (
                <div className="bg-white rounded-lg border border-gray-200 p-16 text-center h-full flex items-center justify-center">
                  <div>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select a Petition Run
                    </h3>
                    <p className="text-sm text-gray-600">
                      Choose a petition run to view its contents
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Generate Package Button - Now on Top */}
                  <div className="bg-primary/5 rounded-lg border border-primary/20 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          Generate Export Package
                        </h3>
                        <p className="text-xs text-gray-600">
                          Prepare files for printing and USCIS submission
                        </p>
                        {selectedRun && selectedRun.warningCount > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary/80">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              {selectedRun.warningCount} item
                              {selectedRun.warningCount > 1 ? "s" : ""} require
                              attention
                            </span>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleGeneratePackage}
                        disabled={!isPaidUser || !selectedRunId}
                        className="bg-primary hover:bg-primary/90 text-white text-sm h-9 px-5 gap-2"
                      >
                        Generate
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* File List */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200">
                      <h2 className="text-sm font-semibold text-gray-900">
                        Package Contents ({packageFiles.length} files)
                      </h2>
                      {previewRunNotice && (
                        <p className="text-xs text-amber-700 mt-1">
                          {previewRunNotice}
                        </p>
                      )}
                      {manifestError && (
                        <p className="text-xs text-red-600 mt-1">
                          {manifestError}
                        </p>
                      )}
                    </div>

                    <div className="p-5 max-h-[500px] overflow-y-auto">
                      {Object.entries(filesByCategory).map(
                        ([category, files]) => (
                          <div key={category} className="mb-6 last:mb-0">
                            <h3 className="text-xs font-semibold text-gray-700 mb-2.5 flex items-center gap-2 uppercase tracking-wide">
                              <div className="w-0.5 h-3 bg-primary rounded-full" />
                              {category}
                            </h3>
                            <div className="space-y-1.5">
                              {files.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-gray-100"
                                >
                                  <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 flex-1">
                                    {file.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Note */}
          {selectedRunId && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-semibold text-gray-900">Note:</span> The
                system automatically prepares your export package. A "Ready"
                status indicates all files have been organized and are
                available for download.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
