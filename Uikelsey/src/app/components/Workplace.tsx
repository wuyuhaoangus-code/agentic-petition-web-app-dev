import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { EB1AOverview } from './EB1AOverview';
import { Toaster } from 'sonner';
import { Wrench, Check, X } from 'lucide-react';

interface WorkplaceProps {
  user: {
    email: string;
    name?: string;
    isPaidUser?: boolean;
  };
  applicationType: 'niw' | 'eb1a' | null;
  onSignOut: () => void;
  onBackToHome?: () => void;
  onCreateNew?: () => void;
  devPaidOverride?: boolean | null;
  setDevPaidOverride?: (value: boolean | null) => void;
}

export function Workplace({ 
  user, 
  applicationType, 
  onSignOut, 
  onBackToHome, 
  onCreateNew,
  devPaidOverride: externalDevPaidOverride,
  setDevPaidOverride: externalSetDevPaidOverride
}: WorkplaceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔧 Development: Temporary paid/unpaid toggle - use external state if provided, otherwise local
  const [localDevPaidOverride, localSetDevPaidOverride] = useState<boolean | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);
  
  const devPaidOverride = externalDevPaidOverride !== undefined ? externalDevPaidOverride : localDevPaidOverride;
  const setDevPaidOverride = externalSetDevPaidOverride || localSetDevPaidOverride;

  // Calculate effective paid status
  const effectivePaidStatus = devPaidOverride !== null ? devPaidOverride : (user.isPaidUser || false);

  // Create modified user object with override
  const effectiveUser = {
    ...user,
    isPaidUser: effectivePaidStatus
  };

  // Determine initial tab based on current route
  const getInitialTab = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/overview')) return 'overview';
    if (path.includes('/dashboard/my-petition')) return 'petition_letter_editor';
    if (path.includes('/dashboard/expert-review')) return 'criteria_mapping';
    if (path.includes('/dashboard/forms')) return 'forms';
    if (path.includes('/dashboard/export-package')) {
      // Check if it's the details page
      const pathParts = path.split('/');
      if (pathParts[pathParts.length - 1] !== 'export-package') {
        return 'export_package_details';
      }
      return 'export_package';
    }
    if (path.includes('/dashboard/settings')) return 'account';
    return 'overview';
  };

  return (
    <>
      <EB1AOverview 
        user={effectiveUser} 
        applicationType={applicationType} 
        onSignOut={onSignOut} 
        onBackToHome={onBackToHome} 
        onCreateNew={onCreateNew}
        initialTab={getInitialTab()}
        onTabChange={(tab: string) => {
          // Map tab names to routes
          const routeMap: Record<string, string> = {
            'overview': '/dashboard/overview',
            'petition_letter_editor': '/dashboard/my-petition',
            'criteria_mapping': '/dashboard/expert-review',
            'forms': '/dashboard/forms',
            'export_package': '/dashboard/export-package',
            'export_package_details': '/dashboard/export-package/details',
            'account': '/dashboard/settings',
          };
          const route = routeMap[tab];
          if (route) {
            navigate(route);
          }
        }}
      />
      <Toaster />

      {/* 🔧 Development Tools Panel */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showDevTools ? (
          <button
            onClick={() => setShowDevTools(true)}
            className="bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-110 opacity-50 hover:opacity-100"
            title="Open Developer Tools"
          >
            <Wrench className="w-5 h-5" />
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-900 p-4 w-80 animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-gray-900" />
                <h3 className="font-bold text-gray-900">Developer Tools</h3>
              </div>
              <button
                onClick={() => setShowDevTools(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Current Status Display */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Current Status</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${effectivePaidStatus ? 'text-green-600' : 'text-amber-600'}`}>
                    {effectivePaidStatus ? (
                      <>
                        <Check className="w-4 h-4" />
                        Paid User
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Free User
                      </>
                    )}
                  </span>
                  {devPaidOverride !== null && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Override Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Original: {user.isPaidUser ? 'Paid' : 'Free'}
                </p>
              </div>

              {/* Toggle Buttons */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Override User Status:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDevPaidOverride(true)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      devPaidOverride === true
                        ? 'bg-green-600 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    onClick={() => setDevPaidOverride(false)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      devPaidOverride === false
                        ? 'bg-amber-600 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setDevPaidOverride(null)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      devPaidOverride === null
                        ? 'bg-blue-600 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-900">
                  <strong>Note:</strong> This override is temporary and only affects the UI. 
                  Refresh the page to reset to actual status.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}