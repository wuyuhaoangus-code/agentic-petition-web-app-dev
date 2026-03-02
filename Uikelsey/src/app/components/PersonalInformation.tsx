import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Upload, FileText, Plus, X, Lightbulb, Info, Eye, File, Loader2 } from 'lucide-react';
import { profileService } from '../admin/services/profileService';
import { toast } from 'sonner';
import { criteriaService } from '../services/criteriaService';
import { queryKeys } from '../../lib/queryKeys';

/** File item with optional backend id for delete; name/size for display. */
export interface PersonalInfoFileItem {
  id?: string;
  name: string;
  size: number;
  type?: string;
  lastModified?: number;
}

export type PersonalInfoUploads = {
  degrees: PersonalInfoFileItem[];
  certificates: PersonalInfoFileItem[];
  employment: PersonalInfoFileItem[];
  futurePlan: PersonalInfoFileItem[];
  others: PersonalInfoFileItem[];
};

const PERSONAL_FILES_CATEGORIES = ['resumeCV', 'graduation_certificates', 'employment_verification', 'future_plan', 'other_personalinfo'] as const;
const CATEGORY_MAP: Record<string, keyof PersonalInfoUploads> = {
  'resumeCV': 'degrees',
  'graduation_certificates': 'certificates',
  'employment_verification': 'employment',
  'future_plan': 'futurePlan',
  'other_personalinfo': 'others'
};

/** Fetcher for personal-info files by application (used by useQuery and prefetch). */
export async function fetchPersonalFilesForApplication(applicationId: string): Promise<PersonalInfoUploads> {
  const allFiles = await Promise.all(
    PERSONAL_FILES_CATEGORIES.map(cat => criteriaService.getFiles(applicationId, cat as any))
  );
  const filesPerCategory: PersonalInfoUploads = {
    degrees: [],
    certificates: [],
    employment: [],
    futurePlan: [],
    others: []
  };
  allFiles.forEach((filesInCategory, index) => {
    const backendCategory = PERSONAL_FILES_CATEGORIES[index];
    const frontendCategory = CATEGORY_MAP[backendCategory];
    filesInCategory.forEach((file: { id: string; name: string; size: number; upload_date?: string; file_type?: string }) => {
      filesPerCategory[frontendCategory].push({
        id: file.id,
        name: file.name,
        size: file.size ?? 0,
        type: file.file_type || 'application/octet-stream',
        lastModified: file.upload_date ? new Date(file.upload_date).getTime() : undefined
      });
    });
  });
  return filesPerCategory;
}

interface PersonalInformationProps {
  onAddFiles?: (files: File[], category: string) => void;
  onRemoveFile?: (fileName: string) => void;
  isNIW?: boolean;
  applicationId?: string;  // ✅ Add applicationId prop
}

