import React, { useState } from 'react';
import { 
  IconUser,
  IconCreditCard,
  IconLock,
  IconBell,
  IconDownload,
  IconCheck,
  IconAlertCircle,
  IconChevronRight,
  IconExternalLink,
  IconShield,
  IconFileText,
  IconSettings,
  IconSparkles,
  IconBolt,
  IconKey,
  IconCrown
} from '@tabler/icons-react';
import { Button } from '../components/ui/button';
import { ASSETS } from '@/app/config/assets';

interface UserAccountPageProps {
  isPaidUser?: boolean;
  onActivateCode?: (code: string) => void;
}

export function UserAccountPage({ isPaidUser = false, onActivateCode }: UserAccountPageProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'security' | 'notifications' | 'data'>('billing');
  const [activationCode, setActivationCode] = useState('');
  const [activationError, setActivationError] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleActivateCode = () => {
    if (!activationCode.trim()) {
      setActivationError('Please enter an activation code');
      return;
    }

    setIsActivating(true);
    setActivationError('');

    // Simulate API call
    setTimeout(() => {
      if (onActivateCode) {
        onActivateCode(activationCode);
      }
      setIsActivating(false);
    }, 500);
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 text-lg">Manage your membership, billing, and workspace preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
          <nav className="p-2 space-y-1">
            <button
              onClick={() => setActiveTab('billing')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'billing' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconCreditCard size={18} />
              Billing & Membership
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'profile' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconUser size={18} />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'security' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconLock size={18} />
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'notifications' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconBell size={18} />
              Notifications
            </button>
            <div className="h-px bg-gray-100 my-2" />
            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'data' 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <IconDownload size={18} />
              Data & Export
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px]">
          
          {/* Billing Tab (Membership Card Design) */}
          {activeTab === 'billing' && (
            <div className="p-8 space-y-10">
              
              {!isPaidUser ? (
                // FREE USER - UPGRADE INTERFACE
                <>
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <h2 className="text-xl font-semibold text-slate-900">Choose Your Plan</h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Free Plan
                      </span>
                    </div>
                    
                    {/* Pricing Cards - Vertical Stack */}
                    <div className="space-y-5 max-w-3xl">
                      {/* $39 Plan - AI Drafting */}
                      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-white rounded-xl p-8 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="absolute top-5 right-5 px-2.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full uppercase tracking-wide">
                          Popular
                        </div>
                        
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                            <IconSparkles className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Drafting Plan</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                              <div className="text-4xl font-bold text-gray-900">$249</div>
                              <div className="text-sm text-gray-500">one-time</div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">Generate AI petition drafts with smart document organization</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-7">
                          {[
                            "Unlimited AI Petition Generation",
                            "Unlimited File Uploads",
                            "Advanced Criteria Mapping",
                            "Export to PDF & Word",
                            "Email Support"
                          ].map((feature, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <IconCheck size={10} className="text-white stroke-[3]" />
                              </div>
                              <span className="text-sm text-gray-700 leading-tight">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button 
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm py-5 text-sm font-medium rounded-lg transition-all"
                          onClick={() => window.open('https://buy.stripe.com/your-payment-link-39', '_blank')}
                        >
                          <IconSparkles className="w-4 h-4 mr-2" />
                          Get AI Drafting
                        </Button>
                      </div>

                      {/* $499 Plan - Expert Review */}
                      <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <IconCrown className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Expert Review Plan</h3>
                            <div className="flex items-baseline gap-2 mb-2">
                              <div className="text-4xl font-bold text-gray-900">$499</div>
                              <div className="text-sm text-gray-500">one-time</div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">Professional review by immigration experts + all AI features</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-7">
                          {[
                            "Everything in AI Drafting Plan",
                            "Expert Strategic Review",
                            "Professional Feedback (48hrs)",
                            "Detailed Improvement Suggestions",
                            "One Round of Revisions",
                            "Priority Support"
                          ].map((feature, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <IconCheck size={10} className="text-white stroke-[3]" />
                              </div>
                              <span className="text-sm text-gray-700 leading-tight">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button 
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm py-5 text-sm font-medium rounded-lg transition-all"
                          onClick={() => window.open('https://buy.stripe.com/your-payment-link-499', '_blank')}
                        >
                          <IconCrown className="w-4 h-4 mr-2" />
                          Get Expert Review
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* Activation Code Section */}
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3">Have an Activation Code?</h3>
                    <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                      If you've already purchased or received an activation code, enter it below to unlock your plan features.
                    </p>
                    
                    <div className="max-w-xl">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <input 
                            type="text"
                            value={activationCode}
                            onChange={(e) => {
                              setActivationCode(e.target.value);
                              setActivationError('');
                            }}
                            placeholder="Enter your activation code"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm bg-white"
                          />
                          {activationError && (
                            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                              <IconAlertCircle size={12} />
                              {activationError}
                            </p>
                          )}
                        </div>
                        <Button 
                          onClick={handleActivateCode}
                          disabled={isActivating || !activationCode.trim()}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 text-sm font-medium rounded-lg"
                        >
                          {isActivating ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Activating...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <IconKey size={14} />
                              Activate
                            </div>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Activation codes are provided after purchase or through special promotions.
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* Current Plan Benefits */}
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-4">Free Plan Benefits</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        "Upload up to 5 evidence files",
                        "View AI criteria classification",
                        "Access to all forms",
                        "Basic document organization"
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                          <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <IconCheck size={10} className="text-gray-400" />
                          </div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // PAID USER - MEMBERSHIP CARD
                <>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Active Membership</h2>
                    
                    {/* PREMIUM MEMBERSHIP CARD */}
                    <div className="relative w-full max-w-[520px] aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.01] duration-500 group mx-auto md:mx-0">
                      
                      {/* Metallic Background Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1f35] via-[#2a3255] to-[#161b2e] z-0"></div>
                      
                      {/* Noise Texture */}
                      <div className="absolute inset-0 opacity-[0.15] z-[1]" 
                           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
                      </div>
                      
                      {/* Glossy Sheen Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent z-[2] opacity-50"></div>
                      
                      {/* Content Container */}
                      <div className="absolute inset-0 p-8 flex flex-col justify-between z-10">
                        
                        {/* Top Row: Logo & Status */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {/* DreamCard Logo - White/Monochrome for card */}
                            <div className="opacity-90 brightness-200 contrast-100">
                               <img src={ASSETS.logo} alt="DreamCard" className="h-6 opacity-90 invert grayscale" />
                            </div>
                            <span className="text-white/40 text-[10px] font-medium tracking-[0.2em] uppercase mt-1">
                              Private Client
                            </span>
                          </div>
                          
                          <div className="px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md flex items-center gap-1.5 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            <IconSparkles size={12} className="text-yellow-400" />
                            <span className="text-[10px] font-bold text-yellow-100 uppercase tracking-wide">Pro Member</span>
                          </div>
                        </div>

                        {/* Middle Row: Chip & Contactless */}
                        <div className="flex items-center gap-4 pl-1">
                          {/* EMV Chip */}
                          <div className="w-12 h-9 rounded-md bg-gradient-to-br from-[#f0d68b] via-[#d4af37] to-[#a0821e] relative overflow-hidden shadow-inner border border-[#b8952f]">
                            <div className="absolute inset-0 border border-black/10 rounded-md"></div>
                            {/* Chip Lines */}
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-black/20"></div>
                            <div className="absolute top-0 bottom-0 left-1/3 w-px bg-black/20"></div>
                            <div className="absolute top-0 bottom-0 right-1/3 w-px bg-black/20"></div>
                            <div className="absolute top-1/3 bottom-1/3 left-1/2 w-px bg-black/20 rounded-full border border-black/10 w-4 h-3 -translate-x-1/2 -translate-y-px"></div>
                          </div>
                          
                          {/* Contactless Icon */}
                          <IconBolt size={20} className="text-white/30 rotate-90" />
                        </div>

                        {/* Bottom Row: Name & ID */}
                        <div className="space-y-1">
                          <div className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Member Name</div>
                          <div className="text-white font-medium text-lg tracking-widest text-shadow-sm uppercase font-mono" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            ACORN ZHANG
                          </div>
                          <div className="flex justify-between items-end pt-2">
                             <div className="text-white/60 text-xs font-mono tracking-widest">
                               **** 8842
                             </div>
                             <div className="text-white/60 text-[10px] font-mono">
                               VALID THRU 12/28
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Holographic Border Effect */}
                      <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none z-20"></div>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-4 max-w-[520px]">
                      <Button className="bg-[#1a1f35] text-white hover:bg-[#2a3255] border border-white/10 shadow-lg flex-1">
                        Manage Subscription
                      </Button>
                      <Button variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50 flex-1">
                        Download Invoice
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-gray-100" />

                  {/* Plan Details Grid */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                       <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Plan Benefits</h3>
                       <ul className="space-y-3">
                         {[
                           "Unlimited AI Petition Drafts",
                           "Advanced Criteria Mapping",
                           "Citation Style Formatting (APA/MLA)",
                           "Priority Email Support",
                           "Export to PDF & Word"
                         ].map((benefit, i) => (
                           <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                             <div className="mt-0.5 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                               <IconCheck size={10} className="text-green-600" />
                             </div>
                             {benefit}
                           </li>
                         ))}
                       </ul>
                    </div>

                    <div>
                       <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">Payment Method</h3>
                       <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-8 bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">Visa ending in 4242</p>
                            <p className="text-xs text-slate-500">Expires 12/28</p>
                          </div>
                        </div>
                        <button className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-8 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Personal Profile</h2>
                <p className="text-sm text-slate-500">Manage your personal information used for your application.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    defaultValue="Acorn Zhang" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input 
                    type="email" 
                    defaultValue="acorn@example.com" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <input 
                    type="tel" 
                    defaultValue="+1 (555) 123-4567" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Current Visa Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-white transition-all">
                    <option>H-1B</option>
                    <option>F-1 (OPT)</option>
                    <option>L-1</option>
                    <option>O-1</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-8 space-y-8">
               <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Security Settings</h2>
                <p className="text-sm text-slate-500">Manage your password and account security.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Current Password</label>
                  <input 
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">New Password</label>
                  <input 
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                  <input 
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
                  />
                </div>
                <div className="pt-2">
                  <Button variant="outline">Update Password</Button>
                </div>
              </div>

              <div className="border-t border-gray-100 my-6" />
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-slate-500 mt-1">Add an extra layer of security to your account.</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </div>
          )}

           {/* Notifications Tab */}
           {activeTab === 'notifications' && (
            <div className="p-8 space-y-8">
               <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Notification Preferences</h2>
                <p className="text-sm text-slate-500">Choose what updates you want to receive.</p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Case Analysis Updates", desc: "Get notified when AI finishes analyzing your documents" },
                  { label: "Petition Draft Ready", desc: "Receive an email when your petition drafts are generated" },
                  { label: "Immigration News", desc: "Weekly digest of USCIS policy changes and news" },
                  { label: "Marketing Emails", desc: "Promotions and special offers" }
                ].map((item, i) => (
                   <div key={i} className="flex items-start gap-3 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                      <div className="flex items-center h-5 mt-0.5">
                        <input 
                          type="checkbox" 
                          defaultChecked={i < 2}
                          className="w-4 h-4 text-slate-900 border-gray-300 rounded focus:ring-slate-900 cursor-pointer" 
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-900 block group-hover:text-black transition-colors">{item.label}</label>
                        <p className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">{item.desc}</p>
                      </div>
                   </div>
                ))}
              </div>
              
              <div className="pt-4">
                <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                  Save Preferences
                </Button>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
             <div className="p-8 space-y-8">
               <div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Data & Export</h2>
                <p className="text-sm text-slate-500">Manage your application data.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border border-gray-200 text-slate-500">
                      <IconFileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Download All Application Data</h3>
                      <p className="text-xs text-slate-500">Includes all uploaded files and generated drafts in a .zip file.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <IconDownload size={14} /> Export Data
                  </Button>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between bg-gray-50/50">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded border border-gray-200 text-slate-500">
                      <IconSettings size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900">Formatting Preferences</h3>
                      <p className="text-xs text-slate-500">Set default citation style (APA/MLA) for generated letters.</p>
                    </div>
                  </div>
                   <Button variant="outline" size="sm">Configure</Button>
                </div>
              </div>

              <div className="border-t border-gray-100 my-6" />

              <div>
                <h3 className="text-base font-semibold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-slate-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <Button variant="destructive" className="bg-white text-red-600 border border-red-200 hover:bg-red-50">
                  Delete Account
                </Button>
              </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}