import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface CookiePolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookiePolicyModal({ open, onOpenChange }: CookiePolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Cookie Policy</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">Last updated: January 14, 2026</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="px-6 pb-6 max-h-[calc(85vh-120px)]">
          <div className="prose prose-sm max-w-none pr-4">
            <p>
              This Cookie Policy explains how DreamCardAI ("we," "us," or "our") uses cookies and similar technologies 
              to recognize you when you visit our website and use our services.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">1. What Are Cookies?</h3>
            <p>
              Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. 
              They help the website remember your preferences and improve your experience.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">2. Types of Cookies We Use</h3>
            
            <h4 className="text-base font-semibold mt-4 mb-2">Essential Cookies</h4>
            <p>
              These cookies are necessary for the website to function properly. They enable core functionality such as 
              security, authentication, and session management. You cannot opt out of these cookies.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Session authentication tokens</li>
              <li>Security and fraud prevention</li>
              <li>Load balancing</li>
            </ul>

            <h4 className="text-base font-semibold mt-4 mb-2">Analytics Cookies</h4>
            <p>
              These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Analytics (traffic analysis)</li>
              <li>Page view tracking</li>
              <li>Feature usage statistics</li>
            </ul>

            <h4 className="text-base font-semibold mt-4 mb-2">Functional Cookies</h4>
            <p>
              These cookies enable enhanced functionality and personalization, such as remembering your preferences.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Language preferences</li>
              <li>Theme settings (light/dark mode)</li>
              <li>User interface customizations</li>
            </ul>

            <h4 className="text-base font-semibold mt-4 mb-2">Marketing Cookies</h4>
            <p>
              These cookies track your online activity to help deliver more relevant advertising. We may use third-party services 
              that set marketing cookies.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Google Ads</li>
              <li>Social media pixels (LinkedIn, Facebook)</li>
              <li>Retargeting campaigns</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">3. Third-Party Cookies</h3>
            <p>
              We may use third-party services that set their own cookies, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
              <li><strong>Stripe:</strong> For payment processing (if applicable)</li>
              <li><strong>Social Media Platforms:</strong> For social sharing and authentication</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">4. How Long Do Cookies Last?</h3>
            <p>
              Cookies can be either session cookies or persistent cookies:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain on your device for a set period (usually up to 2 years) or until you delete them</li>
            </ul>

            <h3 className="text-lg font-semibold mt-6 mb-3">5. How to Control Cookies</h3>
            <p>
              You have the right to accept or reject cookies. You can control cookies through:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or delete cookies through their settings</li>
              <li><strong>Cookie Consent Manager:</strong> Adjust your preferences through our cookie banner when you first visit</li>
              <li><strong>Opt-Out Tools:</strong> Use industry opt-out tools like the Network Advertising Initiative opt-out page</li>
            </ul>
            <p className="mt-3 text-sm text-muted-foreground italic">
              Note: Disabling certain cookies may affect website functionality and your user experience.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">6. Do Not Track Signals</h3>
            <p>
              Some browsers include a "Do Not Track" (DNT) feature. Our website does not currently respond to DNT signals, 
              but we respect your privacy choices and provide cookie controls.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">7. Updates to This Policy</h3>
            <p>
              We may update this Cookie Policy from time to time. We will notify you of any material changes by updating 
              the "Last updated" date at the top of this policy.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3">8. Contact Us</h3>
            <p>
              If you have questions about our use of cookies, please contact us at:{' '}
              <a href="mailto:privacy@dreamcardai.com" className="text-primary hover:underline">privacy@dreamcardai.com</a>
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}