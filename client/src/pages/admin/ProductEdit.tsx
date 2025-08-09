import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  Video,
  Package,
  DollarSign,
  FileText,
  Settings
} from 'lucide-react';

interface ProductForm {
  name: string;
  productType: string;
  displayTitle: string;
  marketingTitle: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
  texturePhotoUrl: string;
  additionalImages: string[];
  productVideoUrl: string;
  productVideoTitle: string;
  ingredients: string;
  targetAudience: string;
  recommendedUses: string;
  story: string;
  usage: string;
  certifications: string;
  features: string;
  sizeOptions: string;
  availableSizeOptions: string[];
  isWholesaleOnly: boolean;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  isPriceNegotiable: boolean;
  requiresQuote: boolean;
  allowBulkPickup: boolean;
  seoKeywords: string;
  marketingNote: string;
}

const categories = [
  'Potting Soil',
  'Compost',
  'Soil Amendments',
  'Mulch',
  'Fertilizers'
];

const AdminProductEdit = () => {
  const [, params] = useRoute('/admin/products/:id/edit');
  const [, navigate] = useLocation();
  const productId = params?.id;
  const isNew = productId === 'new';
  
  const { toast } = useToast();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState<ProductForm>({
    name: '',
    productType: '',
    displayTitle: '',
    marketingTitle: '',
    description: '',
    category: 'Potting Soil',
    price: 0,
    stockQuantity: 0,
    imageUrl: '',
    texturePhotoUrl: '',
    additionalImages: [],
    productVideoUrl: '',
    productVideoTitle: '',
    ingredients: '',
    targetAudience: '',
    recommendedUses: '',
    story: '',
    usage: '',
    certifications: '',
    features: '',
    sizeOptions: '',
    availableSizeOptions: [],
    isWholesaleOnly: false,
    minOrderQuantity: 1,
    maxOrderQuantity: 1000,
    isPriceNegotiable: false,
    requiresQuote: false,
    allowBulkPickup: false,
    seoKeywords: '',
    marketingNote: ''
  });

  useEffect(() => {
    if (!isNew) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();
      setForm({
        ...data,
        additionalImages: data.additionalImages || [],
        availableSizeOptions: data.availableSizeOptions || []
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive',
      });
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isNew
        ? '/api/admin/products'
        : `/api/admin/products/${productId}`;
      
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error('Failed to save product');

      toast({
        title: 'Success',
        description: `Product ${isNew ? 'created' : 'updated'} successfully`,
      });

      navigate('/admin/products');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddImage = () => {
    setForm(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, '']
    }));
  };

  const handleRemoveImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.map((img, i) => i === index ? value : img)
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/admin/products')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNew ? 'Add New Product' : 'Edit Product'}
              </h1>
              {!isNew && <p className="text-gray-600">ID: {productId}</p>}
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </h2>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="productType">Product Type</Label>
                    <Input
                      id="productType"
                      value={form.productType}
                      onChange={(e) => setForm(prev => ({ ...prev, productType: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="displayTitle">Display Title</Label>
                    <Input
                      id="displayTitle"
                      value={form.displayTitle}
                      onChange={(e) => setForm(prev => ({ ...prev, displayTitle: e.target.value }))}
                      placeholder="Title shown on product page"
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketingTitle">Marketing Title</Label>
                    <Input
                      id="marketingTitle"
                      value={form.marketingTitle}
                      onChange={(e) => setForm(prev => ({ ...prev, marketingTitle: e.target.value }))}
                      placeholder="Title for SEO/marketing"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={form.category} onValueChange={(value) => setForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                    <Input
                      id="stockQuantity"
                      type="number"
                      value={form.stockQuantity}
                      onChange={(e) => setForm(prev => ({ ...prev, stockQuantity: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="texturePhotoUrl">Texture Photo URL (Primary)</Label>
                  <Input
                    id="texturePhotoUrl"
                    value={form.texturePhotoUrl}
                    onChange={(e) => setForm(prev => ({ ...prev, texturePhotoUrl: e.target.value }))}
                    placeholder="https://example.com/texture.jpg"
                  />
                  <p className="text-sm text-gray-500 mt-1">This will be displayed as the main product image</p>
                </div>

                <div>
                  <Label htmlFor="imageUrl">Product Bag Photo URL</Label>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/product.jpg"
                  />
                </div>

                <div>
                  <Label>Additional Images</Label>
                  {form.additionalImages.map((img, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={img}
                        onChange={(e) => handleImageChange(index, e.target.value)}
                        placeholder="https://example.com/additional.jpg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddImage}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Image
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="productVideoUrl">Product Video URL</Label>
                    <div className="relative">
                      <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="productVideoUrl"
                        value={form.productVideoUrl}
                        onChange={(e) => setForm(prev => ({ ...prev, productVideoUrl: e.target.value }))}
                        placeholder="https://youtube.com/..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="productVideoTitle">Video Title</Label>
                    <Input
                      id="productVideoTitle"
                      value={form.productVideoTitle}
                      onChange={(e) => setForm(prev => ({ ...prev, productVideoTitle: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Details */}
          <TabsContent value="details">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Product Details
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ingredients">Ingredients</Label>
                  <Textarea
                    id="ingredients"
                    value={form.ingredients}
                    onChange={(e) => setForm(prev => ({ ...prev, ingredients: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="usage">Usage Instructions</Label>
                  <Textarea
                    id="usage"
                    value={form.usage}
                    onChange={(e) => setForm(prev => ({ ...prev, usage: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="story">Product Story</Label>
                  <Textarea
                    id="story"
                    value={form.story}
                    onChange={(e) => setForm(prev => ({ ...prev, story: e.target.value }))}
                    rows={3}
                    placeholder="Tell the story behind this product..."
                  />
                </div>

                <div>
                  <Label htmlFor="features">Features (separate with |)</Label>
                  <Textarea
                    id="features"
                    value={form.features}
                    onChange={(e) => setForm(prev => ({ ...prev, features: e.target.value }))}
                    rows={2}
                    placeholder="Feature 1 | Feature 2 | Feature 3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      value={form.targetAudience}
                      onChange={(e) => setForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                      placeholder="Landscapers, Nurseries, etc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="certifications">Certifications</Label>
                    <Input
                      id="certifications"
                      value={form.certifications}
                      onChange={(e) => setForm(prev => ({ ...prev, certifications: e.target.value }))}
                      placeholder="OMRI, CDFA OIM, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="recommendedUses">Recommended Uses</Label>
                  <Textarea
                    id="recommendedUses"
                    value={form.recommendedUses}
                    onChange={(e) => setForm(prev => ({ ...prev, recommendedUses: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Pricing & Inventory */}
          <TabsContent value="pricing">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Inventory
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sizeOptions">Size Options (comma separated)</Label>
                  <Input
                    id="sizeOptions"
                    value={form.sizeOptions}
                    onChange={(e) => setForm(prev => ({ ...prev, sizeOptions: e.target.value }))}
                    placeholder="1CF, 2CF, Bulk"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minOrderQuantity">Min Order Quantity</Label>
                    <Input
                      id="minOrderQuantity"
                      type="number"
                      value={form.minOrderQuantity}
                      onChange={(e) => setForm(prev => ({ ...prev, minOrderQuantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxOrderQuantity">Max Order Quantity</Label>
                    <Input
                      id="maxOrderQuantity"
                      type="number"
                      value={form.maxOrderQuantity}
                      onChange={(e) => setForm(prev => ({ ...prev, maxOrderQuantity: parseInt(e.target.value) || 1000 }))}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isWholesaleOnly">Wholesale Only</Label>
                    <Switch
                      id="isWholesaleOnly"
                      checked={form.isWholesaleOnly}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, isWholesaleOnly: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isPriceNegotiable">Price Negotiable</Label>
                    <Switch
                      id="isPriceNegotiable"
                      checked={form.isPriceNegotiable}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, isPriceNegotiable: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requiresQuote">Requires Quote</Label>
                    <Switch
                      id="requiresQuote"
                      checked={form.requiresQuote}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, requiresQuote: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowBulkPickup">Allow Bulk Pickup</Label>
                    <Switch
                      id="allowBulkPickup"
                      checked={form.allowBulkPickup}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, allowBulkPickup: checked }))}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* SEO */}
          <TabsContent value="seo">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">SEO & Marketing</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seoKeywords">SEO Keywords</Label>
                  <Textarea
                    id="seoKeywords"
                    value={form.seoKeywords}
                    onChange={(e) => setForm(prev => ({ ...prev, seoKeywords: e.target.value }))}
                    rows={3}
                    placeholder="wholesale organic soil, bulk potting mix, commercial grade compost"
                  />
                </div>

                <div>
                  <Label htmlFor="marketingNote">Marketing Note</Label>
                  <Textarea
                    id="marketingNote"
                    value={form.marketingNote}
                    onChange={(e) => setForm(prev => ({ ...prev, marketingNote: e.target.value }))}
                    rows={2}
                    placeholder="Internal notes for marketing team"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </h2>
              <div className="text-sm text-gray-600">
                <p>Product ID: {productId || 'New'}</p>
                <p>Created: {isNew ? 'Not yet created' : 'Date will be shown here'}</p>
                <p>Last Modified: {isNew ? 'Not yet created' : 'Date will be shown here'}</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </AdminLayout>
  );
};

export default AdminProductEdit;