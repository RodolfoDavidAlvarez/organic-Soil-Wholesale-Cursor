import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

type DriveThruSize = {
  id?: string;
  label: string;
  unit: string;
  priceCents: number;
  stockQty: number;
  pickupWindowMinutes: number;
  isDefault: boolean;
};

type DriveThruProduct = {
  id: string;
  slug: string;
  name: string;
  displayTitle: string;
  headline: string;
  description: string;
  heroImageUrl: string;
  textureImageUrl: string;
  status: "active" | "inactive";
  orderIndex: number;
  sizes: DriveThruSize[];
};

type EditableProduct = DriveThruProduct & { isNew?: boolean };

const fetchDriveThruProducts = async (): Promise<DriveThruProduct[]> => {
  const response = await fetch("/api/drive-thru/admin/products");
  if (!response.ok) {
    throw new Error("Failed to load drive-thru products");
  }
  const data = await response.json();
  return data.products ?? [];
};

interface SavePayload {
  product: EditableProduct;
  sizes: DriveThruSize[];
}

const saveProduct = async (payload: SavePayload) => {
  const { product, sizes } = payload;
  const endpoint = product.isNew
    ? "/api/drive-thru/admin/products"
    : `/api/drive-thru/admin/products/${product.id}`;
  const method = product.isNew ? "POST" : "PUT";

  const response = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product: {
        slug: product.slug,
        name: product.name,
        displayTitle: product.displayTitle,
        headline: product.headline,
        description: product.description,
        heroImageUrl: product.heroImageUrl,
        textureImageUrl: product.textureImageUrl,
        status: product.status,
        orderIndex: product.orderIndex,
      },
      sizes: sizes.map((size) => ({
        id: size.id,
        label: size.label,
        unit: size.unit,
        priceCents: size.priceCents,
        stockQty: size.stockQty,
        pickupWindowMinutes: size.pickupWindowMinutes,
        isDefault: size.isDefault,
      })),
    }),
  });

  if (!response.ok) {
    const message = await response.json().catch(() => ({ error: "Failed to save product" }));
    throw new Error(message.error ?? "Failed to save product");
  }

  const data = await response.json();
  return data.product as DriveThruProduct;
};

