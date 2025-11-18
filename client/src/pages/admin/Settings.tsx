import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Mail, Clock, CheckCircle, XCircle, Shield, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedAdminRoute from "@/components/admin/ProtectedAdminRoute";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminInvitation {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export default function Settings() {
  const { admin } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");

  const isSuperAdmin = admin?.role === "super_admin";

  // Fetch invitations
  const { data: invitations, isLoading } = useQuery<AdminInvitation[]>({
    queryKey: ["adminInvitations"],
    queryFn: async () => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/invitations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Only super admins can view invitations");
        }
        throw new Error("Failed to fetch invitations");
      }

      return response.json();
    },
    enabled: isSuperAdmin,
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: async (data: { email: string; full_name: string; role: string }) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: "The invitation email has been sent successfully.",
      });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("admin");
      queryClient.invalidateQueries({ queryKey: ["adminInvitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendInvitation = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    sendInvitationMutation.mutate({
      email: inviteEmail.trim(),
      full_name: inviteName.trim() || undefined,
      role: inviteRole,
    });
  };

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`/api/admin/invitations/${invitationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled successfully. You can now send a new one.",
      });
      queryClient.invalidateQueries({ queryKey: ["adminInvitations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCancelInvitation = (invitationId: string) => {
    if (confirm("Are you sure you want to cancel this invitation? You will be able to send a new one after cancelling.")) {
      cancelInvitationMutation.mutate(invitationId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isSuperAdmin) {
    return (
      <ProtectedAdminRoute>
        <AdminLayout>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>Only super administrators can access this page.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </AdminLayout>
      </ProtectedAdminRoute>
    );
  }

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage system settings and administrator access</p>
            </div>
          </div>

          {/* Admin Management Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Admin Management
                  </CardTitle>
                  <CardDescription className="mt-1">Invite and manage administrators. Only super admins can access this section.</CardDescription>
                </div>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : invitations && invitations.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Sent</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Expires</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.map((invitation) => (
                          <tr key={invitation.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {invitation.email}
                              </div>
                            </td>
                            <td className="py-3 px-4">{invitation.full_name || "-"}</td>
                            <td className="py-3 px-4">
                              <Badge variant="secondary">{invitation.role}</Badge>
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(invitation.status)}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{formatDate(invitation.created_at)}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{formatDate(invitation.expires_at)}</td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end">
                                {invitation.status === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelInvitation(invitation.id)}
                                    disabled={cancelInvitationMutation.isPending}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    {cancelInvitationMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <X className="w-4 h-4 mr-1" />
                                        Cancel
                                      </>
                                    )}
                                  </Button>
                                )}
                                {invitation.status !== "pending" && (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>No invitations sent yet. Click "Send Invitation" to invite a new administrator.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invitation Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Admin Invitation</DialogTitle>
              <DialogDescription>
                Send an invitation email to a new administrator. They will receive a link to create their account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={sendInvitationMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Full Name (Optional)</Label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  disabled={sendInvitationMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole} disabled={sendInvitationMutation.isPending}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                    <SelectItem value="order_processor">Order Processor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)} disabled={sendInvitationMutation.isPending}>
                Cancel
              </Button>
              <Button onClick={handleSendInvitation} disabled={sendInvitationMutation.isPending || !inviteEmail}>
                {sendInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
