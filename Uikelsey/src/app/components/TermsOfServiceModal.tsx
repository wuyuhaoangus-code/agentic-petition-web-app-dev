import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface TermsOfServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsOfServiceModal({ open, onOpenChange }: TermsOfServiceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Terms of Service</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">Last updated: January 14, 2026</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-[calc(85vh-120px)]">
          <div className="prose prose-sm max-w-none pr-4">
            <p>
              Welcome to DreamCardAI. By accessing or using our services, you agree to be bound by these Terms of Service ("Terms"). 
              Please read them carefully.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">1. Acceptance of Terms</h3>
            <p>
              By creating an account or using DreamCardAI, you agree to these Terms and our Privacy Policy. 
              If you do not agree, you may not use our services.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">2. Description of Service</h3>
            <p>
              DreamCardAI provides AI-powered tools to help users prepare NIW and EB-1 visa petitions, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Document transformation and formatting</li>
              <li>AI-assisted petition letter generation</li>
              <li>Evidence organization and case management</li>
              <li>Draft review and editing tools</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">3. No Legal Advice</h3>
            <p className="font-semibold text-amber-700 dark:text-amber-500">
              IMPORTANT: DreamCardAI is NOT a law firm and does not provide legal advice. Our services are 
              informational and assistive tools only. You should consult with a qualified immigration attorney 
              before submitting any petition to USCIS.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">4. User Accounts</h3>
            <p>
              You are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring the accuracy of information you provide</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">5. Acceptable Use</h3>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use the service for any illegal purpose</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Reverse engineer or copy our software or AI models</li>
              <li>Share your account with others</li>
              <li>Use the service to harm others or violate their rights</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">6. Intellectual Property</h3>
            <p>
              You retain ownership of the documents and information you upload. By using our service, you grant us 
              a limited license to process your content to provide the services. Our AI models, software, and platform 
              design are proprietary and protected by intellectual property laws.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">7. Payment and Subscriptions</h3>
            <p>
              Certain features require a paid subscription. You agree to pay all fees associated with your chosen plan. 
              Subscriptions automatically renew unless cancelled. Refunds are handled on a case-by-case basis.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">8. Disclaimers and Limitations of Liability</h3>
            <p>
              DreamCardAI is provided "AS IS" without warranties of any kind. We do not guarantee:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Approval of your visa petition</li>
              <li>Accuracy or completeness of AI-generated content</li>
              <li>Uninterrupted or error-free service</li>
              <li>Specific outcomes or results</li>
            </ul>
            <p className="mt-3">
              To the maximum extent permitted by law, we are not liable for any indirect, incidental, consequential, 
              or punitive damages arising from your use of our services.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">9. Termination</h3>
            <p>
              We may suspend or terminate your account at any time for violation of these Terms. 
              You may cancel your account at any time through your account settings.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">10. Changes to Terms</h3>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes. 
              Continued use of the service after changes constitutes acceptance of the new Terms.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">11. Governing Law</h3>
            <p>
              These Terms are governed by the laws of the State of California, United States, without regard to 
              conflict of law principles.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">12. Contact Us</h3>
            <p>
              For questions about these Terms, contact us at:{' '}
              <a href="mailto:legal@dreamcardai.com" className="text-primary hover:underline">legal@dreamcardai.com</a>
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}