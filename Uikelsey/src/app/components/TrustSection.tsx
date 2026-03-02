import { Shield, Scale, FileCheck } from 'lucide-react';

export function TrustSection() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg border border-border p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-3">
              <div className="w-10 h-10 mx-auto bg-accent rounded-md flex items-center justify-center">
                <Scale className="w-5 h-5 text-muted-foreground" />
              </div>
              <h4 className="text-sm text-foreground">Not legal advice</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This tool provides structural organization and assessment. It does not constitute legal advice.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-10 h-10 mx-auto bg-accent rounded-md flex items-center justify-center">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
              <h4 className="text-sm text-foreground">Drafting Tool Only</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We generate the structural foundation. You or your attorney must provide the final legal review.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="w-10 h-10 mx-auto bg-accent rounded-md flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <h4 className="text-sm text-foreground">No guarantee of approval</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All assessments are analytical tools. Final decisions rest with USCIS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}