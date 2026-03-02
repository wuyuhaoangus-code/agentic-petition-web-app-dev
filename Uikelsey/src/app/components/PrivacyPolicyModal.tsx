import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">Last updated: January 14, 2026</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-[calc(85vh-120px)]">
          <div className="prose prose-sm max-w-none pr-4">
            <p>
              At DreamCardAI ("we," "our," or "us"), we take your privacy and the security of your sensitive documents seriously. 
              This Privacy Policy explains how we collect, use, and protect your personal information when you use our EB-1 application aid services.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, and password when you create an account.</li>
              <li><strong>Case Data:</strong> Professional achievements, citation counts, awards, memberships, and other evidence you upload for your EB-1 petition.</li>
              <li><strong>Documents:</strong> Files, CVs, and draft letters you upload or generate within the platform.</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">2. How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Generate AI-powered petition drafts and supporting letters</li>
              <li>Provide customer support and respond to your inquiries</li>
              <li>Send you important updates about our services</li>
              <li>Improve our platform and develop new features</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">3. Data Security</h3>
            <p>
              We implement industry-standard security measures to protect your data, including encryption at rest and in transit, 
              secure cloud storage, and regular security audits. However, no method of transmission over the internet is 100% secure.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">4. Data Sharing</h3>
            <p>
              We do not sell, rent, or share your personal information with third parties for their marketing purposes. 
              We may share your information with:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Service providers who assist us in operating our platform (e.g., cloud hosting, AI model providers)</li>
              <li>Legal authorities when required by law or to protect our rights</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">5. Your Rights</h3>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access, update, or delete your personal information</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
              <li>Request restriction of processing</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">6. Data Retention</h3>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide you services. 
              You may request deletion of your account and data at any time.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">7. International Data Transfers</h3>
            <p>
              Your information may be transferred to and processed in countries other than your country of residence. 
              We ensure appropriate safeguards are in place for such transfers.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">8. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
              the new policy on this page and updating the "Last updated" date.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">9. Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:privacy@dreamcardai.com" className="text-primary hover:underline">privacy@dreamcardai.com</a>
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}