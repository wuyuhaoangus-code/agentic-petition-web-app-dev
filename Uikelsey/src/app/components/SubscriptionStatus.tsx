/**
 * Subscription Status Component
 * Displays user's subscription information and usage statistics
 */

import React, { useEffect, useState } from 'react';
import { subscriptionService, UserSubscription } from '../services/subscriptionService';
import { Button } from './ui/button';
import { Crown, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const [subData, stats, days] = await Promise.all([
        subscriptionService.getUserSubscription(),
        subscriptionService.getUsageStats(),
        subscriptionService.getTrialDaysRemaining()
      ]);
      
      setSubscription(subData);
      setUsageStats(stats);
      setTrialDays(days);
    } catch (error: any) {
      console.error('Failed to load subscription data:', error);
      toast.error(error.message || 'Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-500">No subscription found</p>
      </div>
    );
  }

  const isFreePlan = subscription.plan_name === 'free';
  const isTrial = subscription.status === 'trial';
  const isActive = subscription.status === 'active';

  return (
    <div className="space-y-4">
      {/* Current Plan Card */}
      <div className={`rounded-lg border-2 p-6 ${
        isActive ? 'border-[#434E87] bg-blue-50' : 
        isTrial ? 'border-amber-400 bg-amber-50' : 
        'border-gray-200 bg-white'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isActive ? 'bg-[#434E87] text-white' : 
              isTrial ? 'bg-amber-500 text-white' : 
              'bg-gray-200 text-gray-600'
            }`}>
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {subscription.plan_display_name}
              </h3>
              <p className="text-sm text-gray-600">
                Status: <span className="font-medium capitalize">{subscription.status}</span>
              </p>
            </div>
          </div>
          {!isActive && !isTrial && (
            <Button className="bg-[#434E87] hover:bg-[#323b6b]">
              Upgrade Plan
            </Button>
          )}
        </div>

        {/* Trial Warning */}
        {isTrial && trialDays !== null && (
          <div className="bg-white border-l-4 border-amber-500 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {trialDays > 0 
                    ? `${trialDays} day${trialDays !== 1 ? 's' : ''} remaining in your trial` 
                    : 'Your trial has expired'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {trialDays > 0 
                    ? 'Upgrade now to continue using premium features' 
                    : 'Please upgrade to continue'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Usage Statistics */}
        {usageStats && (
          <div className="space-y-4">
            {/* Applications Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Applications</span>
                <span className="text-sm text-gray-600">
                  {usageStats.applicationsUsed} / {usageStats.applicationsLimit || '∞'} used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    usageStats.applicationsPercentage >= 90 ? 'bg-red-500' :
                    usageStats.applicationsPercentage >= 70 ? 'bg-amber-500' :
                    'bg-[#434E87]'
                  }`}
                  style={{ width: `${Math.min(usageStats.applicationsPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Files Usage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">File Uploads</span>
                <span className="text-sm text-gray-600">
                  {usageStats.filesUploaded} / {usageStats.filesLimit || '∞'} used
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    usageStats.filesPercentage >= 90 ? 'bg-red-500' :
                    usageStats.filesPercentage >= 70 ? 'bg-amber-500' :
                    'bg-[#434E87]'
                  }`}
                  style={{ width: `${Math.min(usageStats.filesPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Upgrade CTA for Free Users */}
        {isFreePlan && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-[#434E87] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Unlock Premium Features
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Get unlimited applications, priority support, and advanced templates
                </p>
                <Button 
                  size="sm" 
                  className="bg-[#434E87] hover:bg-[#323b6b]"
                >
                  View Plans
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={loadSubscriptionData}>
          Refresh
        </Button>
        <Button variant="outline" className="flex-1">
          Payment History
        </Button>
      </div>
    </div>
  );
}
