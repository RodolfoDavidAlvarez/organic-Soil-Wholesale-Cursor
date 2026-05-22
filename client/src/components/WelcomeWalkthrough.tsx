import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingCart, Search, Clock, FileText, Package, Leaf, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ONBOARDING_KEY = 'osw-onboarding-complete';

interface WelcomeWalkthroughProps {
  variant: 'retail' | 'wholesale';
  onClose?: () => void;
}

const WelcomeWalkthrough = ({ variant, onClose }: WelcomeWalkthroughProps) => {
  const { isAuthenticated, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setVisible(true);
    }
  }, [isAuthenticated, user]);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setVisible(false);
    onClose?.();
  };

  const handleSubmitNote = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      await fetch('/api/portal/onboarding-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.profile?.full_name || '',
          email: user?.email || '',
          note: note.trim(),
        }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit onboarding note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const firstName = user?.profile?.full_name?.split(' ')[0] || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#264027] px-6 pt-8 pb-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-bold">
            Welcome{firstName ? `, ${firstName}` : ''}!
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {variant === 'retail'
              ? "We're glad you're here. Here's how to get started."
              : "Let's get your wholesale account set up."}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Optional note field */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              What are you looking for? <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {!submitted ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    variant === 'retail'
                      ? 'e.g. Soil for raised beds, mulch for landscaping...'
                      : 'e.g. Bulk compost for landscaping jobs, potting soil...'
                  }
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#264027]/20 focus:border-[#264027] transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && note.trim()) handleSubmitNote();
                  }}
                />
                {note.trim() && (
                  <button
                    onClick={handleSubmitNote}
                    disabled={submitting}
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#264027] text-white hover:bg-[#264027]/90 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#264027] font-medium">Thanks! We'll keep that in mind.</p>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {variant === 'retail' ? (
              <>
                <StepItem
                  number={1}
                  icon={<Search className="h-5 w-5" />}
                  title="Browse our products"
                  description="Explore our full catalog of organic soils, amendments, and mulches."
                />
                <StepItem
                  number={2}
                  icon={<ShoppingCart className="h-5 w-5" />}
                  title="Add to your Quote Cart"
                  description="Select the products and quantities you need."
                />
                <StepItem
                  number={3}
                  icon={<Clock className="h-5 w-5" />}
                  title="We'll respond within 24 hours"
                  description="Submit your quote and our team will reach out with pricing and availability."
                />
              </>
            ) : (
              <>
                <StepItem
                  number={1}
                  icon={<FileText className="h-5 w-5" />}
                  title="Complete your application"
                  description="We'll set up your wholesale account with custom pricing."
                />
                <StepItem
                  number={2}
                  icon={<Leaf className="h-5 w-5" />}
                  title="Browse products"
                  description="See our full catalog while we review your application."
                />
                <StepItem
                  number={3}
                  icon={<Package className="h-5 w-5" />}
                  title="Place orders"
                  description="Once approved, order directly from your portal."
                />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          {variant === 'retail' ? (
            <Button
              onClick={handleClose}
              className="w-full bg-[#264027] hover:bg-[#264027]/90 text-white h-12 text-base font-semibold rounded-xl"
            >
              Start Shopping
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={() => {
                  handleClose();
                  window.location.href = '/portal/application';
                }}
                className="w-full bg-[#264027] hover:bg-[#264027]/90 text-white h-12 text-base font-semibold rounded-xl"
              >
                Complete Application
              </Button>
              <Button
                onClick={() => {
                  handleClose();
                  window.location.href = '/products';
                }}
                variant="outline"
                className="w-full h-11 text-sm border-[#264027]/30 text-[#264027] hover:bg-[#264027]/5 rounded-xl"
              >
                Browse Products First
              </Button>
            </div>
          )}
          <button
            onClick={handleClose}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

interface StepItemProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const StepItem = ({ number, icon, title, description }: StepItemProps) => (
  <div className="flex items-start gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#264027]/10 flex items-center justify-center text-[#264027]">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#264027]/50 uppercase tracking-wider">
          Step {number}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mt-0.5">{title}</h3>
      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default WelcomeWalkthrough;
