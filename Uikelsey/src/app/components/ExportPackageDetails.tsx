import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "./ui/button";
import {
  Download,
  ArrowLeft,
  AlertTriangle,
  AlertCircle,
  FileText,
  FileSignature,
  Upload,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { queryKeys } from "../../lib/queryKeys";
import { fetchUserPetitionDocuments } from "../services/petitionService";
import { getCurrentUser, getExportPackageManifest } from "../../lib/backend";
import { exportPetitionPackage } from "../../lib/backend";
import { toast } from "sonner";

interface PackageFile {
  id: string;
  name: string;
  type: "form" | "letter" | "evidence" | "other";
  order: number;
  category: string;
  warning?: "needs_signature" | "not_uploaded" | "sensitive_file";
  warningMessage?: string;
}

interface ExportPackageDetailsProps {
  applicationId?: string;
}

const PLACEHOLDER_PACKAGE_FILES: PackageFile[] = [
  {
    id: "placeholder-1",
    name: "I-140 Petition",
    type: "form",
    order: 1,
    category: "Petition Form",
    warning: "needs_signature",
    warningMessage: "This form requires your signature before submission",
  },
  {
    id: "placeholder-2",
    name: "G-28 Notice of Appearance",
    type: "form",
    order: 2,
    category: "Petition Form",
  },
  {
    id: "placeholder-3",
    name: "G-1145 E-Notification",
    type: "form",
    order: 3,
    category: "Petition Form",
  },
  {
    id: "placeholder-4",
    name: "Cover Letter.docx",
    type: "letter",
    order: 4,
    category: "Supporting Documents",
  },
  {
    id: "placeholder-5",
    name: "Petition Letter.docx",
    type: "letter",
    order: 5,
    category: "Supporting Documents",
  },
  {
    id: "placeholder-6",
    name: "Exhibit File Example.pdf",
    type: "evidence",
    order: 6,
    category: "Evidence",
  },
];

export function ExportPackageDetails({
  applicationId,
}: ExportPackageDetailsProps) {
  const navigate = useNavigate();
  const { runId } = useParams<{ runId: string }>();
  const [isExporting, setIsExporting] = useState(false);
  const [packageFiles, setPackageFiles] = useState<PackageFile[]>([]);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [usePlaceholderPreview, setUsePlaceholderPreview] = useState(false);

  // Fetch petition document
  const { data: petitionDocsResponse, isLoading } = useQuery({
    queryKey: queryKeys.petitionDocuments(applicationId!),
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user || !applicationId) return [];
      return fetchUserPetitionDocuments(applicationId, user.id);
    },
    enabled: !!applicationId && !!runId,
  });

  const { data: manifestData, isLoading: isLoadingManifest, isError: isManifestError, error: manifestQueryError } = useQuery({
    queryKey: ['export-manifest', runId],
    queryFn: async () => {
      if (!runId) return null;
      return getExportPackageManifest(runId);
    },
    enabled: !!runId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

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
      setPackageFiles(PLACEHOLDER_PACKAGE_FILES);
    }
  }, [isManifestError, manifestQueryError]);

  // Find selected petition run
  const selectedPetition = Array.isArray(petitionDocsResponse)
    ? petitionDocsResponse.find((d) => d.id === runId)
    : null;

  // Build package file list from immutable backend manifest.
  useEffect(() => {
    if (usePlaceholderPreview) return;
    if (!manifestData?.entries) {
      setPackageFiles([]);
      return;
    }

    const files: PackageFile[] = manifestData.entries.map((entry, idx) => {
      const full = entry.zip_entry_name || "";
      const segments = full.split(" - ");
      const filename = segments.length > 0 ? segments[segments.length - 1] : full;

      if (full.startsWith("02 - Form") || full.startsWith("03 - Form") || full.startsWith("04 - Form")) {
        return {
          id: `manifest-${idx}`,
          name: filename.replace(/\.txt$/i, ""),
          type: "form",
          order: entry.sort_order,
          category: "Petition Form",
        };
      }

      if (full.startsWith("01 - Cover Letter") || full.startsWith("05 - Petition Letter")) {
        return {
          id: `manifest-${idx}`,
          name: filename,
          type: "letter",
          order: entry.sort_order,
          category: "Supporting Documents",
        };
      }

      if (/^\d+\s-\sExhibit\s+\d+\s-\s/i.test(full)) {
        const withoutPrefix = full.replace(/^\d+\s-\s/, "");
        const lastSep = withoutPrefix.lastIndexOf(" - ");
        const exhibitHeader = lastSep > 0 ? withoutPrefix.slice(0, lastSep) : "Evidence";
        const exhibitFile = lastSep > 0 ? withoutPrefix.slice(lastSep + 3) : filename;
        return {
          id: `manifest-${idx}`,
          name: exhibitFile,
          type: "evidence",
          order: entry.sort_order,
          category: exhibitHeader,
        };
      }

      return {
        id: `manifest-${idx}`,
        name: filename,
        type: "evidence",
        order: entry.sort_order,
        category: "Evidence",
      };
    });

    setManifestError(null);
    setUsePlaceholderPreview(false);
    setPackageFiles(files);
  }, [manifestData, usePlaceholderPreview]);

  const handleDownloadPackage = async () => {
    if (!runId) return;

    setIsExporting(true);
    try {
      const blob = await exportPetitionPackage(runId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Petition_Package_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Package downloaded successfully");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Export failed";
      toast.error(message);
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const getWarningConfig = (warning: string) => {
    switch (warning) {
      case "needs_signature":
        return {
          label: "Needs Signature",
          icon: FileSignature,
        };
      case "not_uploaded":
        return {
          label: "Not Uploaded",
          icon: Upload,
        };
      case "sensitive_file":
        return {
          label: "Sensitive File",
          icon: AlertTriangle,
        };
      default:
        return null;
    }
  };

  const warningsCount = packageFiles.filter((f) => f.warning).length;

  // Group files by category for display
  const categorizedFiles: { category: string; files: PackageFile[] }[] = [];
  packageFiles.forEach((file) => {
    const existing = categorizedFiles.find(
      (group) => group.category === file.category,
    );
    if (existing) {
      existing.files.push(file);
    } else {
      categorizedFiles.push({ category: file.category, files: [file] });
    }
  });

  if (isLoading || (!!runId && isLoadingManifest)) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary mb-4" />
          <p className="text-sm text-gray-600 font-medium">
            {isLoading ? "Loading package..." : "Loading package manifest..."}
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPetition) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Package Not Found
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            The requested package could not be found
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/export-package")}
            className="font-semibold"
          >
            Back to Export Package
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/export-package")}
          className="mb-5 -ml-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Back
        </Button>

        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">
              Package Contents
            </h1>
            <p className="text-sm text-gray-600">
              Print and assemble files in this order for USCIS submission
            </p>
          </div>

          {/* Download ZIP Button - More Prominent */}
          <Button
            onClick={handleDownloadPackage}
            disabled={isExporting}
            className="gap-2 bg-primary hover:bg-primary/90 text-white px-6 h-11 rounded-lg text-base font-semibold shadow-sm"
          >
            <Download className="w-5 h-5" />
            {isExporting ? "Preparing..." : "Download ZIP"}
          </Button>
        </div>
        {usePlaceholderPreview && (
          <p className="mt-3 text-xs text-amber-700">
            Preview data is placeholder because backend API is unavailable in this environment.
          </p>
        )}
        {!usePlaceholderPreview && manifestError && (
          <p className="mt-3 text-xs text-red-600">{manifestError}</p>
        )}
      </div>

      {/* Warning Summary */}
      {warningsCount > 0 && (
        <div className="mb-6 bg-primary/5 border border-primary/30 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-semibold text-gray-900 mb-1">
                {warningsCount} {warningsCount === 1 ? "Item" : "Items"}{" "}
                Require Attention
              </p>
              <p className="text-xs text-gray-600">
                Review the warnings below before submitting your package to
                USCIS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning Categories Info */}
      <div className="mb-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Warning Categories
        </p>
        <div className="space-y-2.5 text-xs text-gray-700">
          <div className="flex items-start gap-2.5">
            <FileSignature className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-600" />
            <span>
              <span className="font-semibold text-gray-900">
                Needs Signature:
              </span>{" "}
              Forms require your handwritten or digital signature
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Upload className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-600" />
            <span>
              <span className="font-semibold text-gray-900">
                Not Uploaded:
              </span>{" "}
              Completed form version has not been uploaded yet
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-600" />
            <span>
              <span className="font-semibold text-gray-900">
                Sensitive File:
              </span>{" "}
              Replace placeholder with actual document containing sensitive
              information
            </span>
          </div>
        </div>
      </div>

      {/* Files List - The Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">
            Print Order ({packageFiles.length} files)
          </h2>
        </div>

        <div>
          {categorizedFiles.map((categoryGroup) => (
            <div key={categoryGroup.category}>
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                  {categoryGroup.category}
                </h3>
              </div>
              {categoryGroup.files.map((file, index) => {
                const warningConfig = file.warning
                  ? getWarningConfig(file.warning)
                  : null;
                const WarningIcon = warningConfig?.icon;

                return (
                  <div
                    key={file.id}
                    className={`px-5 py-4 flex items-start gap-4 ${
                      index !== categoryGroup.files.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    } ${file.warning ? "bg-primary/5" : ""}`}
                  >
                    {/* Order Number - Refined */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {file.order}
                      </span>
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                        {file.name}
                      </h3>

                      {/* Warning Message */}
                      {file.warning && file.warningMessage && (
                        <p className="text-xs text-gray-600 mt-1.5">
                          {file.warningMessage}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0 pt-0.5">
                      {file.warning && warningConfig && WarningIcon ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-gray-300 bg-white">
                          <WarningIcon className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium text-gray-700">
                            {warningConfig.label}
                          </span>
                        </div>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              How to Organize Your Package
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Learn the best practices for assembling and submitting your EB-1A petition package to USCIS
            </p>
            <a
              href="/blog/eb1a-package-organization"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Read our guide
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <Button
            onClick={handleDownloadPackage}
            disabled={isExporting}
            className="gap-2 bg-primary hover:bg-primary/90 text-white px-6 h-11 rounded-lg text-base font-semibold shadow-sm flex-shrink-0"
          >
            <Download className="w-5 h-5" />
            {isExporting ? "Preparing..." : "Download ZIP"}
          </Button>
        </div>
      </div>
    </div>
  );
}
