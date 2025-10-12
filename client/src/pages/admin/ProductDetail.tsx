import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useLocation, useRoute } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  Loader2,
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
import { useToast } from '@/hooks/use-toast';
import { SIZE_CATALOG, SIZE_CATALOG_BY_KEY } from '@/data/sizeCatalog';
import {
  PRODUCT_IMAGE_FOLDER,
  Product,
  EditFormData,
  SizePriceOptionFormValue,
  buildEditForm,
  formatPrice,
  getPrimaryImage,
} from './product-utils';

const parseProductId = (param?: string | number | null) => {
  if (param === undefined || param === null) return NaN;
  const numeric = Number(param);
  return Number.isFinite(numeric) ? numeric : NaN;
};

export default function AdminProductDetail() {
  const [, params] = useRoute('/admin/products/:productId');
  const [, navigate] = useLocation();
  const productId = parseProductId(params?.productId);
  const isValidProductId = Number.isInteger(productId) && productId > 0;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const heroInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [editForm, setEditForm] = useState<EditFormData | null>(null);
  const [heroUpload, setHeroUpload] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [galleryUploads, setGalleryUploads] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [newCustomSize, setNewCustomSize] = useState<{ label: string; price: string }>({
    label: '',
    price: '',
  });
  const [isSaving, setIsSaving] = useState(false);

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
      setNewCustomSize({ label: '', price: '' });
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
      return {
        ...prev,
        size_price_options: nextOptions,
        available_size_options: syncAvailableSizeOptions(nextOptions),
      };
    });
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const getCatalogEntry = (key: string) =>
    Object.prototype.hasOwnProperty.call(SIZE_CATALOG_BY_KEY, key)
      ? SIZE_CATALOG_BY_KEY[key as keyof typeof SIZE_CATALOG_BY_KEY]
      : undefined;

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

  const handleCustomOptionChange = (
    key: string,
    updates: Partial<Pick<SizePriceOptionFormValue, 'label' | 'price' | 'isActive'>>,
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
        },
      ];
    });

    setNewCustomSize({ label: '', price: '' });
  };

  const handleSaveChanges = async () => {
    if (!editForm || !isValidProductId) return;

    setIsSaving(true);

    try {
      let heroImageUrl = editForm.pay_and_pickup_hero_image;
      if (heroUpload) {
        heroImageUrl = await uploadImage(heroUpload, `${PRODUCT_IMAGE_FOLDER}/${productId}`);
      }

      let galleryImages = [...editForm.additional_images];
      if (galleryUploads.length > 0) {
        const newGalleryUrls = await Promise.all(
          galleryUploads.map((file, index) =>
            uploadImage(file, `${PRODUCT_IMAGE_FOLDER}/${productId}/gallery-${index + 1}`)
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

      const payload = {
        name: editForm.name.trim(),
        display_title: editForm.display_title.trim() || null,
        sku: editForm.sku.trim() || null,
        category: editForm.category.trim() || null,
        price: priceInCents,
        stock_quantity: editForm.stock_quantity.trim() ? Number(editForm.stock_quantity) : null,
        is_pay_and_pickup_enabled: editForm.is_pay_and_pickup_enabled,
        pay_and_pickup_description: editForm.pay_and_pickup_description.trim() || null,
        pay_and_pickup_hero_image: heroImageUrl || null,
        texture_photo_url:
          editForm.texture_photo_url.trim() || heroImageUrl || editForm.image_url || null,
        image_url: editForm.image_url.trim() || heroImageUrl || null,
        additional_images: galleryImages,
        available_size_options: availableSizeOptions,
        size_price_options: sizePriceOptionsPayload,
        product_video_url: editForm.product_video_url.trim() || null,
        product_video_title: editForm.product_video_title.trim() || null,
      };

      await updateProductMutation.mutateAsync({ productId, data: payload });
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

  if (!isValidProductId) {
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
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() => navigate('/admin/products')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to products
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {editForm?.display_title || editForm?.name || product?.name || 'Product details'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage Pay &amp; Pickup presentation, availability, and imagery for this product.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => productId && deleteMutation.mutate(productId)}
                disabled={deleteMutation.isPending || isSaving}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete product
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveChanges}
                disabled={!editForm || isSaving || updateProductMutation.isPending}
              >
                {(isSaving || updateProductMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save changes
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-4">
                <Skeleton className="h-80 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-40 rounded-2xl" />
                <Skeleton className="h-56 rounded-2xl" />
              </div>
            </div>
          ) : isError || !product || !editForm ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/10 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <div>
                <p className="text-lg font-semibold">Unable to load product</p>
                <p className="text-sm">
                  {error instanceof Error ? error.message : 'Please try again or contact support.'}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate('/admin/products')}>
                Back to products
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <section className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-200" />
                  <div
                    className="relative flex h-[360px] items-center justify-center"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleHeroDrop}
                  >
                    {heroImageForPreview ? (
                      <img src={heroImageForPreview} alt={editForm.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow">
                          <ImagePlus className="h-8 w-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">Drag a hero image</p>
                          <p className="text-xs text-muted-foreground">
                            1600×1200 recommended · JPG, PNG, or WEBP up to 5&nbsp;MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-black/45 to-transparent px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-md text-sm text-white">
                      <p className="font-semibold leading-tight">
                        {editForm.display_title || product.name}
                      </p>
                      {editForm.category && (
                        <p className="text-xs uppercase tracking-wide text-white/70">{editForm.category}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 text-foreground shadow-sm backdrop-blur"
                        onClick={() => heroInputRef.current?.click()}
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Upload hero
                      </Button>
                      {(heroUpload || editForm.pay_and_pickup_hero_image) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 text-white hover:bg-white/30"
                          onClick={() => {
                            setHeroUpload(null);
                            resetHeroPreview();
                            setEditForm({
                              ...editForm,
                              pay_and_pickup_hero_image: '',
                            });
                          }}
                        >
                          <X className="mr-1 h-4 w-4" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  <input
                    ref={heroInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleHeroInputChange}
                  />
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Gallery photos</h2>
                      <p className="text-xs text-muted-foreground">
                        Showcase texture, pallets, and packaging variations.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()}>
                      Add images
                    </Button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGalleryInputChange}
                    />
                  </div>

                  <div
                    className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-dashed border-border/50 bg-muted/20 p-4 md:grid-cols-3"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleGalleryDrop}
                  >
                    {editForm.additional_images.length === 0 && galleryPreviews.length === 0 ? (
                      <div className="col-span-full flex h-32 flex-col items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                        <ImagePlus className="h-6 w-6" />
                        <span>Drag images here or use “Add images”</span>
                      </div>
                    ) : (
                      <>
                        {editForm.additional_images.map((image) => (
                          <div
                            key={image}
                            className="group relative h-32 overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm"
                          >
                            <img src={image} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              className="absolute right-2 top-2 hidden rounded-full bg-black/70 p-1 text-white transition group-hover:flex"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveExistingGalleryImage(image);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}

                        {galleryPreviews.map((preview, index) => (
                          <div
                            key={`${preview}-${index}`}
                            className="group relative h-32 overflow-hidden rounded-xl border border-primary/40 bg-white shadow-sm"
                          >
                            <img src={preview} alt="" className="h-full w-full object-cover" />
                            <button
                              type="button"
                              className="absolute right-2 top-2 hidden rounded-full bg-black/70 p-1 text-white transition group-hover:flex"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveNewGalleryImage(index);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <div className="space-y-4 rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={editForm.is_pay_and_pickup_enabled ? 'default' : 'secondary'}>
                          {editForm.is_pay_and_pickup_enabled ? 'Live in Pay & Pickup' : 'Hidden'}
                        </Badge>
                        {editForm.sku && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            SKU {editForm.sku}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">
                          {editForm.display_title || editForm.name || product.name}
                        </p>
                        {editForm.category && (
                          <p className="text-sm text-muted-foreground">Category · {editForm.category}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid w-full max-w-xs gap-3 text-sm text-muted-foreground sm:w-auto sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide">Price</p>
                        <p className="text-lg font-semibold text-foreground">
                          {editForm.price ? `$${editForm.price}` : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide">Stock</p>
                        <p
                          className={`text-lg font-semibold ${
                            (Number(editForm.stock_quantity) || 0) < 10 ? 'text-destructive' : ''
                          }`}
                        >
                          {editForm.stock_quantity || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="product-name">Product name</Label>
                      <Input
                        id="product-name"
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            name: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="display-title">Display title</Label>
                      <Input
                        id="display-title"
                        value={editForm.display_title}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            display_title: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={editForm.sku}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            sku: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={editForm.category}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            category: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price (USD)</Label>
                      <Input
                        id="price"
                        value={editForm.price}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            price: event.target.value,
                          })
                        }
                        placeholder="19.99"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Stock quantity</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={editForm.stock_quantity}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            stock_quantity: event.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5 rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-foreground">Pay &amp; Pickup presentation</h2>
                    <p className="text-xs text-muted-foreground">
                      Tailor what customers read and the sizes they can reserve for pickup.
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Pay &amp; Pickup</p>
                      <p className="text-sm font-medium">
                        {editForm.is_pay_and_pickup_enabled ? 'Enabled' : 'Hidden'}
                      </p>
                    </div>
                    <Switch
                      checked={editForm.is_pay_and_pickup_enabled}
                      onCheckedChange={(value) =>
                        setEditForm({
                          ...editForm,
                          is_pay_and_pickup_enabled: value,
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="pay-pickup-description">Description</Label>
                    <Textarea
                      id="pay-pickup-description"
                      rows={6}
                      value={editForm.pay_and_pickup_description}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          pay_and_pickup_description: event.target.value,
                        })
                      }
                      placeholder="Highlight pickup-ready details, quality notes, and quick ordering instructions."
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {editForm.pay_and_pickup_description.length} characters
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <Label>Size availability</Label>
                      <p className="text-xs text-muted-foreground">
                        Select the sizes customers can order and provide the pricing shown on the product and Pay &amp;
                        Pickup pages.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
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
                            className={`flex flex-col gap-3 rounded-xl border p-4 transition ${
                              option.isActive ? 'border-primary/60 bg-primary/5' : 'border-border/60 bg-muted/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-20 w-28 overflow-hidden rounded-lg bg-white shadow-sm">
                                <img
                                  src={option.image || entry.image}
                                  alt={entry.label}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                                    <p className="text-xs text-muted-foreground">{entry.description}</p>
                                  </div>
                                  <Switch
                                    checked={Boolean(option.isActive)}
                                    onCheckedChange={(value) => handleStandardSizeToggle(entry.key, value)}
                                  />
                                </div>
                                {option.isActive && (
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={priceInputId}
                                      className="text-xs uppercase tracking-wide text-muted-foreground"
                                    >
                                      Price (USD)
                                    </Label>
                                    <Input
                                      id={priceInputId}
                                      placeholder="e.g. 129.99"
                                      value={option.price}
                                      onChange={(event) =>
                                        handleStandardPriceChange(entry.key, event.target.value)
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-3 rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Custom size options</p>
                          <p className="text-xs text-muted-foreground">
                            Add product-specific sizes. Leave the price blank if it varies by location.
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {editForm.available_size_options.length} size
                          {editForm.available_size_options.length === 1 ? '' : 's'} active
                        </div>
                      </div>

                      <div className="space-y-3">
                        {editForm.size_price_options
                          .filter((option) => !SIZE_CATALOG.some((entry) => entry.key === option.key))
                          .map((option) => (
                            <div
                              key={option.key}
                              className="space-y-3 rounded-lg border border-border/50 bg-white/80 p-4 shadow-sm"
                            >
                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px]">
                                <div className="grid gap-1">
                                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Label
                                  </Label>
                                  <Input
                                    value={option.label}
                                    onChange={(event) =>
                                      handleCustomOptionChange(option.key, { label: event.target.value })
                                    }
                                    placeholder="e.g. 9lb Bag"
                                  />
                                </div>
                                <div className="grid gap-1">
                                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Price (USD)
                                  </Label>
                                  <Input
                                    value={option.price}
                                    onChange={(event) =>
                                      handleCustomOptionChange(option.key, { price: event.target.value })
                                    }
                                    placeholder="e.g. 24.99"
                                  />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Switch
                                      checked={Boolean(option.isActive)}
                                      onCheckedChange={(value) =>
                                        handleCustomOptionChange(option.key, { isActive: value })
                                      }
                                    />
                                    <span>Show to customers</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => handleRemoveCustomSizeOption(option.key)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}

                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px]">
                          <Input
                            value={newCustomSize.label}
                            onChange={(event) =>
                              setNewCustomSize((prev) => ({ ...prev, label: event.target.value }))
                            }
                            placeholder="Custom size label e.g. 9lb Bag"
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
                            placeholder="Price e.g. 24.99"
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                handleAddCustomSizeOption();
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddCustomSizeOption} className="w-full">
                            Add custom size
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="product-video-url">Product video link</Label>
                    <Input
                      id="product-video-url"
                      value={editForm.product_video_url}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          product_video_url: event.target.value,
                        })
                      }
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste a YouTube or Vimeo URL to feature the video on the product page.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="product-video-title">Video title</Label>
                    <Input
                      id="product-video-title"
                      value={editForm.product_video_title}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          product_video_title: event.target.value,
                        })
                      }
                      placeholder="Optional label shown next to the video"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="image-url">Fallback image URL</Label>
                      <Input
                        id="image-url"
                        value={editForm.image_url}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            image_url: event.target.value,
                          })
                        }
                        placeholder="/images/products/bag-photo.jpg"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="texture-photo">Texture photo URL</Label>
                      <Input
                        id="texture-photo"
                        value={editForm.texture_photo_url}
                        onChange={(event) =>
                          setEditForm({
                            ...editForm,
                            texture_photo_url: event.target.value,
                          })
                        }
                        placeholder="/images/products/textures/texture.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-foreground">Quick references</h2>
                  <div className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide">Current pricing</p>
                      <p className="text-base font-semibold text-foreground">
                        {product.price ? `$${formatPrice(product.price)}` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide">Primary image</p>
                      <p className="truncate text-foreground">
                        {editForm.pay_and_pickup_hero_image || editForm.image_url || getPrimaryImage(product) || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
