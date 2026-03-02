import { HelpCircle, AlertCircle, TrendingUp, Shield } from 'lucide-react';

const concerns = [
  {
    icon: AlertCircle,
    question: "Why do strong profiles get rejected?",
    stat: "42%",
    label: "rejection rate for qualified petitioners"
  },
  {
    icon: HelpCircle,
    question: "What does USCIS actually want to see?",
    stat: "11",
    label: "criteria reviewed per case"
  },
  {
    icon: TrendingUp,
    question: "Can I predict their concerns?",
    stat: "4,000+",
    label: "past USCIS decisions analyzed"
  },
  {
    icon: Shield,
    question: "How do I avoid common mistakes?",
    stat: "Top 5",
    label: "rejection patterns identified"
  }
];

export function ApplicantConcerns() {
  return (
    <section className="py-12 px-6 bg-gradient-to-b from-white to-gray-50/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 mb-3">
            The Reality of EB-1 Applications
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {concerns.map((concern, index) => {
            const Icon = concern.icon;
            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-3xl font-bold text-indigo-600 mb-1">
                    {concern.stat}
                  </div>
                  <div className="text-xs text-gray-500 mb-3 min-h-[32px] flex items-center">
                    {concern.label}
                  </div>
                  <p className="text-sm text-gray-700 font-medium leading-snug">
                    {concern.question}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}