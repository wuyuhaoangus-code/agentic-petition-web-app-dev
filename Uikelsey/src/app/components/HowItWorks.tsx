import { Upload, Brain, Sparkles, CheckCircle, ArrowDown } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload & Organize',
    description: 'Upload your evidence and background documents. We help you organize and understand what you have.',
    points: [
      'Convert PDFs to editable text',
      'Organize your materials',
      'See what you need to add'
    ]
  },
  {
    number: 2,
    icon: Brain,
    title: 'Match to EB-1 Criteria',
    description: 'We analyze your work and match your evidence to the specific requirements USCIS looks for.',
    points: [
      'Understand how your work fits',
      'Map evidence to 11 criteria',
      'Track your progress'
    ]
  },
  {
    number: 3,
    icon: Sparkles,
    title: 'Draft Your Petition',
    description: 'Generate a structured petition draft based on your evidence — ready for you to review and refine.',
    points: [
      'Generated in minutes, not weeks',
      'You control all edits',
      'Organized narrative structure'
    ]
  },
  {
    number: 4,
    icon: CheckCircle,
    title: 'Prepare Filing Package',
    description: 'Complete your filing package with organized exhibits, forms, and tracking — ready for USCIS.',
    points: [
      'Print-ready filing packet',
      'Track your case status',
      'Secure document storage'
    ]
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
            How it works
          </h2>
          <p className="text-muted-foreground">
            From documents to petition in four intelligent steps
          </p>
        </div>
        
        {/* Vertical Flow Layout */}
        <div className="space-y-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.number}>
                <div className="bg-card border border-border rounded-lg p-8 hover:border-primary/30 transition-colors">
                  {/* Header */}
                  <div className="flex items-start gap-6 mb-6">
                    {/* Icon Circle */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                        <Icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-sm font-medium text-primary">
                          Step {step.number}
                        </div>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      
                      <h3 className="text-2xl font-semibold text-foreground mb-3">
                        {step.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed mb-4">
                        {step.description}
                      </p>

                      {/* Feature Points */}
                      <ul className="space-y-2">
                        {step.points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            <span className="text-sm text-foreground/80">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Flow Arrow */}
                {!isLast && (
                  <div className="flex justify-center py-4">
                    <div className="flex flex-col items-center">
                      <div className="w-px h-8 bg-border" />
                      <ArrowDown className="w-5 h-5 text-primary" />
                      <div className="w-px h-8 bg-border" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}