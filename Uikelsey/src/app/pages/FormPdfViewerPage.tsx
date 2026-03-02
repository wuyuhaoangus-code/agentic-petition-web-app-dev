import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Eye, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';

interface FormInfo {
  id: string;
  name: string;
  examplePdfUrl?: string;
  officialLink: string;
}

const FORM_INFO: Record<string, FormInfo> = {
  i140: {
    id: 'i140',
    name: 'I-140 Petition',
    examplePdfUrl:
      'https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/i140_example.pdf',
    officialLink: 'https://www.uscis.gov/i-140',
  },
  g28: {
    id: 'g28',
    name: 'G-28 Notice of Appearance',
    examplePdfUrl:
      'https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/g28_example.pdf',
    officialLink: 'https://www.uscis.gov/g-28',
  },
  g1145: {
    id: 'g1145',
    name: 'G-1145 E-Notification',
    examplePdfUrl:
      'https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/g1145%20_example.pdf',
    officialLink: 'https://www.uscis.gov/g-1145',
  },
};

export function FormPdfViewerPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const formInfo = formId ? FORM_INFO[formId] : null;

  if (!formInfo || !formInfo.examplePdfUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600 mb-6">
            The requested form example could not be found.
          </p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Append toolbar=0 to disable the native download button (view-only intent)
  const iframeSrc = `${formInfo.examplePdfUrl}#toolbar=0&navpanes=0&scrollbar=1`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Forms
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {formInfo.name} — How to Fill
                </h1>
                <p className="text-xs text-gray-500">
                  Reference guide with key fields highlighted
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <Eye className="w-3.5 h-3.5" />
                View Only
              </span>
              {formInfo.officialLink && (
                <a
                  href={formInfo.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    USCIS Official Page
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative">
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0 absolute inset-0"
          title={`${formInfo.name} - How to Fill`}
          style={{ minHeight: 'calc(100vh - 73px)' }}
        />
      </div>
    </div>
  );
}
