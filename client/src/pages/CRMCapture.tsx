import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Camera, Upload, Loader2, Mic, MicOff, Sparkles, Send, Check, X, RotateCcw, ChevronDown, ChevronUp, Zap, Users, Building2, MapPin, Pencil, RefreshCw, Mail, Leaf, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Types
interface ExtractedData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  title: string;
  address: string;
  website: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

// Organization type
type Organization = 'ssw' | 'ufe' | 'both';

// SSW Segments - Soil products, agriculture, composting
const SSW_SEGMENTS = [
  { value: 'operator', label: 'Operator', icon: Building2, color: 'bg-amber-500' },
  { value: 'farmer_vineyard', label: 'Vineyard', icon: MapPin, color: 'bg-purple-500' },
  { value: 'farmer_orchard', label: 'Orchard', icon: MapPin, color: 'bg-orange-500' },
  { value: 'farmer_general', label: 'Farmer', icon: MapPin, color: 'bg-green-500' },
  { value: 'landscaper', label: 'Landscaper', icon: MapPin, color: 'bg-teal-500' },
  { value: 'waste_hauler', label: 'Hauler', icon: Building2, color: 'bg-slate-500' },
  { value: 'other', label: 'Other', icon: Users, color: 'bg-gray-400' },
];

// UFE Segments - Education, corporate, municipal
const UFE_SEGMENTS = [
  { value: 'municipal', label: 'Municipal', icon: Building2, color: 'bg-blue-500' },
  { value: 'equipment', label: 'Equipment', icon: Building2, color: 'bg-slate-500' },
  { value: 'policy', label: 'Policy', icon: Building2, color: 'bg-indigo-500' },
  { value: 'esg', label: 'ESG', icon: Building2, color: 'bg-cyan-500' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: 'bg-yellow-500' },
  { value: 'operator', label: 'Operator', icon: Building2, color: 'bg-amber-500' },
  { value: 'other', label: 'Other', icon: Users, color: 'bg-gray-400' },
];

// Combined segments (legacy/both)
const ALL_SEGMENTS = [
  { value: 'operator', label: 'Operator', icon: Building2, color: 'bg-amber-500' },
  { value: 'municipal', label: 'Municipal', icon: Building2, color: 'bg-blue-500' },
  { value: 'farmer_vineyard', label: 'Vineyard', icon: MapPin, color: 'bg-purple-500' },
  { value: 'farmer_orchard', label: 'Orchard', icon: MapPin, color: 'bg-orange-500' },
  { value: 'farmer_general', label: 'Farmer', icon: MapPin, color: 'bg-green-500' },
  { value: 'landscaper', label: 'Landscaper', icon: MapPin, color: 'bg-teal-500' },
  { value: 'equipment', label: 'Equipment', icon: Building2, color: 'bg-slate-500' },
  { value: 'other', label: 'Other', icon: Users, color: 'bg-gray-400' },
];

