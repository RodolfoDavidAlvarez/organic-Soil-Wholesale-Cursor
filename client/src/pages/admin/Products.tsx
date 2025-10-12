import { useMemo, useState } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Product, formatPrice, getPrimaryImage } from './product-utils';

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const togglePayAndPickupMutation = useMutation({
    mutationFn: ({ productId, isEnabled }: { productId: number; isEnabled: boolean }) =>
      updateProductRequest(productId, { is_pay_and_pickup_enabled: isEnabled }),
    onSuccess: (updatedProduct: Product) => {
      toast({
        title: updatedProduct.is_pay_and_pickup_enabled ? 'Pay & Pickup enabled' : 'Pay & Pickup hidden',
        description: `${updatedProduct.display_title || updatedProduct.name} has been updated.`,
      });

      queryClient.setQueryData<Product[]>(['adminProducts'], (existing) =>
        existing?.map((product) => (product.id === updatedProduct.id ? updatedProduct : product)) ?? []
      );
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'We could not update the Pay & Pickup status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ productIds, updates }: { productIds: number[]; updates: Record<string, unknown> }) => {
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
    onSuccess: () => {
      toast({
        title: 'Products updated',
        description: `Successfully updated ${selectedProductIds.size} products.`,
      });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      setSelectedProductIds(new Set());
      setIsBulkUpdating(false);
    },
    onError: () => {
      toast({
        title: 'Bulk update failed',
        description: 'We could not update the selected products. Please try again.',
        variant: 'destructive',
      });
      setIsBulkUpdating(false);
    },
  });

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return products;
    }

    return products.filter((product) => {
      const nameMatch = product.name?.toLowerCase().includes(normalizedSearch);
      const skuMatch = product.sku?.toLowerCase().includes(normalizedSearch);
      const categoryMatch = product.category?.toLowerCase().includes(normalizedSearch);
      return Boolean(nameMatch || skuMatch || categoryMatch);
    });
  }, [products, searchTerm]);

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

  const selectAllProducts = () => {
    setSelectedProductIds(new Set(filteredProducts.map((product) => product.id)));
  };

  const clearSelection = () => {
    setSelectedProductIds(new Set());
  };

  const handleBulkAction = async (action: 'show' | 'hide' | 'delete') => {
    if (selectedProductIds.size === 0) return;

    setIsBulkUpdating(true);
    const productIds = Array.from(selectedProductIds);

    switch (action) {
      case 'show':
        await bulkUpdateMutation.mutateAsync({
          productIds,
          updates: { is_pay_and_pickup_enabled: true },
        });
        break;
      case 'hide':
        await bulkUpdateMutation.mutateAsync({
          productIds,
          updates: { is_pay_and_pickup_enabled: false },
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

  const isAllSelected = selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0;

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-muted-foreground">
                Visual management for Pay &amp; Pickup inventory, photos, and availability.
              </p>
            </div>
            <Button className="self-start md:self-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full items-center gap-2 md:max-w-md">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, or category..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
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
                    {selectedProductIds.size} of {filteredProducts.length} selected
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
                        Show in Pay & Pickup
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('hide')}>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide from Pay & Pickup
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
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">No products found</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Try adjusting your search terms or add a new product to start managing Pay &amp; Pickup availability.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const primaryImage = getPrimaryImage(product);
                const isSelected = selectedProductIds.has(product.id);

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
                      <div className="absolute left-4 top-4 flex gap-2">
                        <Badge variant={product.is_pay_and_pickup_enabled ? 'default' : 'secondary'}>
                          {product.is_pay_and_pickup_enabled ? 'Pay & Pickup' : 'Hidden'}
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
                          <p className="text-xs text-muted-foreground">Pay &amp; Pickup</p>
                          <p className="text-sm font-medium">
                            {product.is_pay_and_pickup_enabled ? 'Enabled' : 'Hidden'}
                          </p>
                        </div>
                        <Switch
                          checked={Boolean(product.is_pay_and_pickup_enabled)}
                          disabled={togglePayAndPickupMutation.isPending}
                          onCheckedChange={(value) =>
                            togglePayAndPickupMutation.mutate({
                              productId: product.id,
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
                    <th className="p-4 text-left text-sm font-medium">Category</th>
                    <th className="p-4 text-left text-sm font-medium">SKU</th>
                    <th className="p-4 text-center text-sm font-medium">Price</th>
                    <th className="p-4 text-center text-sm font-medium">Stock</th>
                    <th className="p-4 text-center text-sm font-medium">Pay & Pickup</th>
                    <th className="p-4 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const primaryImage = getPrimaryImage(product);
                    const isSelected = selectedProductIds.has(product.id);

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
                          <Switch
                            checked={Boolean(product.is_pay_and_pickup_enabled)}
                            disabled={togglePayAndPickupMutation.isPending}
                            onCheckedChange={(value) =>
                              togglePayAndPickupMutation.mutate({
                                productId: product.id,
                                isEnabled: value,
                              })
                            }
                          />
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
