import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  FileText,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '@/lib/supabase-info';

interface CaseStatus {
  caseNumber: string;
  status: string;
  lastUpdated: string;
  receivedDate?: string;
  noticeDate?: string;
  description: string;
  history: Array<{
    date: string;
    status: string;
    description: string;
  }>;
}

export function ApplicationTracker() {
  const [caseNumber, setCaseNumber] = useState('');
  const [savedCaseNumber, setSavedCaseNumber] = useState<string | null>(null);
  const [caseStatus, setCaseStatus] = useState<CaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load saved case number from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dreamcard_case_number');
    if (saved) {
      setSavedCaseNumber(saved);
      setCaseNumber(saved);
      // Auto-load the case status if there's a saved number
      handleCheckStatus(saved);
    }
  }, []);

  const handleCheckStatus = async (caseNum?: string) => {
    const numToCheck = caseNum || caseNumber;
    
    if (!numToCheck.trim()) {
      toast.error('Please enter a Case Number');
      return;
    }

    // Validate case number format (basic validation)
    const caseNumPattern = /^[A-Z]{3}\d{10}$/;
    if (!caseNumPattern.test(numToCheck.trim())) {
      toast.error('Invalid Case Number format (e.g., WAC2190012345)');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Save to localStorage
      localStorage.setItem('dreamcard_case_number', numToCheck);
      setSavedCaseNumber(numToCheck);

      // Call Lawful API via our server
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-604ca09d/check-case-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ caseNumber: numToCheck }),
      });

      if (!response.ok) {
        throw new Error('Unable to retrieve case status');
      }

      const data = await response.json();
      setCaseStatus(data);
      toast.success('Case status updated');
    } catch (error) {
      console.error('Error checking case status:', error);
      toast.error('Failed to retrieve case status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCase = () => {
    localStorage.removeItem('dreamcard_case_number');
    setSavedCaseNumber(null);
    setCaseNumber('');
    setCaseStatus(null);
    setHasSearched(false);
    toast.success('Saved Case Number cleared');
  };

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('approved') || lowerStatus.includes('completed')) {
      return <CheckCircle2 className="text-green-600" size={20} />;
    } else if (lowerStatus.includes('received') || lowerStatus.includes('progress')) {
      return <Clock className="text-blue-600" size={20} />;
    } else if (lowerStatus.includes('denied') || lowerStatus.includes('rejected')) {
      return <AlertCircle className="text-red-600" size={20} />;
    }
    return <TrendingUp className="text-amber-600" size={20} />;
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Application Tracker
        </h1>
        <p className="text-sm text-gray-600">
          Track your USCIS application status. Enter your Case Number to view the latest updates.
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Enter Case Number (e.g., WAC2190012345)"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleCheckStatus()}
              className="h-10"
            />
            <p className="text-xs text-gray-500 mt-2">
              Case Number format: 3 letters + 10 digits (e.g., WAC2190012345)
            </p>
          </div>
          <Button
            onClick={() => handleCheckStatus()}
            disabled={isLoading}
            className="h-10 bg-[#434E87] hover:bg-[#3a4272]"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search size={16} className="mr-2" />
                Check
              </>
            )}
          </Button>
        </div>

        {savedCaseNumber && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Saved: <span className="font-mono font-medium text-gray-900">{savedCaseNumber}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCase}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Status Display */}
      {caseStatus && (
        <div className="space-y-6">
          {/* Current Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(caseStatus.status)}
                  <h2 className="text-lg font-semibold text-gray-900">
                    {caseStatus.status}
                  </h2>
                </div>
                <p className="text-sm text-gray-600 font-mono">
                  Case Number: {caseStatus.caseNumber}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCheckStatus()}
                disabled={isLoading}
              >
                <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <p className="text-sm text-gray-700">{caseStatus.description}</p>
            </div>

            {caseStatus.receivedDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <span className="text-gray-500">Received Date: </span>
                  <span className="font-medium text-gray-900">{caseStatus.receivedDate}</span>
                </div>
              </div>
            )}
          </div>

          {/* History Timeline */}
          {caseStatus.history && caseStatus.history.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-serif-display)' }}>
                <FileText size={18} />
                Case History
              </h3>
              <div className="space-y-4">
                {caseStatus.history.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#434E87]/10 flex items-center justify-center flex-shrink-0">
                        {getStatusIcon(item.status)}
                      </div>
                      {index < caseStatus.history.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-baseline justify-between mb-1">
                        <h4 className="font-medium text-gray-900 text-sm">{item.status}</h4>
                        <span className="text-xs text-gray-500">{item.date}</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Helpful Links */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Helpful Links
            </h3>
            <div className="space-y-2">
              <a
                href="https://egov.uscis.gov/casestatus/landing.do"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#434E87] hover:underline"
              >
                <ExternalLink size={14} />
                USCIS Case Status Online
              </a>
              
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!caseStatus && hasSearched && !isLoading && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-serif-display)' }}>
            No Case Information Found
          </h3>
          <p className="text-sm text-gray-600">
            Please check if your Case Number is correct, or try again later.
          </p>
        </div>
      )}

      {/* Initial Empty State */}
      {!caseStatus && !hasSearched && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-[#434E87]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-[#434E87]" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-serif-display)' }}>
            Start Tracking Your Application
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter your USCIS Case Number to view application status and historical updates
          </p>
          <p className="text-xs text-gray-500">
            You can find your Case Number on the USCIS Receipt Notice
          </p>
        </div>
      )}

      {/* Powered by Lawful */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Powered by <span className="font-semibold">Lawful</span> · 
          <a href="#" className="ml-1 text-[#434E87] hover:underline">Configure API Key</a>
        </p>
      </div>
    </div>
  );
}