import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  EyeOff,
  Filter,
  Grid3x3,
  List,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Product, formatPrice, getPrimaryImage } from './product-utils';

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'catalog' | 'payPickup'>('catalog');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getDisplayOrder = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const parsed = Number.parseInt(trimmed, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const {
    data: products = [],
    isLoading,
  } = useQuery<Product[]>({
    queryKey: ['adminProducts'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      return response.json();
    },
  });

  const catalogSortedProducts = useMemo(() => {
    return [...products].sort((productA, productB) => {
      const orderA = getDisplayOrder(productA.catalog_display_order) ?? Number.MAX_SAFE_INTEGER;
      const orderB = getDisplayOrder(productB.catalog_display_order) ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      const nameA = (productA.display_title || productA.name || '').toLowerCase();
      const nameB = (productB.display_title || productB.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [products]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const catalogFilteredProducts = useMemo(() => {
    if (!normalizedSearch) {
      return catalogSortedProducts;
    }

    return catalogSortedProducts.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(normalizedSearch);
      const skuMatch = product.sku?.toLowerCase().includes(normalizedSearch);
      const categoryMatch = product.category?.toLowerCase().includes(normalizedSearch);
      return Boolean(nameMatch || skuMatch || categoryMatch);
    });
  }, [catalogSortedProducts, normalizedSearch]);

  const payPickupSortedProducts = useMemo(() => {
    return [...products].sort((productA, productB) => {
      const orderA = getDisplayOrder(productA.pay_and_pickup_display_order) ?? Number.MAX_SAFE_INTEGER;
      const orderB = getDisplayOrder(productB.pay_and_pickup_display_order) ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      const nameA = (productA.display_title || productA.name || '').toLowerCase();
      const nameB = (productB.display_title || productB.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [products]);

  const payPickupFilteredProducts = useMemo(() => {
    if (!normalizedSearch) {
      return payPickupSortedProducts;
    }

    return payPickupSortedProducts.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(normalizedSearch);
      const skuMatch = product.sku?.toLowerCase().includes(normalizedSearch);
      const categoryMatch = product.category?.toLowerCase().includes(normalizedSearch);
      return Boolean(nameMatch || skuMatch || categoryMatch);
    });
  }, [payPickupSortedProducts, normalizedSearch]);

  const displayedProducts =
    activeTab === 'catalog' ? catalogFilteredProducts : payPickupFilteredProducts;

  const resolveProductStatus = (product: Product) => {
    const snakeStatus =
      typeof product.product_status === 'string' ? product.product_status : undefined;
    const camelStatus =
      typeof (product as Record<string, unknown>).productStatus === 'string'
        ? ((product as Record<string, string>).productStatus as string)
        : undefined;
    const normalized = (snakeStatus || camelStatus || '').trim().toLowerCase();
    if (normalized === 'draft' || normalized === 'inactive') {
      return 'draft';
    }
    if (normalized === 'active') {
      return 'active';
    }
    return product.is_catalog_enabled === false ? 'draft' : 'active';
  };

  const visibleProducts = useMemo(() => {
    if (statusFilter === 'all') {
      return displayedProducts;
    }
    const desiredStatus = statusFilter === 'active' ? 'active' : 'draft';
    return displayedProducts.filter(
      (product) => resolveProductStatus(product) === desiredStatus,
    );
  }, [displayedProducts, statusFilter]);

  const catalogCount = catalogFilteredProducts.length;
  const payPickupCount = payPickupFilteredProducts.length;
  const totalCount = visibleProducts.length;
  const contextLabel = activeTab === 'catalog' ? 'Catalog' : 'Pay & Pickup';
  const secondaryContextLabel = activeTab === 'catalog' ? 'Pay & Pickup' : 'Catalog';
  const headerDescription =
    activeTab === 'catalog'
      ? 'Manage the public Products page catalog: visibility, ordering, and media.'
      : 'Visual management for Pay & Pickup availability, pricing, and presentation.';
  const showLabel = activeTab === 'catalog' ? 'Show in Catalog' : 'Show in Pay & Pickup';
  const hideLabel = activeTab === 'catalog' ? 'Hide from Catalog' : 'Hide from Pay & Pickup';

  const updateProductRequest = async (productId: number, data: Record<string, unknown>) => {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`/api/admin/products/${productId}`, {
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

    return response.json();
  };

  type VisibilityField = 'is_pay_and_pickup_enabled' | 'is_catalog_enabled';

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({
      productId,
      field,
      isEnabled,
    }: {
      productId: number;
      field: VisibilityField;
      isEnabled: boolean;
    }) => updateProductRequest(productId, { [field]: isEnabled }),
    onSuccess: (updatedProduct: Product, variables) => {
      const contextLabel =
        variables.field === 'is_pay_and_pickup_enabled' ? 'Pay & Pickup' : 'Catalog';
      toast({
        title: variables.isEnabled ? `${contextLabel} enabled` : `${contextLabel} hidden`,
        description: `${updatedProduct.display_title || updatedProduct.name} has been updated.`,
      });

      queryClient.setQueryData<Product[]>(['adminProducts'], (existing) =>
        existing?.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)) ?? []
      );
    },
    onError: (_error, variables) => {
      const contextLabel =
        variables.field === 'is_pay_and_pickup_enabled' ? 'Pay & Pickup' : 'Catalog';
      toast({
        title: 'Update failed',
        description: `We could not update the ${contextLabel.toLowerCase()} status. Please try again.`,
        variant: 'destructive',
      });
    },
  });

  type BulkUpdatePayload = {
    productIds: number[];
    updates: Record<string, unknown>;
    context: 'catalog' | 'payPickup';
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }: BulkUpdatePayload) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds, updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update products');
      }

      return response.json();
    },
    onSuccess: (_data, variables) => {
      const contextLabel = variables.context === 'catalog' ? 'Catalog' : 'Pay & Pickup';
      toast({
        title: `${contextLabel} updated`,
        description: `Successfully updated ${variables.productIds.length} products.`,
      });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setSelectedProductIds(new Set());
      setIsBulkUpdating(false);
    },
    onError: (_error, variables) => {
      const contextLabel = variables.context === 'catalog' ? 'Catalog' : 'Pay & Pickup';
      toast({
        title: 'Bulk update failed',
        description: `We could not update the ${contextLabel.toLowerCase()} status for the selected products. Please try again.`,
        variant: 'destructive',
      });
      setIsBulkUpdating(false);
    },
  });

  const handleCardClick = (productId: number) => {
    navigate(`/admin/products/${productId}`);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  useEffect(() => {
    setSelectedProductIds(new Set());
  }, [activeTab, statusFilter]);

  const selectAllProducts = () => {
    setSelectedProductIds(new Set(visibleProducts.map((product) => product.id)));
  };

  const clearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const handleBulkAction = async (action: 'show' | 'hide' | 'delete') => {
    if (selectedProductIds.size === 0) return;

    setIsBulkUpdating(true);
    const productIds = Array.from(selectedProductIds);
    const visibilityField: VisibilityField =
      activeTab === 'catalog' ? 'is_catalog_enabled' : 'is_pay_and_pickup_enabled';
    const contextKey = activeTab === 'catalog' ? 'catalog' : 'payPickup';

    switch (action) {
      case 'show':
        await bulkUpdateMutation.mutateAsync({
          productIds,
          updates: { [visibilityField]: true },
          context: contextKey,
        });
        break;
      case 'hide':
        await bulkUpdateMutation.mutateAsync({
          productIds,
          updates: { [visibilityField]: false },
          context: contextKey,
        });
        break;
      case 'delete':
        setIsBulkUpdating(false);
        toast({
          title: 'Bulk delete not available',
          description: 'Please delete products individually from the detail page.',
        });
        break;
    }
  };

  const isAllSelected =
    selectedProductIds.size === visibleProducts.length && visibleProducts.length > 0;

  const handleAddProduct = useCallback(() => {
    navigate('/admin/products/new');
  }, [navigate]);

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-muted-foreground">{headerDescription}</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'catalog' | 'payPickup')}
                className="w-full md:w-auto"
              >
                <TabsList className="grid w-full grid-cols-2 md:inline-flex md:w-auto">
                  <TabsTrigger value="catalog">Catalog ({catalogCount})</TabsTrigger>
                  <TabsTrigger value="payPickup">Pay &amp; Pickup ({payPickupCount})</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button className="self-start md:self-auto" onClick={handleAddProduct}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:gap-3">
                <div className="flex flex-1 items-center gap-2 md:max-w-md">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, SKU, or category..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  {totalCount} {contextLabel.toLowerCase()} product{totalCount === 1 ? '' : 's'}
                </div>
                <Separator orientation="vertical" className="h-5" />
                <div className="flex items-center gap-1 rounded-lg border p-1">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    className="h-7 w-7 p-0"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    className="h-7 w-7 p-0"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {selectedProductIds.size > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted px-4 py-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => (checked ? selectAllProducts() : clearSelection())}
                  />
                  <span className="text-sm font-medium">
                    {selectedProductIds.size} of {totalCount} selected
                  </span>
                  <Button size="sm" variant="link" onClick={clearSelection} className="text-xs">
                    Clear selection
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" disabled={isBulkUpdating}>
                        <Filter className="mr-2 h-3 w-3" />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleBulkAction('show')}>
                        <Eye className="mr-2 h-4 w-4" />
                        {showLabel}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('hide')}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        {hideLabel}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[360px] animate-pulse rounded-2xl border border-border bg-muted/30" />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">No products found</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Try adjusting your search terms or add a new product to manage {contextLabel.toLowerCase()} settings.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => {
                const primaryImage = getPrimaryImage(product);
                const isSelected = selectedProductIds.has(product.id);
                const catalogOrder = getDisplayOrder(product.catalog_display_order);
                const payPickupOrder = getDisplayOrder(product.pay_and_pickup_display_order);
                const catalogVisible = Boolean(product.is_catalog_enabled);
                const payPickupVisible = Boolean(product.is_pay_and_pickup_enabled);
                const primaryVisibility = activeTab === 'catalog' ? catalogVisible : payPickupVisible;
                const primaryOrder = activeTab === 'catalog' ? catalogOrder : payPickupOrder;
                const secondaryVisibility = activeTab === 'catalog' ? payPickupVisible : catalogVisible;
                const secondaryOrder = activeTab === 'catalog' ? payPickupOrder : catalogOrder;

                return (
                  <article
                    key={product.id}
                    className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                    }`}
                    onClick={() => handleCardClick(product.id)}
                  >
                    <div className="absolute right-4 top-4 z-10">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="bg-white shadow-sm"
                      />
                    </div>

                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted" aria-hidden="true">
                      {primaryImage ? (
                        <img
                          src={primaryImage}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          <Package className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                        <Badge variant={primaryVisibility ? 'default' : 'secondary'}>
                          {primaryVisibility ? `${contextLabel} Visible` : `${contextLabel} Hidden`}
                        </Badge>
                        <Badge variant="outline">
                          {contextLabel} {primaryOrder !== null ? `#${primaryOrder}` : '—'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-4 p-5">
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-semibold leading-tight">
                          {product.display_title || product.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                          {product.category && <span>{product.category}</span>}
                          {product.sku && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs uppercase tracking-wide">
                              {product.sku}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="text-base font-semibold">${formatPrice(product.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Stock</p>
                          <p
                            className={`text-base font-semibold ${
                              (product.stock_quantity ?? 0) < 10 ? 'text-destructive' : ''
                            }`}
                          >
                            {product.stock_quantity ?? 0}
                          </p>
                        </div>
                      </div>
                      <Separator />
                      <div
                        className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div>
                          <p className="text-xs text-muted-foreground">{contextLabel}</p>
                          <p className="text-sm font-medium">
                            {primaryVisibility ? 'Visible' : 'Hidden'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {secondaryContextLabel}: {secondaryVisibility ? 'Visible' : 'Hidden'}
                            {secondaryVisibility && secondaryOrder !== null ? ` (#${secondaryOrder})` : ''}
                          </p>
                        </div>
                        <Switch
                          checked={primaryVisibility}
                          disabled={toggleVisibilityMutation.isPending}
                          onCheckedChange={(value) =>
                            toggleVisibilityMutation.mutate({
                              productId: product.id,
                              field:
                                activeTab === 'catalog'
                                  ? 'is_catalog_enabled'
                                  : 'is_pay_and_pickup_enabled',
                              isEnabled: value,
                            })
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        className="mt-auto"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCardClick(product.id);
                        }}
                      >
                        Manage product
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border bg-white">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="w-12 p-4">
                      <Checkbox checked={isAllSelected} onCheckedChange={(checked) => (checked ? selectAllProducts() : clearSelection())} />
                    </th>
                    <th className="p-4 text-left text-sm font-medium">Product</th>
                    <th className="p-4 text-left text-sm font-medium">{contextLabel}</th>
                    <th className="p-4 text-left text-sm font-medium">{secondaryContextLabel}</th>
                    <th className="p-4 text-left text-sm font-medium">Category</th>
                    <th className="p-4 text-left text-sm font-medium">SKU</th>
                    <th className="p-4 text-center text-sm font-medium">Price</th>
                    <th className="p-4 text-center text-sm font-medium">Stock</th>
                    <th className="p-4 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product, index) => {
                    const primaryImage = getPrimaryImage(product);
                    const isSelected = selectedProductIds.has(product.id);
                    const catalogOrder = getDisplayOrder(product.catalog_display_order);
                    const payPickupOrder = getDisplayOrder(product.pay_and_pickup_display_order);
                    const catalogVisible = Boolean(product.is_catalog_enabled);
                    const payPickupVisible = Boolean(product.is_pay_and_pickup_enabled);
                    const primaryVisibility = activeTab === 'catalog' ? catalogVisible : payPickupVisible;
                    const primaryOrder = activeTab === 'catalog' ? catalogOrder : payPickupOrder;
                    const secondaryVisibility = activeTab === 'catalog' ? payPickupVisible : catalogVisible;
                    const secondaryOrder = activeTab === 'catalog' ? payPickupOrder : catalogOrder;

                    return (
                      <tr
                        key={product.id}
                        className={`cursor-pointer border-b transition-colors hover:bg-muted/50 ${
                          isSelected ? 'bg-primary/5' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                        onClick={() => handleCardClick(product.id)}
                      >
                        <td className="p-4" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                              {primaryImage ? (
                                <img src={primaryImage} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                  <Package className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.display_title || product.name}</p>
                              {product.category && (
                                <p className="text-xs text-muted-foreground">{product.category}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4" onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground">{contextLabel}</p>
                              <p className="text-sm font-medium">
                                {primaryVisibility ? 'Visible' : 'Hidden'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Order {primaryOrder !== null ? `#${primaryOrder}` : '—'}
                              </p>
                            </div>
                            <Switch
                              checked={primaryVisibility}
                              disabled={toggleVisibilityMutation.isPending}
                              onCheckedChange={(value) =>
                                toggleVisibilityMutation.mutate({
                                  productId: product.id,
                                  field:
                                    activeTab === 'catalog'
                                      ? 'is_catalog_enabled'
                                      : 'is_pay_and_pickup_enabled',
                                  isEnabled: value,
                                })
                              }
                            />
                          </div>
                        </td>
                        <td className="p-4 text-sm" onClick={(event) => event.stopPropagation()}>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">{secondaryContextLabel}</p>
                            <p className="text-sm font-medium">
                              {secondaryVisibility ? 'Visible' : 'Hidden'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Order {secondaryOrder !== null ? `#${secondaryOrder}` : '—'}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{product.category || '-'}</td>
                        <td className="p-4 text-sm font-mono">{product.sku || '-'}</td>
                        <td className="p-4 text-center text-sm font-medium">${formatPrice(product.price)}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`text-sm font-medium ${
                              (product.stock_quantity ?? 0) < 10 ? 'text-red-600' : ''
                            }`}
                          >
                            {product.stock_quantity ?? 0}
                          </span>
                        </td>
                        <td className="p-4 text-center" onClick={(event) => event.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => handleCardClick(product.id)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
