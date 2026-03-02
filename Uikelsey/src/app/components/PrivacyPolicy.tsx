import { ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Header / Nav */}
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

      {/* Content */}
      <main className="container max-w-3xl py-12 md:py-20 px-6 mx-auto">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: January 14, 2026</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p>
              At DreamCardAI ("we," "our," or "us"), we take your privacy and the security of your sensitive documents seriously. 
              This Privacy Policy explains how we collect, use, and protect your personal information when you use our EB-1 application aid services.
            </p>

            <h3>1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us, including:
            </p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Case Data:</strong> Professional achievements, citation counts, awards, memberships, and other evidence you upload for your EB-1 petition.</li>
              <li><strong>Documents:</strong> Files, CVs, and draft letters you upload or generate within the platform.</li>
            </ul>

            <h3>2. How We Use Your Information</h3>
            <p>
              We use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our services.</li>
              <li>Generate drafts of petition letters based on your inputs.</li>
              <li>Process payments and send receipts.</li>
              <li>Send you technical notices, updates, and support messages.</li>
            </ul>

            <h3>3. Document Security & Confidentiality</h3>
            <p>
              We understand the sensitive nature of immigration documents. We implement robust security measures to protect your data:
            </p>
            <ul>
              <li><strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest.</li>
              <li><strong>Access Control:</strong> Your documents are private by default. We do not access your specific case files unless explicit support is requested.</li>
              <li><strong>No Third-Party AI Training:</strong> We do not use your personal private data to train public AI models.</li>
            </ul>

            <h3>4. Data Sharing</h3>
            <p>
              We do not sell your personal data. We may share data with trusted service providers who help us operate our business (e.g., payment processing via Stripe, database hosting via Supabase), subject to confidentiality obligations.
            </p>

            <h3>5. Your Rights</h3>
            <p>
              You have the right to access, correct, or delete your personal information. You can manage your account settings directly within the application or contact us for assistance.
            </p>

            <h3>6. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@dreamcard.ai.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}