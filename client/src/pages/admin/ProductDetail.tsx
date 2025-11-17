import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import { useLocation, useRoute } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  Loader2,
  Package,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SIZE_CATALOG, SIZE_CATALOG_BY_KEY } from '@/data/sizeCatalog';
import {
  PRODUCT_IMAGE_FOLDER,
  Product,
  EditFormData,
  SizePriceOptionFormValue,
  createEmptyEditForm,
  buildEditForm,
  formatPrice,
  getPrimaryImage,
} from './product-utils';

const parseProductId = (param?: string | number | null) => {
  if (param === undefined || param === null) return NaN;
  const numeric = Number(param);
  return Number.isFinite(numeric) ? numeric : NaN;
};

type SectionCardProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const SectionCard = ({ title, description, actions, children }: SectionCardProps) => (
  <div className="space-y-4 rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

export default function AdminProductDetail() {
  const [, params] = useRoute('/admin/products/:productId');
  const [, navigate] = useLocation();
  const productId = parseProductId(params?.productId ?? null);
  const isValidProductId = Number.isInteger(productId) && productId > 0;
  const isCreatingNew = params?.productId === 'new';

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [editForm, setEditForm] = useState<EditFormData | null>(isCreatingNew ? createEmptyEditForm() : null);
  const [heroUpload, setHeroUpload] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [galleryUploads, setGalleryUploads] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [newCustomSize, setNewCustomSize] = useState<{ label: string; price: string; quantity: string }>({
    label: '',
    price: '',
    quantity: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch product data (restored for new system)
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery<Product>({
    queryKey: ['adminProduct', productId],
    enabled: isValidProductId,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load product');
      }

      return response.json();
    },
  });

  const resetHeroPreview = () => {
    setHeroPreview((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
  };

  const resetGalleryPreviews = () => {
    setGalleryPreviews((previous) => {
      previous.forEach((preview) => URL.revokeObjectURL(preview));
      return [];
    });
  };

  useEffect(() => {
    if (product) {
      setEditForm(buildEditForm(product));
      setHeroUpload(null);
      resetHeroPreview();
      setGalleryUploads([]);
      resetGalleryPreviews();
      setNewCustomSize({ label: '', price: '', quantity: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    return () => {
      resetHeroPreview();
      resetGalleryPreviews();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadImage = async (file: File, folder: string) => {
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const response = await fetch('/api/admin/uploads/product-image', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.url as string;
  };

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId: id, data }: { productId: number; data: Record<string, unknown> }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update product');
      }

      return response.json() as Promise<Product>;
    },
    onSuccess: (updatedProduct) => {
      toast({
        title: 'Product updated',
        description: `${updatedProduct.display_title || updatedProduct.name} has been saved.`,
      });

      setEditForm(buildEditForm(updatedProduct));
      setHeroUpload(null);
      resetHeroPreview();
      setGalleryUploads([]);
      resetGalleryPreviews();

      queryClient.setQueryData<Product>(['adminProduct', updatedProduct.id], updatedProduct);
      queryClient.setQueryData<Product[]>(['adminProducts'], (existing) =>
        existing?.map((item) => (item.id === updatedProduct.id ? updatedProduct : item)) ?? []
      );
    },
    onError: () => {
      toast({
        title: 'Save failed',
        description: 'We could not save your changes. Please review the fields and try again.',
        variant: 'destructive',
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      return response.json() as Promise<Product>;
    },
    onSuccess: (newProduct) => {
      toast({
        title: 'Product created',
        description: `${newProduct.display_title || newProduct.name} is now available to manage.`,
      });

      setEditForm(buildEditForm(newProduct));
      queryClient.setQueryData<Product>(['adminProduct', newProduct.id], newProduct);
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      navigate(`/admin/products/${newProduct.id}`);
    },
    onError: () => {
      toast({
        title: 'Create failed',
        description: 'We could not create this product. Please review the fields and try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Product deleted',
        description: 'The product has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      navigate('/admin/products');
    },
    onError: () => {
      toast({
        title: 'Delete failed',
        description: 'We could not delete this product. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleHeroInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    const [file] = event.target.files ?? [];
    if (!file) return;
    setHeroUpload(file);
    const preview = URL.createObjectURL(file);
    setHeroPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return preview;
    });
    event.target.value = '';
  };

  const handleHeroDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!editForm) return;
    const [file] = Array.from(event.dataTransfer.files).filter((item) => item.type.startsWith('image/'));
    if (!file) return;
    setHeroUpload(file);
    const preview = URL.createObjectURL(file);
    setHeroPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return preview;
    });
  };

  const handleGalleryInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;
    setGalleryUploads((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...previews]);
    event.target.value = '';
  };

  const handleGalleryDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) return;
    setGalleryUploads((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingGalleryImage = (image: string) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            additional_images: prev.additional_images.filter((item) => item !== image),
          }
        : prev
    );
  };

  const handleRemoveNewGalleryImage = (index: number) => {
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

  const handleStatusChange = (status: 'active' | 'draft') => {
    setEditForm((prev) => {
      if (!prev) return prev;
      if (prev.product_status === status) {
        if (status === 'draft' && prev.is_catalog_enabled) {
          return { ...prev, is_catalog_enabled: false };
        }
        if (status === 'active' && !prev.is_catalog_enabled) {
          return { ...prev, is_catalog_enabled: true };
        }
        return prev;
      }

      const next: EditFormData = {
        ...prev,
        product_status: status,
      };

      if (status === 'draft') {
        next.is_catalog_enabled = false;
      } else if (!prev.is_catalog_enabled) {
        next.is_catalog_enabled = true;
      }

      return next;
    });
  };

  const syncAvailableSizeOptions = (options: SizePriceOptionFormValue[]) =>
    Array.from(
      new Set(
        options
          .filter((option) => option.isActive && option.label.trim().length > 0)
          .map((option) => option.label.trim()),
      ),
    );

  const updateSizePriceOptions = (
    updater: (options: SizePriceOptionFormValue[]) => SizePriceOptionFormValue[],
  ) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const currentOptions = prev.size_price_options ?? [];
      const nextOptions = updater([...currentOptions]);
      const totalInventory = nextOptions
        .filter((option) => option.isActive)
        .reduce((sum, option) => {
          const normalized = option.inventoryQuantity?.trim() ?? '';
          if (!normalized) {
            return sum;
          }
          const parsed = Number.parseInt(normalized, 10);
          if (!Number.isFinite(parsed)) {
            return sum;
          }
          return sum + Math.max(0, parsed);
        }, 0);
      return {
        ...prev,
        size_price_options: nextOptions,
        available_size_options: syncAvailableSizeOptions(nextOptions),
        stock_quantity: String(totalInventory),
      };
    });
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const getCatalogEntry = (key: string) => {
    const catalogKey = key as keyof typeof SIZE_CATALOG_BY_KEY;
    return Object.prototype.hasOwnProperty.call(SIZE_CATALOG_BY_KEY, catalogKey)
      ? SIZE_CATALOG_BY_KEY[catalogKey]
      : undefined;
  };

  const handleStandardSizeToggle = (key: string, isActive: boolean) => {
    updateSizePriceOptions((options) =>
      options.map((option) => (option.key === key ? { ...option, isActive } : option)),
    );
  };

  const handleStandardPriceChange = (key: string, price: string) => {
    updateSizePriceOptions((options) =>
      options.map((option) => (option.key === key ? { ...option, price } : option)),
    );
  };

  const handleStandardInventoryChange = (key: string, quantity: string) => {
    updateSizePriceOptions((options) =>
      options.map((option) =>
        option.key === key ? { ...option, inventoryQuantity: quantity } : option,
      ),
    );
  };

  const handleCustomOptionChange = (
    key: string,
    updates: Partial<
      Pick<SizePriceOptionFormValue, 'label' | 'price' | 'isActive' | 'inventoryQuantity'>
    >,
  ) => {
    updateSizePriceOptions((options) =>
      options.map((option) => (option.key === key ? { ...option, ...updates } : option)),
    );
  };

  const handleRemoveCustomSizeOption = (key: string) => {
    updateSizePriceOptions((options) => options.filter((option) => option.key !== key));
  };

  const handleAddCustomSizeOption = () => {
    const label = newCustomSize.label.trim();
    const price = newCustomSize.price.trim();
    const quantity = newCustomSize.quantity.trim();

    if (!label) return;

    updateSizePriceOptions((options) => {
      const normalizedLabel = label;
      const normalizedLabelLower = normalizedLabel.toLowerCase();
      const existingIndex = options.findIndex(
        (option) =>
          option.label.toLowerCase() === normalizedLabelLower ||
          option.key === slugify(normalizedLabel),
      );

      if (existingIndex >= 0) {
        const next = [...options];
        next[existingIndex] = {
          ...next[existingIndex],
          label: normalizedLabel,
          price,
          isActive: true,
          inventoryQuantity: quantity,
        };
        return next;
      }

      const baseSlug = slugify(normalizedLabel);
      const standardKeys = new Set(SIZE_CATALOG.map((entry) => entry.key));
      let keyCandidate =
        (baseSlug && !standardKeys.has(baseSlug) ? baseSlug : `custom-${baseSlug || 'size'}`) ||
        `custom-size-${Date.now()}`;

      let suffix = 1;
      while (options.some((option) => option.key === keyCandidate)) {
        keyCandidate = `${baseSlug || 'custom-size'}-${suffix++}`;
      }

      return [
        ...options,
        {
          key: keyCandidate,
          label: normalizedLabel,
          price,
          isActive: true,
          inventoryQuantity: quantity,
        },
      ];
    });

    setNewCustomSize({ label: '', price: '', quantity: '' });
  };

  const handleSaveChanges = async () => {
    if (!editForm || (!isValidProductId && !isCreatingNew)) return;

    setIsSaving(true);

    try {
      const displayOrderInput = editForm.pay_and_pickup_display_order.trim();
      let parsedDisplayOrder: number | null = null;
      const catalogOrderInput = editForm.catalog_display_order.trim();
      let parsedCatalogOrder: number | null = null;

      if (displayOrderInput.length > 0) {
        const candidate = Number.parseInt(displayOrderInput, 10);
        if (Number.isNaN(candidate) || candidate < 0) {
          toast({
            title: 'Invalid display order',
            description: 'Enter a whole number zero or greater to control the product order.',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
        parsedDisplayOrder = candidate;
      }

      if (parsedDisplayOrder !== null && !Number.isInteger(parsedDisplayOrder)) {
        toast({
          title: 'Invalid display order',
          description: 'Enter a whole number zero or greater to control the product order.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      if (catalogOrderInput.length > 0) {
        const candidate = Number.parseInt(catalogOrderInput, 10);
        if (Number.isNaN(candidate) || candidate < 0) {
          toast({
            title: 'Invalid catalog order',
            description: 'Enter a whole number zero or greater to control the catalog product ordering.',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
        parsedCatalogOrder = candidate;
      }

      if (parsedCatalogOrder !== null && !Number.isInteger(parsedCatalogOrder)) {
        toast({
          title: 'Invalid catalog order',
          description: 'Enter a whole number zero or greater to control the catalog product ordering.',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      const uploadFolder = isValidProductId ? `${PRODUCT_IMAGE_FOLDER}/${productId}` : PRODUCT_IMAGE_FOLDER;
      let heroImageUrl = editForm.pay_and_pickup_hero_image;
      if (heroUpload) {
        heroImageUrl = await uploadImage(heroUpload, uploadFolder);
      }

      let galleryImages = [...editForm.additional_images];
      if (galleryUploads.length > 0) {
        const newGalleryUrls = await Promise.all(
          galleryUploads.map((file, index) =>
            uploadImage(file, `${uploadFolder}/gallery-${index + 1}`)
          )
        );
        galleryImages = [...galleryImages, ...newGalleryUrls];
      }

      const parsedPrice = parseFloat(editForm.price.replace(/[^0-9.]/g, ''));
      const priceInCents = Number.isFinite(parsedPrice) ? Math.round(parsedPrice * 100) : null;

      const priceStringToCents = (value: string): number | null => {
        if (!value) return null;
        const cleaned = value.replace(/[^0-9.]/g, '');
        if (!cleaned) return null;
        const parsed = Number.parseFloat(cleaned);
        if (!Number.isFinite(parsed)) return null;
        return Math.round(parsed * 100);
      };

      const parseInventoryQuantity = (value: string): number | null => {
        if (typeof value !== 'string') return null;
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

      const supportsSizePriceOptions = product
        ? Object.prototype.hasOwnProperty.call(product, 'size_price_options')
        : true;

      const sizePriceOptionsPayload = editForm.size_price_options
        .filter((option) => option.label.trim().length > 0)
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
            display_order: index,
          };
        });

      const availableSizeOptions = Array.from(
        new Set(
          sizePriceOptionsPayload
            .filter((option) => option.is_active)
            .map((option) => option.label),
        ),
      );

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
            entry,
          ): entry is {
            size_option: string;
            quantity_available: number;
          } => Boolean(entry),
        );

      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        display_title: editForm.display_title.trim() || null,
        category: editForm.category.trim() || null,
        marketing_title: editForm.marketing_title.trim() || null,
        marketing_note: editForm.marketing_note.trim() || null,
        seo_keywords: editForm.seo_keywords.trim() || null,
        description: editForm.description.trim() || null,
        ingredients: editForm.ingredients.trim() || null,
        target_audience: editForm.target_audience.trim() || null,
        recommended_uses: editForm.recommended_uses.trim() || null,
        features: editForm.features.trim() || null,
        story: editForm.story.trim() || null,
        usage: editForm.usage.trim() || null,
        product_status: editForm.product_status || 'draft',
        catalog_display_order: parsedCatalogOrder ?? 0,
        pay_and_pickup_display_order: parsedDisplayOrder ?? 0,
        price: priceInCents,
        stock_quantity: (() => {
          const cleaned = editForm.stock_quantity.trim();
          if (!cleaned) return null;
          const parsed = Number.parseInt(cleaned, 10);
          return Number.isFinite(parsed) ? parsed : null;
        })(),
        is_catalog_enabled: editForm.is_catalog_enabled,
        is_pay_and_pickup_enabled: editForm.is_pay_and_pickup_enabled,
        pay_and_pickup_description: editForm.pay_and_pickup_description.trim() || null,
        pay_and_pickup_badge: editForm.pay_and_pickup_badge.trim() || null,
        pay_and_pickup_hero_image: heroImageUrl || null,
        texture_photo_url:
          editForm.texture_photo_url.trim() || heroImageUrl || editForm.image_url || null,
        image_url: editForm.image_url.trim() || heroImageUrl || null,
        additional_images: galleryImages,
        available_size_options: availableSizeOptions,
        product_video_url: editForm.product_video_url.trim() || null,
        product_video_title: editForm.product_video_title.trim() || null,
      };

      if (product && Object.prototype.hasOwnProperty.call(product, 'sku')) {
        payload.sku = editForm.sku.trim() || null;
      }

      if (supportsSizePriceOptions) {
        payload.size_price_options = sizePriceOptionsPayload;
      }

      if (inventoryUpdatesPayload.length > 0) {
        payload.inventory_updates = inventoryUpdatesPayload;
        const totalInventory = inventoryUpdatesPayload.reduce(
          (sum, entry) => sum + entry.quantity_available,
          0,
        );
        payload.stock_quantity = totalInventory;
      }

      if (isCreatingNew) {
        await createProductMutation.mutateAsync(payload);
      } else {
        await updateProductMutation.mutateAsync({ productId, data: payload });
      }
    } catch (mutationError) {
      console.error(mutationError);
    } finally {
      setIsSaving(false);
    }
  };

  const heroImageForPreview = useMemo(() => {
    if (heroPreview) return heroPreview;
    if (!editForm) return product ? getPrimaryImage(product) : '';
    return (
      editForm.pay_and_pickup_hero_image ||
      editForm.texture_photo_url ||
      editForm.image_url ||
      (product ? getPrimaryImage(product) : '')
    );
  }, [editForm, heroPreview, product]);

  const resolvedProductName =
    (editForm?.display_title ||
      editForm?.name ||
      product?.display_title ||
      product?.name ||
      'New product'
    ).trim();
  const normalizedStatus = (editForm?.product_status || 'draft').toLowerCase();
  const statusLabel = normalizedStatus === 'draft' ? 'Draft' : 'Active';
  const isProcessingSave =
    isSaving || updateProductMutation.isPending || createProductMutation.isPending;
  const canDeleteProduct = !isCreatingNew && Boolean(productId) && Boolean(product);
  const fallbackPrimaryImage = product ? getPrimaryImage(product) : '';
  const quickReferencePrice = editForm?.price?.trim()
    ? `$${editForm.price.trim()}`
    : product?.price
      ? `$${formatPrice(product.price)}`
      : 'Not set';
  const parsedStockValue = Number.parseInt(editForm?.stock_quantity ?? '', 10);
  const quickReferenceStock = Number.isFinite(parsedStockValue)
    ? parsedStockValue
    : typeof product?.stock_quantity === 'number'
      ? product.stock_quantity
      : 0;
  const quickReferenceImage =
    editForm?.pay_and_pickup_hero_image ||
    editForm?.image_url ||
    fallbackPrimaryImage ||
    'Not set';

  const catalogPreviewImage =
    editForm?.texture_photo_url?.trim() ||
    editForm?.image_url?.trim() ||
    (typeof quickReferenceImage === 'string' ? quickReferenceImage : '') ||
    fallbackPrimaryImage ||
    '';
  const catalogPreviewDescription =
    editForm?.marketing_note?.trim() ||
    editForm?.marketing_title?.trim() ||
    editForm?.description?.trim() ||
    product?.marketing_note ||
    product?.description ||
    '';
  const catalogPreviewCategory = editForm?.category?.trim() || product?.category || 'Uncategorized';

  const payPickupPreviewImage =
    editForm?.pay_and_pickup_hero_image?.trim() ||
    heroImageForPreview ||
    catalogPreviewImage ||
    fallbackPrimaryImage ||
    '';
  const payPickupPreviewDescription =
    editForm?.pay_and_pickup_description?.trim() ||
    catalogPreviewDescription ||
    '';
  const payPickupPreviewBadge = editForm?.pay_and_pickup_badge?.trim() || '';
  const payPickupPreviewSizes = (() => {
    if (editForm?.available_size_options?.length) {
      return editForm.available_size_options;
    }
    const fallbackSizes =
      editForm?.size_price_options
        ?.filter((option) => option.isActive && option.label.trim().length > 0)
        .map((option) => option.label.trim()) ?? [];
    return fallbackSizes.length > 0 ? fallbackSizes : ['Custom size'];
  })();

  if (!isCreatingNew && !isValidProductId) {
    return (
      <ProtectedAdminRoute>
        <AdminLayout>
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <AlertCircle className="h-6 w-6" />
            <p>We couldn&apos;t determine which product you want to manage.</p>
            <Button variant="outline" onClick={() => navigate('/admin/products')}>
              Back to products
            </Button>
          </div>
        </AdminLayout>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* Professional Header */}
          <div className="bg-white border-b sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/products')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Products
                  </Button>
                  <div className="h-4 w-px bg-border" />
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      {resolvedProductName}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isCreatingNew ? 'Create a new product' : 'Edit product details'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canDeleteProduct && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => productId && deleteMutation.mutate(productId)}
                      disabled={deleteMutation.isPending || isProcessingSave}
                      className="text-destructive hover:text-destructive"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={!editForm || isProcessingSave}
                    className="min-w-[120px]"
                  >
                    {isProcessingSave ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isCreatingNew ? 'Creating...' : 'Saving...'}
                      </>
                    ) : (
                      (isCreatingNew ? 'Create product' : 'Save changes')
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-6 py-6">
            {!isCreatingNew && isLoading ? (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <Skeleton className="h-96 rounded-lg" />
                  <Skeleton className="h-64 rounded-lg" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-48 rounded-lg" />
                  <Skeleton className="h-64 rounded-lg" />
                </div>
              </div>
            ) : (!isCreatingNew && (isError || !product || !editForm)) ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Unable to load product</h3>
                  <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                    {error instanceof Error ? error.message : 'Please try again or contact support.'}
                  </p>
                  <Button variant="outline" onClick={() => navigate('/admin/products')}>
                    Back to products
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content - Left 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                  {/* SECTION 1: BASIC INFORMATION */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                        Basic Information
                      </CardTitle>
                      <CardDescription>Essential product details and identification</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="product-name" className="text-sm font-medium">Product Name *</Label>
                          <Input
                            id="product-name"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm({ ...editForm, name: event.target.value })
                            }
                            placeholder="e.g. Artemis Root Boost Blend"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="display-title" className="text-sm font-medium">Display Title</Label>
                          <Input
                            id="display-title"
                            value={editForm.display_title}
                            onChange={(event) =>
                              setEditForm({ ...editForm, display_title: event.target.value })
                            }
                            placeholder="Customer-facing title"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="product-description" className="text-sm font-medium">Description</Label>
                        <Textarea
                          id="product-description"
                          value={editForm.description || ''}
                          onChange={(event) =>
                            setEditForm({ ...editForm, description: event.target.value })
                          }
                          rows={4}
                          placeholder="Detailed product description..."
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-right">
                          {(editForm.description || '').length} characters
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                          <Input
                            id="category"
                            value={editForm.category}
                            onChange={(event) =>
                              setEditForm({ ...editForm, category: event.target.value })
                            }
                            placeholder="e.g. Amendment"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                          <Input
                            id="sku"
                            value={editForm.sku}
                            onChange={(event) =>
                              setEditForm({ ...editForm, sku: event.target.value })
                            }
                            placeholder="Product SKU"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price" className="text-sm font-medium">Base Price (USD)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={(event) =>
                              setEditForm({ ...editForm, price: event.target.value })
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SECTION 2: IMAGES */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                        Images
                      </CardTitle>
                      <CardDescription>Product photos and gallery images</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Hero Image */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Hero Image</Label>
                        <div
                          className="relative group aspect-[16/10] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={handleHeroDrop}
                          onClick={() => heroInputRef.current?.click()}
                        >
                          {heroImageForPreview ? (
                            <>
                              <img 
                                src={heroImageForPreview} 
                                alt={resolvedProductName} 
                                className="h-full w-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white/95 shadow-lg"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      heroInputRef.current?.click();
                                    }}
                                  >
                                    <UploadCloud className="mr-2 h-4 w-4" />
                                    Replace Image
                                  </Button>
                                </div>
                              </div>
                              {(heroUpload || editForm.pay_and_pickup_hero_image) && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHeroUpload(null);
                                    resetHeroPreview();
                                    setEditForm({
                                      ...editForm,
                                      pay_and_pickup_hero_image: '',
                                    });
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-gray-300">
                                <ImagePlus className="h-6 w-6" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">Click or drag to upload</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  1600×1200 recommended · JPG, PNG, or WEBP
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          ref={heroInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleHeroInputChange}
                        />
                      </div>

                      {/* Gallery Images */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Gallery Images</Label>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => galleryInputRef.current?.click()}
                          >
                            <ImagePlus className="mr-2 h-4 w-4" />
                            Add Images
                          </Button>
                        </div>
                        <input
                          ref={galleryInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleGalleryInputChange}
                        />
                        <div
                          className="grid grid-cols-2 md:grid-cols-3 gap-3"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={handleGalleryDrop}
                        >
                          {editForm.additional_images.length === 0 && galleryPreviews.length === 0 ? (
                            <div className="col-span-full flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-center text-sm text-muted-foreground">
                              <ImagePlus className="h-6 w-6" />
                              <span>Drag images here or click "Add Images"</span>
                            </div>
                          ) : (
                            <>
                              {editForm.additional_images.map((image) => (
                                <div
                                  key={image}
                                  className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white"
                                >
                                  <img src={image} alt="" className="h-full w-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRemoveExistingGalleryImage(image);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              {galleryPreviews.map((preview, index) => (
                                <div
                                  key={`${preview}-${index}`}
                                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-primary/40 bg-white"
                                >
                                  <img src={preview} alt="" className="h-full w-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleRemoveNewGalleryImage(index);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Texture Photo URL */}
                      <div className="space-y-2">
                        <Label htmlFor="texture-photo" className="text-sm font-medium">Texture Photo URL</Label>
                        <Input
                          id="texture-photo"
                          value={editForm.texture_photo_url}
                          onChange={(event) =>
                            setEditForm({ ...editForm, texture_photo_url: event.target.value })
                          }
                          placeholder="/images/textures/..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* SECTION 3: CATALOG SETTINGS */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                        Catalog Settings
                      </CardTitle>
                      <CardDescription>Control visibility and ordering in the public Products catalog</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">Show in Catalog</Label>
                            <Badge variant={editForm.is_catalog_enabled ? 'default' : 'secondary'}>
                              {editForm.is_catalog_enabled ? 'Visible' : 'Hidden'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Show this product on the public Products page
                          </p>
                        </div>
                        <Switch
                          checked={editForm.is_catalog_enabled}
                          onCheckedChange={(value) =>
                            setEditForm({ ...editForm, is_catalog_enabled: value })
                          }
                        />
                      </div>
                      {editForm.is_catalog_enabled && (
                        <div className="space-y-2">
                          <Label htmlFor="catalog-order" className="text-sm font-medium">Display Order</Label>
                          <Input
                            id="catalog-order"
                            type="number"
                            min={0}
                            value={editForm.catalog_display_order}
                            onChange={(event) =>
                              setEditForm({ ...editForm, catalog_display_order: event.target.value })
                            }
                            placeholder="0"
                            className="max-w-32"
                          />
                          <p className="text-xs text-muted-foreground">Lower numbers appear first in the catalog</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* SECTION 4: PAY & PICKUP */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">4</span>
                        Pay & Pickup
                      </CardTitle>
                      <CardDescription>Settings for local pickup ordering</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">Enable Pay & Pickup</Label>
                            <Badge variant={editForm.is_pay_and_pickup_enabled ? 'default' : 'secondary'}>
                              {editForm.is_pay_and_pickup_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Make this product available for local pickup ordering
                          </p>
                        </div>
                        <Switch
                          checked={editForm.is_pay_and_pickup_enabled}
                          onCheckedChange={(value) =>
                            setEditForm({ ...editForm, is_pay_and_pickup_enabled: value })
                          }
                        />
                      </div>
                      {editForm.is_pay_and_pickup_enabled && (
                        <div className="space-y-4 border-t pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="pay-pickup-order" className="text-sm font-medium">Display Order</Label>
                            <Input
                              id="pay-pickup-order"
                              type="number"
                              min={0}
                              value={editForm.pay_and_pickup_display_order}
                              onChange={(event) =>
                                setEditForm({ ...editForm, pay_and_pickup_display_order: event.target.value })
                              }
                              placeholder="0"
                              className="max-w-32"
                            />
                            <p className="text-xs text-muted-foreground">Lower numbers appear first in Pay & Pickup</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pay-pickup-badge" className="text-sm font-medium">Badge Text</Label>
                            <Input
                              id="pay-pickup-badge"
                              value={editForm.pay_and_pickup_badge}
                              maxLength={60}
                              onChange={(event) =>
                                setEditForm({ ...editForm, pay_and_pickup_badge: event.target.value })
                              }
                              placeholder="e.g., Phoenix Pickup • 24hr Turnaround"
                            />
                            <p className="text-xs text-muted-foreground">
                              Short label displayed above the hero image on Pay & Pickup page
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pay-pickup-description" className="text-sm font-medium">Description</Label>
                            <Textarea
                              id="pay-pickup-description"
                              rows={4}
                              value={editForm.pay_and_pickup_description}
                              onChange={(event) =>
                                setEditForm({ ...editForm, pay_and_pickup_description: event.target.value })
                              }
                              placeholder="Highlight pickup-ready details..."
                              className="resize-none"
                            />
                            <p className="text-xs text-muted-foreground text-right">
                              {editForm.pay_and_pickup_description.length} characters
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pay-pickup-hero-image" className="text-sm font-medium">Hero Image URL</Label>
                            <Input
                              id="pay-pickup-hero-image"
                              value={editForm.pay_and_pickup_hero_image}
                              onChange={(event) =>
                                setEditForm({ ...editForm, pay_and_pickup_hero_image: event.target.value })
                              }
                              placeholder="/images/products/..."
                            />
                            <p className="text-xs text-muted-foreground">
                              Optional: Specific image for Pay & Pickup page (uses hero image if not set)
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* SECTION 5: SIZES & PRICING */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">5</span>
                        Sizes & Pricing
                      </CardTitle>
                      <CardDescription>
                        Configure size options, prices, and inventory
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {SIZE_CATALOG.map((entry) => {
                          const option =
                            editForm.size_price_options.find((item) => item.key === entry.key) ?? {
                              key: entry.key,
                              label: entry.label,
                              price: '',
                              isActive: false,
                              image: entry.image,
                            };
                          const priceInputId = `size-price-${entry.key}`;

                          return (
                            <div
                              key={entry.key}
                              className={`rounded-lg border p-4 transition ${
                                option.isActive ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium">{entry.label}</p>
                                    <Switch
                                      checked={Boolean(option.isActive)}
                                      onCheckedChange={(value) => handleStandardSizeToggle(entry.key, value)}
                                      className="scale-90"
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">{entry.description}</p>
                                </div>
                              </div>
                              {option.isActive && (
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="space-y-1.5">
                                    <Label htmlFor={priceInputId} className="text-xs">Price (USD)</Label>
                                    <Input
                                      id={priceInputId}
                                      placeholder="0.00"
                                      value={option.price}
                                      onChange={(event) =>
                                        handleStandardPriceChange(entry.key, event.target.value)
                                      }
                                      className="h-9"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label className="text-xs">Available Units</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      placeholder="0"
                                      value={option.inventoryQuantity}
                                      onChange={(event) =>
                                        handleStandardInventoryChange(entry.key, event.target.value)
                                      }
                                      className="h-9"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Custom Sizes</p>
                          <span className="text-xs text-muted-foreground">
                            {editForm.size_price_options.filter(o => !SIZE_CATALOG.some(e => e.key === o.key) && o.isActive).length} active
                          </span>
                        </div>
                        
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {editForm.size_price_options
                            .filter((option) => !SIZE_CATALOG.some((entry) => entry.key === option.key))
                            .map((option) => (
                              <div
                                key={option.key}
                                className="rounded-lg border border-gray-200 bg-white p-3 space-y-2"
                              >
                                <Input
                                  value={option.label}
                                  onChange={(event) =>
                                    handleCustomOptionChange(option.key, { label: event.target.value })
                                  }
                                  placeholder="Size label"
                                  className="h-9"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={option.price}
                                    onChange={(event) =>
                                      handleCustomOptionChange(option.key, { price: event.target.value })
                                    }
                                    placeholder="Price"
                                    className="h-9"
                                  />
                                  <Input
                                    type="number"
                                    min="0"
                                    value={option.inventoryQuantity}
                                    onChange={(event) =>
                                      handleCustomOptionChange(option.key, {
                                        inventoryQuantity: event.target.value,
                                      })
                                    }
                                    placeholder="Units"
                                    className="h-9"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={Boolean(option.isActive)}
                                      onCheckedChange={(value) =>
                                        handleCustomOptionChange(option.key, { isActive: value })
                                      }
                                      className="scale-90"
                                    />
                                    <span className="text-xs text-muted-foreground">Active</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleRemoveCustomSizeOption(option.key)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-[1fr_100px_100px_auto] gap-2 pt-2 border-t">
                          <Input
                            value={newCustomSize.label}
                            onChange={(event) =>
                              setNewCustomSize((prev) => ({ ...prev, label: event.target.value }))
                            }
                            placeholder="Size label"
                            className="h-9"
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                handleAddCustomSizeOption();
                              }
                            }}
                          />
                          <Input
                            value={newCustomSize.price}
                            onChange={(event) =>
                              setNewCustomSize((prev) => ({ ...prev, price: event.target.value }))
                            }
                            placeholder="Price"
                            className="h-9"
                          />
                          <Input
                            value={newCustomSize.quantity}
                            onChange={(event) =>
                              setNewCustomSize((prev) => ({ ...prev, quantity: event.target.value }))
                            }
                            placeholder="Units"
                            inputMode="numeric"
                            className="h-9"
                          />
                          <Button
                            type="button"
                            onClick={handleAddCustomSizeOption}
                            size="sm"
                            className="h-9"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* SECTION 6: ADDITIONAL INFO */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">6</span>
                        Additional Information
                      </CardTitle>
                      <CardDescription>Optional content for product detail pages</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="features" className="text-sm font-medium">Features</Label>
                        <Textarea
                          id="features"
                          value={editForm.features || ''}
                          onChange={(event) =>
                            setEditForm({ ...editForm, features: event.target.value })
                          }
                          rows={3}
                          placeholder="List key features (separate with | or commas)..."
                          className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">Separate multiple features with | or commas</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="usage" className="text-sm font-medium">Usage Instructions</Label>
                        <Textarea
                          id="usage"
                          value={editForm.usage || ''}
                          onChange={(event) =>
                            setEditForm({ ...editForm, usage: event.target.value })
                          }
                          rows={3}
                          placeholder="How to use this product..."
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="story" className="text-sm font-medium">Product Story</Label>
                        <Textarea
                          id="story"
                          value={editForm.story || ''}
                          onChange={(event) =>
                            setEditForm({ ...editForm, story: event.target.value })
                          }
                          rows={3}
                          placeholder="Origin story or agronomic insight..."
                          className="resize-none"
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="ingredients" className="text-sm font-medium">Ingredients</Label>
                          <Textarea
                            id="ingredients"
                            value={editForm.ingredients || ''}
                            onChange={(event) =>
                              setEditForm({ ...editForm, ingredients: event.target.value })
                            }
                            rows={2}
                            placeholder="List ingredients (separate with | or commas)..."
                            className="resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="target-audience" className="text-sm font-medium">Target Audience</Label>
                          <Textarea
                            id="target-audience"
                            value={editForm.target_audience || ''}
                            onChange={(event) =>
                              setEditForm({ ...editForm, target_audience: event.target.value })
                            }
                            rows={2}
                            placeholder="Who this is for (separate with | or commas)..."
                            className="resize-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recommended-uses" className="text-sm font-medium">Recommended Uses</Label>
                        <Textarea
                          id="recommended-uses"
                          value={editForm.recommended_uses || ''}
                          onChange={(event) =>
                            setEditForm({ ...editForm, recommended_uses: event.target.value })
                          }
                          rows={2}
                          placeholder="Use cases (separate with | or commas)..."
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* SECTION 7: MEDIA */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">7</span>
                        Media
                      </CardTitle>
                      <CardDescription>Video and image URLs</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="product-video-url" className="text-sm font-medium">Video URL</Label>
                        <Input
                          id="product-video-url"
                          value={editForm.product_video_url}
                          onChange={(event) =>
                            setEditForm({ ...editForm, product_video_url: event.target.value })
                          }
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-video-title" className="text-sm font-medium">Video Title</Label>
                        <Input
                          id="product-video-title"
                          value={editForm.product_video_title}
                          onChange={(event) =>
                            setEditForm({ ...editForm, product_video_title: event.target.value })
                          }
                          placeholder="Optional video title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="image-url" className="text-sm font-medium">Primary Image URL</Label>
                        <Input
                          id="image-url"
                          value={editForm.image_url}
                          onChange={(event) =>
                            setEditForm({ ...editForm, image_url: event.target.value })
                          }
                          placeholder="/images/products/..."
                        />
                        <p className="text-xs text-muted-foreground">Fallback image URL if hero image not uploaded</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6 lg:sticky lg:top-24">
                  {/* Quick Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quick Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={normalizedStatus === 'active' ? 'default' : 'secondary'}>
                              {statusLabel}
                            </Badge>
                            <Badge variant={editForm.is_catalog_enabled ? 'default' : 'secondary'}>
                              {editForm.is_catalog_enabled ? 'Catalog' : 'Hidden'}
                            </Badge>
                            <Badge variant={editForm.is_pay_and_pickup_enabled ? 'default' : 'secondary'}>
                              {editForm.is_pay_and_pickup_enabled ? 'Pickup' : 'Hidden'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={normalizedStatus === 'active' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange('active')}
                              className="h-8 px-3 text-xs"
                            >
                              Active
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={normalizedStatus === 'draft' ? 'default' : 'outline'}
                              onClick={() => handleStatusChange('draft')}
                              className="h-8 px-3 text-xs"
                            >
                              Draft
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Draft items stay hidden from the public catalog.
                          </p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Price</p>
                            <p className="text-lg font-semibold">{quickReferencePrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Stock</p>
                            <p
                              className={`text-lg font-semibold ${
                                quickReferenceStock < 10 ? 'text-destructive' : ''
                              }`}
                            >
                              {quickReferenceStock}
                            </p>
                          </div>
                        </div>
                        {editForm.sku && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">SKU</p>
                              <p className="text-sm font-mono">{editForm.sku}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Catalog Preview</CardTitle>
                      <CardDescription>Snapshot of how this appears on /products</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border">
                        {catalogPreviewImage ? (
                          <img
                            src={catalogPreviewImage}
                            alt="Catalog preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Package className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          <Badge variant={editForm.is_catalog_enabled ? 'default' : 'secondary'}>
                            {editForm.is_catalog_enabled ? 'Visible' : 'Hidden'}
                          </Badge>
                          <Badge variant="outline">
                            #{editForm.catalog_display_order || '0'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {catalogPreviewCategory}
                        </p>
                        <p className="text-base font-semibold leading-tight">
                          {resolvedProductName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {catalogPreviewDescription || 'Add marketing copy to complete this preview.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pay & Pickup Preview</CardTitle>
                      <CardDescription>Hero, badge, and sizes shown in the checkout wizard</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="relative aspect-video overflow-hidden rounded-xl border">
                        {payPickupPreviewImage ? (
                          <img
                            src={payPickupPreviewImage}
                            alt="Pay & Pickup preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Package className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          {payPickupPreviewBadge && (
                            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                              {payPickupPreviewBadge}
                            </Badge>
                          )}
                          <Badge variant={editForm.is_pay_and_pickup_enabled ? 'default' : 'secondary'}>
                            {editForm.is_pay_and_pickup_enabled ? 'Enabled' : 'Hidden'}
                          </Badge>
                          <Badge variant="outline">
                            #{editForm.pay_and_pickup_display_order || '0'}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold leading-tight">
                          {resolvedProductName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payPickupPreviewDescription || 'Add a Pay & Pickup description so customers know what to expect.'}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {payPickupPreviewSizes.map((size) => (
                            <span
                              key={size}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                            >
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            )}
          </div>

          {/* Sticky Save Button Bar */}
          <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-50 border-t bg-white/95 backdrop-blur-sm shadow-lg">
            <div className="mx-auto max-w-7xl px-6 py-3">
              <div className="flex items-center justify-end gap-2">
                {productId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => productId && deleteMutation.mutate(productId)}
                    disabled={deleteMutation.isPending || isSaving}
                    className="text-destructive hover:text-destructive"
                  >
                    {deleteMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={!editForm || isSaving || updateProductMutation.isPending}
                  className="min-w-[120px]"
                >
                  {(isSaving || updateProductMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
