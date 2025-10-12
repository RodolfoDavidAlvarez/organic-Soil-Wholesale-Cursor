import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedImage } from "@/components/OptimizedImage";
import { X, Save, Upload } from "lucide-react";

// Extended Product interface that includes texturePhotoUrl
interface ExtendedProduct {
  id: number;
  name: string;
  description?: string;
  category: string;
  type?: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string | null;
  texturePhotoUrl?: string | null;
  ingredients?: string | null;
  targetAudience?: string | null;
  recommendedUses?: string | null;
  story?: string | null;
  usage?: string | null;
  certifications?: string | null;
  features?: string | null;
  sizeOptions?: string | null;
  productType?: string | null;
  displayTitle?: string | null;
  marketingTitle?: string | null;
  seoKeywords?: string | null;
  marketingNote?: string | null;
  productVideoUrl?: string | null;
  productVideoTitle?: string | null;
  safetyPrecautions?: string | null;
  warranty?: string | null;
  isWholesaleOnly?: boolean;
  additionalImages?: string[] | null;
}

interface ProductEditorProps {
  product: ExtendedProduct;
  onSave: (product: ExtendedProduct) => void;
  onCancel: () => void;
}

export function ProductEditor({ product, onSave, onCancel }: ProductEditorProps) {
  const [editedProduct, setEditedProduct] = useState<ExtendedProduct>({ ...product });
  const [imagePreview, setImagePreview] = useState({
    texturePhoto: editedProduct.texturePhotoUrl || "",
    bagPhoto: editedProduct.imageUrl || "",
  });

  const handleFieldChange = (field: keyof ExtendedProduct, value: any) => {
    setEditedProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUrlChange = (type: "texture" | "bag", url: string) => {
    if (type === "texture") {
      handleFieldChange("texturePhotoUrl", url);
      setImagePreview((prev) => ({ ...prev, texturePhoto: url }));
    } else {
      handleFieldChange("imageUrl", url);
      setImagePreview((prev) => ({ ...prev, bagPhoto: url }));
    }
  };

  const handleSave = () => {
    onSave(editedProduct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Edit Product: {editedProduct.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={editedProduct.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={editedProduct.description || ""}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editedProduct.category}
                  onChange={(e) => handleFieldChange("category", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={editedProduct.type || ""}
                  onChange={(e) => handleFieldChange("type", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Images</h3>
            
            {/* Texture Photo */}
            <div className="space-y-2">
              <Label>Texture Photo URL (Primary Image)</Label>
              <div className="flex gap-2">
                <Input
                  value={editedProduct.texturePhotoUrl || ""}
                  onChange={(e) => handleImageUrlChange("texture", e.target.value)}
                  placeholder="e.g., compost-texture-look.jpg"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {imagePreview.texturePhoto && (
                <div className="mt-2 relative w-48 h-48 border rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={imagePreview.texturePhoto}
                    alt="Texture preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Bag Photo */}
            <div className="space-y-2">
              <Label>9lb Bag Photo URL</Label>
              <div className="flex gap-2">
                <Input
                  value={editedProduct.imageUrl || ""}
                  onChange={(e) => handleImageUrlChange("bag", e.target.value)}
                  placeholder="e.g., dansgold9lbs-1.jpg"
                />
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {imagePreview.bagPhoto && (
                <div className="mt-2 relative w-48 h-48 border rounded-lg overflow-hidden">
                  <OptimizedImage
                    src={imagePreview.bagPhoto}
                    alt="Bag preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Additional Images */}
            <div className="space-y-2">
              <Label>Additional Images (comma-separated)</Label>
              <Textarea
                value={editedProduct.additionalImages?.join(", ") || ""}
                onChange={(e) => 
                  handleFieldChange(
                    "additionalImages",
                    e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  )
                }
                placeholder="image1.jpg, image2.jpg, image3.jpg"
                rows={2}
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="ingredients">Ingredients</Label>
              <Textarea
                id="ingredients"
                value={editedProduct.ingredients || ""}
                onChange={(e) => handleFieldChange("ingredients", e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="usage">Usage Instructions</Label>
              <Textarea
                id="usage"
                value={editedProduct.usage || ""}
                onChange={(e) => handleFieldChange("usage", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="features">Key Features (pipe-separated)</Label>
              <Textarea
                id="features"
                value={editedProduct.features || ""}
                onChange={(e) => handleFieldChange("features", e.target.value)}
                rows={3}
                placeholder="Feature 1|Feature 2|Feature 3"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}