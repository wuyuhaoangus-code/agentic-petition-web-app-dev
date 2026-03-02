import { ArrowRight } from "lucide-react";

export function PathOptions() {
  return (
    <section id="pricing" className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg p-12 border border-border">
          <h2 className="tracking-tight text-foreground mb-4 text-center font-[Playfair_Display] text-[36px]">
            Choose your starting point
          </h2>
          <p className="text-muted-foreground text-center mb-3 max-w-2xl mx-auto">
            Two paths, different levels of support. Both provide
            structural clarity.
          </p>
          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Option A: AI Assessment */}
            <div className="border-2 border-primary bg-background rounded-lg p-8 space-y-6 relative">
              <div className="absolute top-4 right-4 px-3 py-1 bg-[rgb(0,0,0)] text-primary-foreground text-xs rounded-sm">
                Primary
              </div>

              <div>
                <div className="text-3xl text-foreground mb-2">
                  $249
                </div>
                <h3 className="text-xl text-foreground mb-3 font-bold">
                  AI Drafting & Organization
                </h3>
                <p className="text-muted-foreground text-[16px]">
                  Automated petition generation and smart
                  document management
                </p>
              </div>

              <div className="space-y-3 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">Generates 80% complete petition letter (remaining 20% is for you to check, edit and refine)</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">
                    Converts and organizes evidence (PDF to
                    Word)
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">
                    Case tracking and timeline management
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">
                    AI synthesis of your research impact
                  </p>
                </div>
              </div>

              <button className="w-full px-6 py-3 bg-[rgb(0,0,0)] text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2 rounded-sm">
                Start Drafting
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Option B: Human Review */}
            <div className="border border-border bg-background rounded-lg p-8 space-y-6">
              <div>
                <div className="text-3xl text-foreground mb-2">
                  $499
                </div>
                <h3 className="text-xl text-foreground mb-3 font-bold">
                  Expert Strategic Review
                </h3>
                <p className="text-muted-foreground text-[16px]">
                  Professional feedback on your AI draft and
                  evidence portfolio
                </p>
              </div>

              <div className="space-y-3 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">
                    Includes full AI Drafting workspace
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">
                    Five 30-minute 1-1 sessions with Petition Development Coach.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">
                    1-month access for expert meeting review
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">
                    Strategic critique of your AI-petition
                    narrative
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                  <p className="text-foreground text-[15px]">
                    Actionable suggestions (we advise, you edit)
                  </p>
                </div>
              </div>

              <button className="w-full px-6 py-3 border border-border text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2 rounded-sm">
                Request Expert Review
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}