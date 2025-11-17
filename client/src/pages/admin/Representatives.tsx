import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Save,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Representative {
  id: number;
  slug: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  bio?: string;
  photo_url?: string;
  banner_image_url?: string;
  gallery_images?: string[];
  company_name?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  social_links?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    [key: string]: string | undefined;
  };
  custom_fields?: Record<string, any>;
  contact_button_text?: string;
  contact_card_button_text?: string;
  contact_form_title?: string;
  contact_form_description?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface RepresentativeFormData {
  slug: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  bio?: string;
  photoUrl?: string;
  bannerImageUrl?: string;
  galleryImages: string[];
  companyName?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    [key: string]: string | undefined;
  };
  customFields: Record<string, any>;
  contactButtonText?: string;
  contactCardButtonText?: string;
  contactFormTitle?: string;
  contactFormDescription?: string;
  isActive: boolean;
  displayOrder: number;
}

const createEmptyFormData = (): RepresentativeFormData => ({
  slug: '',
  name: '',
  email: '',
  phone: '',
  website: '',
  bio: '',
  photoUrl: '',
  companyName: '',
  title: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  bannerImageUrl: '',
  galleryImages: [],
  socialLinks: {},
  customFields: {},
  contactButtonText: 'Contact Me',
  contactCardButtonText: 'Download Contact Card',
  contactFormTitle: 'Get In Touch',
  contactFormDescription: '',
  isActive: true,
  displayOrder: 0,
});

