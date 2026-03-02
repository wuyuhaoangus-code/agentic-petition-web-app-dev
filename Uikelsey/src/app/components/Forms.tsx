import React, { useState, useEffect } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { 
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  X,
  FileText,
  Download,
  Upload,
  RefreshCw,
  BookOpen,
  ExternalLink
} from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "@/lib/supabase-info";
import { toast } from "sonner";
import { queryKeys } from "../../lib/queryKeys";
import { DEFAULT_FORMS, FormDefinition, TOTAL_FORMS_COUNT } from "../constants/forms";
import { formsService } from "../services/formsService";
import { getCurrentUser } from "../../lib/backend";

interface UserForm {
  id: string;
  form_type: string;
  application_id: string;
  file_name: string;
  file_url: string;
  file_size?: number;
  uploaded_at: string;
  status: string;
}

interface Form {
  id: string;
  name: string;
  status: "not_started" | "in_progress" | "finished";
  officialLink: string;
  description: string;
  pdfUrl?: string;
  examplePdfUrl?: string;
  uploadOnly?: boolean;
}

interface FormsProps {
  forms?: Form[];
  onFormStatusChange?: (formId: string, status: Form["status"]) => void;
  applicationId?: string;
}

// ✅ Use shared constant from /src/app/constants/forms.ts
const defaultForms: Form[] = DEFAULT_FORMS;

