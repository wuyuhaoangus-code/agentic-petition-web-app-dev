/**
 * Shared form definitions for USCIS forms
 * Single source of truth for form data across the application
 */

export interface FormDefinition {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'finished';
  officialLink: string;
  description: string;
  pdfUrl: string;
  examplePdfUrl: string;
}

/**
 * Default USCIS forms required for EB-1A and NIW applications
 * Only includes official government forms (I-140, G-28, G-1145)
 * Personal Statement and Supporting Documentation Index are handled in Personal Information section
 */
export const DEFAULT_FORMS: FormDefinition[] = [
  {
    id: "i140",
    name: "I-140 Petition",
    status: "not_started",
    officialLink: "https://www.uscis.gov/i-140",
    description: "Immigrant Petition for Alien Workers",
    pdfUrl:
      "https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/i140.pdf",
    examplePdfUrl:
      "https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/i140_example.pdf",
  },
  {
    id: "g28",
    name: "G-28 Notice of Appearance",
    status: "not_started",
    officialLink: "https://www.uscis.gov/g-28",
    description:
      "Notice of Entry of Appearance as Attorney or Representative",
    pdfUrl:
      "https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/g28.pdf",
    examplePdfUrl:
      "https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/g28_example.pdf",
  },
  {
    id: "g1145",
    name: "G-1145 E-Notification",
    status: "not_started",
    officialLink: "https://www.uscis.gov/g-1145",
    description:
      "E-Notification of Application/Petition Acceptance",
    pdfUrl:
      "https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/g1145.pdf",
    examplePdfUrl:
      "https://mgbftnkxmbasanzfdpax.supabase.co/storage/v1/object/public/make-604ca09d-official-pdfs/g1145%20_example.pdf",
  },
];

/**
 * Total count of USCIS forms (convenience constant)
 */
export const TOTAL_FORMS_COUNT = DEFAULT_FORMS.length;
