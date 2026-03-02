/**
 * Centralized query keys for TanStack Query.
 * Use these in useQuery/useMutation and invalidateQueries so cache stays consistent.
 */
export const queryKeys = {
  profile: () => ['profile'] as const,
  applications: () => ['applications'] as const,
  personalFiles: (applicationId: string) => ['personal-files', applicationId] as const,
  petitionDocuments: (applicationId: string) => ['petition-documents', applicationId] as const,
  petitionRuns: (applicationId: string) => ['petition-runs', applicationId] as const,
  exhibits: (applicationId: string, runId?: string) => 
    runId ? ['exhibits', applicationId, runId] as const : ['exhibits', applicationId] as const,
  criteriaFiles: (applicationId: string) => ['criteria-files', applicationId] as const,
  allFiles: (applicationId: string) => ['all-files', applicationId] as const,
  sensitiveDescriptions: (applicationId: string) => ['sensitive-descriptions', applicationId] as const,
  forms: (applicationId: string) => ['forms', applicationId] as const,
  formDetail: (formId: string) => ['forms', 'detail', formId] as const,
};