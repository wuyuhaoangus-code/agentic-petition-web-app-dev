import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { PopupModal } from "react-calendly";
import { toast } from "sonner";

interface BookingButtonProps {
  onAuth: (mode: "signin" | "signup") => void;
  currentUser: { email: string; name?: string } | null;
  variant?: "floating" | "inline"; // Add variant prop
}

export function BookingButton({ onAuth, currentUser, variant = "floating" }: BookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Replace this with your actual Calendly URL
  const CALENDLY_URL = "https://calendly.com/kelsey-li/dreamcard-scheduling";

  useEffect(() => {
    // Check for pending booking intent after login
    const pendingBooking = localStorage.getItem("dreamcard_pending_booking");
    if (pendingBooking && currentUser) {
      localStorage.removeItem("dreamcard_pending_booking");
      setIsOpen(true);
      toast.success("Welcome back! Opening booking calendar...");
    }
  }, [currentUser]);

  const handleClick = () => {
    if (currentUser) {
      setIsOpen(true);
    } else {
      // Save intent and redirect to signup
      localStorage.setItem("dreamcard_pending_booking", "true");
      onAuth("signup");
      toast.info("Please create an account to book a meeting with us.");
    }
  };

  // Inline variant - navigation button style
  if (variant === "inline") {
    return (
      <>
        <button
          onClick={handleClick}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Book Meeting</span>
        </button>

        <PopupModal
          url={CALENDLY_URL}
          pageSettings={{
            backgroundColor: "ffffff",
            hideEventTypeDetails: false,
            hideLandingPageDetails: false,
            primaryColor: "00a2ff",
            textColor: "4d5055",
          }}
          prefill={{
            email: currentUser?.email,
            name: currentUser?.name,
          }}
          onModalClose={() => setIsOpen(false)}
          open={isOpen}
          rootElement={document.getElementById("root") || document.body}
        />
      </>
    );
  }

  // Floating variant - original floating button
  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 z-50 font-medium"
      >
        <Calendar className="w-5 h-5" />
        <span>Book a Meeting</span>
      </button>

      <PopupModal
        url={CALENDLY_URL}
        pageSettings={{
          backgroundColor: "ffffff",
          hideEventTypeDetails: false,
          hideLandingPageDetails: false,
          primaryColor: "00a2ff",
          textColor: "4d5055",
        }}
        prefill={{
          email: currentUser?.email,
          name: currentUser?.name,
        }}
        onModalClose={() => setIsOpen(false)}
        open={isOpen}
        rootElement={document.getElementById("root") || document.body}
      />
    </>
  );
}