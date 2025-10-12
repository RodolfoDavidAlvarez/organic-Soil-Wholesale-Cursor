import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Package, Search } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatPrice = (price?: number | null) => {
    if (price === null || price === undefined) return '0.00';
    return (Number(price) / 100).toFixed(2);
  };

  const { data: products, isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Product deleted',
        description: 'The product has been deleted successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    }
  });

  const togglePayAndPickupMutation = useMutation({
    mutationFn: async ({ productId, isEnabled }: { productId: number; isEnabled: boolean }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_pay_and_pickup_enabled: isEnabled })
      });

      if (!response.ok) {
        throw new Error('Failed to update Pay & Pickup availability');
      }

      return response.json();
    },
    onSuccess: (updatedProduct: any) => {
      toast({
        title: updatedProduct.is_pay_and_pickup_enabled ? 'Pay & Pickup enabled' : 'Pay & Pickup disabled',
        description: `${updatedProduct.name} has been updated.`
      });
      setSelectedProduct(updatedProduct);
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'We could not update the Pay & Pickup status. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const filteredProducts = products?.filter((product: any) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="bg-white shadow-sm rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Pay & Pickup</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts?.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>${formatPrice(product.price)}</TableCell>
                      <TableCell>
                        <span className={(product.stock_quantity ?? 0) < 10 ? 'text-red-600 font-medium' : ''}>
                          {product.stock_quantity ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_pay_and_pickup_enabled ? 'default' : 'secondary'}>
                          {product.is_pay_and_pickup_enabled ? 'Enabled' : 'Hidden'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this product?')) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </AdminLayout>
      <Dialog
        open={isDialogOpen && Boolean(selectedProduct)}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedProduct(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          {selectedProduct && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>{selectedProduct.display_title || selectedProduct.name}</DialogTitle>
                <DialogDescription>
                  Preview product details and control its Pay & Pickup availability.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                    {selectedProduct.texture_photo_url || selectedProduct.image_url ? (
                      <img
                        src={selectedProduct.texture_photo_url || selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No image available
                      </div>
                    )}
                  </div>
                  {Array.isArray(selectedProduct.additional_images) && selectedProduct.additional_images.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto">
                      {selectedProduct.additional_images.slice(0, 4).map((image: string, index: number) => (
                        <img
                          key={`${image}-${index}`}
                          src={image}
                          alt={`${selectedProduct.name} alternate ${index + 1}`}
                          className="h-20 w-20 rounded-md object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-5">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pay &amp; Pickup availability</p>
                        <p className="text-xs text-muted-foreground">
                          Enable to surface this product in the Pay &amp; Pickup storefront.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(selectedProduct.is_pay_and_pickup_enabled)}
                        disabled={togglePayAndPickupMutation.isPending}
                        onCheckedChange={(value) =>
                          togglePayAndPickupMutation.mutate({
                            productId: selectedProduct.id,
                            isEnabled: value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Description</h3>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {selectedProduct.pay_and_pickup_description || selectedProduct.description || 'No description provided.'}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Size options</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Array.isArray(selectedProduct.available_size_options) && selectedProduct.available_size_options.length > 0 ? (
                          selectedProduct.available_size_options.map((size: string) => (
                            <Badge key={size} variant="outline">
                              {size}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No size options configured.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700">Pricing</h3>
                      <p className="text-sm text-gray-600">${formatPrice(selectedProduct.price)} per unit</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProtectedAdminRoute>
  );
}
