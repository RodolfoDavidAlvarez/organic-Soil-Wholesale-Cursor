import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { ArrowLeft, Save, Upload, X, Plus, Trash2, Eye, Settings, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  displayTitle?: string;
  description?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
  texturePhotoUrl?: string;
  ingredients?: string;
  targetAudience?: string;
  recommendedUses?: string;
  story?: string;
  usage?: string;
  certifications?: string;
  features?: string;
  marketingTitle?: string;
  marketingNote?: string;
  seoKeywords?: string;
  additionalImages?: string[];
}

export default function ProductEdit() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [, params] = useRoute("/products/:id/edit");
  const [, navigate] = useLocation();
  const productId = params?.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [showPreview, setShowPreview] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set());

  // Image upload refs
  const textureUploadRef = useRef<HTMLInputElement>(null);
  const galleryUploadRef = useRef<HTMLInputElement>(null);
  const heroUploadRef = useRef<HTMLInputElement>(null);

  // Image previews
  const [imagePreviews, setImagePreviews] = useState<{
    texture?: string;
    hero?: string;
    gallery: string[];
  }>({ gallery: [] });

  useEffect(() => {
    if (!authLoading && !admin) {
      navigate('/admin');
      return;
    }

    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
          setEditedProduct({ ...data });
        }
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (productId && admin) {
      loadProduct();
    }
  }, [productId, admin, authLoading, navigate]);

  const handleFieldChange = (field: keyof Product, value: any) => {
    setEditedProduct(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleImageUpload = async (file: File, type: 'texture' | 'hero' | 'gallery') => {
    const uploadKey = `${type}-${Date.now()}`;
    setUploadingImages(prev => new Set([...prev, uploadKey]));

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', `products/${productId}`);

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/uploads/product-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        const imageUrl = result.url;

        if (type === 'texture') {
          handleFieldChange('texturePhotoUrl', imageUrl);
          setImagePreviews(prev => ({ ...prev, texture: imageUrl }));
        } else if (type === 'hero') {
          handleFieldChange('imageUrl', imageUrl);
          setImagePreviews(prev => ({ ...prev, hero: imageUrl }));
        } else if (type === 'gallery') {
          const currentGallery = editedProduct?.additionalImages || [];
          handleFieldChange('additionalImages', [...currentGallery, imageUrl]);
          setImagePreviews(prev => ({ ...prev, gallery: [...prev.gallery, imageUrl] }));
        }
      } else {
        const errorData = await response.text();
        console.error('Upload failed:', response.status, errorData);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setUploadingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadKey);
        return newSet;
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'texture' | 'hero' | 'gallery') => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file, type);
    }
  };

  const removeGalleryImage = (index: number) => {
    const currentGallery = editedProduct?.additionalImages || [];
    const newGallery = currentGallery.filter((_, i) => i !== index);
    handleFieldChange('additionalImages', newGallery);
    setImagePreviews(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!editedProduct) return;

    setSaving(true);
    try {
      // Based on the actual database response, only use fields that definitely exist
      const safeFields = {
        name: editedProduct.name,
        description: editedProduct.description,
        category: editedProduct.category,
        price: Math.round((typeof editedProduct.price === 'number' ? editedProduct.price : parseFloat(editedProduct.price || '0')) * 100), // Convert dollars to cents
        image_url: editedProduct.imageUrl,
        texture_photo_url: editedProduct.texturePhotoUrl,
        ingredients: editedProduct.ingredients,
        target_audience: editedProduct.targetAudience,
        recommended_uses: editedProduct.recommendedUses,
        story: editedProduct.story,
        usage: editedProduct.usage,
        certifications: editedProduct.certifications,
        features: editedProduct.features,
        display_title: editedProduct.displayTitle,
        marketing_title: editedProduct.marketingTitle,
        marketing_note: editedProduct.marketingNote,
        seo_keywords: editedProduct.seoKeywords,
      };
      
      console.log('Saving product data (snake_case fields):', safeFields);
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(safeFields),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProduct(updatedProduct);
        setEditedProduct({ ...updatedProduct });
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        const errorData = await response.json();
        console.error('❌ Save failed:', response.status, errorData);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!admin) {
    navigate('/admin');
    return null;
  }

  if (!product || !editedProduct) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/products')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Products
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Edit: {editedProduct.displayTitle || editedProduct.name}
                </h1>
                <p className="text-sm text-gray-500">Product ID: {productId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              
              {/* Save Status Indicator */}
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Saved successfully
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Save failed
                </div>
              )}
              
              <Button
                onClick={handleSave}
                disabled={saving || uploadingImages.size > 0}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : uploadingImages.size > 0 ? 'Uploading...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-8 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-4xl'}`}>
          {/* Editor Panel */}
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="images" className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="seo" className="gap-2">
                  <Settings className="h-4 w-4" />
                  SEO
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Badge variant="outline">{editedProduct.category}</Badge>
                      </div>
                      <h2 className="text-2xl font-bold">
                        {editedProduct.displayTitle || editedProduct.name}
                      </h2>
                      <p className="text-gray-600">{editedProduct.description}</p>
                      {editedProduct.texturePhotoUrl && (
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <OptimizedImage
                            src={editedProduct.texturePhotoUrl}
                            alt={editedProduct.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Product Name</Label>
                          <Input
                            id="name"
                            value={editedProduct.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="displayTitle">Display Title</Label>
                          <Input
                            id="displayTitle"
                            value={editedProduct.displayTitle || ''}
                            onChange={(e) => handleFieldChange('displayTitle', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={editedProduct.category || ''}
                            onChange={(e) => handleFieldChange('category', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={editedProduct.price || ''}
                            onChange={(e) => handleFieldChange('price', parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          rows={4}
                          value={editedProduct.description || ''}
                          onChange={(e) => handleFieldChange('description', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Detailed Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="ingredients">Ingredients</Label>
                        <Textarea
                          id="ingredients"
                          rows={3}
                          value={editedProduct.ingredients || ''}
                          onChange={(e) => handleFieldChange('ingredients', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Textarea
                          id="targetAudience"
                          rows={2}
                          value={editedProduct.targetAudience || ''}
                          onChange={(e) => handleFieldChange('targetAudience', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="recommendedUses">Recommended Uses</Label>
                        <Textarea
                          id="recommendedUses"
                          rows={3}
                          value={editedProduct.recommendedUses || ''}
                          onChange={(e) => handleFieldChange('recommendedUses', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="story">Product Story</Label>
                        <Textarea
                          id="story"
                          rows={4}
                          value={editedProduct.story || ''}
                          onChange={(e) => handleFieldChange('story', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="usage">Usage Instructions</Label>
                        <Textarea
                          id="usage"
                          rows={4}
                          value={editedProduct.usage || ''}
                          onChange={(e) => handleFieldChange('usage', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="images" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Texture Photo (Primary)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {editedProduct.texturePhotoUrl ? (
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <OptimizedImage
                              src={editedProduct.texturePhotoUrl}
                              alt="Texture photo"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => handleFieldChange('texturePhotoUrl', '')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100"
                            onClick={() => textureUploadRef.current?.click()}
                          >
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Click to upload texture photo</p>
                            </div>
                          </div>
                        )}
                        <input
                          ref={textureUploadRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, 'texture')}
                        />
                        <Button
                          onClick={() => textureUploadRef.current?.click()}
                          variant="outline"
                          className="w-full gap-2"
                          disabled={uploadingImages.size > 0}
                        >
                          <Upload className="h-4 w-4" />
                          {uploadingImages.size > 0 ? 'Uploading...' : 'Upload Texture Photo'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Hero Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {editedProduct.imageUrl ? (
                          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                            <OptimizedImage
                              src={editedProduct.imageUrl}
                              alt="Hero image"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => handleFieldChange('imageUrl', '')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100"
                            onClick={() => heroUploadRef.current?.click()}
                          >
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Click to upload hero image</p>
                            </div>
                          </div>
                        )}
                        <input
                          ref={heroUploadRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, 'hero')}
                        />
                        <Button
                          onClick={() => heroUploadRef.current?.click()}
                          variant="outline"
                          className="w-full gap-2"
                          disabled={uploadingImages.size > 0}
                        >
                          <Upload className="h-4 w-4" />
                          {uploadingImages.size > 0 ? 'Uploading...' : 'Upload Hero Image'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Gallery Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {editedProduct.additionalImages && editedProduct.additionalImages.length > 0 && (
                          <div className="grid grid-cols-2 gap-4">
                            {editedProduct.additionalImages.map((image, index) => (
                              <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <OptimizedImage
                                  src={image}
                                  alt={`Gallery image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => removeGalleryImage(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <input
                          ref={galleryUploadRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, 'gallery')}
                        />
                        <Button
                          onClick={() => galleryUploadRef.current?.click()}
                          variant="outline"
                          className="w-full gap-2"
                          disabled={uploadingImages.size > 0}
                        >
                          <Plus className="h-4 w-4" />
                          {uploadingImages.size > 0 ? 'Uploading...' : 'Add Gallery Image'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO & Marketing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="marketingTitle">Marketing Title</Label>
                      <Input
                        id="marketingTitle"
                        value={editedProduct.marketingTitle || ''}
                        onChange={(e) => handleFieldChange('marketingTitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marketingNote">Marketing Note</Label>
                      <Textarea
                        id="marketingNote"
                        rows={3}
                        value={editedProduct.marketingNote || ''}
                        onChange={(e) => handleFieldChange('marketingNote', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="seoKeywords">SEO Keywords</Label>
                      <Textarea
                        id="seoKeywords"
                        rows={2}
                        value={editedProduct.seoKeywords || ''}
                        onChange={(e) => handleFieldChange('seoKeywords', e.target.value)}
                        placeholder="keyword1, keyword2, keyword3"
                      />
                    </div>
                    <div>
                      <Label htmlFor="certifications">Certifications</Label>
                      <Input
                        id="certifications"
                        value={editedProduct.certifications || ''}
                        onChange={(e) => handleFieldChange('certifications', e.target.value)}
                        placeholder="OMRI Listed, Organic"
                      />
                    </div>
                    <div>
                      <Label htmlFor="features">Key Features</Label>
                      <Textarea
                        id="features"
                        rows={3}
                        value={editedProduct.features || ''}
                        onChange={(e) => handleFieldChange('features', e.target.value)}
                        placeholder="Feature 1|Feature 2|Feature 3"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Preview Panel */}
          {showPreview && (
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <Card className="h-fit">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Product Card Preview */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="aspect-[4/3] bg-gray-100">
                        {editedProduct.texturePhotoUrl ? (
                          <OptimizedImage
                            src={editedProduct.texturePhotoUrl}
                            alt={editedProduct.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{editedProduct.category || 'Category'}</Badge>
                          {editedProduct.certifications && (
                            <Badge className="bg-green-100 text-green-800">
                              {editedProduct.certifications.split(',')[0]}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-lg mb-1">
                          {editedProduct.displayTitle || editedProduct.name}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {editedProduct.description}
                        </p>
                        {editedProduct.price && (
                          <p className="text-lg font-semibold text-green-600 mt-2">
                            ${editedProduct.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Product Detail Preview */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Product Detail View:</h4>
                      <div className="space-y-3 text-sm">
                        {editedProduct.ingredients && (
                          <div>
                            <span className="font-medium">Ingredients:</span>
                            <p className="text-gray-600">{editedProduct.ingredients}</p>
                          </div>
                        )}
                        {editedProduct.recommendedUses && (
                          <div>
                            <span className="font-medium">Recommended Uses:</span>
                            <p className="text-gray-600">{editedProduct.recommendedUses}</p>
                          </div>
                        )}
                        {editedProduct.features && (
                          <div>
                            <span className="font-medium">Features:</span>
                            <ul className="text-gray-600 list-disc list-inside">
                              {editedProduct.features.split('|').map((feature, index) => (
                                <li key={index}>{feature.trim()}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}