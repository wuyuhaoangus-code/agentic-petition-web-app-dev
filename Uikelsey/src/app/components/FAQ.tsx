import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-muted-foreground transition-colors"
      >
        <span className="text-foreground pr-8">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  const faqs = [
    {
      question: "Is this a law firm or immigration service?",
      answer: "No. We are a decision support tool. We help you understand the EB-1 process structure, organize materials, and assess readiness. We do not provide legal advice or file petitions."
    },
    {
      question: "What's the difference between AI Assessment and Human Review?",
      answer: "AI Assessment uses structured algorithms to analyze your materials and generate an assessment in minutes. Human Review includes expert interpretation of your specific case by immigration specialists, with written feedback delivered in 2-3 business days."
    },
    {
      question: "Will this guarantee my EB-1 approval?",
      answer: "No. This tool provides structural clarity and assessment, but final decisions rest with USCIS. We help you understand your position and readiness, not guarantee outcomes."
    },
    {
      question: "Who is this for?",
      answer: "Chinese professionals in the US—engineers, researchers, PhDs—who want to understand the EB-1 process systematically before deciding their next steps. You value clarity over sales language."
    },
    {
      question: "What do I get after payment?",
      answer: "A complete structural assessment: process overview showing where you are, materials organized by the 10 EB-1 criteria with gap analysis, and petition structure outline. Human Review also includes personalized written feedback."
    },
    {
      question: "Can I upgrade from AI Assessment to Human Review?",
      answer: "Yes. If you start with the AI Assessment and want expert review, you can upgrade by paying the difference ($459.1)."
    }
  ];
  
  return (
    <section id="faq" className="py-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg border border-border p-12">
          <h2 className="text-2xl tracking-tight text-foreground mb-12 text-center font-[Playfair_Display]">
            Frequently asked questions
          </h2>
          
          <div className="space-y-0">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}