import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Check, RotateCcw, Loader2, Sparkles, AlertCircle, Send, Edit3, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

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

interface CRMData {
  segment: string;
  leadSource: string;
  partnerOwner: string;
  contextNotes: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

interface BusinessCardCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  representativeSlug: string;
  representativeName: string;
  isRepMode?: boolean; // When true, shows CRM fields and email generation
  defaultLeadSource?: string; // Pre-fill lead source (e.g., 'uscc_2026')
}

type CaptureStep = 'capture' | 'preview' | 'extracting' | 'confirm' | 'generating_email' | 'email_preview' | 'submitting' | 'success' | 'error';

const SEGMENTS = [
  { value: 'operator', label: 'Compost Operator/Processor' },
  { value: 'municipal', label: 'Municipal/Solid Waste' },
  { value: 'equipment', label: 'Equipment/Solutions Provider' },
  { value: 'policy', label: 'Policy/Regulatory' },
  { value: 'esg', label: 'ESG/Sustainability' },
  { value: 'education', label: 'Education/University' },
  { value: 'farmer_vineyard', label: 'Farmer - Vineyard' },
  { value: 'farmer_orchard', label: 'Farmer - Orchard' },
  { value: 'farmer_general', label: 'Farmer - General' },
  { value: 'waste_hauler', label: 'Waste Hauler' },
  { value: 'landscaper', label: 'Landscaper/Nursery' },
  { value: 'other', label: 'Other' },
];

