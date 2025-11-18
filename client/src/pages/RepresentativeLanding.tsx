import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Send,
  CheckCircle2,
  IdCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePhoneNumberLock } from '@/hooks/usePhoneNumberLock';
import { formatPhoneNumber, getPhoneNumberForTel } from '@/utils/phone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Representative {
  id: number;
  slug: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  bio?: string;
  photo_url?: string;
  banner_image_url?: string;
  gallery_images?: string[];
  company_name?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  contact_button_text?: string;
  contact_card_button_text?: string;
  contact_form_title?: string;
  contact_form_description?: string;
  video_urls?: string[];
}

const getYouTubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').trim() || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.replace('/shorts/', '').trim() || null;
      }
      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }
  return null;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0&controls=1&loop=1&playlist=${videoId}`;
};

export default function RepresentativeLanding() {
  const [, params] = useRoute('/rep/:slug');
  const slug = (params as { slug?: string })?.slug || '';
  const { toast } = useToast();

  // Exclude this page from phone number tracking systems (CallRail, etc.)
  // Use useLayoutEffect to set attributes before paint, preventing script from running
  useEffect(() => {
    // Set on html element
    document.documentElement.setAttribute('data-callrail-ignore', 'true');
    document.documentElement.setAttribute('data-dynamic-number-ignore', 'true');
    document.documentElement.setAttribute('data-call-tracking-ignore', 'true');
    
    // Also set on body element
    document.body.setAttribute('data-callrail-ignore', 'true');
    document.body.setAttribute('data-dynamic-number-ignore', 'true');
    document.body.setAttribute('data-call-tracking-ignore', 'true');
    
    // Set class for additional exclusion methods
    document.documentElement.classList.add('no-call-tracking');
    document.body.classList.add('no-call-tracking');
    
    // Prevent phone number replacement by wrapping in protected container
    const style = document.createElement('style');
    style.textContent = `
      [data-callrail-ignore="true"],
      [data-dynamic-number-ignore="true"],
      .no-call-tracking a[href^="tel:"] {
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.documentElement.removeAttribute('data-callrail-ignore');
      document.documentElement.removeAttribute('data-dynamic-number-ignore');
      document.documentElement.removeAttribute('data-call-tracking-ignore');
      document.body.removeAttribute('data-callrail-ignore');
      document.body.removeAttribute('data-dynamic-number-ignore');
      document.body.removeAttribute('data-call-tracking-ignore');
      document.documentElement.classList.remove('no-call-tracking');
      document.body.classList.remove('no-call-tracking');
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);

  useEffect(() => {
    if (!isContactDialogOpen) {
      setIsSubmitted(false);
    }
  }, [isContactDialogOpen]);

  const {
    data: representative,
    isLoading,
    error,
  } = useQuery<Representative>({
    queryKey: ['representative', slug],
    queryFn: async () => {
      const response = await fetch(`/api/representatives/${slug}`);
      if (!response.ok) {
        throw new Error('Representative not found');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/representatives/${slug}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          message: data.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit form');
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        notes: '',
      });
      toast({
        title: 'Success!',
        description: 'Your message has been sent successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    submitMutation.mutate(formData);
  };

  usePhoneNumberLock({ enabled: Boolean(representative?.phone) });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !representative) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Representative Not Found</h1>
          <p className="text-muted-foreground">
            The representative you're looking for doesn't exist or is inactive.
          </p>
        </div>
      </div>
    );
  }

  const galleryImages = Array.isArray(representative.gallery_images)
    ? representative.gallery_images.filter((url) => !!url)
    : [];
  const videoUrls = Array.isArray(representative.video_urls)
    ? representative.video_urls.filter((url) => !!url)
    : [];
  const contactButtonLabel = representative.contact_button_text || 'Enter Your Contact Details';
  const contactCardLabel = representative.contact_card_button_text || 'Download Contact Card';
  const contactFormTitle = representative.contact_form_title || 'Stay Connected';
  const contactFormDescription =
    representative.contact_form_description ||
    'Share a few quick details and I will follow up with tailored wholesale recommendations.';
  const locationLine = [representative.address, representative.city, representative.state, representative.zip_code]
    .filter(Boolean)
    .join(', ');
  const socialLinks = representative.social_links || {};
  const hasBanner = Boolean(representative.banner_image_url);
  const primaryCtaClasses =
    'w-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300 shadow-lg font-semibold border border-emerald-50/70';
  const secondaryCtaClasses =
    'w-full border border-white/80 bg-white/15 text-white hover:bg-white/25 hover:text-white shadow-lg backdrop-blur-sm disabled:border-white/40 disabled:bg-white/5 disabled:text-white/50';
  const inputClasses =
    'h-12 rounded-2xl border border-emerald-100 bg-white/90 text-emerald-900 placeholder:text-emerald-400 shadow-inner transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/70';
  const textareaClasses =
    'rounded-3xl border border-emerald-100 bg-white/90 text-emerald-900 placeholder:text-emerald-400 shadow-inner transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/70';

  const handleDownloadContactCard = async () => {
    if (!representative) return;
    try {
      setIsDownloadingCard(true);
      const response = await fetch(`/api/representatives/${slug}/contact-card`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Unable to download contact card');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${representative.slug || representative.name || 'contact'}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Contact card ready',
        description: 'Check your downloads to add it to your contacts.',
      });
    } catch (downloadError: any) {
      toast({
        title: 'Download failed',
        description: downloadError.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloadingCard(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950/5 via-white to-emerald-50/40 text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-0">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-white shadow-2xl shadow-emerald-900/10">
          <div className="absolute inset-0">
            {hasBanner && representative.banner_image_url ? (
              <img
                src={representative.banner_image_url}
                alt={`${representative.name} banner`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700" />
            )}
            <div className="absolute inset-0 bg-emerald-950/60" />
          </div>
          <div className="relative flex flex-col items-center px-6 py-12 text-center text-white sm:px-10 md:py-14">
            <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-100/90">
              Soil Seed &amp; Water
            </span>
            {representative.photo_url ? (
              <img
                src={representative.photo_url}
                alt={representative.name}
                className="my-6 h-28 w-28 rounded-full border-4 border-white/60 object-cover shadow-lg shadow-black/20"
              />
            ) : (
              <div className="my-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/60 bg-white/15 text-3xl font-semibold uppercase text-white">
                {representative.name?.charAt(0) || '?'}
              </div>
            )}
            <h1 className="text-3xl font-heading font-semibold sm:text-4xl md:text-5xl">
              Hey there, I'm {representative.name}
            </h1>
            {representative.title && (
              <p className="mt-2 text-base text-emerald-100/90">{representative.title}</p>
            )}
            {representative.company_name && (
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-100/70">
                {representative.company_name}
              </p>
            )}
            <div className="mt-8 grid w-full gap-3 sm:max-w-xl sm:grid-cols-2">
              <Button
                size="lg"
                className={primaryCtaClasses}
                onClick={() => setIsContactDialogOpen(true)}
              >
                {contactButtonLabel}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={secondaryCtaClasses}
                onClick={handleDownloadContactCard}
                disabled={isDownloadingCard}
              >
                <IdCard className="mr-2 h-4 w-4" />
                {isDownloadingCard ? 'Preparing...' : contactCardLabel}
              </Button>
            </div>
            <p className="mt-4 text-sm text-emerald-100/80">
              Prefer to call or email? Everything you need lives below.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:mt-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-900/5">
              <h2 className="mb-4 text-2xl font-semibold text-emerald-900">Direct contact</h2>
              <div className="space-y-5">
                {representative.email && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 p-4">
                    <Mail className="mt-1 h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-700/70">Email</p>
                      <a
                        href={`mailto:${representative.email}`}
                        className="font-semibold text-emerald-900 underline-offset-4 hover:underline"
                      >
                        {representative.email}
                      </a>
                    </div>
                  </div>
                )}
                {representative.phone && (
                  <div 
                    className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 p-4"
                    data-callrail-ignore="true"
                    data-dynamic-number-ignore="true"
                    data-call-tracking-ignore="true"
                  >
                    <Phone className="mt-1 h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-700/70">Phone</p>
                      <a
                        href={`tel:${getPhoneNumberForTel(representative.phone)}`}
                        className="font-semibold text-emerald-900 underline-offset-4 hover:underline no-call-tracking"
                        data-callrail-ignore="true"
                        data-dynamic-number-ignore="true"
                        data-call-tracking-ignore="true"
                        data-phone-number={representative.phone}
                      >
                        {formatPhoneNumber(representative.phone)}
                      </a>
                    </div>
                  </div>
                )}
                {representative.website && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 p-4">
                    <Globe className="mt-1 h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-700/70">
                        Website
                      </p>
                      <a
                        href={representative.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-emerald-900 underline-offset-4 hover:underline"
                      >
                        {representative.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
                {locationLine && (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 p-4">
                    <MapPin className="mt-1 h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-700/70">
                        Location
                      </p>
                      <p className="font-semibold text-emerald-900">{locationLine}</p>
                    </div>
                  </div>
                )}
              </div>

              {(socialLinks.facebook ||
                socialLinks.twitter ||
                socialLinks.linkedin ||
                socialLinks.instagram) && (
                <div className="mt-6 border-t border-emerald-100 pt-6">
                  <p className="mb-3 text-sm font-medium text-emerald-800">Connect online</p>
                  <div className="flex flex-wrap gap-3">
                    {socialLinks.facebook && (
                      <a
                        href={socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-emerald-600/90 p-2 text-white transition hover:bg-emerald-600"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.twitter && (
                      <a
                        href={socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-emerald-500 p-2 text-white transition hover:bg-emerald-400"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-emerald-700 p-2 text-white transition hover:bg-emerald-600"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {socialLinks.instagram && (
                      <a
                        href={socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-pink-600 p-2 text-white transition hover:bg-pink-500"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {representative.bio && (
              <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-900/5">
                <h2 className="mb-4 text-2xl font-semibold text-emerald-900">About Soil Seed &amp; Water</h2>
                <p className="leading-relaxed text-emerald-900/90">{representative.bio}</p>
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-900/5">
                <h2 className="mb-4 text-2xl font-semibold text-emerald-900">Project snapshots</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {galleryImages.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="overflow-hidden rounded-2xl border border-emerald-50 bg-muted/20"
                    >
                      <img
                        src={image}
                        alt={`${representative.name} gallery ${index + 1}`}
                        className="h-48 w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videoUrls.length > 0 && (
              <div className="rounded-3xl border border-emerald-100 bg-white/95 p-6 shadow-lg shadow-emerald-900/5">
                <h2 className="mb-2 text-2xl font-semibold text-emerald-900">Video spotlight</h2>
                <p className="text-sm text-emerald-800/80">
                  Tap play to meet {representative.name} and learn how we support partners at Soil Seed &amp; Water.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {videoUrls.map((url, index) => {
                    const embedUrl = getYouTubeEmbedUrl(url);
                    return (
                      <div key={`${url}-${index}`} className="space-y-2">
                        <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-900/20 shadow-inner aspect-video">
                          {embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={`Video ${index + 1}`}
                              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                              allowFullScreen
                              loading="lazy"
                              className="h-full w-full"
                            />
                          ) : (
                            <video
                              src={url}
                              className="h-full w-full object-cover"
                              autoPlay
                              muted
                              loop
                              playsInline
                              controls
                            />
                          )}
                        </div>
                        <p className="text-sm font-medium text-emerald-900">Video highlight {index + 1}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 p-6 text-white shadow-xl shadow-emerald-900/30">
              <h2 className="text-2xl font-semibold">{contactFormTitle}</h2>
              <p className="mt-2 text-emerald-50/90">{contactFormDescription}</p>
              <div className="mt-6 space-y-3 text-sm text-emerald-50/90">
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="font-semibold text-white">1:1 connection</p>
                  <p>Skip phone trees—chat directly with {representative.name} about your project.</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="font-semibold text-white">Fast follow-up</p>
                  <p>Average response time is under one business day with curated recommendations.</p>
                </div>
              </div>
              <div className="mt-8 space-y-3">
                <Button
                  size="lg"
                  className={primaryCtaClasses}
                  onClick={() => setIsContactDialogOpen(true)}
                >
                  {contactButtonLabel}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={secondaryCtaClasses}
                  onClick={handleDownloadContactCard}
                  disabled={isDownloadingCard}
                >
                  <IdCard className="mr-2 h-4 w-4" />
                  {isDownloadingCard ? 'Preparing...' : contactCardLabel}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="w-[94vw] max-w-xl rounded-[32px] border border-emerald-100 bg-gradient-to-b from-white via-emerald-50/70 to-white p-5 shadow-2xl shadow-emerald-900/15 sm:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-emerald-900">{contactFormTitle}</DialogTitle>
            <DialogDescription className="text-emerald-700">
              Provide a few quick details so {representative.name} can follow up within one business day.
            </DialogDescription>
          </DialogHeader>

          {isSubmitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" />
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Thank You!</h3>
              <p className="text-gray-600">
                Your message has been sent successfully. {representative.name} will get back to you
                soon.
              </p>
              <Button className="mt-6 w-full" onClick={() => setIsContactDialogOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    className={inputClasses}
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    className={inputClasses}
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  className={inputClasses}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  className={inputClasses}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  className={textareaClasses}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Briefly describe how we can help..."
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-full bg-emerald-500 text-white font-semibold tracking-wide shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400 focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
