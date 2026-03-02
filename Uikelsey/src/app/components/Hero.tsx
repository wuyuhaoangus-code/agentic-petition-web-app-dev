import { SystemGraphic } from './SystemGraphic';

export function Hero() {
  return (
    <section className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-2xl shadow-lg p-12 border border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text content */}
            <div className="space-y-6">
              <h1 className="text-4xl tracking-tight text-foreground">
                Understand your EB-1 path
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                A structural decision tool for organizing materials, assessing readiness, 
                and determining your next steps—AI draft or human review.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="px-6 py-3 bg-primary text-primary-foreground hover:opacity-90 transition-opacity rounded-sm">
                  Start Assessment — $39.9
                </button>
                <button className="px-6 py-3 border border-border text-foreground hover:bg-accent transition-colors rounded-sm">
                  Human Review — $499
                </button>
              </div>
            </div>
            
            {/* Right: Abstract graphic */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <SystemGraphic />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}