import { useNavigate } from "react-router";
import { VideoHero } from "../components/VideoHero";
import { TrustStrip } from "../components/TrustStrip";
import { USCISInsights } from "../components/USCISInsights";
import { CaseMatchingDemo } from "../components/CaseMatchingDemo";
import { BrandShowcase } from "../components/BrandShowcase";
import { ValueProposition } from "../components/ValueProposition";
import { PathOptions } from "../components/PathOptions";
import { PricingComparison } from "../components/PricingComparison";
import { FAQ } from "../components/FAQ";
import { TrustSection } from "../components/TrustSection";

export function LandingPage() {
  const navigate = useNavigate();

  const handleAuth = (mode: "signin" | "signup") => {
    navigate(`/auth/${mode}`);
  };

  return (
    <>
      <VideoHero onAuth={handleAuth} />
      <USCISInsights />
      <CaseMatchingDemo />
      <PricingComparison />
      <TrustStrip />
      <ValueProposition />
      <PathOptions />
      <FAQ />
      <TrustSection />

      {/* Global Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite 1s;
        }
      `}</style>
    </>
  );
}
