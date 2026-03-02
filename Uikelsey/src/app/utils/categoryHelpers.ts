/**
 * File Category Helper Functions
 * Provides centralized category definitions and helper functions
 */

export type FileCategory = 
  // Personal Information Categories
  | 'resumeCV'
  | 'graduation_certificates'
  | 'employment_verification'
  | 'future_plan'              // ✅ Changed from futureplan
  | 'other_personalinfo'
  // Evidence Category
  | 'evidence'
  // Form Categories (细分)
  | 'personal_statement'
  | 'supporting_document'
  | 'I140'
  | 'G28'
  | 'G1145';

export interface CategoryInfo {
  id: FileCategory;
  label: string;
  description: string;
  group: 'personal' | 'evidence' | 'forms';
  hasCriteria: boolean; // Whether this category supports criteria tagging
}

/**
 * Complete category definitions
 */
export const CATEGORY_DEFINITIONS: Record<FileCategory, CategoryInfo> = {
  // Personal Information Categories
  'resumeCV': {
    id: 'resumeCV',
    label: 'Resume / CV',
    description: 'Your current detailed resume or curriculum vitae',
    group: 'personal',
    hasCriteria: false
  },
  'graduation_certificates': {  
    id: 'graduation_certificates',
    label: 'Graduation Certificates',
    description: 'Degree certificates, diplomas, and official transcripts',
    group: 'personal',
    hasCriteria: false
  },
  'employment_verification': {  
    id: 'employment_verification',
    label: 'Employment Verification',
    description: 'Employment confirmation letters and work verification documents',
    group: 'personal',
    hasCriteria: false
  },
  'future_plan': {
    id: 'future_plan',
    label: 'Future Work Plan',
    description: 'Statement describing your proposed endeavor or work plan',
    group: 'personal',
    hasCriteria: false
  },
  'other_personalinfo': {
    id: 'other_personalinfo',
    label: 'Other Personal Documents',
    description: 'Additional personal information and supporting documents',
    group: 'personal',
    hasCriteria: false
  },
  
  // Evidence Category
  'evidence': {
    id: 'evidence',
    label: 'Evidence Files',
    description: 'Evidence files mapped to specific EB-1A/NIW criteria',
    group: 'evidence',
    hasCriteria: true
  },
  
  // Form Categories
  'personal_statement': {
    id: 'personal_statement',
    label: 'Personal Statement',
    description: 'Your personal statement describing your qualifications and achievements',
    group: 'forms',
    hasCriteria: false
  },
  'supporting_document': {
    id: 'supporting_document',
    label: 'Supporting Documents',
    description: 'Additional supporting documents for your petition',
    group: 'forms',
    hasCriteria: false
  },
  'I140': {
    id: 'I140',
    label: 'Form I-140',
    description: 'Immigrant Petition for Alien Worker',
    group: 'forms',
    hasCriteria: false
  },
  'G28': {
    id: 'G28',
    label: 'Form G-28',
    description: 'Notice of Entry of Appearance as Attorney or Accredited Representative (Only required if you have an attorney)',
    group: 'forms',
    hasCriteria: false
  },
  'G1145': {
    id: 'G1145',
    label: 'Form G-1145',
    description: 'E-Notification of Application/Petition Acceptance',
    group: 'forms',
    hasCriteria: false
  }
};

/**
 * Get category display label
 */
export function getCategoryLabel(category: string): string {
  const categoryInfo = CATEGORY_DEFINITIONS[category as FileCategory];
  return categoryInfo?.label || category;
}

/**
 * Get category description
 */
export function getCategoryDescription(category: string): string {
  const categoryInfo = CATEGORY_DEFINITIONS[category as FileCategory];
  return categoryInfo?.description || '';
}

/**
 * Get category group
 */
export function getCategoryGroup(category: string): 'personal' | 'evidence' | 'forms' | 'unknown' {
  const categoryInfo = CATEGORY_DEFINITIONS[category as FileCategory];
  return categoryInfo?.group || 'unknown';
}

/**
 * Check if category supports criteria tagging
 */
export function categoryHasCriteria(category: string): boolean {
  const categoryInfo = CATEGORY_DEFINITIONS[category as FileCategory];
  return categoryInfo?.hasCriteria || false;
}

/**
 * Get all categories by group
 */
export function getCategoriesByGroup(group: 'personal' | 'evidence' | 'forms'): CategoryInfo[] {
  return Object.values(CATEGORY_DEFINITIONS).filter(cat => cat.group === group);
}

/**
 * Get color class for category (for UI badges/tags)
 */
export function getCategoryColor(category: string): string {
  const group = getCategoryGroup(category);
  
  const colorMap: Record<string, string> = {
    'personal': 'bg-blue-100 text-blue-700 border-blue-200',
    'evidence': 'bg-green-100 text-green-700 border-green-200',
    'forms': 'bg-purple-100 text-purple-700 border-purple-200',
    'unknown': 'bg-gray-100 text-gray-700 border-gray-200'
  };
  
  return colorMap[group] || colorMap.unknown;
}

/**
 * Validate if a string is a valid category
 */
export function isValidCategory(category: string): category is FileCategory {
  return category in CATEGORY_DEFINITIONS;
}

/**
 * Normalize legacy category names to new format
 * Provides backward compatibility for old category naming
 */
export function normalizeCategoryName(category: string): FileCategory {
  const legacyMap: Record<string, FileCategory> = {
    'graduationcertificates': 'graduation_certificates',
    'employmentverification': 'employment_verification',
    'futureplan': 'future_plan',                    // ✅ Added
    'personalstatement': 'personal_statement',
    'supportingdocument': 'supporting_document',
  };
  
  return (legacyMap[category] as FileCategory) || (category as FileCategory);
}