export default function AdminRepresentatives() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const [formData, setFormData] = useState<RepresentativeFormData>(createEmptyFormData());

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: representatives = [],
    isLoading,
  } = useQuery<Representative[]>({
    queryKey: ['adminRepresentatives'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/representatives', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch representatives');
      }

      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RepresentativeFormData) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/representatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create representative');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRepresentatives'] });
      setIsDialogOpen(false);
      setFormData(createEmptyFormData());
      toast({
        title: 'Success',
        description: 'Representative created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RepresentativeFormData }) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/representatives/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update representative');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRepresentatives'] });
      setIsDialogOpen(false);
      setEditingRep(null);
      setFormData(createEmptyFormData());
      toast({
        title: 'Success',
        description: 'Representative updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/representatives/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete representative');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRepresentatives'] });
      toast({
        title: 'Success',
        description: 'Representative deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredReps = representatives.filter((rep) => {
    const search = searchTerm.toLowerCase();
    return (
      rep.name.toLowerCase().includes(search) ||
      rep.email.toLowerCase().includes(search) ||
      rep.slug.toLowerCase().includes(search) ||
      rep.company_name?.toLowerCase().includes(search)
    );
  });

  const handleAddGalleryImage = () => {
    setFormData({
      ...formData,
      galleryImages: [...(formData.galleryImages || []), ''],
    });
  };

  const handleGalleryImageChange = (index: number, value: string) => {
    const next = [...(formData.galleryImages || [])];
    next[index] = value;
    setFormData({
      ...formData,
      galleryImages: next,
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    const next = [...(formData.galleryImages || [])];
    next.splice(index, 1);
    setFormData({
      ...formData,
      galleryImages: next,
    });
  };

  const handleCreate = () => {
    setEditingRep(null);
    setFormData(createEmptyFormData());
    setIsDialogOpen(true);
  };

  const handleEdit = (rep: Representative) => {
    setEditingRep(rep);
    setFormData({
      slug: rep.slug,
      name: rep.name,
      email: rep.email,
      phone: rep.phone,
      website: rep.website,
      bio: rep.bio,
      photoUrl: rep.photo_url,
      bannerImageUrl: rep.banner_image_url,
      galleryImages: rep.gallery_images || [],
      companyName: rep.company_name,
      title: rep.title,
      address: rep.address,
      city: rep.city,
      state: rep.state,
      zipCode: rep.zip_code,
      socialLinks: rep.social_links || {},
      customFields: rep.custom_fields || {},
      contactButtonText: rep.contact_button_text || 'Contact Me',
      contactCardButtonText: rep.contact_card_button_text || 'Download Contact Card',
      contactFormTitle: rep.contact_form_title || 'Get In Touch',
      contactFormDescription: rep.contact_form_description || '',
      isActive: rep.is_active,
      displayOrder: rep.display_order,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this representative?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = () => {
    if (!formData.slug || !formData.name || !formData.email) {
      toast({
        title: 'Error',
        description: 'Slug, name, and email are required',
        variant: 'destructive',
      });
      return;
    }

    const payload: RepresentativeFormData = {
      ...formData,
      socialLinks: formData.socialLinks || {},
      customFields: formData.customFields || {},
      isActive: formData.isActive ?? true,
      displayOrder: formData.displayOrder ?? 0,
      galleryImages: (formData.galleryImages || []).filter((url) => url.trim().length > 0),
      contactButtonText: formData.contactButtonText || 'Contact Me',
      contactCardButtonText: formData.contactCardButtonText || 'Download Contact Card',
      contactFormTitle: formData.contactFormTitle || 'Get In Touch',
    };

    if (editingRep) {
      updateMutation.mutate({ id: editingRep.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleViewLandingPage = (slug: string) => {
    window.open(`/rep/${slug}`, '_blank');
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Representatives</h1>
              <p className="text-muted-foreground">
                Manage representative landing pages and contact information
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Representative
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Representatives</CardTitle>
                  <CardDescription>
                    {filteredReps.length} representative{filteredReps.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search representatives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading...</div>
              ) : filteredReps.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {searchTerm ? 'No representatives found' : 'No representatives yet. Create one to get started.'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReps.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {rep.photo_url && (
                              <img
                                src={rep.photo_url}
                                alt={rep.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div>{rep.name}</div>
                              {rep.title && (
                                <div className="text-sm text-muted-foreground">{rep.title}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3" />
                              {rep.email}
                            </div>
                            {rep.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3" />
                                {rep.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{rep.company_name || '-'}</TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-2 py-1 text-xs">
                            {rep.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rep.is_active ? 'default' : 'secondary'}>
                            {rep.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewLandingPage(rep.slug)}
                              title="View Landing Page"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(rep)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(rep.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Create/Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRep ? 'Edit Representative' : 'Create Representative'}
                </DialogTitle>
                <DialogDescription>
                  {editingRep
                    ? 'Update representative information'
                    : 'Add a new representative landing page'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">
                      Slug <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="slug"
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="john-smith"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL-friendly identifier (e.g., /rep/john-smith)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder ?? 0}
                      onChange={(e) =>
                        setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName || ''}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Sales Representative"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    value={formData.photoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerImageUrl">Banner Image URL</Label>
                  <Input
                    id="bannerImageUrl"
                    value={formData.bannerImageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, bannerImageUrl: e.target.value })}
                    placeholder="Large hero or background image"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional wide image that appears behind the hero section.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell us about this representative..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gallery Images</Label>
                  {(!formData.galleryImages || formData.galleryImages.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No gallery images yet. Add one or more image URLs to showcase the representative&apos;s work.
                    </p>
                  )}
                  <div className="space-y-2">
                    {(formData.galleryImages || []).map((url, index) => (
                      <div className="flex gap-2" key={`gallery-${index}`}>
                        <Input
                          value={url}
                          onChange={(e) => handleGalleryImageChange(index, e.target.value)}
                          placeholder="https://example.com/gallery.jpg"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveGalleryImage(index)}
                          aria-label="Remove image"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddGalleryImage}>
                    Add Gallery Image
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state || ''}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode || ''}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Social Links</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Facebook URL"
                      value={formData.socialLinks?.facebook || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: {
                            ...(formData.socialLinks || {}),
                            facebook: e.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      placeholder="Twitter URL"
                      value={formData.socialLinks?.twitter || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: {
                            ...(formData.socialLinks || {}),
                            twitter: e.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      placeholder="LinkedIn URL"
                      value={formData.socialLinks?.linkedin || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: {
                            ...(formData.socialLinks || {}),
                            linkedin: e.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      placeholder="Instagram URL"
                      value={formData.socialLinks?.instagram || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: {
                            ...(formData.socialLinks || {}),
                            instagram: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactButtonText">Contact Button Label</Label>
                    <Input
                      id="contactButtonText"
                      value={formData.contactButtonText || ''}
                      onChange={(e) => setFormData({ ...formData, contactButtonText: e.target.value })}
                      placeholder="Contact Me"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactCardButtonText">Contact Card Button Label</Label>
                    <Input
                      id="contactCardButtonText"
                      value={formData.contactCardButtonText || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, contactCardButtonText: e.target.value })
                      }
                      placeholder="Download Contact Card"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactFormTitle">Contact Form Title</Label>
                  <Input
                    id="contactFormTitle"
                    value={formData.contactFormTitle || ''}
                    onChange={(e) => setFormData({ ...formData, contactFormTitle: e.target.value })}
                    placeholder="Get In Touch"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactFormDescription">Contact Form Description</Label>
                  <Textarea
                    id="contactFormDescription"
                    value={formData.contactFormDescription || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, contactFormDescription: e.target.value })
                    }
                    rows={3}
                    placeholder="Short description that appears above the intake form button"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive ?? true}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {editingRep ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