export function PersonalInformation({ onAddFiles, onRemoveFile, isNIW = false, applicationId }: PersonalInformationProps) {
  // Safely get queryClient with fallback
  let queryClient;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    console.warn('QueryClient not available in PersonalInformation, some features may not work');
  }
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    occupation: '',
    field: '',
  });

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, error: profileError } = useQuery({
    queryKey: queryKeys.profile(),
    queryFn: () => profileService.getProfile(),
  });

  const { data: filesData, isLoading: isFilesLoading } = useQuery({
    queryKey: queryKeys.personalFiles(applicationId!),
    queryFn: () => fetchPersonalFilesForApplication(applicationId!),
    enabled: !!applicationId,
  });

  const isLoading = isProfileLoading || (!!applicationId && isFilesLoading);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        middleName: '',
        occupation: profile.occupation || '',
        field: profile.field || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (isProfileError && profileError) {
      toast.error(`Failed to load profile: ${profileError instanceof Error ? profileError.message : 'Unknown error'}`);
    }
  }, [isProfileError, profileError]);

  useEffect(() => {
    if (filesData) setUploads(filesData);
  }, [filesData]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await profileService.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        occupation: formData.occupation,
        field: formData.field,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile() });
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Animated placeholder examples
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const examples = [
    { occupation: 'tennis coach', field: 'professional tennis coaching and player development' },
    { occupation: 'machine learning engineer', field: 'artificial intelligence specializing in large language models' },
    { occupation: 'product manager', field: 'digital gaming industry' },
  ];

  // Rotate examples every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % examples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [proposedEndeavor, setProposedEndeavor] = useState({
    title: '',
    gap: '',
    whatYouWillDo: '',
    beneficiaries: '',
    howToAdvance: '',
  });

  const [uploads, setUploads] = useState<PersonalInfoUploads>({
    degrees: [],
    certificates: [],
    employment: [],
    futurePlan: [],
    others: []
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [previewFile, setPreviewFile] = useState<{ file: PersonalInfoFileItem; title: string } | null>(null);

  const handleFileChange = async (category: keyof PersonalInfoUploads, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFile = e.target.files[0]; // Only take the first file
      
      // ✅ Check if applicationId exists
      if (!applicationId) {
        console.error('❌ No applicationId provided');
        toast.error('Cannot upload file: No application ID');
        return;
      }
      
      // ✅ For "others" category, allow multiple files (don't delete existing)
      // For other categories, replace the existing file
      if (category !== 'others') {
        // If there's already a file, delete it from DB first (so we don't orphan rows)
        const existing = uploads[category][0];
        if (existing?.id && applicationId) {
          try {
            await criteriaService.deleteFile(existing.id, applicationId);
          } catch (e) {
            console.warn('Could not delete previous file from DB:', e);
          }
        }
        if (uploads[category].length > 0 && onRemoveFile) {
          onRemoveFile(uploads[category][0].name);
        }
      }

      try {
        // ✅ Map frontend category to database category
        const categoryMap = {
          'degrees': 'resumeCV',
          'certificates': 'graduation_certificates',
          'employment': 'employment_verification',
          'futurePlan': 'future_plan',
          'others': 'other_personalinfo'
        };
        const criteriaMap = {
          'degrees': ['personal_info'],
          'certificates': ['personal_info'],
          'employment': ['personal_info'],
          'futurePlan': ['future_plan'],
          'others': ['personal_info']
        };
        
        const dbCategory = categoryMap[category];
        const dbCriteria = criteriaMap[category];
        
        console.log(`📤 Uploading ${category} file with database category: ${dbCategory}, criteria:`, dbCriteria);
        
        // ✅ Upload to backend
        const uploadedFile = await criteriaService.uploadAndSaveFile(
          newFile,
          applicationId,
          dbCriteria,
          false,  // Not sensitive
          dbCategory
        );
        
        console.log('✅ File uploaded successfully:', uploadedFile);
        toast.success(`${category === 'others' ? 'Document' : category} uploaded successfully`);

        if (applicationId) {
          queryClient.invalidateQueries({ queryKey: queryKeys.personalFiles(applicationId) });
        }
        
        // ✅ For "others", append to existing files; for other categories, replace
        if (category === 'others') {
          setUploads(prev => ({
            ...prev,
            [category]: [...prev[category], {
              id: uploadedFile.id,
              name: uploadedFile.name,
              size: uploadedFile.size,
              type: newFile.type,
              lastModified: Date.now()
            }]
          }));
        } else {
          setUploads(prev => ({
            ...prev,
            [category]: [{
              id: uploadedFile.id,
              name: uploadedFile.name,
              size: uploadedFile.size,
              type: newFile.type,
              lastModified: Date.now()
            }]
          }));
        }
        
        // Notify parent component (optional)
        if (onAddFiles) {
          onAddFiles([newFile], 'Personal Information');
        }
      } catch (error: any) {
        console.error('❌ Upload failed:', error);
        toast.error(`Upload failed: ${error.message}`);
      }
    }
  };

  const removeFile = async (category: keyof PersonalInfoUploads, index: number) => {
    const fileToRemove = uploads[category][index];
    if (fileToRemove?.id && applicationId) {
      try {
        await criteriaService.deleteFile(fileToRemove.id, applicationId);
        toast.success('File removed');
        queryClient.invalidateQueries({ queryKey: queryKeys.personalFiles(applicationId) });
      } catch (e) {
        console.error('Failed to delete file:', e);
        toast.error('Failed to remove file. Please try again.');
        return;
      }
    }
    setUploads(prev => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index)
    }));
    if (onRemoveFile && fileToRemove) {
      onRemoveFile(fileToRemove.name);
    }
  };

  const handleEndeavorChange = (field: keyof typeof proposedEndeavor, value: string) => {
    setProposedEndeavor(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-5xl space-y-10 animate-in fade-in duration-300">
      
      {/* Header - Simplified */}
      <div className="border-b border-gray-100 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Personal Information</h1>
          <p className="text-sm text-gray-500">
            Manage your personal details and essential background documents.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || isLoading}
          className="bg-[#434E87] hover:bg-[#323b6b] text-white shadow-sm h-9"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Personal Details - Cleaner Form */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          Petitioner Details
        </h2>
        
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
          {/* Name Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">First Name</label>
              <input 
                type="text" 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all"
                placeholder="e.g. John"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Middle Name <span className="text-gray-400">(Optional)</span></label>
              <input 
                type="text" 
                value={formData.middleName}
                onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Last Name</label>
              <input 
                type="text" 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all"
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Professional Fields Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Occupation</label>
              <input 
                type="text" 
                value={formData.occupation}
                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all"
                placeholder={`e.g. ${examples[currentExampleIndex].occupation}`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Field of Expertise</label>
              <input 
                type="text" 
                value={formData.field}
                onChange={(e) => setFormData({...formData, field: e.target.value})}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all"
                placeholder={`e.g. ${examples[currentExampleIndex].field}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Proposed Endeavor Section - Only for NIW */}
      {isNIW && (
        <section className="animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Proposed Endeavor
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-medium rounded-full border border-amber-100">
              <Info className="w-3 h-3" />
              Critical for NIW
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-600 leading-relaxed">
                Your Proposed Endeavor is the core of your NIW petition. It defines specifically what you plan to do in the U.S. and why it matters. 
                Avoid generic job titles like "Software Engineer". Be specific about your project or focus.
              </p>
            </div>

            <div className="p-5 space-y-6">
              
              {/* Field 1: Endeavor Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 block">
                  1. Endeavor Title <span className="text-gray-400 font-normal">(One sentence summary)</span>
                </label>
                <input 
                  type="text" 
                  value={proposedEndeavor.title}
                  onChange={(e) => handleEndeavorChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all"
                  placeholder="e.g. Developing AI-driven diagnostic tools for early cancer detection in rural clinics."
                />
              </div>

              {/* Field 2: Problem / Gap */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 block">
                  2. Problem / Gap <span className="text-gray-400 font-normal">(What urgent problem are you solving?)</span>
                </label>
                <textarea 
                  rows={3}
                  value={proposedEndeavor.gap}
                  onChange={(e) => handleEndeavorChange('gap', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all resize-none"
                  placeholder="Example: Current diagnostic methods are expensive and require specialized equipment unavailable in rural areas, leading to late-stage diagnoses and higher mortality rates."
                />
              </div>

              {/* Field 3: What you will do */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 block">
                  3. What You Will Do <span className="text-gray-400 font-normal">(Specific project goals & technical approach)</span>
                </label>
                <textarea 
                  rows={3}
                  value={proposedEndeavor.whatYouWillDo}
                  onChange={(e) => handleEndeavorChange('whatYouWillDo', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all resize-none"
                  placeholder="Example: I will design and train a lightweight deep learning model capable of running on mobile devices to analyze medical images with 95% accuracy..."
                />
              </div>

              {/* Field 4: Who benefits & why national */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 block">
                  4. National Importance <span className="text-gray-400 font-normal">(Who benefits? Why does the U.S. care?)</span>
                </label>
                <textarea 
                  rows={3}
                  value={proposedEndeavor.beneficiaries}
                  onChange={(e) => handleEndeavorChange('beneficiaries', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all resize-none"
                  placeholder="Example: This will improve healthcare outcomes for millions of Americans in underserved areas, reduce national healthcare costs, and advance U.S. leadership in medical AI technology."
                />
              </div>

              {/* Field 5: Where/how you’ll advance it */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 block">
                  5. Execution Plan <span className="text-gray-400 font-normal">(Employer, entrepreneurship, or research path?)</span>
                </label>
                <textarea 
                  rows={2}
                  value={proposedEndeavor.howToAdvance}
                  onChange={(e) => handleEndeavorChange('howToAdvance', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#434E87]/20 focus:border-[#434E87] transition-all resize-none"
                  placeholder="Example: I will advance this work as a Senior Research Scientist at [Company Name], leveraging their proprietary dataset and computing infrastructure."
                />
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Documents - Compact List Layout */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          Documents
        </h2>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm overflow-hidden">
          {/* Resume */}
          <DocumentRow 
            rowId="resume"
            title="Resume / CV"
            description="Your current detailed resume."
            files={uploads.degrees}
            required
            onUpload={(e) => handleFileChange('degrees', e)}
            onRemove={(i) => removeFile('degrees', i)}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            previewFile={previewFile}
            setPreviewFile={setPreviewFile}
          />

          {/* Graduation Certificates */}
          <DocumentRow 
            rowId="certificates"
            title="Graduation Certificates"
            description="Transcripts or official completion letters."
            files={uploads.certificates}
            onUpload={(e) => handleFileChange('certificates', e)}
            onRemove={(i) => removeFile('certificates', i)}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            previewFile={previewFile}
            setPreviewFile={setPreviewFile}
          />

          {/* Employment Verification */}
          <DocumentRow 
            rowId="employment"
            title="Employment Verification"
            description="Letters from employers confirming tenure."
            files={uploads.employment}
            onUpload={(e) => handleFileChange('employment', e)}
            onRemove={(i) => removeFile('employment', i)}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            previewFile={previewFile}
            setPreviewFile={setPreviewFile}
          />

          {/* Future Work Plan - Only show file upload if NOT NIW, or as supplemental for NIW */}
          <DocumentRow 
            rowId="futurePlan"
            title={isNIW ? "Additional Endeavor Documents" : "Future Work Plan"}
            description={isNIW ? "Business plan, pitch deck, or detailed technical diagrams (Optional)." : "Statement describing your proposed endeavor."}
            files={uploads.futurePlan}
            onUpload={(e) => handleFileChange('futurePlan', e)}
            onRemove={(i) => removeFile('futurePlan', i)}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            previewFile={previewFile}
            setPreviewFile={setPreviewFile}
          />

          {/* Other Documents */}
          <DocumentRow 
            rowId="others"
            title="Other Documents"
            description="Personal Statement, supporting materials, etc. You can upload multiple documents."
            files={uploads.others}
            onUpload={(e) => handleFileChange('others', e)}
            onRemove={(i) => removeFile('others', i)}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            previewFile={previewFile}
            setPreviewFile={setPreviewFile}
          />
        </div>
      </section>

      {/* Preview Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-[#434E87]" />
                <div>
                  <h3 className="font-semibold text-gray-900">{previewFile.file.name}</h3>
                  <p className="text-xs text-gray-500">{previewFile.title}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">File Preview</p>
                <p className="text-sm text-gray-500">
                  Preview functionality will be implemented with backend integration.
                </p>
                <div className="mt-4 text-xs text-gray-400">
                  <p>File: {previewFile.file.name}</p>
                  <p>Size: {(previewFile.file.size / 1024).toFixed(2)} KB</p>
                  <p>Type: {previewFile.file.type || 'Unknown'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                onClick={() => setPreviewFile(null)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentRow({
  rowId,
  title,
  description,
  files,
  required,
  onUpload,
  onRemove,
  deleteConfirmId,
  setDeleteConfirmId,
  previewFile,
  setPreviewFile
}: {
  rowId: string;
  title: string;
  description: string;
  files: PersonalInfoFileItem[];
  required?: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  previewFile: { file: PersonalInfoFileItem; title: string } | null;
  setPreviewFile: (file: { file: PersonalInfoFileItem; title: string } | null) => void;
}) {
  // ✅ Determine if this is the "others" category which allows multiple files
  const allowsMultipleFiles = rowId === 'others';
  
  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-start group transition-colors hover:bg-gray-50/50">
      {/* Icon & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {required && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{description}</p>
        
        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mt-3 space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-1.5 max-w-md shadow-sm">
                <FileText className="w-3.5 h-3.5 text-[#434E87] flex-shrink-0" />
                <span className="truncate flex-1 text-xs">{file.name}</span>
                <span className="text-[10px] text-gray-400 flex-shrink-0">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                
                {/* Action buttons container */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Preview button */}
                  <button
                    onClick={() => setPreviewFile({file, title})}
                    className="p-1 text-gray-400 hover:text-[#434E87] transition-colors rounded hover:bg-gray-100"
                    title="Preview file"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Delete button with confirmation */}
                  <div className="relative">
                    <button 
                      onClick={() => setDeleteConfirmId(`${rowId}-${idx}`)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-gray-100"
                      title="Delete file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    
                    {/* Delete Confirmation Popup - use rowId+index so same file in different categories doesn't show both */}
                    {deleteConfirmId === `${rowId}-${idx}` && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-48">
                        <p className="text-xs text-gray-700 mb-2">Delete this file?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              onRemove(idx);
                              setDeleteConfirmId(null);
                            }}
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
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="flex-shrink-0 pt-0.5">
        <div className="relative">
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-[5]"
            onChange={onUpload}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className={`h-8 text-xs gap-1.5 relative z-[1] whitespace-nowrap ${
              files.length > 0 
                ? 'border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300' 
                : 'border-dashed border-gray-300 text-gray-500 hover:border-[#434E87] hover:text-[#434E87] hover:bg-[#434E87]/5'
            }`}
          >
            {files.length > 0 ? (
              <>
                <Upload className="w-3.5 h-3.5" />
                {allowsMultipleFiles ? 'Add More' : 'Replace'}
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}