export function Forms({
  forms: propForms,
  onFormStatusChange,
  applicationId,
}: FormsProps) {
  const queryClient = useQueryClient();
  const forms = propForms || defaultForms;
  const [viewingPdf, setViewingPdf] = useState<{
    form: Form & { savedForm?: UserForm | null };
    url: string;
    title: string;
    subtitle: string;
    isExample?: boolean; // Whether this is an example PDF (view-only, no download)
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<
    string | null
  >(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Failed to fetch user ID:", error);
      }
    };
    fetchUserId();
  }, []);

  // Fetch user forms from backend
  const {
    data: savedForms,
    isLoading: isLoadingForms,
    error: formsQueryError,
  } = useQuery({
    queryKey: queryKeys.forms(applicationId!),
    queryFn: () => formsService.getForms(applicationId!),
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000,   // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,     // 10 minutes - keep in cache for 10 min
    placeholderData: (previousData) => previousData, // ✅ Show cached data immediately
  });

  // Debug: Log query results
  useEffect(() => {
    console.log('📊 [Forms] Query State:', {
      isLoading: isLoadingForms,
      error: formsQueryError?.message,
      savedFormsCount: savedForms?.length ?? 0,
      applicationId,
      savedForms: savedForms?.map(sf => ({
        form_type: sf.form_type,
        file_url: sf.file_url,
        file_name: sf.file_name,
      })),
    });
  }, [savedForms, isLoadingForms, formsQueryError, applicationId]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      formType,
      formName,
    }: {
      file: File;
      formType: string;
      formName: string;
    }) => {
      console.log('🚀 Starting upload mutation:', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type,
        formType, 
        formName, 
        applicationId, 
        userId 
      });
      
      if (!applicationId || !userId) {
        console.error('❌ Upload failed: Missing IDs', { applicationId, userId });
        throw new Error("Application ID or User ID missing");
      }

      // 🔍 DEBUG: Check auth state before upload
      const { getSupabaseClient } = await import('../../lib/backend');
      const supabase = getSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔍 Auth Debug:', {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        passedUserId: userId,
        userIdMatch: session?.user?.id === userId,
        sessionError,
        accessToken: session?.access_token ? 'exists' : 'missing'
      });

      if (!session) {
        console.error('❌ No auth session found! User may not be logged in.');
        throw new Error('Authentication required. Please log in again.');
      }

      if (session.user.id !== userId) {
        console.error('❌ User ID mismatch!', {
          sessionUserId: session.user.id,
          passedUserId: userId
        });
        throw new Error('User ID mismatch. Please refresh the page.');
      }
      
      return formsService.uploadAndSaveForm(
        file,
        applicationId,
        userId,
        formType,
        formName,
      );
    },
    onSuccess: (data) => {
      console.log('✅ Upload successful:', data);
      toast.success("Form uploaded successfully");
      queryClient.invalidateQueries({
        queryKey: queryKeys.forms(applicationId!),
      });
      if (onFormStatusChange) {
        onFormStatusChange(data.form_type, "finished");
      }
    },
    onError: (error: any) => {
      console.error('❌ Upload error:', error);
      toast.error(
        `Upload failed: ${error.message || "Unknown error"}`,
      );
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({
      formId,
      fileUrl,
    }: {
      formId: string;
      fileUrl: string | null;
    }) => {
      if (!applicationId)
        throw new Error("Application ID missing");
      return formsService.deleteForm(
        formId,
        applicationId,
        fileUrl,
      );
    },
    onSuccess: () => {
      toast.success("Form deleted successfully");
      queryClient.invalidateQueries({
        queryKey: queryKeys.forms(applicationId!),
      });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast.error(
        `Delete failed: ${error.message || "Unknown error"}`,
      );
    },
  });

  // Merge saved forms status with default forms
  const formsWithStatus = forms.map((form) => {
    const savedForm = savedForms?.find(
      (sf) => sf.form_type === form.id,
    );
    return {
      ...form,
      status: savedForm?.status || form.status,
      savedForm: savedForm || null,
    };
  });

  // Debug: Log merged forms
  useEffect(() => {
    console.log('🔄 Forms Merged:', formsWithStatus.map(f => ({
      id: f.id,
      status: f.status,
      hasSavedForm: !!f.savedForm,
      savedFormType: f.savedForm?.form_type,
      savedFormUrl: f.savedForm?.file_url
    })));
  }, [formsWithStatus]);

  const handleFileUpload = (
    formId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const form = formsWithStatus.find((f) => f.id === formId);
      if (form) {
        uploadMutation.mutate({
          file,
          formType: formId,
          formName: form.name,
        });
      }
    } else {
      toast.error("Please upload a PDF file");
    }
    // Reset input
    event.target.value = "";
  };

  const handleViewUploadedFile = async (formId: string) => {
    const form = formsWithStatus.find((f) => f.id === formId);
    if (form && form.savedForm?.file_url) {
      try {
        // Get signed URL for private file
        const signedUrl = await formsService.getSignedUrl(form.savedForm.file_url);
        setViewingPdf({
          form,
          url: signedUrl,
          title: form.name,
          subtitle: "Your uploaded form",
          isExample: false,
        });
      } catch (error) {
        console.error('Failed to get signed URL:', error);
        toast.error('Failed to load file preview');
      }
    }
  };

  const handleViewExample = (formId: string) => {
    const form = formsWithStatus.find((f) => f.id === formId);
    if (form && form.examplePdfUrl) {
      setViewingPdf({
        form,
        url: form.examplePdfUrl,
        title: `${form.name} - How to Fill`,
        subtitle: "Reference guide with key fields highlighted — view only, not downloadable",
        isExample: true,
      });
    }
  };

  const handleRemoveUploadedFile = (formId: string) => {
    const form = formsWithStatus.find((f) => f.id === formId);
    if (form && form.savedForm) {
      deleteMutation.mutate({
        formId: form.savedForm.id, // ✅ Use database ID, not form.id
        fileUrl: form.savedForm.file_url,
      });
    }
  };

  return (
    <div className="flex flex-row gap-6 max-w-7xl">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Forms · Documents
          </h1>
          <p className="text-sm text-gray-500">
            Complete and upload administrative forms required for
            your petition.
          </p>
        </div>

        {/* Forms List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {formsWithStatus.map((form) => (
              <FormRow
                key={form.id}
                form={form}
                onFileUpload={handleFileUpload}
                onViewFile={handleViewUploadedFile}
                onViewExample={handleViewExample}
                onRemoveFile={handleRemoveUploadedFile}
                deleteConfirmId={deleteConfirmId}
                setDeleteConfirmId={setDeleteConfirmId}
              />
            ))}
          </div>
        </div>

        {/* PDF Viewer Modal */}
        {viewingPdf && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {viewingPdf.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {viewingPdf.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {viewingPdf.isExample && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <Eye className="w-3.5 h-3.5" />
                      View Only
                    </span>
                  )}
                  <button
                    onClick={() => setViewingPdf(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 overflow-hidden relative">
                <iframe
                  src={
                    viewingPdf.isExample
                      ? `${viewingPdf.url}#toolbar=0&navpanes=0&scrollbar=1`
                      : viewingPdf.url
                  }
                  className="w-full h-full border-0"
                  title={viewingPdf.title}
                  sandbox={
                    viewingPdf.isExample
                      ? "allow-same-origin allow-scripts"
                      : undefined
                  }
                />
                {/* Overlay to block right-click on example PDFs */}
                {viewingPdf.isExample && (
                  <div
                    className="absolute top-0 right-0 w-12 h-12"
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ pointerEvents: "auto" }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="bg-white rounded-lg border border-gray-200 sticky top-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Forms Overview
            </h3>
            <p className="text-xs text-gray-500">
              {
                formsWithStatus.filter(
                  (f) => f.status === "finished",
                ).length
              }{" "}
              of {formsWithStatus.length} forms completed
            </p>
          </div>

          <div className="p-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#434E87]" />
                Form Completion Tips
              </h4>
              <ul className="text-xs text-gray-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#434E87] font-bold mt-0.5">
                    •
                  </span>
                  <span>
                    Download blank forms, fill them out, then upload
                    completed versions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#434E87] font-bold mt-0.5">
                    •
                  </span>
                  <span>
                    Use "How to Fill" guides to see examples and
                    instructions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#434E87] font-bold mt-0.5">
                    •
                  </span>
                  <span>
                    All forms must be uploaded as PDF files
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#434E87] font-bold mt-0.5">
                    •
                  </span>
                  <span>
                    Review all forms before final submission
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#434E87] font-bold mt-0.5">
                    •
                  </span>
                  <span>
                    G-28 form only needed if you have an attorney
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

interface FormRowProps {
  form: Form & { savedForm?: UserForm | null };
  onFileUpload: (
    formId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onViewFile: (formId: string) => void;
  onViewExample: (formId: string) => void;
  onRemoveFile: (formId: string) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
}

function FormRow({
  form,
  onFileUpload,
  onViewFile,
  onViewExample,
  onRemoveFile,
  deleteConfirmId,
  setDeleteConfirmId,
}: FormRowProps) {
  const hasUploadedFile = !!form.savedForm?.file_url;
  const isUSCISForm = !!(form.pdfUrl || form.examplePdfUrl);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "finished":
        return (
          <CheckCircle2 className="w-5 h-5 text-green-600" />
        );
      case "in_progress":
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "finished":
        return "Uploaded";
      case "in_progress":
        return "In Progress";
      default:
        return "Not Uploaded";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finished":
        return "text-green-600 bg-green-50";
      case "in_progress":
        return "text-amber-600 bg-amber-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50/50 transition-colors">
      <div className="flex gap-6">
        {/* Status Icon - Left */}
        <div className="flex-shrink-0 pt-0.5">
          {getStatusIcon(form.status)}
        </div>

        {/* Content - Center */}
        <div className="flex-1 min-w-0">
          {/* Title and Link */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-900">
              {form.name}
            </h3>
            {form.officialLink !== "#" && (
              <a
                href={form.officialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-gray-400 hover:text-[#434E87] transition-colors"
                title="View USCIS Official Page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-3">
            {form.description}
          </p>

          {/* Status Badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status)}`}
            >
              {getStatusText(form.status)}
            </span>
          </div>

          {/* Uploaded File Info */}
          {hasUploadedFile && (
            <div className="mt-3 max-w-md">
              <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 shadow-sm">
                {/* File icon */}
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />

                {/* File name */}
                <span className="truncate flex-1 text-sm text-gray-700 font-normal">
                  {form.savedForm.file_name}
                </span>

                {/* File size */}
                <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                  {form.savedForm.file_size
                    ? `(${(form.savedForm.file_size / 1024 / 1024).toFixed(1)}MB)`
                    : ""}
                </span>

                {/* Preview button */}
                <button
                  onClick={() => onViewFile(form.id)}
                  className="p-1 text-gray-400 hover:text-[#434E87] transition-colors rounded hover:bg-gray-100 flex-shrink-0"
                  title="Preview file"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Delete button with confirmation */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setDeleteConfirmId(form.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-gray-100"
                    title="Delete file"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Delete Confirmation Popup */}
                  {deleteConfirmId === form.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-48">
                      <p className="text-xs text-gray-700 mb-2">
                        Delete this file?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onRemoveFile(form.id)}
                          className="flex-1 px-2 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-800"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="flex-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reference Buttons: How to Fill + Download (only for USCIS forms) */}
          {isUSCISForm && (form.examplePdfUrl || form.pdfUrl) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {/* How to Fill Button - Navigate to new page */}
              {form.examplePdfUrl && (
                <Link to={`/dashboard/forms/${form.id}/how-to-fill`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 text-xs gap-1.5 border-gray-300 hover:border-[#434E87] hover:bg-[#434E87]/5 text-gray-700 hover:text-[#434E87]"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    How to Fill?
                  </Button>
                </Link>
              )}

              {/* Download Button */}
              {form.pdfUrl && (
                <a
                  href={form.pdfUrl}
                  download={`${form.id}.pdf`}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-4 text-xs gap-1.5 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Form
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Upload Button - Right Side */}
        <div className="flex-shrink-0 flex items-start pt-0.5">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => onFileUpload(form.id, e)}
            />
            <Button
              variant={hasUploadedFile ? "outline" : "default"}
              size="sm"
              className={`h-8 px-4 text-xs gap-1.5 whitespace-nowrap ${
                hasUploadedFile
                  ? "border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700"
                  : "bg-gray-900 hover:bg-gray-800 text-white"
              }`}
              asChild
            >
              <span>
                {hasUploadedFile ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    Re-upload
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}