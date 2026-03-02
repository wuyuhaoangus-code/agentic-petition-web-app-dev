// Category mapping utilities
// Maps frontend field names to database category values

export const FRONTEND_TO_DB_CATEGORY = {
  'degrees': 'resumeCV',
  'certificates': 'graduationcertificates',
  'employment': 'employmentverification',
  'futurePlan': 'futureplan',
  'others': 'other_personalinfo'
} as const;

export const DB_TO_FRONTEND_CATEGORY = {
  'resumeCV': 'degrees',
  'graduationcertificates': 'certificates',
  'employmentverification': 'employment',
  'futureplan': 'futurePlan',
  'other_personalinfo': 'others'
} as const;

export const ALL_CATEGORIES = {
  EVIDENCE: 'evidence',
  RESUME_CV: 'resumeCV',
  GRADUATION_CERTIFICATES: 'graduationcertificates',
  EMPLOYMENT_VERIFICATION: 'employmentverification',
  FUTURE_PLAN: 'futureplan',
  OTHER_PERSONAL_INFO: 'other_personalinfo',
  FORM: 'form'
} as const;

export const CATEGORY_LABELS = {
  'evidence': 'Evidence (Criteria Mapping / NIW)',
  'resumeCV': 'Resume / CV',
  'graduationcertificates': 'Graduation Certificates',
  'employmentverification': 'Employment Verification',
  'futureplan': 'Future Work Plan',
  'other_personalinfo': 'Other Personal Info',
  'form': 'Form'
} as const;

export const PERSONAL_INFO_CATEGORIES = [
  'resumeCV',
  'graduationcertificates',
  'employmentverification',
  'futureplan',
  'other_personalinfo'
] as const;

// Helper functions
export function frontendToDbCategory(frontendField: keyof typeof FRONTEND_TO_DB_CATEGORY): string {
  return FRONTEND_TO_DB_CATEGORY[frontendField];
}

export function dbToFrontendCategory(dbCategory: keyof typeof DB_TO_FRONTEND_CATEGORY): string {
  return DB_TO_FRONTEND_CATEGORY[dbCategory];
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category;
}

export function isPersonalInfoCategory(category: string): boolean {
  return PERSONAL_INFO_CATEGORIES.includes(category as any);
}

export type FrontendCategory = keyof typeof FRONTEND_TO_DB_CATEGORY;
export type DbCategory = keyof typeof DB_TO_FRONTEND_CATEGORY | 'evidence' | 'form';
