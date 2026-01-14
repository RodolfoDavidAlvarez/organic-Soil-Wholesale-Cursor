import { useRef, useState, type DragEvent, type ChangeEvent, useEffect } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  folder?: string;
  label?: string;
  description?: string;
  maxSizeMB?: number;
  aspectRatio?: "square" | "banner" | "auto";
  className?: string;
}

interface ImagePosition {
  x: number;
  y: number;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function ImageUpload({
  value,
  onChange,
  onRemove,
  folder = "contact-cards",
  label,
  description,
  maxSizeMB = 20,
  aspectRatio = "auto",
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ x: 50, y: 50 }); // Center position in percentage
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [lastPosition, setLastPosition] = useState<ImagePosition>({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isProfilePhoto = aspectRatio === "square";

  // Reset position when image changes
  useEffect(() => {
    if (value && isProfilePhoto) {
      setImagePosition({ x: 50, y: 50 });
      setLastPosition({ x: 50, y: 50 });
    }
  }, [value, isProfilePhoto]);

  const validateFile = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, WebP, etc.)",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File too large",
        description: `Please upload an image under ${maxSizeMB} MB. It will be automatically optimized.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const uploadImage = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    const token = localStorage.getItem("adminToken");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", folder);

      const response = await fetch("/api/admin/uploads/product-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const result = await response.json();
      onChange(result.url);
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded and optimized.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadImage(e.target.files[0]);
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "banner":
        return "aspect-[16/6]";
      default:
        return "";
    }
  };

  const handleImageMouseDown = (e: React.MouseEvent) => {
    if (!isProfilePhoto || !containerRef.current) return;
    // Don't prevent default on buttons
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDragStart({
      x: mouseX - containerCenterX,
      y: mouseY - containerCenterY,
    });
  };

  const handleImageMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart || !containerRef.current || !isProfilePhoto) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate movement relative to container center
    const currentOffsetX = mouseX - containerCenterX;
    const currentOffsetY = mouseY - containerCenterY;

    const deltaX = currentOffsetX - dragStart.x;
    const deltaY = currentOffsetY - dragStart.y;

    // Calculate new position based on container size
    // Scale factor accounts for image being 1.3x larger
    const containerSize = rect.width;
    const scaleFactor = 1.3;
    const deltaXPercent = ((deltaX / containerSize) * 100) / scaleFactor;
    const deltaYPercent = ((deltaY / containerSize) * 100) / scaleFactor;

    const newX = Math.max(-20, Math.min(120, lastPosition.x + deltaXPercent));
    const newY = Math.max(-20, Math.min(120, lastPosition.y + deltaYPercent));

    setImagePosition({ x: newX, y: newY });
  };

  const handleImageMouseUp = () => {
    if (isDragging) {
      setLastPosition(imagePosition);
      setIsDragging(false);
      setDragStart(null);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => handleImageMouseMove(e);
    const handleUp = () => handleImageMouseUp();

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
  }, [isDragging, dragStart, lastPosition, imagePosition, isProfilePhoto]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label className="text-sm font-medium">{label}</Label>}

      {value ? (
        <div className="relative group" ref={containerRef}>
          <div
            className={`relative overflow-hidden rounded-lg border-2 border-border ${getAspectRatioClass()} ${isProfilePhoto ? "rounded-full" : ""}`}
          >
            {/* Image with draggable positioning for profile photos */}
            <div
              className={`w-full h-full relative ${isProfilePhoto ? "cursor-move z-[5]" : ""}`}
              onMouseDown={handleImageMouseDown}
              style={isProfilePhoto ? { touchAction: "none" } : {}}
            >
              {isProfilePhoto ? (
                <>
                  {/* Circular mask for preview - shows what will be visible */}
                  <div className="absolute inset-0 rounded-full overflow-hidden z-0">
                    <img
                      src={value}
                      alt="Uploaded"
                      className="w-full h-full object-cover select-none"
                      draggable={false}
                      style={{
                        objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                        transform: "scale(1.3)", // Larger to allow repositioning within circle
                      }}
                    />
                  </div>
                  {/* Circular outline overlay - shows the crop boundary */}
                  <div
                    className="absolute inset-0 rounded-full pointer-events-none z-10"
                    style={{
                      boxShadow: `
                        inset 0 0 0 2px rgba(16, 185, 129, 0.8),
                        inset 0 0 0 3px rgba(255, 255, 255, 0.5),
                        0 0 0 999px rgba(0, 0, 0, 0.5)
                      `,
                    }}
                  />
                </>
              ) : (
                <img src={value} alt="Uploaded" className="w-full h-full object-cover select-none" draggable={false} />
              )}
            </div>

            {/* Hover overlay with actions - completely transparent to pointer events except buttons */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center z-[20] pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center">
                {isProfilePhoto && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-white/90 rounded-md pointer-events-none">
                    <Move className="h-4 w-4 text-gray-700" />
                    <span className="text-xs font-medium text-gray-700">Drag to reposition</span>
                  </div>
                )}
                <div className="flex gap-2 pointer-events-auto">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    disabled={isUploading}
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Replace
                  </Button>
                  {onRemove && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                      }}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Position indicator for profile photos */}
          {isProfilePhoto && isDragging && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground bg-white/90 px-2 py-1 rounded shadow">
              Repositioning...
            </div>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-border"
          } ${getAspectRatioClass()} ${aspectRatio !== "auto" ? "" : "min-h-[200px]"} flex flex-col items-center justify-center cursor-pointer`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Uploading and optimizing...</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP up to {maxSizeMB}MB</p>
            </>
          )}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" disabled={isUploading} />

      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
