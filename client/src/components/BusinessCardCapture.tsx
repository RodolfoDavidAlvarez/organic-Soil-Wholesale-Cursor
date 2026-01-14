import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Check, RotateCcw, Loader2, Sparkles, AlertCircle } from 'lucide-react';
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

interface BusinessCardCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  representativeSlug: string;
  representativeName: string;
}

type CaptureStep = 'capture' | 'preview' | 'analyzing' | 'confirm' | 'submitting' | 'success' | 'error';

export default function BusinessCardCapture({
  isOpen,
  onClose,
  representativeSlug,
  representativeName,
}: BusinessCardCaptureProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<CaptureStep>('capture');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [confirmTimer, setConfirmTimer] = useState(15);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  // Cleanup camera stream on unmount or close
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Analyzing progress animation
  useEffect(() => {
    if (step === 'analyzing') {
      setAnalyzeProgress(0);
      const interval = setInterval(() => {
        setAnalyzeProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Confirmation timer countdown - only when on confirm step
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'confirm' && confirmTimer > 0) {
      timer = setTimeout(() => setConfirmTimer(prev => prev - 1), 1000);
    } else if (step === 'confirm' && confirmTimer === 0) {
      // Auto-submit when timer reaches 0
      doSubmit();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step, confirmTimer]);

  const resetState = useCallback(() => {
    setStep('capture');
    setImageData(null);
    setImageFile(null);
    setExtractedData(null);
    setIsUsingCamera(false);
    setConfirmTimer(15);
    setErrorMessage('');
    setAnalyzeProgress(0);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

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

  const analyzeCard = async () => {
    if (!imageFile) return;

    setStep('analyzing');
    setAnalyzeProgress(0);

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
      setAnalyzeProgress(100);

      // Small delay to show 100% completion
      await new Promise(resolve => setTimeout(resolve, 300));

      setExtractedData(data.extractedData);
      setConfirmTimer(15);
      setStep('confirm');
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to analyze business card');
      setStep('error');
    }
  };

  const doSubmit = async () => {
    if (!extractedData || !imageFile) return;

    setStep('submitting');

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('firstName', extractedData.firstName || '');
      formData.append('lastName', extractedData.lastName || '');
      formData.append('email', extractedData.email || '');
      formData.append('phone', extractedData.phone || '');
      formData.append('companyName', extractedData.companyName || '');
      formData.append('title', extractedData.title || '');
      formData.append('address', extractedData.address || '');
      formData.append('website', extractedData.website || '');

      const response = await fetch(`/api/representatives/${representativeSlug}/submit-business-card`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to submit business card');
      }

      setStep('success');
      toast({
        title: 'Success!',
        description: 'Your business card has been submitted.',
      });
    } catch (error: any) {
      setErrorMessage(error.message || 'Unable to submit business card');
      setStep('error');
    }
  };

  const handleSubmitClick = () => {
    doSubmit();
  };

  const updateExtractedField = (field: keyof ExtractedData, value: string) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, [field]: value });
      // Reset timer when user edits
      setConfirmTimer(15);
    }
  };

  const stepDescriptions: Record<CaptureStep, string> = {
    capture: 'Take a photo or upload an image of your business card',
    preview: 'Review your photo before analysis',
    analyzing: 'AI is reading your business card...',
    confirm: `Review your info (auto-submit in ${confirmTimer}s)`,
    submitting: 'Submitting your contact info...',
    success: `Thank you! ${representativeName} will be in touch soon.`,
    error: 'Something went wrong',
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[94vw] max-w-lg rounded-xl border border-gray-200 bg-white p-0 shadow-xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
          <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight sm:text-2xl">
            {step === 'success' ? 'Card Submitted!' : step === 'error' ? 'Oops!' : 'Submit Business Card'}
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
                <div className="space-y-3">
                  <Button
                    onClick={startCamera}
                    className="w-full h-24 flex-col gap-2 bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-[1.02]"
                  >
                    <Camera className="h-8 w-8" />
                    <span>Take Photo</span>
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-500">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full h-16 border-dashed border-2 hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                  >
                    <Upload className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="text-gray-600">Upload from Gallery</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
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
              <p className="text-sm text-center text-gray-600">
                Is this photo clear and readable?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={resetState}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={analyzeCard}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze with AI
                </Button>
              </div>
            </div>
          )}

          {/* Step: Analyzing */}
          {step === 'analyzing' && (
            <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-25" />
                <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg">
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">AI Analysis in Progress</p>
                <p className="text-sm text-gray-500 mt-1">Reading contact information...</p>
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                <Progress value={analyzeProgress} className="h-2" />
                <p className="text-xs text-gray-400">{Math.round(analyzeProgress)}% complete</p>
              </div>
              {imageData && (
                <div className="mt-4 rounded-lg overflow-hidden border border-gray-100 opacity-40 max-w-[200px] mx-auto">
                  <img src={imageData} alt="Analyzing" className="w-full object-contain" />
                </div>
              )}
            </div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && extractedData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Timer bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-500" />
                    Auto-submitting in
                  </span>
                  <span className="font-mono font-medium">{confirmTimer}s</span>
                </div>
                <Progress value={(confirmTimer / 15) * 100} className="h-1.5" />
              </div>

              {/* Business card image thumbnail */}
              {imageData && (
                <div className="rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={imageData} alt="Business card" className="w-full max-h-20 object-contain" />
                </div>
              )}

              {/* Extracted fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">First Name</Label>
                  <Input
                    value={extractedData.firstName}
                    onChange={(e) => updateExtractedField('firstName', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Last Name</Label>
                  <Input
                    value={extractedData.lastName}
                    onChange={(e) => updateExtractedField('lastName', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label className="text-xs text-gray-500">Email</Label>
                  <Input
                    value={extractedData.email}
                    onChange={(e) => updateExtractedField('email', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Phone</Label>
                  <Input
                    value={extractedData.phone}
                    onChange={(e) => updateExtractedField('phone', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Company</Label>
                  <Input
                    value={extractedData.companyName}
                    onChange={(e) => updateExtractedField('companyName', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Title</Label>
                  <Input
                    value={extractedData.title}
                    onChange={(e) => updateExtractedField('title', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Website</Label>
                  <Input
                    value={extractedData.website}
                    onChange={(e) => updateExtractedField('website', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={resetState}
                  variant="outline"
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleSubmitClick}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Submit Now
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
                <p className="font-semibold text-gray-900 text-lg">Business Card Submitted!</p>
                <p className="text-sm text-gray-500 mt-1">
                  {representativeName} will follow up with you soon.
                </p>
              </div>
              <Button onClick={handleClose} className="w-full bg-emerald-600 hover:bg-emerald-700">
                Done
              </Button>
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