const LEAD_SOURCES = [
  { value: 'uscc_2026', label: 'USCC 2026 Conference' },
  { value: 'skyfire_2026', label: 'SkyFire 2026 Festival' },
  { value: 'azcc', label: 'Arizona Composting Council' },
  { value: 'referral', label: 'Referral' },
  { value: 'website', label: 'Website' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
  { value: 'other', label: 'Other' },
];

const PARTNER_OWNERS = [
  { value: 'ssw', label: 'SSW' },
  { value: 'ufe', label: 'UFE' },
  { value: 'both', label: 'Both' },
];

export default function BusinessCardCapture({
  isOpen,
  onClose,
  representativeSlug,
  representativeName,
  isRepMode = false,
  defaultLeadSource = 'uscc_2026',
}: BusinessCardCaptureProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<CaptureStep>('capture');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    title: '',
    address: '',
    website: '',
  });
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // New state for non-blocking UX
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState<Set<string>>(new Set());
  const [userEditedFields, setUserEditedFields] = useState<Set<string>>(new Set());
  const [fieldHighlights, setFieldHighlights] = useState<Set<string>>(new Set());

  // CRM-specific state
  const [crmData, setCrmData] = useState<CRMData>({
    segment: 'other',
    leadSource: defaultLeadSource,
    partnerOwner: 'ssw',
    contextNotes: '',
  });
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [companyResearch, setCompanyResearch] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Cleanup camera stream on unmount or close
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Auto-remove field highlights after 2 seconds
  useEffect(() => {
    if (fieldHighlights.size > 0) {
      const timeout = setTimeout(() => {
        setFieldHighlights(new Set());
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [fieldHighlights]);

  const resetState = useCallback(() => {
    setStep('capture');
    setImageData(null);
    setImageFile(null);
    setExtractedData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      title: '',
      address: '',
      website: '',
    });
    setIsUsingCamera(false);
    setErrorMessage('');
    setIsExtracting(false);
    setExtractedFields(new Set());
    setUserEditedFields(new Set());
    setFieldHighlights(new Set());
    setCrmData({
      segment: 'other',
      leadSource: defaultLeadSource,
      partnerOwner: 'ssw',
      contextNotes: '',
    });
    setGeneratedEmail(null);
    setCompanyResearch(null);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream, defaultLeadSource]);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      setStream(mediaStream);
      setIsUsingCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please use file upload instead.',
        variant: 'destructive',
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setImageData(dataUrl);

        // Convert to file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'business-card.jpg', { type: 'image/jpeg' });
            setImageFile(file);
          }
        }, 'image/jpeg', 0.9);

        // Stop camera
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        setIsUsingCamera(false);
        setStep('preview');
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageData(e.target?.result as string);
        setStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  // Track user field edits
  const handleFieldChange = (fieldName: keyof ExtractedData, value: string) => {
    setExtractedData(prev => ({ ...prev, [fieldName]: value }));
    setUserEditedFields(prev => new Set(prev).add(fieldName));
  };

  // Populate field from AI (only if user hasn't touched it)
  const populateField = (fieldName: keyof ExtractedData, value: string) => {
    if (!userEditedFields.has(fieldName) && value) {
      setExtractedData(prev => ({ ...prev, [fieldName]: value }));
      setExtractedFields(prev => new Set(prev).add(fieldName));
      setFieldHighlights(prev => new Set(prev).add(fieldName));
    }
  };

  // Auto-classify segment based on title and company
  const classifySegment = async (title: string, company: string) => {
    try {
      const response = await fetch('/api/representatives/classify-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, company }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.segment;
      }
    } catch (error) {
      console.error('Error classifying segment:', error);
    }
    return 'other';
  };

  // New non-blocking extraction flow
  const analyzeCardNonBlocking = async () => {
    if (!imageFile) return;

    // IMMEDIATELY show form with skeleton loaders
    setStep('confirm');
    setIsExtracting(true);

    // Run AI extraction in background
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`/api/representatives/${representativeSlug}/analyze-business-card`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to analyze business card');
      }

      const data = await response.json();

      // Populate fields one by one (respecting user edits)
      if (data.extractedData) {
        populateField('firstName', data.extractedData.firstName);
        populateField('lastName', data.extractedData.lastName);
        populateField('email', data.extractedData.email);
        populateField('phone', data.extractedData.phone);
        populateField('companyName', data.extractedData.companyName);
        populateField('title', data.extractedData.title);
        populateField('address', data.extractedData.address);
        populateField('website', data.extractedData.website);

        // Auto-classify segment if in rep mode
        if (isRepMode) {
          const segment = await classifySegment(
            data.extractedData.title || '',
            data.extractedData.companyName || ''
          );
          setCrmData(prev => ({ ...prev, segment }));
        }
      }

      setIsExtracting(false);
    } catch (error: any) {
      setIsExtracting(false);
      toast({
        title: 'AI Extraction Failed',
        description: 'You can still fill the form manually',
        variant: 'destructive',
      });
    }
  };

  // Generate AI email (background)
  const generateEmailInBackground = async (): Promise<GeneratedEmail | null> => {
    try {
      // First, enrich company if we have a website
      let research = null;
      if (extractedData.website || extractedData.companyName) {
        try {
          const enrichResponse = await fetch('/api/representatives/enrich-company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              company: extractedData.companyName,
              website: extractedData.website,
            }),
          });
          if (enrichResponse.ok) {
            const enrichData = await enrichResponse.json();
            research = enrichData.companyContext;
            setCompanyResearch(research);
          }
        } catch (e) {
          console.log('Company enrichment failed, continuing without it');
        }
      }

      // Generate the email
      const response = await fetch('/api/representatives/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: extractedData.firstName,
          lastName: extractedData.lastName,
          email: extractedData.email,
          company: extractedData.companyName,
          title: extractedData.title,
          website: extractedData.website,
          segment: crmData.segment,
          event: LEAD_SOURCES.find(s => s.value === crmData.leadSource)?.label || crmData.leadSource,
          contextNotes: crmData.contextNotes,
          companyContext: research,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();
      return data.email || data;
    } catch (error: any) {
      console.error('Email generation failed:', error);
      return null;
    }
  };

  // Save contact helper
  const saveContactToDatabase = async () => {
    const formData = new FormData();
    if (imageFile) formData.append('image', imageFile);
    formData.append('firstName', extractedData.firstName || '');
    formData.append('lastName', extractedData.lastName || '');
    formData.append('email', extractedData.email || '');
    formData.append('phone', extractedData.phone || '');
    formData.append('companyName', extractedData.companyName || '');
    formData.append('title', extractedData.title || '');
    formData.append('address', extractedData.address || '');
    formData.append('website', extractedData.website || '');

    if (isRepMode) {
      formData.append('segment', crmData.segment);
      formData.append('leadSource', crmData.leadSource);
      formData.append('partnerOwner', crmData.partnerOwner);
      formData.append('contextNotes', crmData.contextNotes);
      formData.append('companyContext', companyResearch || '');
    }

    const endpoint = isRepMode
      ? `/api/representatives/${representativeSlug}/submit-business-card-enhanced`
      : `/api/representatives/${representativeSlug}/submit-business-card`;

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to save contact');
    }

    return await response.json();
  };

  // Button 1: Quick Save (no email)
  const handleQuickSave = async () => {
    if (!imageFile) return;

    setStep('submitting');

    try {
      await saveContactToDatabase();

      setStep('success');
      toast({
        title: 'Contact Saved!',
        description: `${extractedData.firstName} ${extractedData.lastName} saved successfully`,
      });

      setTimeout(() => {
        if (isRepMode) {
          resetState(); // Ready for next card
        } else {
          handleClose();
        }
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to save contact');
      setStep('error');
    }
  };

  // Button 2: Generate & Send Email (auto-send)
  const handleGenerateAndSend = async () => {
    if (!imageFile) return;

    setStep('generating_email');

    try {
      // Generate email in background
      const email = await generateEmailInBackground();

      if (!email) {
        throw new Error('Failed to generate email');
      }

      setStep('submitting');

      // Save contact
      const contactResult = await saveContactToDatabase();

      // Send email
      const emailResponse = await fetch('/api/representatives/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: extractedData.email,
          subject: email.subject,
          body: email.body,
          contactId: contactResult.contact?.id,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Email failed to send');
      }

      setStep('success');
      toast({
        title: `Email Sent to ${extractedData.firstName}!`,
        description: 'Contact saved and follow-up sent',
      });

      setTimeout(() => {
        if (isRepMode) {
          resetState(); // Ready for next card
        } else {
          handleClose();
        }
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to send email');
      setStep('error');
    }
  };

  // Button 3: Review Email First
  const handleReviewEmail = async () => {
    setStep('generating_email');

    try {
      const email = await generateEmailInBackground();

      if (!email) {
        throw new Error('Failed to generate email');
      }

      setGeneratedEmail(email);
      setStep('email_preview');
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to generate email');
      setStep('error');
    }
  };

  // Send email after review
  const sendEmailAfterReview = async () => {
    if (!generatedEmail) return;

    setStep('submitting');

    try {
      // Save contact
      const contactResult = await saveContactToDatabase();

      // Send email
      const emailResponse = await fetch('/api/representatives/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: extractedData.email,
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          contactId: contactResult.contact?.id,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Email failed to send');
      }

      setStep('success');
      toast({
        title: 'Email Sent!',
        description: 'Contact saved and follow-up sent',
      });

      setTimeout(() => {
        if (isRepMode) {
          resetState(); // Ready for next card
        } else {
          handleClose();
        }
      }, 1500);
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to send email');
      setStep('error');
    }
  };

  const updateCrmField = (field: keyof CRMData, value: string) => {
    setCrmData({ ...crmData, [field]: value });
  };

  // Voice recording using MediaRecorder + OpenAI Whisper
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Start recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine best audio format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Only transcribe if we have audio
        if (audioBlob.size > 1000) {
          setIsTranscribing(true);

          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch('/api/representatives/transcribe', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              if (data.text) {
                // Append to existing notes
                setCrmData(prev => ({
                  ...prev,
                  contextNotes: prev.contextNotes
                    ? `${prev.contextNotes} ${data.text}`
                    : data.text,
                }));
                toast({
                  title: 'Voice Note Added',
                  description: 'Your voice note has been transcribed.',
                });
              }
            } else {
              const error = await response.json();
              toast({
                title: 'Transcription Failed',
                description: error.error || 'Could not transcribe audio',
                variant: 'destructive',
              });
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
              title: 'Error',
              description: 'Failed to transcribe audio',
              variant: 'destructive',
            });
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: 'Recording...',
        description: 'Speak your notes. Tap again to stop.',
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stepDescriptions: Record<CaptureStep, string> = {
    capture: 'Snap a photo of the business card',
    preview: 'Looking good? Let\'s analyze it!',
    extracting: 'AI is extracting data in background...',
    confirm: isExtracting
      ? 'Start adding context while AI fills the fields'
      : 'Review the details and choose how to save',
    generating_email: 'Writing personalized follow-up...',
    email_preview: 'Review & send',
    submitting: 'Saving...',
    success: isRepMode
      ? 'Lead captured!'
      : `Done! ${representativeName} will follow up.`,
    error: 'Something went wrong',
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`w-[94vw] ${isRepMode ? 'max-w-2xl' : 'max-w-lg'} rounded-xl border border-gray-200 bg-white p-0 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6 sticky top-0 bg-white z-10">
          <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight sm:text-2xl">
            {step === 'success' ? 'Success!' : step === 'error' ? 'Oops!' : isRepMode ? 'Capture Lead' : 'Scan Your Card'}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-600 leading-relaxed sm:text-sm">
            {stepDescriptions[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          {/* Step: Capture */}
          {step === 'capture' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {isUsingCamera ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black aspect-[4/3]"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <Button
                      onClick={() => {
                        if (stream) {
                          stream.getTracks().forEach(track => track.stop());
                          setStream(null);
                        }
                        setIsUsingCamera(false);
                      }}
                      variant="outline"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Camera button - opens camera directly */}
                  <Button
                    onClick={() => {
                      const cameraInput = document.getElementById('camera-input-capture') as HTMLInputElement;
                      cameraInput?.click();
                    }}
                    className="w-full h-32 sm:h-28 flex-col gap-3 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] rounded-2xl"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      <Camera className="h-8 w-8" />
                    </div>
                    <span className="text-lg font-semibold">Take Photo</span>
                  </Button>

                  {/* Hidden input for camera (with capture attribute) */}
                  <input
                    id="camera-input-capture"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      handleFileUpload(e);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-400 uppercase tracking-wide">or</span>
                    </div>
                  </div>

                  {/* Gallery button - opens gallery only (NO capture attribute) */}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-20 sm:h-16 border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all rounded-xl"
                  >
                    <Upload className="h-6 w-6 mr-3 text-emerald-600" />
                    <span className="text-gray-700 font-medium">Choose from Gallery</span>
                  </Button>

                  {/* Hidden input for gallery (NO capture attribute) */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleFileUpload(e);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && imageData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="relative rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                <img
                  src={imageData}
                  alt="Business card preview"
                  className="w-full object-contain max-h-64"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={resetState}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={analyzeCardNonBlocking}
                  className="flex-[2] h-12 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md font-semibold"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Analyze Card
                </Button>
              </div>
            </div>
          )}


          {/* Step: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* AI extraction indicator */}
              {isExtracting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">AI is filling the fields</p>
                    <p className="text-xs text-blue-600">Start adding your notes below while you wait</p>
                  </div>
                </div>
              )}

              {/* Business card image thumbnail */}
              {imageData && (
                <div className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={imageData} alt="Business card" className="w-full max-h-20 object-contain" />
                </div>
              )}

              {/* Extracted fields with skeleton loaders */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">First Name</Label>
                  {isExtracting && !extractedData.firstName ? (
                    <div className="h-9 bg-gray-200 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      value={extractedData.firstName}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      className={`h-9 text-sm transition-all ${fieldHighlights.has('firstName') ? 'ring-2 ring-emerald-400 bg-emerald-50' : ''}`}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Last Name</Label>
                  {isExtracting && !extractedData.lastName ? (
                    <div className="h-9 bg-gray-200 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      value={extractedData.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      className={`h-9 text-sm transition-all ${fieldHighlights.has('lastName') ? 'ring-2 ring-emerald-400 bg-emerald-50' : ''}`}
                    />
                  )}
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-gray-500">Email</Label>
                  {isExtracting && !extractedData.email ? (
                    <div className="h-9 bg-gray-200 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      value={extractedData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className={`h-9 text-sm transition-all ${fieldHighlights.has('email') ? 'ring-2 ring-emerald-400 bg-emerald-50' : ''}`}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Phone</Label>
                  {isExtracting && !extractedData.phone ? (
                    <div className="h-9 bg-gray-200 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      value={extractedData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className={`h-9 text-sm transition-all ${fieldHighlights.has('phone') ? 'ring-2 ring-emerald-400 bg-emerald-50' : ''}`}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Company</Label>
                  {isExtracting && !extractedData.companyName ? (
                    <div className="h-9 bg-gray-200 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      value={extractedData.companyName}
                      onChange={(e) => handleFieldChange('companyName', e.target.value)}
                      className={`h-9 text-sm transition-all ${fieldHighlights.has('companyName') ? 'ring-2 ring-emerald-400 bg-emerald-50' : ''}`}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Title</Label>
                  {isExtracting && !extractedData.title ? (
                    <div className="h-9 bg-gray-200 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      value={extractedData.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className={`h-9 text-sm transition-all ${fieldHighlights.has('title') ? 'ring-2 ring-emerald-400 bg-emerald-50' : ''}`}
                    />
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Website</Label>
                  {isExtracting && !extractedData.website ? (
                    <div className="h-9 bg-gray-200 animate-pulse rounded-md" />
                  ) : (
                    <Input
                      value={extractedData.website}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      className={`h-9 text-sm transition-all ${fieldHighlights.has('website') ? 'ring-2 ring-emerald-400 bg-emerald-50' : ''}`}
                    />
                  )}
                </div>
              </div>

              {/* CRM Fields (Rep Mode Only) - ALWAYS ENABLED */}
              {isRepMode && (
                <div className="border-t border-gray-200 pt-4 mt-4 space-y-4">
                  <p className="text-sm font-medium text-gray-700">Add Context (Optional)</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500 flex items-center gap-1">
                        Segment
                        {isExtracting && <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />}
                      </Label>
                      <Select
                        value={crmData.segment}
                        onValueChange={(value) => updateCrmField('segment', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select segment" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEGMENTS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">How did you meet?</Label>
                      <Select
                        value={crmData.leadSource}
                        onValueChange={(value) => updateCrmField('leadSource', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_SOURCES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Partner Owner</Label>
                    <div className="flex gap-2">
                      {PARTNER_OWNERS.map(p => (
                        <Button
                          key={p.value}
                          type="button"
                          variant={crmData.partnerOwner === p.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateCrmField('partnerOwner', p.value)}
                          className={crmData.partnerOwner === p.value ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                        >
                          {p.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Context Notes</Label>
                    <div className="relative">
                      <Textarea
                        value={crmData.contextNotes}
                        onChange={(e) => updateCrmField('contextNotes', e.target.value)}
                        placeholder="What did you discuss? Tap mic to dictate..."
                        className="h-24 text-sm resize-none pr-14"
                        disabled={isTranscribing}
                      />
                      <Button
                        type="button"
                        variant={isRecording ? 'destructive' : 'outline'}
                        size="icon"
                        onClick={toggleRecording}
                        disabled={isTranscribing}
                        className={`absolute right-2 top-2 h-10 w-10 rounded-full ${
                          isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {isTranscribing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : isRecording ? (
                          <MicOff className="h-5 w-5" />
                        ) : (
                          <Mic className="h-5 w-5 text-emerald-600" />
                        )}
                      </Button>
                    </div>
                    {isRecording && (
                      <p className="text-xs text-red-500 animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Recording... tap mic to stop
                      </p>
                    )}
                    {isTranscribing && (
                      <p className="text-xs text-blue-500 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Transcribing with AI...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Three Save Options (Rep Mode) or Simple Save (Visitor Mode) */}
              {isRepMode ? (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 font-medium">Choose save option:</p>

                  <Button
                    onClick={handleQuickSave}
                    variant="outline"
                    className="w-full h-12 justify-start"
                  >
                    <Check className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Save Contact</p>
                      <p className="text-xs text-gray-500">Quick save, follow up later</p>
                    </div>
                  </Button>

                  <Button
                    onClick={handleGenerateAndSend}
                    className="w-full h-12 justify-start bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                  >
                    <Send className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Generate & Send Email</p>
                      <p className="text-xs opacity-90">Auto-send AI email immediately</p>
                    </div>
                  </Button>

                  <Button
                    onClick={handleReviewEmail}
                    className="w-full h-12 justify-start bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800"
                  >
                    <Edit3 className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <p className="font-semibold text-sm">Review Email First</p>
                      <p className="text-xs opacity-90">Edit before sending</p>
                    </div>
                  </Button>

                  <Button
                    onClick={resetState}
                    variant="ghost"
                    className="w-full h-10 text-gray-500"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Photo
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3 pt-3">
                  <Button
                    onClick={resetState}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                  <Button
                    onClick={handleQuickSave}
                    className="flex-[2] h-12 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-md font-semibold"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Save Contact
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step: Generating Email */}
          {step === 'generating_email' && (
            <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-25" />
                <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg">
                  <Edit3 className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Crafting Your Email</p>
                <p className="text-sm text-gray-500 mt-1">AI is writing a personalized follow-up...</p>
              </div>
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
            </div>
          )}

          {/* Step: Email Preview */}
          {step === 'email_preview' && generatedEmail && extractedData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">To:</p>
                    <p className="text-sm font-medium">{extractedData.firstName} {extractedData.lastName} &lt;{extractedData.email}&gt;</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Subject:</p>
                    <Input
                      value={generatedEmail.subject}
                      onChange={(e) => setGeneratedEmail({ ...generatedEmail, subject: e.target.value })}
                      className="h-9 text-sm font-medium"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Message:</p>
                    <Textarea
                      value={generatedEmail.body}
                      onChange={(e) => setGeneratedEmail({ ...generatedEmail, body: e.target.value })}
                      className="min-h-[200px] text-sm whitespace-pre-wrap"
                    />
                  </div>
                </div>
              </div>

              {companyResearch && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Company Research Used:</p>
                  <p className="text-xs text-blue-700">{companyResearch}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep('confirm')}
                  variant="outline"
                  className="flex-1 h-12"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={sendEmailAfterReview}
                  className="flex-[2] h-12 bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 shadow-md font-semibold"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Send Email
                </Button>
              </div>
            </div>
          )}

          {/* Step: Submitting */}
          {step === 'submitting' && (
            <div className="py-10 text-center space-y-4 animate-in fade-in duration-300">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100">
                <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Submitting...</p>
                <p className="text-sm text-gray-500 mt-1">Almost there!</p>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-50" style={{ animationDuration: '1.5s' }} />
                <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                  <Check className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {isRepMode ? 'Lead Captured!' : 'Business Card Submitted!'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isRepMode
                    ? 'Contact saved and follow-up email sent.'
                    : `${representativeName} will follow up with you soon.`}
                </p>
              </div>
              <div className="flex gap-3">
                {isRepMode && (
                  <Button
                    onClick={resetState}
                    className="flex-[2] h-14 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md font-semibold text-lg"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Next Card
                  </Button>
                )}
                <Button onClick={handleClose} className={`${isRepMode ? 'flex-1 h-14' : 'w-full h-14'} bg-gray-600 hover:bg-gray-700`}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Something Went Wrong</p>
                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={resetState} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
