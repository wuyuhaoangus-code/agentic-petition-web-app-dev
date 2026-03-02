import React from 'react';

// Configuration for the testimonials
// Positions are carefully chosen to avoid the center area (35%-65%)
// and to create a loose, airy feel.
const TESTIMONIALS = [
  // Left Side (0-35%)
  { 
    quote: "Document transform saved me so much time.", 
    author: "Zichen", 
    tag: "EB-1A", 
    x: "4%", 
    yStart: "100%",
    delay: "0s", 
    duration: "25s", 
    size: "lg",
    initials: "Z"
  },
  { 
    quote: "Simple UI.", 
    author: "Sophia", 
    tag: "NIW", 
    x: "22%", 
    yStart: "100%",
    delay: "-5s", 
    duration: "28s", 
    size: "sm",
    initials: "S"
  },
  { 
    quote: "Copy. Paste. Done.", 
    author: "Hannah", 
    tag: "EB-1A", 
    x: "10%", 
    yStart: "100%",
    delay: "-12s", 
    duration: "30s", 
    size: "sm",
    initials: "H"
  },
  { 
    quote: "The petition draft looks clean and professional.", 
    author: "Rachel", 
    tag: "EB-1A", 
    x: "28%", 
    yStart: "100%",
    delay: "-18s", 
    duration: "22s", 
    size: "lg",
    initials: "R"
  },
  { 
    quote: "I love everything about DreamCardAI.", 
    author: "Leo", 
    tag: "NIW", 
    x: "6%", 
    yStart: "100%",
    delay: "-22s", 
    duration: "26s", 
    size: "sm",
    initials: "L"
  },
  { 
    quote: "Upload anything — it just works.", 
    author: "Kumari", 
    tag: "EB-1A", 
    x: "18%", 
    yStart: "100%",
    delay: "-8s", 
    duration: "24s", 
    size: "sm",
    initials: "K"
  },
  {
    quote: "Way better than starting from a blank page.",
    author: "Daniel",
    tag: "EB-1A",
    x: "2%",
    yStart: "100%",
    delay: "-15s",
    duration: "29s",
    size: "sm",
    initials: "D"
  },
  {
     quote: "Easy to edit, easy to iterate.",
     author: "Wei",
     tag: "EB-1A",
     x: "30%",
     yStart: "100%",
     delay: "-3s",
     duration: "32s",
     size: "sm",
     initials: "W"
  },

  // Right Side (65-100%)
  { 
    quote: "AI helped me generate a well-formatted petition letter.", 
    author: "Jason", 
    tag: "NIW", 
    x: "72%", 
    yStart: "100%",
    delay: "-2s", 
    duration: "27s", 
    size: "lg",
    initials: "J"
  },
  { 
    quote: "Way better than starting from a blank page.", 
    author: "Daniel", 
    tag: "EB-1A", 
    x: "88%", 
    yStart: "100%",
    delay: "-7s", 
    duration: "23s", 
    size: "sm",
    initials: "D"
  },
  { 
    quote: "Easy to edit, easy to iterate.", 
    author: "Wei", 
    tag: "EB-1A", 
    x: "68%", 
    yStart: "100%",
    delay: "-15s", 
    duration: "29s", 
    size: "sm",
    initials: "W"
  },
  { 
    quote: "I saved time on formatting and focused on improving my story.", 
    author: "Haoming", 
    tag: "EB-1A", 
    x: "92%", 
    yStart: "100%",
    delay: "-20s", 
    duration: "21s", 
    size: "lg",
    initials: "H"
  },
  {
    quote: "Document transform saved me so much time.",
    author: "Zichen",
    tag: "EB-1A",
    x: "78%",
    yStart: "100%",
    delay: "-10s",
    duration: "31s",
    size: "sm",
    initials: "Z"
  },
  {
    quote: "Simple UI.",
    author: "Sophia",
    tag: "NIW",
    x: "95%",
    yStart: "100%",
    delay: "-25s",
    duration: "26s",
    size: "sm",
    initials: "S"
  },
  {
     quote: "The petition draft looks clean and professional.",
     author: "Rachel",
     tag: "EB-1A",
     x: "66%",
     yStart: "100%",
     delay: "-30s",
     duration: "33s",
     size: "sm",
     initials: "R"
  },
  {
      quote: "Copy. Paste. Done.",
      author: "Hannah",
      tag: "EB-1A",
      x: "82%",
      yStart: "100%",
      delay: "-13s",
      duration: "24s",
      size: "sm",
      initials: "H"
  }
];

export function AuthBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Subtle Gradient Wash is handled by parent, but we can add a specific overlay if needed */}
      {/* We rely on the parent's gradient for the base. */}
      
      <style>
        {`
          @keyframes floatUp {
            from { transform: translateY(110vh) translateX(0); }
            to { transform: translateY(-120vh) translateX(20px); }
          }
          @keyframes driftSide {
            0%, 100% { margin-left: 0px; }
            50% { margin-left: 15px; }
          }
        `}
      </style>

      {TESTIMONIALS.map((item, i) => (
        <div
          key={i}
          className={`absolute flex flex-col gap-3 p-4 rounded-2xl bg-white/60 shadow-sm border border-white/40 backdrop-blur-[1px]
            ${item.size === 'lg' ? 'w-[280px]' : 'w-[220px]'}
          `}
          style={{
            left: item.x,
            bottom: '-200px', // Start offscreen
            opacity: 0.16, // 12-20% opacity
            animation: `floatUp ${item.duration} linear infinite`,
            animationDelay: item.delay,
          }}
        >
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100/50 flex items-center justify-center text-[10px] font-bold text-indigo-800/60">
              {item.initials}
            </div>
            
            {/* Content */}
            <div className="space-y-1">
              <p className={`text-indigo-950 font-medium leading-relaxed ${item.size === 'lg' ? 'text-sm' : 'text-xs'}`}>
                "{item.quote}"
              </p>
              <p className="text-[10px] font-medium text-indigo-800/60">
                — {item.author} · {item.tag}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
