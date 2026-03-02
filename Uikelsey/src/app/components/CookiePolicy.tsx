import { ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface CookiePolicyProps {
  onBack: () => void;
}

export function CookiePolicy({ onBack }: CookiePolicyProps) {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>

      <main className="container max-w-3xl py-12 md:py-20 px-6 mx-auto">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Cookie Policy</h1>
            <p className="text-muted-foreground">Last updated: January 14, 2026</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              This Cookie Policy explains how DreamCardAI uses cookies and similar technologies to recognize you when you visit our website.
            </p>

            <h3>1. What are Cookies?</h3>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide reporting information.
            </p>

            <h3>2. How We Use Cookies</h3>
            <p>
              We use cookies for the following purposes:
            </p>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for the technical operation of our website (e.g., keeping you logged in).</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our services.</li>
              <li><strong>Functionality Cookies:</strong> Remember your preferences and settings.</li>
            </ul>

            <h3>3. Managing Cookies</h3>
            <p>
              You can control or delete cookies through your browser settings. However, disabling essential cookies may limit your ability to use certain features of DreamCardAI.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}