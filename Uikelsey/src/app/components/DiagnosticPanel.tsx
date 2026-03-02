import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import backend from '@/lib/backend';

export function DiagnosticPanel() {
  const [results, setResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: []
    };

    try {
      // 1. Check Supabase configuration
      const supabase = backend.getSupabaseClient();
      const isAuth = await backend.isAuthenticated();
      
      diagnostics.checks.push({
        name: 'Supabase Configuration',
        status: 'pass',
        details: {
          configured: 'Using backend layer',
          authenticated: isAuth
        }
      });

      // 2. Check authentication
      const user = await backend.getCurrentUser();
      const token = await backend.getAuthToken();
      
      diagnostics.checks.push({
        name: 'Authentication Status',
        status: user ? 'pass' : 'fail',
        details: {
          authenticated: !!user,
          userId: user?.id || 'Not logged in',
          email: user?.email || 'N/A',
          hasToken: !!token
        }
      });

      // 3. Check backend server health
      const SERVER_URL = `https://${backend.projectId}.supabase.co/functions/v1/make-server-604ca09d`;
      try {
        const healthResponse = await fetch(`${SERVER_URL}/health`);
        diagnostics.checks.push({
          name: 'Backend Server Health',
          status: healthResponse.ok ? 'pass' : 'fail',
          details: {
            status: healthResponse.status,
            statusText: healthResponse.statusText,
            url: `${SERVER_URL}/health`
          }
        });
      } catch (error: any) {
        diagnostics.checks.push({
          name: 'Backend Server Health',
          status: 'fail',
          details: {
            error: error.message,
            url: `${SERVER_URL}/health`
          }
        });
      }

      // 3.5. Check Edge Function environment variables
      try {
        const envCheckResponse = await fetch(`${SERVER_URL}/env-check`);
        const envCheckData = await envCheckResponse.json();
        
        diagnostics.checks.push({
          name: 'Edge Function Environment Variables',
          status: envCheckData.allConfigured ? 'pass' : 'fail',
          details: {
            ...envCheckData.configured,
            message: envCheckData.message,
            critical: !envCheckData.configured.SUPABASE_ANON_KEY || !envCheckData.configured.SUPABASE_SERVICE_ROLE_KEY
          }
        });
      } catch (error: any) {
        diagnostics.checks.push({
          name: 'Edge Function Environment Variables',
          status: 'fail',
          details: {
            error: error.message
          }
        });
      }

      // 4. Check profile endpoint
      if (user) {
        try {
          console.log('Testing profile endpoint with token:', token.substring(0, 20) + '...');
          
          const profileResponse = await fetch(`${SERVER_URL}/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          const profileData = await profileResponse.text();
          let parsedData;
          try {
            parsedData = JSON.parse(profileData);
          } catch {
            parsedData = profileData;
          }
          
          diagnostics.checks.push({
            name: 'Profile Endpoint',
            status: profileResponse.ok ? 'pass' : 'fail',
            details: {
              status: profileResponse.status,
              statusText: profileResponse.statusText,
              response: typeof parsedData === 'string' ? parsedData.substring(0, 200) : JSON.stringify(parsedData).substring(0, 200),
              url: `${SERVER_URL}/profile`,
              tokenPrefix: token.substring(0, 20) + '...',
              issue: !profileResponse.ok && parsedData?.message === 'Invalid JWT' ? 
                'JWT_SECRET not configured in Edge Function' : undefined
            }
          });
        } catch (error: any) {
          diagnostics.checks.push({
            name: 'Profile Endpoint',
            status: 'fail',
            details: {
              error: error.message,
              url: `${SERVER_URL}/profile`
            }
          });
        }
      } else {
        diagnostics.checks.push({
          name: 'Profile Endpoint',
          status: 'skip',
          details: {
            reason: 'Not authenticated - cannot test'
          }
        });
      }

      // 5. Check direct database access (will likely fail due to RLS)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);
        
        diagnostics.checks.push({
          name: 'Direct Database Access',
          status: !error ? 'pass' : 'warning',
          details: {
            error: error?.message,
            note: 'Expected to fail if RLS is properly configured',
            hasData: !!data && data.length > 0
          }
        });
      } catch (error: any) {
        diagnostics.checks.push({
          name: 'Direct Database Access',
          status: 'warning',
          details: {
            error: error.message,
            note: 'This is expected if using backend API'
          }
        });
      }

    } catch (error: any) {
      diagnostics.checks.push({
        name: 'General Error',
        status: 'fail',
        details: {
          error: error.message
        }
      });
    }

    setResults(diagnostics);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'skip':
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Diagnostics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Check the status of Supabase connection and profile integration
          </p>
        </div>
        <Button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running...' : 'Rerun Tests'}
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          {results.checks.map((check: any, index: number) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{check.name}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        check.status === 'pass'
                          ? 'bg-green-100 text-green-700'
                          : check.status === 'fail'
                          ? 'bg-red-100 text-red-700'
                          : check.status === 'warning'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {check.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm space-y-1">
                    {Object.entries(check.details).map(([key, value]: any) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-gray-500 font-medium min-w-[120px]">
                          {key}:
                        </span>
                        <span className="text-gray-700 font-mono text-xs break-all">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Common Issues & Solutions</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>
            <strong>❌ 401 Invalid JWT:</strong> This is the most common issue! The Edge Function 
            cannot verify authentication tokens. <strong>Solution:</strong> Add SUPABASE_SERVICE_ROLE_KEY 
            to Edge Function environment variables. See /QUICK_FIX_401_JWT.md for detailed steps.
          </li>
          <li>
            <strong>Backend Server Health fails:</strong> Check that the Edge Function is deployed
            and environment variables are set in Supabase dashboard.
          </li>
          <li>
            <strong>Profile Endpoint returns 500:</strong> Verify SUPABASE_SERVICE_ROLE_KEY is
            configured correctly in the Edge Function environment variables.
          </li>
          <li>
            <strong>Profile Endpoint returns empty object:</strong> The user doesn't have a profile
            record yet. Try saving the profile to create one.
          </li>
        </ul>
      </div>

      {results && results.checks.some((c: any) => 
        c.status === 'fail' && c.details?.issue === 'JWT_SECRET not configured in Edge Function'
      ) && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5 space-y-3">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-lg mb-2">
                🚨 Critical: Edge Function Configuration Required
              </h3>
              <p className="text-red-800 mb-3">
                Your Edge Function needs the <code className="px-1.5 py-0.5 bg-red-100 rounded font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</code> environment variable to authenticate users.
              </p>
              
              <div className="bg-white rounded border border-red-200 p-3 space-y-2">
                <p className="font-semibold text-red-900 text-sm">Quick Fix Steps:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-red-800">
                  <li>Go to Supabase Dashboard → Project Settings → API</li>
                  <li>Copy the <code className="px-1 bg-red-50 rounded text-xs">service_role</code> key</li>
                  <li>Go to Edge Functions → make-server-604ca09d → Settings</li>
                  <li>Add environment variable: <code className="px-1 bg-red-50 rounded text-xs">SUPABASE_SERVICE_ROLE_KEY</code></li>
                  <li>Wait 1-2 minutes, then refresh this page</li>
                </ol>
              </div>

              <p className="text-xs text-red-700 mt-3">
                📄 See <code className="px-1 py-0.5 bg-red-100 rounded">/QUICK_FIX_401_JWT.md</code> for detailed instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      {results && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Full Diagnostic Report</h3>
          <pre className="text-xs overflow-auto bg-white p-3 rounded border border-gray-200">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}