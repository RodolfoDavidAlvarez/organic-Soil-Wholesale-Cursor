import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode } from "react";
import { useLocation, useRoute } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  Loader2,
  Package,
  ShoppingBag,
  Trash2,
  Truck,
  UploadCloud,
  X,
  Youtube,
  Plus,
  Play,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { SIZE_CATALOG, SIZE_CATALOG_BY_KEY } from "@/data/sizeCatalog";
import { generateSlug } from "@/utils/generateSlug";
import { extractYouTubeVideoId } from "@/components/YouTubePlayer";
import {
  PRODUCT_IMAGE_FOLDER,
  Product,
  EditFormData,
  SizePriceOptionFormValue,
  createEmptyEditForm,
  buildEditForm,
  formatPrice,
  getPrimaryImage,
  buildAdminProductRouteParam,
} from "./product-utils";

// Increased to 20MB - images will be automatically optimized on the server
const MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const parseProductId = (param?: string | number | null) => {
  if (param === undefined || param === null) return NaN;
  if (typeof param === "number") {
    return Number.isFinite(param) ? param : NaN;
  }
  const trimmed = param.trim();
  if (trimmed.toLowerCase() === "new") {
    return NaN;
  }
  const idMatch = trimmed.match(/^\d+/);
  if (idMatch) {
    const numeric = Number.parseInt(idMatch[0], 10);
    return Number.isFinite(numeric) ? numeric : NaN;
  }
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : NaN;
};

type SectionCardProps = {
  title: string | ReactNode;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const SectionCard = ({ title, description, actions, children }: SectionCardProps) => (
  <div className="space-y-4 rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {typeof title === "string" ? (
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
        ) : (
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</div>
        )}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const sanitizeSlug = (value: string) => generateSlug(value) ?? "";

const priceStringToCents = (value: string): number | null => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed)) return null;
  return Math.round(parsed * 100);
};

