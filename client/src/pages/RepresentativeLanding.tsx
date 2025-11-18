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
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
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
}

export default function RepresentativeLanding() {
  const [, params] = useRoute('/rep/:slug');
  const slug = (params as { slug?: string })?.slug || '';
  const { toast } = useToast();
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
  const contactButtonLabel = representative.contact_button_text || 'Contact Me';
  const contactCardLabel = representative.contact_card_button_text || 'Download Contact Card';
  const contactFormTitle = representative.contact_form_title || 'Get In Touch';
  const contactFormDescription =
    representative.contact_form_description ||
    'Share your details and we will follow up with recommendations tailored to your needs.';
  const locationLine = [representative.address, representative.city, representative.state, representative.zip_code]
    .filter(Boolean)
    .join(', ');
  const socialLinks = representative.social_links || {};
  const hasBanner = Boolean(representative.banner_image_url);

  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return phone;
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX if it's 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    // Format as (XXX) XXX-XXXX XXXX if it's 11 digits (with country code)
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    // Return original if it doesn't match expected format
    return phone;
  };

  const getPhoneNumberForTel = (phone: string): string => {
    if (!phone) return phone;
    // Remove all non-digit characters for tel: link
    return phone.replace(/\D/g, '');
  };

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
            <p className="mt-4 max-w-2xl text-base text-emerald-50/90">
              I help Soil Seed &amp; Water partners dial in bulk soil, seed, and irrigation blends
              for their projects. Drop a quick note and I'll get right back to you.
            </p>
            <div className="mt-8 grid w-full gap-3 sm:max-w-xl sm:grid-cols-2">
              <Button size="lg" className="w-full" onClick={() => setIsContactDialogOpen(true)}>
                {contactButtonLabel}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full border-white/60 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:border-white/30 disabled:bg-white/5 disabled:text-white/60"
                onClick={handleDownloadContactCard}
                disabled={isDownloadingCard}
              >
                <Download className="mr-2 h-4 w-4" />
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
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 p-4">
                    <Phone className="mt-1 h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-emerald-700/70">Phone</p>
                      <a
                        href={`tel:${getPhoneNumberForTel(representative.phone)}`}
                        className="font-semibold text-emerald-900 underline-offset-4 hover:underline"
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
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-300/40 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 p-6 text-white shadow-xl shadow-emerald-900/30">
              <h2 className="text-2xl font-semibold">{contactFormTitle}</h2>
              <p className="mt-2 text-emerald-50/90">{contactFormDescription}</p>
              <ul className="mt-6 space-y-3 text-sm text-emerald-50/90">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                  <span>Direct access to {representative.name}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                  <span>Customized wholesale recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                  <span>Fast follow-up within 1 business day</span>
                </li>
              </ul>
              <div className="mt-8 space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-white text-emerald-900 hover:bg-emerald-50"
                  onClick={() => setIsContactDialogOpen(true)}
                >
                  {contactButtonLabel}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white disabled:border-white/30 disabled:bg-white/5 disabled:text-white/60"
                  onClick={handleDownloadContactCard}
                  disabled={isDownloadingCard}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloadingCard ? 'Preparing...' : contactCardLabel}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/80 p-6 text-emerald-900 shadow-inner">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
                Quick note
              </p>
              <p className="mt-3 text-sm leading-relaxed text-emerald-900/80">
                Once you hit send, {representative.name.split(' ')[0]} sees your details instantly
                inside the Soil Seed &amp; Water CRM. Expect a friendly follow-up shortly after.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="w-[92vw] max-w-lg rounded-3xl border-none p-6 sm:w-full sm:p-8">
          <DialogHeader>
            <DialogTitle>{contactFormTitle}</DialogTitle>
            <DialogDescription>
              Provide a few details so {representative.name} can follow up quickly.
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
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
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Briefly describe how we can help..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
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
