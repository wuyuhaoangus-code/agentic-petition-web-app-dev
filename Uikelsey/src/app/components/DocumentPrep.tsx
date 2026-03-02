import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, Download, Search, Filter, Calendar, FolderOpen, Eye, X, File } from 'lucide-react';
import { Button } from './ui/button';
import { criteriaService } from '../services/criteriaService';
import { toast } from 'sonner';
import { queryKeys } from '../../lib/queryKeys';

interface BackendFile {
  id: string;
  name: string;
  size: number;
  upload_date: string;
  category: string;
  url?: string;
}

interface DocumentPrepProps {
  applicationId: string | null;
}

export function DocumentPrep({ applicationId }: DocumentPrepProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Preview modal state
  const [previewFile, setPreviewFile] = useState<BackendFile | null>(null);

  // ✅ Use React Query to fetch files with caching
  const { data: files = [], isLoading } = useQuery({
    queryKey: queryKeys.allFiles(applicationId || ''),
    queryFn: () => {
      if (!applicationId) return [];
      return criteriaService.getFiles(applicationId);
    },
    enabled: !!applicationId,
    staleTime: 5 * 60 * 1000,   // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,     // 10 minutes - keep in cache for 10 min
    placeholderData: (previousData) => previousData, // ✅ Show cached data immediately
  });

  // Sort files by upload date (newest first)
  const sortedFiles = [...files].sort((a, b) => 
    new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
  );

  // Filter files
  const filteredFiles = sortedFiles.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(files.map(f => f.category)));

  const formatDate = (date: string) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: new Date(date).getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      // Personal Information categories
      'resumeCV': 'Resume/CV',
      'graduation_certificates': 'Graduation Certificates',
      'employment_verification': 'Employment Verification',
      'future_plan': 'Future Work Plan',
      'other_personalinfo': 'Other Personal Info',
      
      // Evidence categories
      'evidence': 'Evidence',
      
      // Forms categories
      'personal_statement': 'Personal Statement',
      'supporting_document': 'Supporting Document',
      'I140': 'Form I-140',
      'G28': 'Form G-28',
      'G1145': 'Form G-1145',
      
      // Legacy support
      'degrees': 'Education Degrees',
      'certificates': 'Graduation Certificates',
      'employment': 'Employment Verification',
      'futurePlan': 'Future Work Plan',
      'others': 'Other Documents'
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      // Personal Information - Blue tones
      'resumeCV': 'bg-blue-100 text-blue-700',
      'graduation_certificates': 'bg-cyan-100 text-cyan-700',
      'employment_verification': 'bg-sky-100 text-sky-700',
      'future_plan': 'bg-indigo-100 text-indigo-700',
      'other_personalinfo': 'bg-slate-100 text-slate-700',
      
      // Evidence - Purple/Violet tones
      'evidence': 'bg-purple-100 text-purple-700',
      
      // Forms - Green/Emerald tones
      'personal_statement': 'bg-emerald-100 text-emerald-700',
      'supporting_document': 'bg-green-100 text-green-700',
      'I140': 'bg-teal-100 text-teal-700',
      'G28': 'bg-lime-100 text-lime-700',
      'G1145': 'bg-green-100 text-green-700',
      
      // Legacy support
      'degrees': 'bg-blue-100 text-blue-700',
      'certificates': 'bg-green-100 text-green-700',
      'employment': 'bg-purple-100 text-purple-700',
      'futurePlan': 'bg-amber-100 text-amber-700',
      'others': 'bg-slate-100 text-slate-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // Handle file deletion
  const handleDeleteFile = async (fileId: string) => {
    if (!applicationId) return;
    
    try {
      await criteriaService.deleteFile(fileId, applicationId);
      // ✅ Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.allFiles(applicationId) });
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Failed to delete file:', error);
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents Preparation</h1>
        <p className="text-sm text-gray-500">
          View and organize all your uploaded documents. Files are automatically categorized based on where you uploaded them.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white cursor-pointer min-w-[200px]"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{files.length} Total Files</span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span>{categories.length} Categories</span>
          </div>
          {filterCategory !== 'all' && (
            <div className="text-primary font-medium">
              Filtered: {filteredFiles.length} files
            </div>
          )}
        </div>
      </div>

      {/* Files List */}
      {filteredFiles.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {files.length === 0 ? 'No documents uploaded yet' : 'No files match your search'}
          </h3>
          <p className="text-xs text-gray-500">
            {files.length === 0 
              ? 'Upload documents from the Basic Info page to get started'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFiles.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#434E87] flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-md">
                            {item.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(item.upload_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 relative">
                        {/* Preview button */}
                        <button
                          onClick={() => setPreviewFile(item)}
                          className="p-1.5 text-gray-400 hover:text-[#434E87] transition-colors rounded hover:bg-gray-100"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Download button */}
                        <button
                          onClick={() => {
                            const url = URL.createObjectURL(new Blob([item.url as ArrayBuffer]));
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = item.name;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#434E87] transition-colors rounded hover:bg-gray-100"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        {/* Delete button */}
                        <div className="relative">
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          {/* Delete Confirmation Popup */}
                          {deleteConfirmId === item.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-48">
                              <p className="text-xs text-gray-700 mb-2">Delete this file?</p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    handleDeleteFile(item.id);
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
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
                  <h3 className="font-semibold text-gray-900">{previewFile.name}</h3>
                  <p className="text-xs text-gray-500">{getCategoryLabel(previewFile.category)}</p>
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
                <div className="mt-4 text-xs text-gray-400 space-y-1">
                  <p>File: {previewFile.name}</p>
                  <p>Size: {(previewFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Type: {previewFile.url ? 'PDF' : 'Unknown'}</p>
                  <p>Uploaded: {formatDate(previewFile.upload_date)}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
              <Button
                onClick={() => {
                  const url = URL.createObjectURL(new Blob([previewFile.url as ArrayBuffer]));
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = previewFile.name;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                variant="outline"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
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