const parseInventoryQuantity = (value: string): number | null => {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned.length) {
    return null;
  }
  const parsed = Number.parseInt(cleaned, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

const getCatalogEntry = (key: string) => SIZE_CATALOG_BY_KEY[key as keyof typeof SIZE_CATALOG_BY_KEY];

export default function AdminProductDetail() {
  const [, params] = useRoute("/admin/products/:productId");
  const [, navigate] = useLocation();
  const routeParams = params as { productId?: string } | null;
  const routeProductId = routeParams ? routeParams.productId : undefined;
  const isCreatingNew = routeProductId === "new";
  const productId = parseProductId(routeProductId ?? null);
  const isValidProductId = Number.isInteger(productId) && productId > 0;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [editForm, setEditForm] = useState<EditFormData | null>(isCreatingNew ? createEmptyEditForm() : null);
  const [galleryUploads, setGalleryUploads] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [newCustomSize, setNewCustomSize] = useState<{ label: string; price: string; description?: string }>({
    label: "",
    price: "",
    description: "",
  });
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isCreatingNew);
  const [formError, setFormError] = useState<string | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [pendingSlugChange, setPendingSlugChange] = useState<{ oldSlug: string; newSlug: string } | null>(null);
  const [originalFormData, setOriginalFormData] = useState<EditFormData | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Array<{ fileName: string; error: string }>>([]);

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery<Product>({
    queryKey: ["adminProduct", productId],
    enabled: !isCreatingNew && isValidProductId,
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load product");
      }

      return response.json();
    },
  });

  const resetGalleryPreviews = useCallback(() => {
    setGalleryPreviews((previous) => {
      previous.forEach((preview) => URL.revokeObjectURL(preview));
      return [];
    });
  }, []);

  useEffect(() => {
    if (product) {
      const form = buildEditForm(product);
      setEditForm(form);
      setOriginalFormData(JSON.parse(JSON.stringify(form))); // Deep clone for comparison
      setOriginalSlug(form.slug);
      setGalleryUploads([]);
      resetGalleryPreviews();
      setNewCustomSize({ label: "", price: "", description: "" });
      setFormError(null);
      setSlugManuallyEdited(Boolean(product.slug));
      setFormError(null);
      setUploadErrors([]);
    } else if (isCreatingNew) {
      const form = createEmptyEditForm();
      setEditForm(form);
      setOriginalFormData(JSON.parse(JSON.stringify(form))); // Deep clone for comparison
      setOriginalSlug("");
      setSlugManuallyEdited(false);
      setFormError(null);
      setUploadErrors([]);
    }
  }, [product, isCreatingNew, resetGalleryPreviews]);

  useEffect(() => {
    if (isCreatingNew || !product || !isValidProductId) {
      return;
    }
    const canonicalParam = buildAdminProductRouteParam(product);
    if (canonicalParam && routeProductId !== canonicalParam) {
      navigate(`/admin/products/${canonicalParam}`, { replace: true });
    }
  }, [isCreatingNew, isValidProductId, navigate, routeProductId, product]);

  useEffect(() => {
    return () => {
      resetGalleryPreviews();
    };
  }, [resetGalleryPreviews]);

  const uploadImage = async (file: File, folder: string) => {
    const token = localStorage.getItem("adminToken");
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
      let message = "Failed to upload image";
      try {
        const details = await response.json();
        if (details && typeof details.error === "string" && details.error.length > 0) {
          message = details.error;
        }
      } catch {
        try {
          const text = await response.text();
          if (text) {
            message = text;
          }
        } catch {
          // ignore parse errors
        }
      }
      throw new Error(message);
    }

    const result = await response.json();
    return result.url as string;
  };

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId: id, data }: { productId: number; data: Record<string, unknown> }) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || "Failed to update product");
      }

      return response.json() as Promise<Product>;
    },
    onSuccess: (updatedProduct) => {
      toast({
        title: "Product updated",
        description: `${updatedProduct.display_title || "Product"} has been saved.`,
      });

      const updatedForm = buildEditForm(updatedProduct);
      setEditForm(updatedForm);
      setOriginalFormData(JSON.parse(JSON.stringify(updatedForm))); // Deep clone for comparison
      setGalleryUploads([]);
      resetGalleryPreviews();
      setNewCustomSize({ label: "", price: "", description: "" });
      setUploadErrors([]);

      queryClient.setQueryData<Product>(["adminProduct", updatedProduct.id], updatedProduct);
      queryClient.setQueryData<Product[]>(
        ["adminProducts"],
        (existing) => existing?.map((item) => (item.id === updatedProduct.id ? updatedProduct : item)) ?? []
      );
      if (!isCreatingNew) {
        const canonicalParam = buildAdminProductRouteParam(updatedProduct);
        if (canonicalParam && routeProductId !== canonicalParam) {
          navigate(`/admin/products/${canonicalParam}`, { replace: true });
        }
      }
    },
    onError: (mutationError: Error) => {
      setFormError(mutationError.message || "We could not save your changes.");
      toast({
        title: "Save failed",
        description: mutationError.message || "We could not save your changes.",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || "Failed to create product");
      }

      return response.json() as Promise<Product>;
    },
    onSuccess: (newProduct) => {
      toast({
        title: "Product created",
        description: `${newProduct.display_title || "Product"} is now available to manage.`,
      });

      const newForm = buildEditForm(newProduct);
      setEditForm(newForm);
      setOriginalFormData(JSON.parse(JSON.stringify(newForm))); // Deep clone for comparison
      setUploadErrors([]);
      queryClient.setQueryData<Product>(["adminProduct", newProduct.id], newProduct);
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      navigate(`/admin/products/${buildAdminProductRouteParam(newProduct)}`);
      setFormError(null);
    },
    onError: (mutationError: Error) => {
      setFormError(mutationError.message || "We could not create this product.");
      toast({
        title: "Create failed",
        description: mutationError.message || "We could not create this product.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        throw new Error(details.error || "Failed to delete product");
      }
    },
    onSuccess: () => {
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      navigate("/admin/products");
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "We could not delete this product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSizePriceOptions = (updater: (options: SizePriceOptionFormValue[]) => SizePriceOptionFormValue[]) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const nextOptions = updater(prev.size_price_options);
      // Ensure displayOrder is set for all options
      const optionsWithOrder = nextOptions.map((option, index) => ({
        ...option,
        displayOrder: option.displayOrder ?? index,
      }));
      return {
        ...prev,
        size_price_options: optionsWithOrder,
        available_size_options: Array.from(new Set(optionsWithOrder.filter((option) => option.isActive).map((option) => option.label))),
      };
    });
  };

  const moveSizeOption = (key: string, direction: "up" | "down") => {
    updateSizePriceOptions((options) => {
      // Get only active options and sort by displayOrder
      const activeOptions = options.filter((opt) => opt.isActive).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

      const currentIndex = activeOptions.findIndex((opt) => opt.key === key);
      if (currentIndex === -1) return options;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= activeOptions.length) return options;

      // Get the two options to swap
      const currentOption = activeOptions[currentIndex];
      const targetOption = activeOptions[newIndex];

      // Swap display orders
      const tempOrder = currentOption.displayOrder ?? currentIndex;
      const targetOrder = targetOption.displayOrder ?? newIndex;

      // Update all options with new display orders
      return options.map((opt) => {
        if (opt.key === currentOption.key) {
          return { ...opt, displayOrder: targetOrder };
        }
        if (opt.key === targetOption.key) {
          return { ...opt, displayOrder: tempOrder };
        }
        return opt;
      });
    });
  };

  const handleStandardSizeToggle = (key: string, isActive: boolean) => {
    updateSizePriceOptions((options) => {
      const existingOption = options.find((opt) => opt.key === key);
      if (isActive && existingOption && existingOption.displayOrder === undefined) {
        // Assign displayOrder when activating
        const activeOptions = options.filter((opt) => opt.isActive && opt.key !== key);
        const maxDisplayOrder = activeOptions.length > 0 ? Math.max(...activeOptions.map((opt) => opt.displayOrder ?? 0)) : -1;
        return options.map((option) =>
          option.key === key
            ? {
                ...option,
                isActive,
                displayOrder: maxDisplayOrder + 1,
              }
            : option
        );
      }
      return options.map((option) =>
        option.key === key
          ? {
              ...option,
              isActive,
            }
          : option
      );
    });
  };

  const handleSizePriceChange = (key: string, field: "price" | "description" | "image", value: string) => {
    updateSizePriceOptions((options) =>
      options.map((option) =>
        option.key === key
          ? {
              ...option,
              [field]: value,
            }
          : option
      )
    );
  };

  const handleSizeImageUpload = async (key: string, file: File) => {
    if (!validateFileSize(file)) return;

    try {
      // Upload to shared location - this image will be used by ALL products with this size category
      const uploadFolder = "size-categories";
      const imageUrl = await uploadImage(file, `${uploadFolder}/${key}`);
      handleSizePriceChange(key, "image", imageUrl);
      toast({
        title: "Image uploaded",
        description: "Size category image has been uploaded and optimized. This will update for all products using this size category.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload image";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCustomSizeChange = (key: string, partial: Pick<SizePriceOptionFormValue, "label" | "price" | "description">) => {
    updateSizePriceOptions((options) => options.map((option) => (option.key === key ? { ...option, ...partial } : option)));
  };

  const handleRemoveCustomSizeOption = (key: string) => {
    updateSizePriceOptions((options) => options.filter((option) => option.key !== key));
  };

  const handleAddCustomSizeOption = () => {
    if (!newCustomSize.label.trim()) {
      toast({
        title: "Missing label",
        description: "Give the new size a name before adding it.",
        variant: "destructive",
      });
      return;
    }

    const newKey = `${newCustomSize.label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    updateSizePriceOptions((options) => {
      const activeOptions = options.filter((opt) => opt.isActive);
      const maxDisplayOrder = activeOptions.length > 0 ? Math.max(...activeOptions.map((opt) => opt.displayOrder ?? 0)) : -1;

      return [
        ...options,
        {
          key: newKey,
          label: newCustomSize.label.trim(),
          description: newCustomSize.description?.trim() || undefined,
          image: undefined,
          price: newCustomSize.price.trim(),
          isActive: true,
          inventoryQuantity: "", // Quantity moved to Pay & Pickup section
          displayOrder: maxDisplayOrder + 1,
        },
      ];
    });
    setNewCustomSize({ label: "", price: "", description: "" });
  };

  const validateFileSize = (file: File) => {
    if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const maxSizeMB = (MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
      const error = `${file.name} is too large (${fileSizeMB} MB). Maximum upload size is ${maxSizeMB} MB. Images are automatically optimized for fast loading.`;
      setUploadErrors((prev) => [...prev, { fileName: file.name, error }]);
      toast({
        title: "Image too large",
        description: `${file.name} is ${fileSizeMB} MB. Maximum size is ${maxSizeMB} MB. Images are automatically optimized on upload.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleGalleryInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));

    // Check for non-image files
    const nonImageFiles = Array.from(event.target.files ?? []).filter((file) => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      nonImageFiles.forEach((file) => {
        const error = `${file.name} is not an image file. Please select image files only.`;
        setUploadErrors((prev) => [...prev, { fileName: file.name, error }]);
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
      });
    }

    const validFiles = files.filter((file) => validateFileSize(file));
    if (validFiles.length === 0 && files.length > 0) {
      event.target.value = "";
      return;
    }

    if (validFiles.length > 0) {
      setGalleryUploads((prev) => [...prev, ...validFiles]);
      const previews = validFiles.map((file) => URL.createObjectURL(file));
      setGalleryPreviews((prev) => [...prev, ...previews]);

      // Set thumbnail_index to first image if no thumbnail is selected
      setEditForm((prev) => {
        if (!prev) return prev;
        if (prev.thumbnail_index < 0 && prev.additional_images.length === 0) {
          return { ...prev, thumbnail_index: 0 };
        }
        return prev;
      });
    }

    event.target.value = "";
  };

  const handleGalleryDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const allFiles = Array.from(event.dataTransfer.files);
    const files = allFiles.filter((file) => file.type.startsWith("image/"));

    // Check for non-image files
    const nonImageFiles = allFiles.filter((file) => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      nonImageFiles.forEach((file) => {
        const error = `${file.name} is not an image file. Please select image files only.`;
        setUploadErrors((prev) => [...prev, { fileName: file.name, error }]);
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
      });
    }

    const validFiles = files.filter((file) => validateFileSize(file));
    if (validFiles.length === 0) return;

    setGalleryUploads((prev) => [...prev, ...validFiles]);
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...previews]);

    // Set thumbnail_index to first image if no thumbnail is selected
    setEditForm((prev) => {
      if (!prev) return prev;
      if (prev.thumbnail_index < 0 && prev.additional_images.length === 0) {
        return { ...prev, thumbnail_index: 0 };
      }
      return prev;
    });
  };

  const handleRemoveExistingGalleryImage = (image: string) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const imageIndex = prev.additional_images.findIndex((item) => item === image);
      const newImages = prev.additional_images.filter((item) => item !== image);

      // Adjust thumbnail_index if needed
      let newThumbnailIndex = prev.thumbnail_index;
      if (imageIndex >= 0 && prev.thumbnail_index === imageIndex) {
        // If we're removing the thumbnail, set to first image or -1
        newThumbnailIndex = newImages.length > 0 ? 0 : -1;
      } else if (imageIndex >= 0 && prev.thumbnail_index > imageIndex) {
        // If we're removing an image before the thumbnail, decrement the index
        newThumbnailIndex = prev.thumbnail_index - 1;
      }

      return {
        ...prev,
        additional_images: newImages,
        thumbnail_index: newThumbnailIndex,
      };
    });
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;

    const videoId = extractYouTubeVideoId(newVideoUrl.trim());
    if (!videoId) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)",
        variant: "destructive",
      });
      return;
    }

    // Normalize URL to standard format: https://www.youtube.com/watch?v=VIDEO_ID
    const normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;

    setEditForm((prev) => {
      if (!prev) return prev;
      // Check if this video ID is already in the list (handle different URL formats)
      const existingVideoIds = prev.video_urls.map((url) => extractYouTubeVideoId(url)).filter(Boolean);
      if (existingVideoIds.includes(videoId)) {
        toast({
          title: "Video already added",
          description: "This video is already in the gallery.",
          variant: "default",
        });
        return prev;
      }
      return {
        ...prev,
        video_urls: [...prev.video_urls, normalizedUrl],
      };
    });

    setNewVideoUrl("");
    toast({
      title: "Video added",
      description: "The video has been added to the gallery.",
      variant: "default",
    });
  };

  const handleRemoveVideo = (videoUrl: string) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        video_urls: prev.video_urls.filter((url) => url !== videoUrl),
      };
    });
  };

  const handleRemoveNewGalleryImage = (index: number) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const actualIndex = prev.additional_images.length + index;
      let newThumbnailIndex = prev.thumbnail_index;

      // Adjust thumbnail_index if needed
      if (prev.thumbnail_index === actualIndex) {
        // If we're removing the thumbnail, set to first existing image or -1
        newThumbnailIndex = prev.additional_images.length > 0 ? 0 : -1;
      } else if (prev.thumbnail_index > actualIndex) {
        // If we're removing an image before the thumbnail, decrement the index
        newThumbnailIndex = prev.thumbnail_index - 1;
      }

      return {
        ...prev,
        thumbnail_index: newThumbnailIndex,
      };
    });

    setGalleryUploads((prev) => prev.filter((_, idx) => idx !== index));
    setGalleryPreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) {
        URL.revokeObjectURL(removed);
      }
      return next;
    });
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm) return;
    setIsSaving(true);
    setFormError(null);

    try {
      // Auto-generate slug from display_title if empty
      let normalizedSlug = sanitizeSlug(editForm.slug);
      if (!normalizedSlug && editForm.display_title) {
        normalizedSlug = sanitizeSlug(editForm.display_title);
        if (normalizedSlug) {
          setEditForm((prev) => (prev ? { ...prev, slug: normalizedSlug } : prev));
          setSlugManuallyEdited(false);
        }
      }

      if (!normalizedSlug) {
        toast({
          title: "Missing URL",
          description: "Set a product name or URL so the product preview page has a stable link.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const catalogOrderInput = editForm.catalog_display_order.trim();
      let parsedCatalogOrder: number | null = null;

      if (catalogOrderInput.length > 0) {
        const candidate = Number.parseInt(catalogOrderInput, 10);
        if (Number.isNaN(candidate) || candidate < 0) {
          toast({
            title: "Invalid catalog order",
            description: "Enter a whole number zero or greater to control the product order.",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        parsedCatalogOrder = candidate;
      }

      const uploadFolder = isValidProductId ? `${PRODUCT_IMAGE_FOLDER}/${productId}` : PRODUCT_IMAGE_FOLDER;

      let galleryImages = [...editForm.additional_images];
      if (galleryUploads.length > 0) {
        const uploadResults = await Promise.allSettled(
          galleryUploads.map((file, index) => uploadImage(file, `${uploadFolder}/gallery-${index + 1}`))
        );

        const successfulUploads: string[] = [];
        const failedUploads: Array<{ fileName: string; error: string }> = [];

        uploadResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            successfulUploads.push(result.value);
          } else {
            const file = galleryUploads[index];
            const error = result.reason?.message || "Upload failed";
            failedUploads.push({ fileName: file.name, error });
            setUploadErrors((prev) => [...prev, { fileName: file.name, error }]);
            toast({
              title: "Upload failed",
              description: `${file.name}: ${error}`,
              variant: "destructive",
            });
          }
        });

        if (failedUploads.length > 0) {
          // Show summary if multiple files failed
          if (failedUploads.length > 1) {
            toast({
              title: "Some uploads failed",
              description: `${failedUploads.length} image(s) could not be uploaded. Check the error messages above.`,
              variant: "destructive",
            });
          }
        }

        galleryImages = [...galleryImages, ...successfulUploads];

        // Remove successfully uploaded files from pending uploads
        const successfulIndices = uploadResults
          .map((result, index) => (result.status === "fulfilled" ? index : -1))
          .filter((index) => index !== -1)
          .reverse(); // Reverse to remove from end to start

        successfulIndices.forEach((index) => {
          setGalleryUploads((prev) => prev.filter((_, i) => i !== index));
          setGalleryPreviews((prev) => {
            const next = [...prev];
            const [removed] = next.splice(index, 1);
            if (removed) {
              URL.revokeObjectURL(removed);
            }
            return next;
          });
        });
      }

      // Determine thumbnail from thumbnail_index
      // If thumbnail_index is -1, use image_url (legacy support)
      // Otherwise, use the image at that index in galleryImages
      let thumbnailUrl = editForm.image_url || "";
      if (editForm.thumbnail_index >= 0 && editForm.thumbnail_index < galleryImages.length) {
        thumbnailUrl = galleryImages[editForm.thumbnail_index];
      } else if (galleryImages.length > 0) {
        // Fallback to first image if thumbnail_index is invalid
        thumbnailUrl = galleryImages[0];
      }

      const sizePriceOptionsPayload = editForm.size_price_options
        .filter((option) => option.label.trim().length > 0)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
        .map((option, index) => {
          const trimmedLabel = option.label.trim();
          const priceCents = priceStringToCents(option.price);
          const catalogEntry = getCatalogEntry(option.key);
          const image = option.image || catalogEntry?.image || null;
          const description = option.description || catalogEntry?.description || null;
          const isActive = Boolean(option.isActive && trimmedLabel.length > 0);

          return {
            key: option.key,
            label: trimmedLabel,
            price_cents: priceCents,
            price: priceCents !== null ? Number((priceCents / 100).toFixed(2)) : null,
            image,
            description,
            is_active: isActive,
            display_order: option.displayOrder ?? index,
          };
        });

      const availableSizeOptions = Array.from(new Set(sizePriceOptionsPayload.filter((option) => option.is_active).map((option) => option.label)));

      const inventoryUpdatesPayload = editForm.size_price_options
        .filter((option) => option.isActive)
        .map((option) => {
          const quantity = parseInventoryQuantity(option.inventoryQuantity);
          if (quantity === null) {
            return null;
          }

          const label = option.label.trim();
          if (!label) {
            return null;
          }

          return {
            size_option: label,
            quantity_available: quantity,
          };
        })
        .filter(
          (
            entry
          ): entry is {
            size_option: string;
            quantity_available: number;
          } => Boolean(entry)
        );

      const activePriceCents = sizePriceOptionsPayload.find((option) => option.is_active && option.price_cents !== null)?.price_cents ?? null;

      const payload: Record<string, unknown> = {
        name: editForm.display_title.trim() || "Product",
        display_title: editForm.display_title.trim() || null,
        category: editForm.category.trim() || null,
        slug: normalizedSlug,
        marketing_note: editForm.marketing_note.trim() || null,
        description: editForm.description.trim() || null,
        ingredients: editForm.ingredients.trim() || null,
        recommended_uses: editForm.recommended_uses.trim() || null,
        features: editForm.features.trim() || null,
        story: editForm.story.trim() || null,
        usage: editForm.usage.trim() || null,
        target_audience: editForm.target_audience.trim() || null,
        product_status: editForm.is_catalog_enabled ? "active" : "draft",
        catalog_display_order: parsedCatalogOrder ?? 0,
        is_catalog_enabled: editForm.is_catalog_enabled,
        is_pay_and_pickup_enabled: editForm.is_pay_and_pickup_enabled,
        pay_and_pickup_description: editForm.pay_and_pickup_description.trim() || null,
        pay_and_pickup_badge: editForm.pay_and_pickup_badge.trim() || null,
        pay_and_pickup_hero_image: thumbnailUrl || null, // Use same thumbnail for pay & pickup
        image_url: thumbnailUrl || null, // Use selected thumbnail
        additional_images: galleryImages,
        video_urls: editForm.video_urls.length > 0 ? editForm.video_urls : null, // Save video URLs (support both single and array)
        product_video_url: editForm.video_urls.length > 0 ? editForm.video_urls[0] : null, // Legacy support for single video
        available_size_options: availableSizeOptions,
      };

      if (activePriceCents !== null) {
        payload.price = activePriceCents;
      }

      if (sizePriceOptionsPayload.length > 0) {
        payload.size_price_options = sizePriceOptionsPayload;
      }

      if (inventoryUpdatesPayload.length > 0) {
        payload.inventory_updates = inventoryUpdatesPayload;
        const totalInventory = inventoryUpdatesPayload.reduce((sum, entry) => sum + entry.quantity_available, 0);
        payload.stock_quantity = totalInventory;
      }

      if (isCreatingNew) {
        await createProductMutation.mutateAsync(payload);
      } else if (productId) {
        await updateProductMutation.mutateAsync({ productId, data: payload });
      }
    } catch (mutationError) {
      console.error(mutationError);
      const description =
        mutationError instanceof Error && mutationError.message
          ? mutationError.message
          : "We hit a snag before sending your update. Double-check the fields and try again.";
      toast({
        title: "Save failed",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisplayTitleChange = (value: string) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, display_title: value };
      if (!slugManuallyEdited && !next.slug) {
        // Auto-generate slug if empty
        next.slug = sanitizeSlug(value);
      }
      return next;
    });
  };

  const handleSlugChange = (value: string) => {
    const sanitizedValue = sanitizeSlug(value);
    if (!editForm) return;

    // If slug hasn't been manually edited before, or if it's the same as original, allow change
    if (!slugManuallyEdited || editForm.slug === originalSlug) {
      setSlugManuallyEdited(true);
      setEditForm((prev) => (prev ? { ...prev, slug: sanitizedValue } : prev));
      return;
    }

    // If slug is being changed from a previously set value, show confirmation
    if (editForm.slug && editForm.slug !== sanitizedValue && editForm.slug !== originalSlug) {
      setPendingSlugChange({ oldSlug: editForm.slug, newSlug: sanitizedValue });
      return;
    }

    // If changing from original slug, show confirmation
    if (editForm.slug !== sanitizedValue && originalSlug && editForm.slug === originalSlug) {
      setPendingSlugChange({ oldSlug: editForm.slug, newSlug: sanitizedValue });
      return;
    }

    setSlugManuallyEdited(true);
    setEditForm((prev) => (prev ? { ...prev, slug: sanitizedValue } : prev));
  };

  const confirmSlugChange = () => {
    if (pendingSlugChange) {
      setSlugManuallyEdited(true);
      setEditForm((prev) => (prev ? { ...prev, slug: pendingSlugChange.newSlug } : prev));
      setPendingSlugChange(null);
      toast({
        title: "URL changed",
        description: "The product URL has been updated. Existing links may break.",
        variant: "default",
      });
    }
  };

  const cancelSlugChange = () => {
    if (pendingSlugChange) {
      setEditForm((prev) => (prev ? { ...prev, slug: pendingSlugChange.oldSlug } : prev));
      setPendingSlugChange(null);
    }
  };

  const thumbnailForPreview = useMemo(() => {
    if (!editForm) return product ? getPrimaryImage(product) : "";

    // Get thumbnail from gallery based on thumbnail_index
    if (editForm.thumbnail_index >= 0 && editForm.thumbnail_index < editForm.additional_images.length) {
      return editForm.additional_images[editForm.thumbnail_index];
    }

    // Check if there are new previews that would be at the thumbnail_index
    const totalImages = editForm.additional_images.length + galleryPreviews.length;
    if (editForm.thumbnail_index >= editForm.additional_images.length && editForm.thumbnail_index < totalImages) {
      const previewIndex = editForm.thumbnail_index - editForm.additional_images.length;
      return galleryPreviews[previewIndex] || "";
    }

    // Fallback to first image or image_url
    if (editForm.additional_images.length > 0) {
      return editForm.additional_images[0];
    }

    return editForm.image_url || (product ? getPrimaryImage(product) : "");
  }, [editForm, galleryPreviews, product]);

  const payPickupPreviewSizes = useMemo(() => {
    if (!editForm) return [];
    const activeSizes = editForm.size_price_options.filter((option) => option.isActive);
    if (activeSizes.length === 0) {
      return ["Custom size"];
    }
    return activeSizes.map((size) => (size.price.trim().length ? `${size.label} · $${size.price}` : size.label));
  }, [editForm]);

  const isProcessingSave = isSaving || updateProductMutation.isPending || createProductMutation.isPending;
  const canDeleteProduct = !isCreatingNew && Boolean(productId) && Boolean(product);
  const catalogStatusLabel = editForm?.is_catalog_enabled ? "Visible in catalog" : "Hidden from catalog";
  const payPickupStatusLabel = editForm?.is_pay_and_pickup_enabled ? "Pay & Pickup enabled" : "Pay & Pickup disabled";

  // Check if form has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!editForm || !originalFormData) return false;
    if (galleryUploads.length > 0 || galleryPreviews.length > 0) return true;
    return JSON.stringify(editForm) !== JSON.stringify(originalFormData);
  }, [editForm, originalFormData, galleryUploads.length, galleryPreviews.length]);

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <form onSubmit={handleSave} className="space-y-6 pb-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/admin/products")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Products catalog
              </Button>
              <div>
                <h1 className="text-2xl font-semibold leading-tight">{editForm?.display_title || (isCreatingNew ? "Create product" : "Product")}</h1>
                <p className="text-sm text-muted-foreground">{isCreatingNew ? "Add a new catalog item." : `Managing #${productId}`}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={editForm?.is_catalog_enabled ? "default" : "outline"}>{catalogStatusLabel}</Badge>
              <Badge variant={editForm?.is_pay_and_pickup_enabled ? "default" : "outline"}>{payPickupStatusLabel}</Badge>
              {canDeleteProduct && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={deleteMutation.isPending || isProcessingSave}
                  onClick={() => productId && deleteMutation.mutate(productId)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {/* Sticky Save Button */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  {hasUnsavedChanges && <p className="text-sm font-medium text-amber-600 dark:text-amber-400">You have unsaved changes</p>}
                  {uploadErrors.length > 0 && (
                    <p className="text-sm text-destructive">{uploadErrors.length} upload error(s) - check notifications above</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isProcessingSave}
                  className={hasUnsavedChanges ? "ring-2 ring-amber-500 ring-offset-2" : ""}
                  size="lg"
                >
                  {isProcessingSave ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isCreatingNew ? "Create" : "Save changes"}
                </Button>
              </div>
            </div>
          </div>

          {isError && (
            <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error instanceof Error ? error.message : "Failed to load product"}</span>
            </div>
          )}
          {formError && (
            <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">We couldn't save your changes.</p>
                <p>{formError}</p>
              </div>
            </div>
          )}

          {/* Upload Error Notifications */}
          {uploadErrors.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Upload Errors ({uploadErrors.length})</span>
              </div>
              <div className="space-y-1">
                {uploadErrors.map((error, index) => (
                  <div key={index} className="text-xs text-destructive/90">
                    <span className="font-medium">{error.fileName}:</span> {error.error}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setUploadErrors([])} className="mt-2">
                Dismiss errors
              </Button>
            </div>
          )}

          {!editForm && isLoading && <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading product...</div>}

          {editForm && (
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <SectionCard title="Product basics" description="Essential product information shown to customers.">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="display-title">Product name</Label>
                      <Input
                        id="display-title"
                        value={editForm.display_title}
                        onChange={(event) => handleDisplayTitleChange(event.target.value)}
                        placeholder="Organic Dairy Compost"
                        className="text-lg"
                      />
                      <p className="text-xs text-muted-foreground">Main title displayed in the catalog and product page.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        value={editForm.description}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
                        placeholder="Write a helpful summary that appears below the product name..."
                      />
                      <p className="text-xs text-muted-foreground">This description appears on the product detail page below the product name.</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border/50">
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                        Advanced settings (URL, Category, Catalog options)
                      </summary>
                      <div className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="slug">Product URL</Label>
                            <Input
                              id="slug"
                              value={editForm.slug}
                              onChange={(event) => handleSlugChange(event.target.value)}
                              placeholder="organic-dairy-compost"
                            />
                            <p className="text-xs text-muted-foreground">
                              Final page: <code>/products/{editForm.slug || "your-slug"}</code>
                            </p>
                            {!editForm.slug && editForm.display_title && (
                              <p className="text-xs text-primary">Tip: URL will auto-generate from product name when you save.</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                              id="category"
                              value={editForm.category}
                              onChange={(event) => setEditForm((prev) => (prev ? { ...prev, category: event.target.value } : prev))}
                              placeholder="Amendment"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">Show in catalog</p>
                              <p className="text-xs text-muted-foreground">Toggle visibility on the public product catalog.</p>
                            </div>
                            <Switch
                              checked={editForm.is_catalog_enabled}
                              onCheckedChange={(checked) => setEditForm((prev) => (prev ? { ...prev, is_catalog_enabled: checked } : prev))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="catalog-order">Catalog order</Label>
                            <Input
                              id="catalog-order"
                              inputMode="numeric"
                              value={editForm.catalog_display_order}
                              onChange={(event) => setEditForm((prev) => (prev ? { ...prev, catalog_display_order: event.target.value } : prev))}
                              placeholder="0"
                            />
                            <p className="text-xs text-muted-foreground">Lower numbers appear first. Leave blank to auto-sort.</p>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </SectionCard>

                <SectionCard title="Details" description="Long-form guidance for the product detail page.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="features">Features</Label>
                      <Textarea
                        id="features"
                        rows={3}
                        value={editForm.features}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, features: event.target.value } : prev))}
                        placeholder="List key features and soil benefits..."
                      />
                      <p className="text-xs text-muted-foreground">Shown first in "Features & Soil Impact" section.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage">Usage instructions</Label>
                      <Textarea
                        id="usage"
                        rows={3}
                        value={editForm.usage}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, usage: event.target.value } : prev))}
                        placeholder="How to use this product..."
                      />
                      <p className="text-xs text-muted-foreground">Shown in "Usage Guidance" section.</p>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="story">Product story</Label>
                      <Textarea
                        id="story"
                        rows={4}
                        value={editForm.story}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, story: event.target.value } : prev))}
                        placeholder="Share the origin story or agronomic insight..."
                      />
                      <p className="text-xs text-muted-foreground">Shown in "Product Narrative" section.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ingredients">Ingredients</Label>
                      <Textarea
                        id="ingredients"
                        rows={3}
                        value={editForm.ingredients}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, ingredients: event.target.value } : prev))}
                        placeholder="Composted dairy manure..."
                      />
                      <p className="text-xs text-muted-foreground">Shown in "Ingredients & Audiences" section.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target-audience">Best for (Target audience)</Label>
                      <Textarea
                        id="target-audience"
                        rows={3}
                        value={editForm.target_audience}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, target_audience: event.target.value } : prev))}
                        placeholder="Ornamental plants, Landscapers, Trees, Fruit growers..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Shown as "Best for" tags in "Ingredients & Audiences" section. Separate items with commas.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recommended-uses">Recommended uses</Label>
                      <Textarea
                        id="recommended-uses"
                        rows={3}
                        value={editForm.recommended_uses}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, recommended_uses: event.target.value } : prev))}
                        placeholder="Best applications for this product..."
                      />
                      <p className="text-xs text-muted-foreground">Shown as tags in "Usage Guidance" section.</p>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Media"
                  description="Upload images and YouTube videos. Select which image appears as the thumbnail in the catalog and product pages. Images up to 20MB are automatically optimized for fast loading."
                  actions={
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload images
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleAddVideo}>
                        <Youtube className="mr-2 h-4 w-4" />
                        Add YouTube video
                      </Button>
                    </div>
                  }
                >
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryInputChange} />

                  {/* Add YouTube Video Input */}
                  <div className="mb-4 flex gap-2">
                    <Input
                      type="url"
                      placeholder="Paste YouTube URL (e.g., https://youtube.com/watch?v=...)"
                      value={newVideoUrl}
                      onChange={(event) => setNewVideoUrl(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddVideo();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddVideo} disabled={!newVideoUrl.trim()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Upload Error Summary in Media Section */}
                    {uploadErrors.length > 0 && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Upload Issues</span>
                        </div>
                        <div className="space-y-1 text-xs text-destructive/90">
                          {uploadErrors.map((error, index) => (
                            <div key={index}>
                              <span className="font-medium">{error.fileName}:</span> {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {editForm.additional_images.length === 0 && galleryPreviews.length === 0 && editForm.video_urls.length === 0 ? (
                      <div
                        className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 text-center text-sm text-muted-foreground"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleGalleryDrop}
                      >
                        <ImagePlus className="h-8 w-8" />
                        <p>Drag images here or click "Upload images"</p>
                        <p className="text-xs">The first image will be used as the thumbnail</p>
                      </div>
                    ) : (
                      <>
                        <div
                          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={handleGalleryDrop}
                        >
                          {editForm.additional_images.map((image, index) => {
                            const isThumbnail = editForm.thumbnail_index === index;
                            return (
                              <div
                                key={image}
                                className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                                  isThumbnail ? "border-primary ring-2 ring-primary/50 shadow-lg" : "border-border/70 hover:border-primary/50"
                                }`}
                              >
                                <img src={image} alt="" className="h-full w-full object-cover" />
                                {isThumbnail && (
                                  <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs font-semibold text-white">Thumbnail</div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setEditForm((prev) => (prev ? { ...prev, thumbnail_index: index } : prev));
                                    }}
                                    className={isThumbnail ? "bg-primary text-white hover:bg-primary/90" : ""}
                                  >
                                    {isThumbnail ? "Selected" : "Set as thumbnail"}
                                  </Button>
                                  <button
                                    type="button"
                                    className="rounded-full bg-destructive p-2 text-white hover:bg-destructive/90"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRemoveExistingGalleryImage(image);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {galleryPreviews.map((preview, index) => {
                            const actualIndex = editForm.additional_images.length + index;
                            const isThumbnail = editForm.thumbnail_index === actualIndex;
                            return (
                              <div
                                key={`${preview}-${index}`}
                                className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                                  isThumbnail ? "border-primary ring-2 ring-primary/50 shadow-lg" : "border-primary/50"
                                }`}
                              >
                                <img src={preview} alt="" className="h-full w-full object-cover" />
                                {isThumbnail && (
                                  <div className="absolute left-2 top-2 rounded bg-primary px-2 py-1 text-xs font-semibold text-white">Thumbnail</div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      setEditForm((prev) => (prev ? { ...prev, thumbnail_index: actualIndex } : prev));
                                    }}
                                    className={isThumbnail ? "bg-primary text-white hover:bg-primary/90" : ""}
                                  >
                                    {isThumbnail ? "Selected" : "Set as thumbnail"}
                                  </Button>
                                  <button
                                    type="button"
                                    className="rounded-full bg-destructive p-2 text-white hover:bg-destructive/90"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRemoveNewGalleryImage(index);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {/* Video Previews */}
                          {editForm.video_urls.map((videoUrl) => {
                            const videoId = extractYouTubeVideoId(videoUrl);
                            if (!videoId) return null;
                            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

                            return (
                              <div
                                key={videoUrl}
                                className="group relative aspect-video overflow-hidden rounded-lg border-2 border-red-500/50 hover:border-red-500 transition-all"
                              >
                                <div className="relative h-full w-full">
                                  <img
                                    src={thumbnailUrl}
                                    alt="YouTube video thumbnail"
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      // Fallback to default thumbnail if maxresdefault fails
                                      (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                    }}
                                  />
                                  {/* Play button in bottom-right corner */}
                                  <div className="absolute bottom-2 right-2 rounded-full bg-red-600 p-2 shadow-lg transition-transform group-hover:scale-110">
                                    <Play className="h-5 w-5 text-white fill-white" />
                                  </div>
                                  {/* YouTube badge in top-left */}
                                  <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white flex items-center gap-1">
                                    <Youtube className="h-3 w-3" />
                                    <span>Video</span>
                                  </div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    className="rounded-full bg-destructive p-2 text-white hover:bg-destructive/90"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRemoveVideo(videoUrl);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Click "Set as thumbnail" on any image to make it the main image shown in the catalog and product pages. Videos are shown in
                          the gallery but cannot be used as thumbnails.
                        </p>
                      </>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Sizes & Pricing"
                  description="Activate size options and set pricing/stock. Edit directly in catalog preview or here."
                >
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
                      Standard sizes (
                      {editForm.size_price_options.filter((opt) => SIZE_CATALOG.some((e) => e.key === opt.key) && opt.isActive).length} active)
                    </summary>
                    <div className="mt-4 space-y-3">
                      {editForm.size_price_options
                        .filter((opt) => SIZE_CATALOG.some((e) => e.key === opt.key))
                        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                        .map((option) => {
                          const entry = SIZE_CATALOG.find((e) => e.key === option.key);
                          if (!entry) return null;
                          const isActive = option.isActive;
                          const activeOptions = editForm.size_price_options
                            .filter((opt) => SIZE_CATALOG.some((e) => e.key === opt.key) && opt.isActive)
                            .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
                          const currentIndex = activeOptions.findIndex((opt) => opt.key === option.key);
                          const canMoveUp = isActive && currentIndex > 0;
                          const canMoveDown = isActive && currentIndex < activeOptions.length - 1;

                          return (
                            <div
                              key={entry.key}
                              className={`rounded-lg border p-3 transition-colors ${
                                isActive ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/10"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex-1 flex items-center gap-2">
                                  {isActive && (
                                    <div className="flex flex-col gap-1">
                                      <button
                                        type="button"
                                        onClick={() => moveSizeOption(entry.key, "up")}
                                        disabled={!canMoveUp}
                                        className="p-1 rounded hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Move up"
                                      >
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveSizeOption(entry.key, "down")}
                                        disabled={!canMoveDown}
                                        className="p-1 rounded hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        aria-label="Move down"
                                      >
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 flex-1">
                                    <Checkbox
                                      checked={isActive}
                                      onCheckedChange={(checked) => handleStandardSizeToggle(entry.key, Boolean(checked))}
                                    />
                                    <Label className="text-sm font-medium cursor-pointer">{entry.label}</Label>
                                    {isActive && (
                                      <span className="text-xs text-muted-foreground">(Order: {option.displayOrder ?? currentIndex + 1})</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isActive && (
                                <div className="ml-6 mt-2 space-y-3">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Image</Label>
                                    <div className="flex items-center gap-2">
                                      {(option.image || entry.image) ? (
                                        <div className="relative group">
                                          <img src={option.image || entry.image} alt={entry.label} className="h-16 w-16 rounded-lg object-cover border" />
                                          {option.image && (
                                            <button
                                              type="button"
                                              onClick={() => handleSizePriceChange(entry.key, "image", "")}
                                              className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                              aria-label="Remove image"
                                            >
                                              <X className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      ) : null}
                                      <div className="flex-1">
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          id={`size-image-${entry.key}`}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleSizeImageUpload(entry.key, file);
                                            e.target.value = "";
                                          }}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => document.getElementById(`size-image-${entry.key}`)?.click()}
                                          className="h-8 text-xs"
                                        >
                                          <ImagePlus className="mr-1 h-3 w-3" />
                                          {option.image ? "Change" : "Upload"} Image
                                        </Button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Upload an image for this size category (automatically optimized).
                                      <span className="font-medium text-amber-600 dark:text-amber-400">
                                        {" "}
                                        This image will be shared across all products using this size category.
                                      </span>
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Description</Label>
                                    <Input
                                      value={option.description ?? entry.description}
                                      onChange={(event) => handleSizePriceChange(entry.key, "description", event.target.value)}
                                      placeholder={entry.description}
                                      className="h-8 text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Customize the size description (e.g., "144 units (36 cases of 4 units)")
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Price ($)</Label>
                                    <Input
                                      value={option.price ?? ""}
                                      onChange={(event) => handleSizePriceChange(entry.key, "price", event.target.value)}
                                      placeholder="0.00"
                                      className="h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                        .filter((item): item is JSX.Element => item !== null)}
                    </div>
                  </details>

                  <details className="group mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
                      Custom sizes (
                      {
                        editForm.size_price_options.filter((option) => !SIZE_CATALOG.some((entry) => entry.key === option.key) && option.isActive)
                          .length
                      }{" "}
                      active)
                    </summary>
                    <div className="mt-3">
                      <div className="space-y-3">
                        {editForm.size_price_options
                          .filter((option) => !SIZE_CATALOG.some((entry) => entry.key === option.key))
                          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                          .map((option, index, array) => {
                            const activeCustomOptions = array.filter((opt) => opt.isActive);
                            const currentIndex = activeCustomOptions.findIndex((opt) => opt.key === option.key);
                            const canMoveUp = option.isActive && currentIndex > 0;
                            const canMoveDown = option.isActive && currentIndex < activeCustomOptions.length - 1;
                            return (
                              <Card key={option.key}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    {option.isActive && (
                                      <div className="flex flex-col gap-1 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => moveSizeOption(option.key, "up")}
                                          disabled={!canMoveUp}
                                          className="p-1 rounded hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                          aria-label="Move up"
                                        >
                                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveSizeOption(option.key, "down")}
                                          disabled={!canMoveDown}
                                          className="p-1 rounded hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                          aria-label="Move down"
                                        >
                                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        </button>
                                      </div>
                                    )}
                                    <div className="flex-1 space-y-3">
                                      <div className="grid gap-3 sm:grid-cols-3">
                                        <Input
                                          value={option.label}
                                          onChange={(event) =>
                                            handleCustomSizeChange(option.key, {
                                              label: event.target.value,
                                              price: option.price,
                                              description: option.description,
                                            })
                                          }
                                          placeholder="Size label"
                                        />
                                        <Input
                                          value={option.description ?? ""}
                                          onChange={(event) =>
                                            handleCustomSizeChange(option.key, {
                                              label: option.label,
                                              price: option.price,
                                              description: event.target.value,
                                            })
                                          }
                                          placeholder="Description (e.g., 144 units)"
                                        />
                                        <div className="flex items-center gap-2">
                                          <Input
                                            value={option.price}
                                            onChange={(event) =>
                                              handleCustomSizeChange(option.key, {
                                                label: option.label,
                                                price: event.target.value,
                                                description: option.description,
                                              })
                                            }
                                            placeholder="Price"
                                            className="flex-1"
                                          />
                                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveCustomSizeOption(option.key)}>
                                            Remove
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">Image</Label>
                                        <div className="flex items-center gap-2">
                                          {option.image ? (
                                            <div className="relative group">
                                              <img src={option.image} alt={option.label} className="h-16 w-16 rounded-lg object-cover border" />
                                              <button
                                                type="button"
                                                onClick={() => handleSizePriceChange(option.key, "image", "")}
                                                className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove image"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            </div>
                                          ) : null}
                                          <div className="flex-1">
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              id={`custom-size-image-${option.key}`}
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleSizeImageUpload(option.key, file);
                                                e.target.value = "";
                                              }}
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => document.getElementById(`custom-size-image-${option.key}`)?.click()}
                                              className="h-8 text-xs"
                                            >
                                              <ImagePlus className="mr-1 h-3 w-3" />
                                              {option.image ? "Change" : "Upload"} Image
                                            </Button>
                                          </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                          Upload an image for this size category (automatically optimized).
                                          <span className="font-medium text-amber-600 dark:text-amber-400">
                                            {" "}
                                            This image will be shared across all products using this size category.
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {option.isActive && (
                                    <p className="text-xs text-muted-foreground mt-2 ml-10">
                                      Display order: {option.displayOrder ?? currentIndex + 1}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Input
                          value={newCustomSize.label}
                          onChange={(event) => setNewCustomSize((prev) => ({ ...prev, label: event.target.value }))}
                          placeholder="New size label"
                        />
                        <Input
                          value={newCustomSize.description ?? ""}
                          onChange={(event) => setNewCustomSize((prev) => ({ ...prev, description: event.target.value }))}
                          placeholder="Description (e.g., 144 units)"
                        />
                        <Input
                          value={newCustomSize.price}
                          onChange={(event) => setNewCustomSize((prev) => ({ ...prev, price: event.target.value }))}
                          placeholder="Price"
                        />
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Button type="button" variant="outline" size="sm" onClick={handleAddCustomSizeOption}>
                          Add custom size
                        </Button>
                      </div>
                    </div>
                  </details>
                </SectionCard>

                <SectionCard
                  title={
                    <div className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      <span>Pay & Pickup</span>
                    </div>
                  }
                  description="Configure pickup availability and messaging for customers."
                >
                  <div className="flex items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">Enable Pay & Pickup</p>
                        <p className="text-xs text-muted-foreground">Allow customers to schedule pickup for this product.</p>
                      </div>
                    </div>
                    <Switch
                      checked={editForm.is_pay_and_pickup_enabled}
                      onCheckedChange={(checked) => setEditForm((prev) => (prev ? { ...prev, is_pay_and_pickup_enabled: checked } : prev))}
                    />
                  </div>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="paypickup-badge" className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        Badge/label
                      </Label>
                      <Input
                        id="paypickup-badge"
                        value={editForm.pay_and_pickup_badge}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, pay_and_pickup_badge: event.target.value } : prev))}
                        placeholder="Ready for pickup"
                        className="font-medium"
                      />
                      <p className="text-xs text-muted-foreground">Text shown on the product badge (e.g., "Pay & Pickup Ready").</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paypickup-description" className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        Pickup description
                      </Label>
                      <Textarea
                        id="paypickup-description"
                        rows={4}
                        value={editForm.pay_and_pickup_description}
                        onChange={(event) => setEditForm((prev) => (prev ? { ...prev, pay_and_pickup_description: event.target.value } : prev))}
                        placeholder="What customers should know about picking this up..."
                      />
                      <p className="text-xs text-muted-foreground">Detailed information shown to customers about pickup options and instructions.</p>
                    </div>

                    {/* Quantity Selection for Pay & Pickup */}
                    {editForm.is_pay_and_pickup_enabled && (
                      <div className="space-y-3 pt-4 border-t border-border/50">
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          Available Quantities for Pickup
                        </Label>
                        <p className="text-xs text-muted-foreground">Set inventory quantities for each size option available for pickup.</p>
                        <div className="space-y-2">
                          {editForm.size_price_options
                            .filter((option) => option.isActive)
                            .map((option) => {
                              const catalogEntry = SIZE_CATALOG.find((entry) => entry.key === option.key);
                              return (
                                <div key={option.key} className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{option.label}</p>
                                    {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
                                  </div>
                                  <div className="w-24">
                                    <Input
                                      value={option.inventoryQuantity ?? ""}
                                      onChange={(event) =>
                                        updateSizePriceOptions((options) =>
                                          options.map((opt) => (opt.key === option.key ? { ...opt, inventoryQuantity: event.target.value } : opt))
                                        )
                                      }
                                      placeholder="Qty"
                                      className="h-9 text-sm"
                                      type="number"
                                      min="0"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          {editForm.size_price_options.filter((option) => option.isActive).length === 0 && (
                            <p className="text-xs text-muted-foreground italic">
                              Enable size options in the "Sizes & Pricing" section above to set quantities here.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Catalog preview</CardTitle>
                    <CardDescription>Edit directly in the preview. Changes sync to the form.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="overflow-hidden rounded-xl border border-border/60">
                      {thumbnailForPreview ? (
                        <img src={thumbnailForPreview} alt="" className="h-48 w-full object-cover" />
                      ) : (
                        <div className="flex h-48 items-center justify-center bg-muted text-muted-foreground">No image</div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground mb-2">{editForm.category || "Category"}</p>
                        <Input
                          value={editForm.display_title}
                          onChange={(event) => handleDisplayTitleChange(event.target.value)}
                          placeholder="Product name"
                          className="text-lg font-semibold"
                        />
                      </div>
                      <div>
                        <Input
                          value={editForm.marketing_note}
                          onChange={(event) => setEditForm((prev) => (prev ? { ...prev, marketing_note: event.target.value } : prev))}
                          placeholder="Highlight line (appears below product name)"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Available sizes</Label>
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                        {editForm.size_price_options
                          .filter((option) => SIZE_CATALOG.some((entry) => entry.key === option.key))
                          .map((option) => {
                            const catalogEntry = SIZE_CATALOG.find((entry) => entry.key === option.key);
                            return (
                              <div key={option.key} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={option.isActive}
                                  onCheckedChange={(checked) => handleStandardSizeToggle(option.key, Boolean(checked))}
                                />
                                <Label className="text-sm font-normal cursor-pointer">{catalogEntry?.label || option.label}</Label>
                              </div>
                            );
                          })}
                        {editForm.size_price_options
                          .filter((option) => !SIZE_CATALOG.some((entry) => entry.key === option.key))
                          .map((option) => (
                            <div key={option.key} className="flex items-center space-x-2">
                              <Checkbox
                                checked={option.isActive}
                                onCheckedChange={(checked) =>
                                  updateSizePriceOptions((options) =>
                                    options.map((opt) => (opt.key === option.key ? { ...opt, isActive: checked === true } : opt))
                                  )
                                }
                              />
                              <Label className="text-sm font-normal cursor-pointer">{option.label}</Label>
                            </div>
                          ))}
                      </div>
                      {editForm.available_size_options.length === 0 && <p className="text-xs text-muted-foreground">No sizes selected</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pay & Pickup preview</CardTitle>
                    <CardDescription>Shows the badge, hero, and CTA copy.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{payPickupStatusLabel}</span>
                    </div>
                    {editForm.pay_and_pickup_badge && <Badge variant="outline">{editForm.pay_and_pickup_badge}</Badge>}
                    <p className="text-sm text-muted-foreground">{editForm.pay_and_pickup_description || "Add pickup instructions."}</p>
                    <div className="space-y-1">
                      {payPickupPreviewSizes.map((size) => (
                        <div key={size} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                          {size}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          <AlertDialog open={pendingSlugChange !== null} onOpenChange={(open) => !open && cancelSlugChange()}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change Product URL?</AlertDialogTitle>
                <AlertDialogDescription>
                  Changing the product URL will break any existing links to this product. This includes:
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    <li>Bookmarked pages</li>
                    <li>Shared links</li>
                    <li>Search engine results</li>
                    <li>External references</li>
                  </ul>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Current URL:</p>
                    <code className="text-xs">/products/{pendingSlugChange?.oldSlug || "current-slug"}</code>
                    <p className="text-sm font-medium mt-2">New URL:</p>
                    <code className="text-xs">/products/{pendingSlugChange?.newSlug || "new-slug"}</code>
                  </div>
                  <p className="mt-4 font-medium">Are you sure you want to change the URL?</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={cancelSlugChange}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmSlugChange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, change URL
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Spacer to prevent content from being hidden behind sticky button (py-3 + button height ≈ 68px) */}
          <div className="h-[68px]" aria-hidden="true" style={{ marginBottom: 0, paddingBottom: 0 }} />
        </form>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