// SSW Lead Sources
const SSW_LEAD_SOURCES = [
  { value: 'uscc_2026', label: 'USCC 2026' },
  { value: 'azcc', label: 'AZCC' },
  { value: 'farm_show', label: 'Farm Show' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

// UFE Lead Sources
const UFE_LEAD_SOURCES = [
  { value: 'uscc_2026', label: 'USCC 2026' },
  { value: 'skyfire_2026', label: 'SkyFire' },
  { value: 'harvesting_wisdom', label: 'Harvesting Wisdom' },
  { value: 'team_builders', label: 'Team Builders' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

// Combined Lead Sources (legacy/both)
const ALL_LEAD_SOURCES = [
  { value: 'uscc_2026', label: 'USCC 2026' },
  { value: 'skyfire_2026', label: 'SkyFire' },
  { value: 'azcc', label: 'AZCC' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const PARTNERS = [
  { value: 'ssw', label: 'SSW', color: 'from-emerald-500 to-emerald-700' },
  { value: 'ufe', label: 'UFE', color: 'from-blue-500 to-blue-700' },
  { value: 'both', label: 'Both', color: 'from-purple-500 to-purple-700' },
];

// Organization configs
const ORG_CONFIG = {
  ssw: {
    name: 'Soil Seed & Water',
    shortName: 'SSW',
    subtitle: 'Lead Capture',
    segments: SSW_SEGMENTS,
    sources: SSW_LEAD_SOURCES,
    defaultPartner: 'ssw' as Organization,
    showPartnerSelector: false,
    headerColor: 'from-emerald-600 to-emerald-800',
    accentColor: 'emerald',
    icon: Leaf,
  },
  ufe: {
    name: 'Urban Farming Education',
    shortName: 'UFE',
    subtitle: 'Lead Capture',
    segments: UFE_SEGMENTS,
    sources: UFE_LEAD_SOURCES,
    defaultPartner: 'ufe' as Organization,
    showPartnerSelector: false,
    headerColor: 'from-blue-600 to-blue-800',
    accentColor: 'blue',
    icon: GraduationCap,
  },
  both: {
    name: 'Lead Capture',
    shortName: 'SSW + UFE',
    subtitle: 'Partnership',
    segments: ALL_SEGMENTS,
    sources: ALL_LEAD_SOURCES,
    defaultPartner: 'both' as Organization,
    showPartnerSelector: true,
    headerColor: 'from-slate-700 to-slate-900',
    accentColor: 'slate',
    icon: Users,
  },
};

type FlowStep = 'capture' | 'entry' | 'email_preview' | 'sending' | 'success';

// Animated pulse ring component
const PulseRing = ({ color = 'bg-emerald-400', delay = 0 }: { color?: string; delay?: number }) => (
  <div
    className={`absolute inset-0 rounded-full ${color} animate-ping opacity-20`}
    style={{ animationDelay: `${delay}ms`, animationDuration: '2s' }}
  />
);

// Animated card scanning indicator
const ScanningIndicator = () => (
  <div className="flex items-center gap-3 bg-black/70 backdrop-blur-sm text-white px-4 py-3 rounded-2xl">
    <div className="relative w-6 h-6">
      <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
      <div className="absolute inset-0 border-2 border-t-white rounded-full animate-spin" />
    </div>
    <span className="text-sm font-medium">Reading card...</span>
  </div>
);

export default function CRMCapture() {
  const { toast } = useToast();
  const [location] = useLocation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Determine organization and user from URL
  // URL patterns: /crm/ssw/rodolfo, /crm/ufe/joe, /crm/ssw, /crm/ufe
  const getOrgFromUrl = (): 'ssw' | 'ufe' | 'both' => {
    if (location.includes('/crm/ssw')) return 'ssw';
    if (location.includes('/crm/ufe')) return 'ufe';
    return 'ssw'; // Default to SSW instead of both
  };
  
  const getUserSlugFromUrl = (): string | null => {
    // Match /crm/ssw/username or /crm/ufe/username
    const match = location.match(/\/crm\/(ssw|ufe)\/([^\/]+)/);
    return match ? match[2] : null;
  };
  
  const currentOrg = getOrgFromUrl();
  const userSlug = getUserSlugFromUrl();
  const orgConfig = ORG_CONFIG[currentOrg];

  // User profile state
  const [userProfile, setUserProfile] = useState<{
    name: string;
    email: string;
    title?: string;
    company?: string;
    photo_url?: string;
  } | null>(null);

  // Fetch user profile on mount if userSlug exists
  useEffect(() => {
    if (userSlug) {
      fetch(`/api/representatives/${userSlug}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUserProfile({
              name: data.name || data.full_name,
              email: data.email,
              title: data.title,
              company: data.company_name,
              photo_url: data.photo_url,
            });
          }
        })
        .catch(err => console.error('Failed to fetch user profile:', err));
    }
  }, [userSlug]);

  // Get segments and sources based on org
  const SEGMENTS = orgConfig.segments;
  const LEAD_SOURCES = orgConfig.sources;

  // Flow state
  const [step, setStep] = useState<FlowStep>('capture');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  // Website enrichment state
  const [isResearchingWebsite, setIsResearchingWebsite] = useState(false);
  const [websiteResearchComplete, setWebsiteResearchComplete] = useState(false);
  const [companyContext, setCompanyContext] = useState<string | null>(null);
  const [showCompanyContext, setShowCompanyContext] = useState(false);

  // Contact data
  const [contactData, setContactData] = useState<ExtractedData>({
    firstName: '', lastName: '', email: '', phone: '',
    companyName: '', title: '', address: '', website: '',
  });

  // CRM fields
  const [segment, setSegment] = useState('other');
  const [leadSource, setLeadSource] = useState('uscc_2026');
  const [partnerOwner, setPartnerOwner] = useState<Organization>(orgConfig.defaultPartner as Organization);
  const [contextNotes, setContextNotes] = useState('');

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Email
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);

  // UI state
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Auto-classify segment
  useEffect(() => {
    if (analysisComplete && contactData.title) {
      classifySegment(contactData.title, contactData.companyName);
    }
  }, [analysisComplete, contactData.title, contactData.companyName]);

  const classifySegment = async (title: string, company: string) => {
    try {
      const response = await fetch('/api/representatives/classify-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, company }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.segment && data.segment !== 'other') {
          setSegment(data.segment);
        }
      }
    } catch (error) {
      console.error('Error classifying:', error);
    }
  };

  // Handle photo capture
  const handlePhotoCapture = useCallback(async (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImageData(e.target?.result as string);
    reader.readAsDataURL(file);
    setStep('entry');
    // Start both processes in parallel
    analyzeCardInBackground(file);
  }, []);

  const analyzeCardInBackground = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    // Start web research in pending state (will start after card is read)
    setIsResearchingWebsite(false);
    setWebsiteResearchComplete(false);

    try {
      // Compress image to reduce payload size for serverless functions (4.5MB limit)
      const compressImage = async (file: File, maxSize: number = 1024): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          const canvas = document.createElement('canvas');
          const reader = new FileReader();

          reader.onload = (e) => {
            img.onload = () => {
              let width = img.width;
              let height = img.height;

              // Scale down if larger than maxSize
              if (width > maxSize || height > maxSize) {
                if (width > height) {
                  height = (height / width) * maxSize;
                  width = maxSize;
                } else {
                  width = (width / height) * maxSize;
                  height = maxSize;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);

              // Use JPEG compression at 80% quality
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
              console.log(`[Card] Compressed image from ${(file.size / 1024).toFixed(1)}KB to ~${(compressedBase64.length * 0.75 / 1024).toFixed(1)}KB`);
              resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      console.log('[Card] Starting card analysis, compressing image...');
      const base64 = await compressImage(file, 1200);

      console.log('[Card] Sending to API...');
      const response = await fetch('/api/representatives/rodolfo/analyze-business-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Card] Analysis result:', data);

        if (data.extractedData) {
          setContactData(data.extractedData);

          // Always try website enrichment if we have company or website
          const { companyName, website } = data.extractedData;
          console.log('[Card] Extracted company:', companyName, 'website:', website);

          if (website || companyName) {
            // IMPORTANT: Set web research to "in progress" BEFORE marking card complete
            // This prevents the UI from briefly collapsing before web research starts
            setIsResearchingWebsite(true);
            setAnalysisComplete(true);
            console.log('[Card] Starting web enrichment...');
            enrichWebsiteInBackground(companyName || '', website || '');
          } else {
            console.log('[Card] No company/website found, skipping web enrichment');
            // Mark both as complete
            setAnalysisComplete(true);
            setWebsiteResearchComplete(true);
          }
        } else {
          // API returned success but no extracted data - mark complete but show warning
          console.warn('[Card] No extracted data returned from API');
          setAnalysisComplete(true);
          setWebsiteResearchComplete(true);
          toast({
            title: 'Card analysis complete',
            description: 'Could not extract contact info - please enter manually',
            variant: 'default',
          });
        }
      } else {
        // API request failed
        const errorText = await response.text();
        console.error('[Card] Analysis failed:', response.status, errorText);
        // Still mark as complete so user can enter manually
        setAnalysisComplete(true);
        setWebsiteResearchComplete(true);
        toast({
          title: 'Card analysis failed',
          description: 'Please enter contact info manually',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[Card] Analysis error:', error);
      // Mark as complete on error so user can still proceed manually
      setAnalysisComplete(true);
      setWebsiteResearchComplete(true);
      toast({
        title: 'Error analyzing card',
        description: 'Please enter contact info manually',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const enrichWebsiteInBackground = async (company: string, website?: string) => {
    console.log('[Web] Starting enrichment for:', { company, website });
    setIsResearchingWebsite(true);
    setWebsiteResearchComplete(false);

    try {
      const response = await fetch('/api/representatives/enrich-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, website }),
      });

      console.log('[Web] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Web] Response data:', data);

        if (data.companyContext) {
          setCompanyContext(data.companyContext);
          setWebsiteResearchComplete(true);
          console.log('[Web] Company context set successfully');
        } else {
          // Even if no context found, mark as complete (no data)
          setWebsiteResearchComplete(true);
          setCompanyContext('No additional company information found.');
          console.log('[Web] No company context found');
        }
      } else {
        console.error('[Web] Error response:', await response.text());
        setWebsiteResearchComplete(true);
        setCompanyContext(null);
      }
    } catch (error) {
      console.error('[Web] Enrichment error:', error);
      setWebsiteResearchComplete(true);
      setCompanyContext(null);
    } finally {
      setIsResearchingWebsite(false);
    }
  };

  // Voice recording with Whisper
  const toggleRecording = async () => {
    console.log('[Voice] toggleRecording called, isRecording:', isRecording);

    if (isRecording) {
      console.log('[Voice] Stopping recording');
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop();
      }
      setIsRecording(false);
      return;
    }

    // Check if we're in a secure context (HTTPS or localhost)
    const isSecure = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    console.log('[Voice] Secure context:', isSecure, 'Localhost:', isLocalhost);

    if (!isSecure && !isLocalhost) {
      toast({
        title: 'HTTPS Required',
        description: 'Voice recording requires HTTPS. Please use localhost:3000 or deploy to HTTPS.',
        variant: 'destructive'
      });
      return;
    }

    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: 'Not Supported',
        description: 'Voice recording not supported in this browser',
        variant: 'destructive'
      });
      return;
    }

    setIsRequestingMic(true);
    console.log('[Voice] Requesting microphone permission...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Voice] Got microphone stream');

      // Determine best mime type (with fallback for iOS)
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      }
      console.log('[Voice] Using mimeType:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        console.log('[Voice] Data chunk received:', e.data.size);
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        console.log('[Voice] Recording stopped, processing...');
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('[Voice] Audio blob size:', audioBlob.size);

        if (audioBlob.size > 1000) {
          setIsTranscribing(true);
          try {
            // Convert audio blob to base64 for serverless compatibility
            const audioBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(audioBlob);
            });
            console.log('[Voice] Sending to transcription API...');

            const response = await fetch('/api/representatives/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64,
                mimeType,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log('[Voice] Transcription result:', data);
              if (data.text) {
                setContextNotes(prev => prev ? `${prev} ${data.text}` : data.text);
                toast({ title: 'Transcribed!', description: data.text.substring(0, 50) + '...' });
              }
            } else {
              const errorText = await response.text();
              console.error('[Voice] Transcription failed:', errorText);
              toast({ title: 'Transcription Failed', description: 'Could not process audio', variant: 'destructive' });
            }
          } catch (error) {
            console.error('[Voice] Transcription error:', error);
            toast({ title: 'Error', description: 'Could not transcribe audio', variant: 'destructive' });
          } finally {
            setIsTranscribing(false);
          }
        } else {
          console.log('[Voice] Audio too short, skipping transcription');
          toast({ title: 'Too Short', description: 'Recording was too short', variant: 'destructive' });
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsRequestingMic(false);
      console.log('[Voice] Recording started!');
      toast({ title: 'Recording...', description: 'Tap the mic again to stop' });
    } catch (error: any) {
      console.error('[Voice] Error:', error);
      setIsRequestingMic(false);

      if (error.name === 'NotAllowedError') {
        toast({
          title: 'Microphone Blocked',
          description: 'Please allow microphone access in your browser settings',
          variant: 'destructive'
        });
      } else if (error.name === 'NotFoundError') {
        toast({
          title: 'No Microphone',
          description: 'No microphone found on this device',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Mic Error',
          description: error.message || 'Could not access microphone',
          variant: 'destructive'
        });
      }
    }
  };

  // Generate email
  const handleStartSequence = async () => {
    if (!contactData.email) {
      toast({ title: 'Email Required', description: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    setIsGeneratingEmail(true);

    try {
      // Use pre-fetched company context if available
      const response = await fetch('/api/representatives/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          company: contactData.companyName,
          title: contactData.title,
          website: contactData.website,
          segment,
          event: LEAD_SOURCES.find(s => s.value === leadSource)?.label || leadSource,
          contextNotes,
          companyContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedEmail(data.email);
        setStep('email_preview');
      } else {
        throw new Error('Failed to generate');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not generate email', variant: 'destructive' });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  // Send email
  const handleSendEmail = async () => {
    if (!generatedEmail) return;
    setStep('sending');
    setIsSending(true);

    try {
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      formData.append('firstName', contactData.firstName);
      formData.append('lastName', contactData.lastName);
      formData.append('email', contactData.email);
      formData.append('phone', contactData.phone);
      formData.append('companyName', contactData.companyName);
      formData.append('title', contactData.title);
      formData.append('website', contactData.website);
      formData.append('segment', segment);
      formData.append('leadSource', leadSource);
      formData.append('partnerOwner', partnerOwner);
      formData.append('contextNotes', contextNotes);

      await fetch(`/api/representatives/${userSlug || 'rodolfo'}/submit-business-card-enhanced`, {
        method: 'POST',
        body: formData,
      });

      await fetch('/api/representatives/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contactData.email,
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          from: userProfile?.email ? `${userProfile.name} <${userProfile.email}>` : undefined,
        }),
      });

      setStep('success');
      setShowSuccess(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Could not complete', variant: 'destructive' });
      setStep('email_preview');
    } finally {
      setIsSending(false);
    }
  };

  // Save contact & schedule email for tomorrow (no immediate send)
  const handleSaveAndContinue = async () => {
    if (!contactData.email) {
      toast({ title: 'Email Required', description: 'Please enter an email address', variant: 'destructive' });
      return;
    }

    setIsSavingContact(true);

    try {
      // Save contact to CRM
      const formData = new FormData();
      if (imageFile) formData.append('image', imageFile);
      formData.append('firstName', contactData.firstName);
      formData.append('lastName', contactData.lastName);
      formData.append('email', contactData.email);
      formData.append('phone', contactData.phone);
      formData.append('companyName', contactData.companyName);
      formData.append('title', contactData.title);
      formData.append('website', contactData.website);
      formData.append('segment', segment);
      formData.append('leadSource', leadSource);
      formData.append('partnerOwner', partnerOwner);
      formData.append('contextNotes', contextNotes);
      formData.append('scheduleEmail', 'true'); // Flag to schedule for tomorrow

      await fetch(`/api/representatives/${userSlug || 'rodolfo'}/submit-business-card-enhanced`, {
        method: 'POST',
        body: formData,
      });

      // Generate and schedule email for tomorrow 9 AM
      const emailResponse = await fetch('/api/representatives/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: contactData.firstName,
          lastName: contactData.lastName,
          email: contactData.email,
          company: contactData.companyName,
          title: contactData.title,
          website: contactData.website,
          segment,
          event: LEAD_SOURCES.find(s => s.value === leadSource)?.label || leadSource,
          contextNotes,
          companyContext,
          senderName: userProfile?.name,
          senderEmail: userProfile?.email,
        }),
      });

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        // Schedule email for tomorrow 9 AM MST
        const tomorrow9am = new Date();
        tomorrow9am.setDate(tomorrow9am.getDate() + 1);
        tomorrow9am.setHours(9, 0, 0, 0);

        await fetch('/api/representatives/schedule-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contactData.email,
            subject: emailData.email.subject,
            body: emailData.email.body,
            scheduledAt: tomorrow9am.toISOString(),
            from: userProfile?.email ? `${userProfile.name} <${userProfile.email}>` : undefined,
          }),
        });
      }

      toast({ 
        title: '✓ Contact Saved', 
        description: `Email scheduled for tomorrow 9 AM`,
      });

      // Reset and go back to capture for next card
      handleReset();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not save contact', variant: 'destructive' });
    } finally {
      setIsSavingContact(false);
    }
  };

  // Reset
  const handleReset = () => {
    setStep('capture');
    setImageData(null);
    setImageFile(null);
    setIsAnalyzing(false);
    setAnalysisComplete(false);
    setIsResearchingWebsite(false);
    setWebsiteResearchComplete(false);
    setCompanyContext(null);
    setShowCompanyContext(false);
    setContactData({ firstName: '', lastName: '', email: '', phone: '', companyName: '', title: '', address: '', website: '' });
    setSegment('other');
    setContextNotes('');
    setGeneratedEmail(null);
    setShowContactDetails(false);
    setShowSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userProfile?.photo_url ? (
              <img 
                src={userProfile.photo_url} 
                alt={userProfile.name}
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className={`p-2 rounded-xl bg-gradient-to-br ${orgConfig.headerColor}`}>
                <orgConfig.icon className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {userProfile?.name ? `${userProfile.name.split(' ')[0]}'s CRM` : orgConfig.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{orgConfig.shortName} • {orgConfig.subtitle}</p>
            </div>
          </div>
          {step !== 'capture' && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              New
            </button>
          )}
        </div>
      </header>

      <main className="relative z-10 px-5 pb-8">
        {/* ═══════════════════════════════════════════════════════════════════
            STEP: CAPTURE - Big beautiful buttons
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 'capture' && (
          <div className="space-y-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Scan Card</h2>
              <p className="text-slate-400">Capture, then add your notes while AI reads</p>
            </div>

            {/* Camera Button - Primary */}
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="group relative w-full h-44 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-2xl shadow-emerald-500/25 overflow-hidden transition-all duration-300 active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-active:opacity-100 transition-opacity" />
              <div className="relative flex flex-col items-center justify-center h-full gap-4">
                <div className="relative">
                  <PulseRing color="bg-white" delay={0} />
                  <PulseRing color="bg-white" delay={700} />
                  <div className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                </div>
                <span className="text-xl font-semibold">Take Photo</span>
              </div>
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoCapture(file);
                e.target.value = '';
              }}
              className="hidden"
            />

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Gallery Button - Secondary */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="group w-full h-16 rounded-2xl border-2 border-slate-600 hover:border-slate-500 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98]"
            >
              <Upload className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" />
              <span className="text-slate-300 group-hover:text-white font-medium transition-colors">Choose from Gallery</span>
            </button>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoCapture(file);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP: ENTRY - Parallel flow while analyzing
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 'entry' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-400">
            {/* Card preview */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-800 shadow-xl">
              {imageData && (
                <img src={imageData} alt="Card" className="w-full h-28 object-cover" />
              )}
              {/* Analysis overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${isAnalyzing ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent pointer-events-none'}`}>
                {isAnalyzing && <ScanningIndicator />}
              </div>
            </div>

            {/* Status Progress Section - Shows during loading, collapses after */}
            {(isAnalyzing || isResearchingWebsite || !analysisComplete) ? (
              // LOADING STATE - Show progress bars
              <div className="space-y-2 animate-in fade-in duration-300">
                {/* Card Analysis Status */}
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    analysisComplete
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40'
                      : isAnalyzing
                      ? 'bg-slate-700'
                      : 'bg-slate-800 border border-slate-700'
                  }`}>
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                    ) : analysisComplete ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border-2 border-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${analysisComplete ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {isAnalyzing ? 'Reading card...' : analysisComplete ? 'Card read' : 'Card'}
                      </span>
                      {analysisComplete && contactData.companyName && (
                        <span className="text-xs text-slate-500 truncate ml-2">{contactData.companyName}</span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ease-out ${
                          analysisComplete
                            ? 'bg-emerald-500 duration-500'
                            : isAnalyzing
                            ? 'bg-emerald-400 animate-pulse duration-1000'
                            : 'bg-slate-700 duration-300'
                        }`}
                        style={{ width: isAnalyzing ? '70%' : analysisComplete ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Web Research Status */}
                <div className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    websiteResearchComplete
                      ? 'bg-blue-500 shadow-lg shadow-blue-500/40'
                      : isResearchingWebsite
                      ? 'bg-slate-700'
                      : analysisComplete
                      ? 'bg-slate-700'
                      : 'bg-slate-800 border border-slate-700'
                  }`}>
                    {isResearchingWebsite ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    ) : websiteResearchComplete ? (
                      <Check className="h-4 w-4 text-white" />
                    ) : analysisComplete ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border-2 border-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        websiteResearchComplete ? 'text-blue-400'
                        : isResearchingWebsite ? 'text-slate-300'
                        : analysisComplete ? 'text-slate-300'
                        : 'text-slate-500'
                      }`}>
                        {isResearchingWebsite ? 'Researching website...'
                          : websiteResearchComplete ? 'Website researched'
                          : analysisComplete ? 'Starting web research...'
                          : 'Web research (after card)'}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ease-out ${
                          websiteResearchComplete
                            ? 'bg-blue-500 duration-500'
                            : isResearchingWebsite
                            ? 'bg-blue-400 animate-pulse duration-1000'
                            : analysisComplete
                            ? 'bg-blue-400 animate-pulse duration-1000'
                            : 'bg-slate-700 duration-300'
                        }`}
                        style={{
                          width: websiteResearchComplete ? '100%'
                            : isResearchingWebsite ? '60%'
                            : analysisComplete ? '20%'
                            : '0%'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // COMPLETE STATE - Collapsed "See card details" button
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <button
                  onClick={() => setShowContactDetails(!showContactDetails)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-emerald-400">Card ready</p>
                      <p className="text-xs text-slate-400">
                        {contactData.firstName} {contactData.lastName} {contactData.companyName ? `• ${contactData.companyName}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {websiteResearchComplete && companyContext && companyContext !== 'No additional company information found.' && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">+Web</span>
                    )}
                    <ChevronDown className={`h-5 w-5 text-emerald-400 transition-transform ${showContactDetails ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expandable Card Details */}
                {showContactDetails && (
                  <div className="mt-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700 animate-in slide-in-from-top-2 duration-200 space-y-3">
                    {/* Company Context if available */}
                    {companyContext && companyContext !== 'No additional company information found.' && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3">
                        <p className="text-xs text-blue-400 font-medium mb-1">Company Research</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{companyContext}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-400">First Name</Label>
                        <Input
                          value={contactData.firstName}
                          onChange={(e) => setContactData({ ...contactData, firstName: e.target.value })}
                          className="h-10 bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Last Name</Label>
                        <Input
                          value={contactData.lastName}
                          onChange={(e) => setContactData({ ...contactData, lastName: e.target.value })}
                          className="h-10 bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">Email</Label>
                      <Input
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                        className="h-10 bg-slate-900 border-slate-700 text-white"
                        type="email"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-400">Phone</Label>
                        <Input
                          value={contactData.phone}
                          onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                          className="h-10 bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Company</Label>
                        <Input
                          value={contactData.companyName}
                          onChange={(e) => setContactData({ ...contactData, companyName: e.target.value })}
                          className="h-10 bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-400">Title</Label>
                        <Input
                          value={contactData.title}
                          onChange={(e) => setContactData({ ...contactData, title: e.target.value })}
                          className="h-10 bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Website</Label>
                        <Input
                          value={contactData.website}
                          onChange={(e) => setContactData({ ...contactData, website: e.target.value })}
                          className="h-10 bg-slate-900 border-slate-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Segment Pills - Full width */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">Segment</label>
              <div className="flex flex-wrap gap-2">
                {SEGMENTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSegment(s.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                      segment === s.value
                        ? `${s.color} text-white shadow-lg`
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source - Own row */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">Source</label>
              <div className="flex flex-wrap gap-2">
                {LEAD_SOURCES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setLeadSource(s.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      leadSource === s.value
                        ? 'bg-slate-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner - Only show when using combined /crm view */}
            {orgConfig.showPartnerSelector && (
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">Owner</label>
                <div className="flex gap-2">
                  {PARTNERS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPartnerOwner(p.value as Organization)}
                      className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                        partnerOwner === p.value
                          ? `bg-gradient-to-r ${p.color} text-white shadow-lg`
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Notes - The Hero */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Context Notes</label>
              <div className="relative">
                <Textarea
                  value={contextNotes}
                  onChange={(e) => setContextNotes(e.target.value)}
                  placeholder="What did you discuss? Tap mic to dictate..."
                  className="min-h-[120px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-2xl pr-20 text-base resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={isTranscribing}
                />
                {/* Voice Button - Large touch target with proper z-index */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleRecording();
                  }}
                  disabled={isTranscribing}
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                  className={`absolute right-3 top-3 z-20 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 select-none ${
                    isRecording
                      ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse scale-110'
                      : isRequestingMic
                      ? 'bg-amber-500 shadow-lg shadow-amber-500/50 animate-pulse'
                      : isTranscribing
                      ? 'bg-slate-700'
                      : 'bg-emerald-500 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-95'
                  }`}
                >
                  {isTranscribing ? (
                    <Loader2 className="h-7 w-7 animate-spin text-white" />
                  ) : isRequestingMic ? (
                    <Loader2 className="h-7 w-7 animate-spin text-white" />
                  ) : isRecording ? (
                    <MicOff className="h-7 w-7 text-white" />
                  ) : (
                    <Mic className="h-7 w-7 text-white" />
                  )}
                </button>
              </div>
              {/* Recording indicator */}
              {isRequestingMic && (
                <div className="flex items-center gap-2 text-amber-400 animate-in fade-in duration-200">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm">Requesting microphone access...</span>
                </div>
              )}
              {isRecording && (
                <div className="flex items-center gap-2 text-red-400 animate-in fade-in duration-200">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <span className="text-sm font-medium">Recording {recordingDuration}s... tap mic to stop</span>
                </div>
              )}
              {isTranscribing && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm">Transcribing audio...</span>
                </div>
              )}
            </div>

            {/* Action Buttons - Two options */}
            <div className="space-y-3">
              {/* Primary: Preview Email First */}
              <button
                onClick={handleStartSequence}
                disabled={isGeneratingEmail || isAnalyzing}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingEmail ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    <span>Preview Email</span>
                  </>
                )}
              </button>

              {/* Secondary: Save & Continue (schedules email for tomorrow) */}
              <button
                onClick={handleSaveAndContinue}
                disabled={isSavingContact || isAnalyzing || !contactData.email}
                className="w-full h-14 rounded-2xl border-2 border-slate-600 hover:border-emerald-500 bg-slate-800/50 text-slate-200 font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingContact ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Save & Continue</span>
                    <span className="text-xs text-slate-400 ml-1">(email tomorrow 9 AM)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP: EMAIL PREVIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 'email_preview' && generatedEmail && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-400">
            {/* Header with action buttons */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Email Preview</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingEmail(!isEditingEmail)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isEditingEmail
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {isEditingEmail ? 'Done' : 'Edit'}
                </button>
                <button
                  onClick={() => {
                    setIsEditingEmail(false);
                    setStep('entry');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Redo
                </button>
              </div>
            </div>

            {/* Context badges - what went into the email */}
            <div className="flex flex-wrap gap-2">
              {analysisComplete && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                  <Check className="h-3 w-3" /> Card
                </span>
              )}
              {websiteResearchComplete && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                  <Check className="h-3 w-3" /> Web
                </span>
              )}
              {contextNotes.trim().length > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                  <Check className="h-3 w-3" /> Notes
                </span>
              )}
              {segment !== 'other' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                  <Check className="h-3 w-3" /> {SEGMENTS.find(s => s.value === segment)?.label}
                </span>
              )}
            </div>

            {/* Email Preview - looks like a real email */}
            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700">
              {/* Email header */}
              <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700 space-y-2">
                <div className="flex items-start gap-3">
                  {userProfile?.photo_url ? (
                    <img 
                      src={userProfile.photo_url} 
                      alt={userProfile.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{userProfile?.name || 'Rodo Alvarez'}</p>
                      <span className="text-xs text-slate-500">Now</span>
                    </div>
                    <p className="text-xs text-emerald-400">{userProfile?.email || 'ralvarez@soilseedandwater.com'}</p>
                  </div>
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-slate-500">To:</span> {contactData.firstName} {contactData.lastName} &lt;{contactData.email}&gt;
                </div>
              </div>

              {/* Subject line */}
              <div className="px-4 py-3 border-b border-slate-700/50">
                {isEditingEmail ? (
                  <Input
                    value={generatedEmail.subject}
                    onChange={(e) => setGeneratedEmail({ ...generatedEmail, subject: e.target.value })}
                    className="bg-slate-900 border-slate-600 text-white font-semibold text-lg"
                  />
                ) : (
                  <h3 className="font-semibold text-lg text-white">{generatedEmail.subject}</h3>
                )}
              </div>

              {/* Email body */}
              <div className="px-4 py-4">
                {isEditingEmail ? (
                  <Textarea
                    value={generatedEmail.body}
                    onChange={(e) => setGeneratedEmail({ ...generatedEmail, body: e.target.value })}
                    className="min-h-[280px] bg-slate-900 border-slate-600 text-white text-base leading-relaxed resize-none"
                  />
                ) : (
                  <div className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">
                    {generatedEmail.body}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setIsEditingEmail(false);
                  setStep('entry');
                }}
                className="flex-1 h-14 rounded-2xl border-2 border-slate-600 text-slate-300 font-medium transition-all active:scale-[0.98] hover:border-slate-500"
              >
                Back
              </button>
              <button
                onClick={handleSendEmail}
                className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.98] hover:from-emerald-400 hover:to-emerald-500"
              >
                <Send className="h-5 w-5" />
                <span>Send Email</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP: SENDING
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 'sending' && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600">
                <Send className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">Sending...</h2>
            <p className="text-slate-400">Saving contact & sending email</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP: SUCCESS
        ═══════════════════════════════════════════════════════════════════ */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-16 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative w-28 h-28 mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-2 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} />
              <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/40">
                <Check className="h-14 w-14 text-white" strokeWidth={3} />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Lead Captured!</h2>
            <p className="text-slate-400 mb-8">Contact saved & email sent</p>

            <button
              onClick={handleReset}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-lg shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]"
            >
              <Camera className="h-5 w-5" />
              <span>Next Card</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
