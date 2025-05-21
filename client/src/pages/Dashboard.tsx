import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/shared/schema";
import { apiRequest } from "@/lib/queryClient";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { Loader2, Package, ShoppingBag, Truck, User as UserIcon } from "lucide-react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Fetch the user profile data
  const { data: userProfile, isLoading: profileLoading } = useQuery<User>({
    queryKey: ["/api/users/profile"],
    enabled: !!user,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !userProfile) {
    return null; // This will redirect due to the useEffect above
  }

  return (
    <div className="py-10 bg-neutral-50">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-heading font-bold text-primary mb-2">Welcome, {userProfile.fullName.split(" ")[0]}</h1>
        <p className="text-neutral-700 mb-8">Access your wholesale account and manage your orders</p>

        <Tabs defaultValue="orders" className="space-y-8">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="catalog">Wholesale Catalog</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>View and manage your wholesale orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
                  <p className="text-neutral-600 mb-6">You haven't placed any orders yet. Browse our wholesale catalog to place your first order.</p>
                  <Button className="bg-primary hover:bg-primary-light text-white" onClick={() => navigate("/catalog")}>
                    View Catalog
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Manage your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-6">
                  <Avatar className="h-16 w-16 mr-4">
                    <AvatarFallback className="bg-primary text-white text-lg">{getInitials(userProfile.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-medium">{userProfile.fullName}</h3>
                    <p className="text-neutral-600">{userProfile.email}</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Company Information</h4>
                    <dl className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-neutral-600">Company:</dt>
                        <dd className="col-span-2">{userProfile.companyName}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-neutral-600">Business Type:</dt>
                        <dd className="col-span-2">{userProfile.businessType}</dd>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <dt className="text-neutral-600">Phone:</dt>
                        <dd className="col-span-2">{userProfile.phoneNumber}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Shipping Address</h4>
                    <address className="not-italic">
                      {userProfile.address}
                      <br />
                      {userProfile.city}, {userProfile.state} {userProfile.zipCode}
                    </address>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="outline">Update Profile</Button>
                  <Button variant="outline">Change Password</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wholesale Catalog Tab */}
          <TabsContent value="catalog" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Wholesale Catalog</CardTitle>
                <CardDescription>Browse our products and place bulk orders at wholesale prices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Wholesale Catalog Coming Soon</h3>
                  <p className="text-neutral-600 mb-6">
                    Our wholesale pricing and ordering system is being set up. In the meantime, please contact our sales team for quotes and orders.
                  </p>
                  <Button
                    className="bg-primary hover:bg-primary-light text-white"
                    onClick={() => {
                      const element = document.querySelector('[data-value="catalog"]');
                      if (element instanceof HTMLElement) {
                        element.click();
                      }
                    }}
                  >
                    Contact Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
