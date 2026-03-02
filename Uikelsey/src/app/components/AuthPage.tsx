import React, { useState } from 'react';
import { ASSETS } from '@/app/config/assets';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { ShieldCheck, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { FloatingTestimonials } from './FloatingTestimonials';
import { supabase } from '@/lib/supabase';

interface AuthPageProps {
  initialMode?: 'signin' | 'signup';
  onBack?: () => void;
  onNavigate?: (page: 'privacy' | 'terms' | 'cookie') => void;
  onAuthSuccess?: (user: { email: string; name?: string }, isNewUser?: boolean) => void;
}

export function AuthPage({ initialMode = 'signin', onBack, onNavigate, onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle mode handler
  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setError(error.message);
          setIsLoading(false);
          return;
        }

        if (data.user && data.session) {
          console.log('✅ Sign in successful - session exists:', !!data.session);
          // ✅ Wait a brief moment for session to be fully persisted
          await new Promise(resolve => setTimeout(resolve, 100));
          
          onAuthSuccess?.({ 
            email: data.user.email || email, 
            name: data.user.user_metadata?.name 
          }, false);
        } else {
          console.warn('⚠️ Sign in returned user but no session:', data);
          setError('Authentication succeeded but session not created. Please try again.');
          setIsLoading(false);
        }
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (error) {
          setError(error.message);
          setIsLoading(false);
          return;
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
          console.log('📧 Email confirmation required');
          setError('Please check your email to confirm your account before signing in.');
          setIsLoading(false);
          return;
        }

        if (data.user && data.session) {
          console.log('✅ Sign up successful - session exists:', !!data.session);
          // ✅ Wait a brief moment for session to be fully persisted
          await new Promise(resolve => setTimeout(resolve, 100));
          
          onAuthSuccess?.({ 
            email: data.user.email || email, 
            name: data.user.user_metadata?.name || name 
          }, true);
        } else {
          console.warn('⚠️ Sign up returned unexpected data:', data);
          setError('Account created but authentication failed. Please try signing in.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-background relative overflow-hidden">
      {/* Floating Testimonials Background */}
      <FloatingTestimonials />
      
      {/* Background Gradient Wash - removed to let FloatingTestimonials handle gradients */}

      {/* Back Button */}
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-10">
        
        {/* Auth Card */}
        <div className="w-full max-w-[440px] bg-card rounded-[12px] shadow-lg border border-border/40 p-8 sm:p-10 px-[40px] py-[64px]">
          
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img src={ASSETS.logo} alt="DreamCardAI" className="h-12 w-auto pt-[8px] pr-[0px] pb-[0px] pl-[-17px]" />
          </div>

          {/* Headline & Subheadline */}
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-2xl font-semibold text-[rgb(67,78,135)] tracking-tight font-[IBM_Plex_Sans] font-bold font-normal text-[20px]">
              {mode === 'signin' ? 'Sign in' : 'GET STARTED'}
            </h1>
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
              <ShieldCheck size={14} className="text-primary/70" />
              <p className="text-sm font-medium font-[IBM_Plex_Serif] text-[12px] font-bold font-normal">
                Secure access to your NIW/EB-1 workspace.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-10 ${error && !email.includes('@') ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
                  Password
                </Label>
                {mode === 'signin' && (
                  <a href="#" className="text-xs text-primary hover:text-primary/80 font-medium">
                    Forgot password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-10 ${error && !password ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
              />
            </div>

            {/* Confirm Password Field (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-foreground/80">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`h-10 ${error && password !== confirmPassword ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                />
              </div>
            )}

            {/* Name Field (Signup only) */}
            {mode === 'signup' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="name" className="text-xs font-medium text-foreground/80">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`h-10 ${error && !name ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-xs font-medium bg-destructive/5 p-2 rounded">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Button */}
            <Button type="submit" className="w-full h-10 font-medium bg-primary hover:bg-primary/90 text-white shadow-sm transition-all">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>

            {/* Privacy + Legal Notice Block */}
            <div className="pt-4 text-center">
               <div className="max-w-[360px] mx-auto">
                 <p className="text-xs text-muted-foreground font-normal leading-normal">
                   By continuing, you agree to Dreamcard's{' '}
                   <button type="button" onClick={() => onNavigate?.('terms')} className="text-[11px] font-semibold text-primary hover:underline underline">Terms of Service</button>
                   {' '}and{' '}
                   <button type="button" onClick={() => onNavigate?.('privacy')} className="text-[11px] font-semibold text-primary hover:underline underline">Privacy Policy</button>,
                   and to receive periodic emails with updates.
                 </p>
               </div>
            </div>

            {/* SSO / Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground/60 tracking-wider">
                  Or
                </span>
              </div>
            </div>

             {/* SSO Button */}
             <Button variant="outline" type="button" className="w-full h-10 font-medium text-foreground/80 hover:text-foreground hover:bg-secondary/50">
               <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               Continue with Google
             </Button>

          </form>

          {/* Toggle Mode Link */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={toggleMode}
                className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
              >
                {mode === 'signin' ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-border/20 bg-background/50 backdrop-blur-sm z-10">
        <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-6 text-[11px] text-muted-foreground/60 font-normal">
          <p>© {new Date().getFullYear()} DreamCardAI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate?.('privacy')} className="text-[11px] text-muted-foreground/60 font-normal hover:text-primary transition-colors">Privacy Policy</button>
            <button onClick={() => onNavigate?.('terms')} className="text-[11px] text-muted-foreground/60 font-normal hover:text-primary transition-colors">Terms of Service</button>
            <button onClick={() => onNavigate?.('cookie')} className="text-[11px] text-muted-foreground/60 font-normal hover:text-primary transition-colors">Cookie</button>
          </div>
        </div>
      </footer>
    </div>
  );
}