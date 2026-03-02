import React from 'react';

interface Testimonial {
  quote: string;
  name: string;
  tag: string;
}

const testimonials: Testimonial[] = [
  { quote: "Document transform saved me so much time.", name: "Kevin", tag: "EB-1A" },
  { quote: "The petition draft looks clean and professional.", name: "Rachel", tag: "EB-1A" },
  { quote: "AI helped me generate a well-formatted petition letter.", name: "Jason", tag: "EB-1A" },
  { quote: "I saved time on formatting and focused on improving my story.", name: "Mina", tag: "EB-1A" },
  { quote: "Upload anything — it just works.", name: "Eric", tag: "EB-1A" },
  { quote: "Copy. Paste. Done.", name: "Hannah", tag: "EB-1A" },
  { quote: "Way better than starting from a blank page.", name: "Daniel", tag: "EB-1A" },
  { quote: "Easy to edit, easy to iterate.", name: "Wei", tag: "EB-1A" },
  { quote: "Simple UI.", name: "Sophia", tag: "NIW" },
  { quote: "I love everything about DreamCardAI.", name: "Leo", tag: "NIW" },
];

// Get initials from name
const getInitials = (name: string): string => {
  return name.charAt(0).toUpperCase();
};

// Generate a consistent color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-indigo-400/30',
    'bg-purple-400/30',
    'bg-blue-400/30',
    'bg-cyan-400/30',
    'bg-teal-400/30',
    'bg-emerald-400/30',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export function FloatingTestimonials() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Softer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-blue-50/50" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-50/30 to-purple-50/40" />
      
      {/* Fixed positioned testimonials - distributed around the center login box */}
      <div className="relative w-full h-full opacity-40">
        {/* Scattered testimonials with irregular positioning */}
        
        {/* Top area */}
        <div className="absolute left-[12%] top-[8%] w-[280px]" style={{ animation: 'cloudFloat1 25s ease-in-out infinite' }}>
          <TestimonialCard testimonial={testimonials[0]} />
        </div>
        
        <div className="absolute right-[15%] top-[15%] w-[260px]" style={{ animation: 'cloudFloat2 20s ease-in-out infinite 2s' }}>
          <TestimonialCard testimonial={testimonials[4]} isCompact />
        </div>

        <div className="absolute left-[8%] top-[28%] w-[240px]" style={{ animation: 'cloudFloat3 22s ease-in-out infinite 4s' }}>
          <TestimonialCard testimonial={testimonials[6]} isCompact />
        </div>

        {/* Middle left area */}
        <div className="absolute left-[5%] top-[45%] w-[300px]" style={{ animation: 'cloudFloat4 23s ease-in-out infinite 1s' }}>
          <TestimonialCard testimonial={testimonials[1]} />
        </div>
        
        <div className="absolute left-[10%] top-[62%] w-[270px]" style={{ animation: 'cloudFloat5 21s ease-in-out infinite 3s' }}>
          <TestimonialCard testimonial={testimonials[5]} isCompact />
        </div>

        {/* Middle right area */}
        <div className="absolute right-[8%] top-[38%] w-[290px]" style={{ animation: 'cloudFloat6 24s ease-in-out infinite 5s' }}>
          <TestimonialCard testimonial={testimonials[2]} />
        </div>

        <div className="absolute right-[12%] top-[55%] w-[250px]" style={{ animation: 'cloudFloat7 26s ease-in-out infinite 1.5s' }}>
          <TestimonialCard testimonial={testimonials[7]} isCompact />
        </div>

        {/* Bottom area */}
        <div className="absolute left-[18%] bottom-[10%] w-[280px]" style={{ animation: 'cloudFloat8 24s ease-in-out infinite 2.5s' }}>
          <TestimonialCard testimonial={testimonials[3]} />
        </div>

        <div className="absolute right-[10%] bottom-[18%] w-[260px]" style={{ animation: 'cloudFloat9 22s ease-in-out infinite 3.5s' }}>
          <TestimonialCard testimonial={testimonials[8]} isCompact />
        </div>

        <div className="absolute right-[20%] bottom-[8%] w-[270px]" style={{ animation: 'cloudFloat10 25s ease-in-out infinite 4.5s' }}>
          <TestimonialCard testimonial={testimonials[9]} isCompact />
        </div>
      </div>

      {/* Cloud-like animation keyframes */}
      <style>{`
        @keyframes cloudFloat1 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-15px, -10px); }
          50% { transform: translate(-8px, -18px); }
          75% { transform: translate(-20px, -5px); }
        }
        
        @keyframes cloudFloat2 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(12px, 8px); }
          50% { transform: translate(20px, -5px); }
          75% { transform: translate(8px, 10px); }
        }
        
        @keyframes cloudFloat3 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-10px, 12px); }
          50% { transform: translate(-18px, 5px); }
          75% { transform: translate(-5px, 15px); }
        }
        
        @keyframes cloudFloat4 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(15px, -8px); }
          50% { transform: translate(10px, -15px); }
          75% { transform: translate(18px, -3px); }
        }
        
        @keyframes cloudFloat5 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-12px, 10px); }
          50% { transform: translate(-20px, 3px); }
          75% { transform: translate(-8px, 12px); }
        }
        
        @keyframes cloudFloat6 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, -12px); }
          50% { transform: translate(15px, -8px); }
          75% { transform: translate(5px, -15px); }
        }
        
        @keyframes cloudFloat7 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-8px, 15px); }
          50% { transform: translate(-15px, 8px); }
          75% { transform: translate(-3px, 18px); }
        }
        
        @keyframes cloudFloat8 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(18px, 10px); }
          50% { transform: translate(12px, 18px); }
          75% { transform: translate(20px, 5px); }
        }
        
        @keyframes cloudFloat9 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-15px, -12px); }
          50% { transform: translate(-10px, -20px); }
          75% { transform: translate(-18px, -8px); }
        }
        
        @keyframes cloudFloat10 {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(12px, -10px); }
          50% { transform: translate(20px, -15px); }
          75% { transform: translate(8px, -18px); }
        }
      `}</style>
    </div>
  );
}

// Testimonial Card Component
interface TestimonialCardProps {
  testimonial: Testimonial;
  isCompact?: boolean;
}

function TestimonialCard({ testimonial, isCompact = false }: TestimonialCardProps) {
  const { quote, name, tag } = testimonial;

  if (isCompact) {
    return (
      <div className="backdrop-blur-md bg-white/50 rounded-full border border-white/20 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className={`flex-shrink-0 w-7 h-7 rounded-full ${getAvatarColor(name)} flex items-center justify-center border border-white/20`}>
            <span className="text-xs font-bold text-foreground/50">
              {getInitials(name)}
            </span>
          </div>
          
          {/* Content */}
          <p className="text-sm text-foreground/50 font-normal flex-1">
            {quote}
          </p>
          <p className="text-xs text-foreground/40 font-medium whitespace-nowrap">
            — {name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/60 rounded-2xl border border-white/25 p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-full ${getAvatarColor(name)} flex items-center justify-center border border-white/20`}>
          <span className="text-sm font-bold text-foreground/50">
            {getInitials(name)}
          </span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed text-foreground/55 font-normal mb-1.5">
            {quote}
          </p>
          <p className="text-xs text-foreground/45 font-medium">
            {name} · {tag}
          </p>
        </div>
      </div>
    </div>
  );
}