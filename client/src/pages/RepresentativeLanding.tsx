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
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
    <div className="min-h-screen bg-gradient-to-b from-green-50/60 via-white to-white">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 space-y-10">
          <div className="relative overflow-hidden rounded-3xl shadow-xl">
            {hasBanner && representative.banner_image_url && (
              <div className="absolute inset-0">
                <img
                  src={representative.banner_image_url}
                  alt={`${representative.name} banner`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/70" />
              </div>
            )}
            <div
              className={`relative px-6 py-14 md:px-12 md:py-20 ${
                hasBanner ? 'text-white' : 'bg-gradient-to-br from-white to-green-50 text-gray-900'
              }`}
            >
              <div className="mb-6 flex flex-col items-center">
                {representative.photo_url && (
                  <img
                    src={representative.photo_url}
                    alt={representative.name}
                    className="mb-5 h-28 w-28 rounded-full border-4 border-white/60 object-cover shadow-lg"
                  />
                )}
                <h1 className="text-4xl font-bold md:text-5xl">{representative.name}</h1>
                {representative.title && (
                  <p
                    className={`mt-2 text-lg ${
                      hasBanner ? 'text-white/80' : 'text-gray-600'
                    }`}
                  >
                    {representative.title}
                  </p>
                )}
                {representative.company_name && (
                  <p
                    className={`text-base ${
                      hasBanner ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {representative.company_name}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" onClick={() => setIsContactDialogOpen(true)}>
                  {contactButtonLabel}
                </Button>
                <Button
                  size="lg"
                  variant={hasBanner ? 'secondary' : 'outline'}
                  onClick={handleDownloadContactCard}
                  disabled={isDownloadingCard}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isDownloadingCard ? 'Preparing...' : contactCardLabel}
                </Button>
              </div>
              <p
                className={`mt-4 text-sm ${
                  hasBanner ? 'text-white/80' : 'text-gray-500'
                }`}
              >
                Instantly add {representative.name} to your contacts or message them for a tailored
                recommendation.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">Contact Information</h2>
                <div className="space-y-5">
                  {representative.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a
                          href={`mailto:${representative.email}`}
                          className="font-medium text-green-700 hover:text-green-800 hover:underline"
                        >
                          {representative.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {representative.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <a
                          href={`tel:${representative.phone}`}
                          className="font-medium text-green-700 hover:text-green-800 hover:underline"
                        >
                          {representative.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {representative.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <a
                          href={representative.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-green-700 hover:text-green-800 hover:underline"
                        >
                          {representative.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                  {locationLine && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-1 h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{locationLine}</p>
                      </div>
                    </div>
                  )}
                </div>

                {(socialLinks.facebook ||
                  socialLinks.twitter ||
                  socialLinks.linkedin ||
                  socialLinks.instagram) && (
                  <div className="mt-6 border-t pt-6">
                    <p className="mb-3 text-sm font-medium text-gray-500">Connect With Me</p>
                    <div className="flex gap-3">
                      {socialLinks.facebook && (
                        <a
                          href={socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-blue-600 p-2 text-white transition hover:bg-blue-700"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                      {socialLinks.twitter && (
                        <a
                          href={socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-blue-400 p-2 text-white transition hover:bg-blue-500"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                      {socialLinks.linkedin && (
                        <a
                          href={socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-blue-700 p-2 text-white transition hover:bg-blue-800"
                        >
                          <Linkedin className="h-5 w-5" />
                        </a>
                      )}
                      {socialLinks.instagram && (
                        <a
                          href={socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-pink-600 p-2 text-white transition hover:bg-pink-700"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {representative.bio && (
                <div className="rounded-2xl bg-white p-6 shadow-md">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">About</h2>
                  <p className="text-gray-700 leading-relaxed">{representative.bio}</p>
                </div>
              )}

              {galleryImages.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-md">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">Featured Highlights</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {galleryImages.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="overflow-hidden rounded-xl border bg-muted/20"
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
              <div className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="text-2xl font-semibold text-gray-900">{contactFormTitle}</h2>
                <p className="mt-2 text-gray-600">{contactFormDescription}</p>
                <ul className="mt-6 space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>Direct access to {representative.name}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>Customized wholesale recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                    <span>Fast follow-up within 1 business day</span>
                  </li>
                </ul>
                <div className="mt-6 flex flex-col gap-3">
                  <Button size="lg" onClick={() => setIsContactDialogOpen(true)}>
                    {contactButtonLabel}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleDownloadContactCard}
                    disabled={isDownloadingCard}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloadingCard ? 'Preparing...' : contactCardLabel}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/60 p-6">
                <p className="text-sm font-medium text-green-900">Quick note</p>
                <p className="text-sm text-green-800">
                  Once you submit your information, {representative.name.split(' ')[0]} will receive
                  it instantly in the CRM dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-lg">
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
              <div className="grid grid-cols-2 gap-4">
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