const deleteProduct = async (id: string) => {
  const response = await fetch(`/api/drive-thru/admin/products/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const message = await response.json().catch(() => ({ error: "Failed to delete product" }));
    throw new Error(message.error ?? "Failed to delete product");
  }

  return true;
};

const DriveThruAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["driveThruProducts"],
    queryFn: fetchDriveThruProducts,
  });
  const [products, setProducts] = useState<EditableProduct[]>([]);

  useEffect(() => {
    if (data) {
      setProducts(data);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: saveProduct,
    onSuccess: (savedProduct, variables) => {
      queryClient.invalidateQueries({ queryKey: ["driveThruProducts"] });
      const savedEditable: EditableProduct = { ...savedProduct, isNew: false };
      setProducts((prev) => {
        let updated = false;
        const next = prev.map((product) => {
          if (product.id === variables.product.id) {
            updated = true;
            return savedEditable;
          }
          return product;
        });
        if (!updated) {
          next.push(savedEditable);
        }
        return next;
      });
      toast({ title: "Saved", description: "Drive-thru product updated successfully." });
    },
    onError: (mutationError: any) => {
      toast({
        title: "Save failed",
        description: mutationError?.message ?? "Unable to save product.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ["driveThruProducts"] });
      setProducts((prev) => prev.filter((product) => product.id !== id));
      toast({ title: "Deleted", description: "Drive-thru product removed." });
    },
    onError: (mutationError: any) => {
      toast({
        title: "Delete failed",
        description: mutationError?.message ?? "Unable to delete product.",
        variant: "destructive",
      });
    },
  });

  const handleFieldChange = (
    productId: string,
    field: keyof EditableProduct,
    value: string | number | "active" | "inactive"
  ) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, [field]: value }
          : product
      )
    );
  };

  const handleSizeChange = (
    productId: string,
    index: number,
    field: keyof DriveThruSize,
    value: string | number | boolean
  ) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        const updatedSizes = [...product.sizes];
        const updatedSize = { ...updatedSizes[index], [field]: value };
        updatedSizes[index] = updatedSize;
        return { ...product, sizes: updatedSizes };
      })
    );
  };

  const handleAddSize = (productId: string) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        return {
          ...product,
          sizes: [
            ...product.sizes,
            {
              id: undefined,
              label: "",
              unit: "bag",
              priceCents: 0,
              stockQty: 0,
              pickupWindowMinutes: 20,
              isDefault: false,
            },
          ],
        };
      })
    );
  };

  const handleRemoveSize = (productId: string, index: number) => {
    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== productId) return product;
        const updatedSizes = [...product.sizes];
        updatedSizes.splice(index, 1);
        return { ...product, sizes: updatedSizes };
      })
    );
  };

  const handleSaveProduct = (product: EditableProduct) => {
    const sanitizedSizes = product.sizes.map((size) => ({
      ...size,
      label: size.label.trim(),
      unit: size.unit.trim() || "bag",
      priceCents: Number.isFinite(size.priceCents) ? size.priceCents : 0,
      stockQty: Number.isFinite(size.stockQty) ? size.stockQty : 0,
      pickupWindowMinutes: Number.isFinite(size.pickupWindowMinutes)
        ? size.pickupWindowMinutes
        : 20,
      isDefault: Boolean(size.isDefault),
    }));

    saveMutation.mutate({
      product,
      sizes: sanitizedSizes,
    });
  };

  const handleAddProduct = () => {
    const tempId = `temp-${Date.now()}`;
    const lastProduct = products.length > 0 ? products[products.length - 1] : undefined;
    const orderIndex = (lastProduct?.orderIndex ?? products.length) + 1;
    const newProduct: EditableProduct = {
      id: tempId,
      slug: "",
      name: "",
      displayTitle: "",
      headline: "",
      description: "",
      heroImageUrl: "",
      textureImageUrl: "",
      status: "inactive",
      orderIndex,
      sizes: [],
      isNew: true,
    };
    setProducts((prev) => [...prev, newProduct]);
  };

  const handleDeleteProduct = (product: EditableProduct) => {
    if (product.isNew || product.id.startsWith("temp-")) {
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      return;
    }

    if (!confirm(`Delete ${product.displayTitle || product.name}?`)) {
      return;
    }

    deleteMutation.mutate(product.id);
  };

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.orderIndex - b.orderIndex),
    [products]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p>Loading drive-thru catalog…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p>{error instanceof Error ? error.message : "Failed to load drive-thru catalog."}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drive-Thru Catalog</h1>
            <p className="text-slate-300 text-sm mt-2">
              Update drive-thru products, pricing, and availability shown on the pay &amp; pickup workflow.
            </p>
          </div>
          <Button onClick={handleAddProduct} variant="secondary">
            Add Product
          </Button>
        </header>

        {sortedProducts.length === 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-10 text-center">
              <p>No drive-thru products configured yet.</p>
              <Button className="mt-4" onClick={handleAddProduct}>
                Create your first product
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {sortedProducts.map((product) => (
            <Card key={product.id} className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-xl">
                  {product.displayTitle || product.name || "Untitled Product"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={product.status === "active" ? "default" : "outline"}>
                    {product.status === "active" ? "Active" : "Hidden"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProduct(product)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`name-${product.id}`}>Public Name</Label>
                      <Input
                        id={`name-${product.id}`}
                        value={product.name}
                        onChange={(event) =>
                          handleFieldChange(product.id, "name", event.target.value)
                        }
                        placeholder="Mikey’s Worm Poop"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`display-${product.id}`}>Display Title</Label>
                      <Input
                        id={`display-${product.id}`}
                        value={product.displayTitle}
                        onChange={(event) =>
                          handleFieldChange(product.id, "displayTitle", event.target.value)
                        }
                        placeholder="Drive-Thru Favorite"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`headline-${product.id}`}>Headline</Label>
                      <Input
                        id={`headline-${product.id}`}
                        value={product.headline}
                        onChange={(event) =>
                          handleFieldChange(product.id, "headline", event.target.value)
                        }
                        placeholder="Short marketing headline"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`slug-${product.id}`}>Slug</Label>
                      <Input
                        id={`slug-${product.id}`}
                        value={product.slug}
                        onChange={(event) =>
                          handleFieldChange(product.id, "slug", event.target.value)
                        }
                        placeholder="mikeys-worm-poop"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`hero-${product.id}`}>Hero Image URL</Label>
                      <Input
                        id={`hero-${product.id}`}
                        value={product.heroImageUrl}
                        onChange={(event) =>
                          handleFieldChange(product.id, "heroImageUrl", event.target.value)
                        }
                        placeholder="https://cdn.example.com/hero.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`texture-${product.id}`}>Texture Image URL</Label>
                      <Input
                        id={`texture-${product.id}`}
                        value={product.textureImageUrl}
                        onChange={(event) =>
                          handleFieldChange(product.id, "textureImageUrl", event.target.value)
                        }
                        placeholder="https://cdn.example.com/texture.jpg"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`order-${product.id}`}>Display Order</Label>
                      <Input
                        id={`order-${product.id}`}
                        type="number"
                        value={product.orderIndex}
                        onChange={(event) =>
                          handleFieldChange(product.id, "orderIndex", Number(event.target.value))
                        }
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`status-${product.id}`}
                        checked={product.status === "active"}
                        onCheckedChange={(value) =>
                          handleFieldChange(product.id, "status", value ? "active" : "inactive")
                        }
                      />
                      <Label htmlFor={`status-${product.id}`}>Show in drive-thru menu</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor={`description-${product.id}`}>Product Overview</Label>
                  <Textarea
                    id={`description-${product.id}`}
                    value={product.description}
                    onChange={(event) =>
                      handleFieldChange(product.id, "description", event.target.value)
                    }
                    placeholder="What should the customer know about this product?"
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Sizes &amp; Pricing</h3>
                    <Button variant="outline" size="sm" onClick={() => handleAddSize(product.id)}>
                      Add Size
                    </Button>
                  </div>
                  <Separator className="my-3 bg-slate-800" />

                  {product.sizes.length === 0 && (
                    <p className="text-sm text-slate-400">
                      No size options yet. Add at least one to sell this product.
                    </p>
                  )}

                  <div className="space-y-4">
                    {product.sizes.map((size, index) => (
                      <div
                        key={size.id ?? `${product.id}-size-${index}`}
                        className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="md:col-span-2">
                            <Label>Label</Label>
                            <Input
                              value={size.label}
                              onChange={(event) =>
                                handleSizeChange(product.id, index, "label", event.target.value)
                              }
                              placeholder="9lb Bag"
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input
                              value={size.unit}
                              onChange={(event) =>
                                handleSizeChange(product.id, index, "unit", event.target.value)
                              }
                              placeholder="bag"
                            />
                          </div>
                          <div>
                            <Label>Price (USD)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={(size.priceCents / 100).toFixed(2)}
                              onChange={(event) =>
                                handleSizeChange(
                                  product.id,
                                  index,
                                  "priceCents",
                                  Math.round(parseFloat(event.target.value || "0") * 100)
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Stock</Label>
                            <Input
                              type="number"
                              value={size.stockQty}
                              onChange={(event) =>
                                handleSizeChange(
                                  product.id,
                                  index,
                                  "stockQty",
                                  Number(event.target.value)
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <Label>Pickup Window (minutes)</Label>
                            <Input
                              type="number"
                              value={size.pickupWindowMinutes}
                              onChange={(event) =>
                                handleSizeChange(
                                  product.id,
                                  index,
                                  "pickupWindowMinutes",
                                  Number(event.target.value)
                                )
                              }
                              min={5}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`default-${product.id}-${index}`}
                              checked={size.isDefault}
                              onCheckedChange={(checked) =>
                                handleSizeChange(product.id, index, "isDefault", checked)
                              }
                            />
                            <Label htmlFor={`default-${product.id}-${index}`}>
                              Default option
                            </Label>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSize(product.id, index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="default"
                    onClick={() => handleSaveProduct(product)}
                    disabled={saveMutation.isPending}
                  >
                    {product.isNew ? "Create Product" : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DriveThruAdmin;
