import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Printer, Mail, Eye, Download, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BOL {
  id: number;
  bolNumber: string;
  date: string;
  customerName: string;
  destinationAddress: string;
  materialType: string;
  netWeight: number;
  netWeightTons: string;
  status: string;
  createdAt: string;
}

export default function Operations() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: bols, isLoading, refetch } = useQuery<BOL[]>({
    queryKey: ['bols', statusFilter, dateFilter],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') params.append('dateFilter', dateFilter);

      const response = await fetch(`/api/admin/operations/bols?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch BOLs');
      return response.json();
    }
  });

  const filteredBOLs = bols?.filter(bol => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bol.bolNumber.toLowerCase().includes(query) ||
      bol.customerName.toLowerCase().includes(query) ||
      bol.materialType.toLowerCase().includes(query) ||
      bol.destinationAddress.toLowerCase().includes(query)
    );
  }) || [];

  const handlePrint = async (bolId: number) => {
    const token = localStorage.getItem('adminToken');
    window.open(`/api/admin/operations/bols/${bolId}/pdf?token=${token}`, '_blank');
  };

  const handleEmail = async (bolId: number) => {
    // TODO: Implement email dialog
    console.log('Email BOL:', bolId);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary",
      sent: "default",
      delivered: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Operations - BOL Management</h1>
              <p className="text-sm text-gray-500 mt-1">Create and manage Bills of Lading / Weight Tickets</p>
            </div>
            <Button
              onClick={() => navigate('/admin/operations/bols/new')}
              className="bg-[#264027] hover:bg-[#3c5233]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New BOL
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total BOLs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredBOLs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredBOLs.filter(b => {
                    const bolDate = new Date(b.createdAt);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return bolDate >= weekAgo;
                  }).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredBOLs.filter(b => b.status === 'draft').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {filteredBOLs.filter(b => b.status === 'delivered').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>BOL History</CardTitle>
              <CardDescription>All Bills of Lading ever created</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by BOL #, customer, material, or destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="3months">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* BOL Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>BOL #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Net Weight</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Loading BOLs...
                        </TableCell>
                      </TableRow>
                    ) : filteredBOLs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          No BOLs found. Click "Create New BOL" to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBOLs.map((bol) => (
                        <TableRow key={bol.id}>
                          <TableCell className="font-medium">{bol.bolNumber}</TableCell>
                          <TableCell>{format(new Date(bol.date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{bol.customerName}</TableCell>
                          <TableCell className="max-w-xs truncate">{bol.destinationAddress}</TableCell>
                          <TableCell>{bol.materialType}</TableCell>
                          <TableCell className="text-right">
                            {bol.netWeight.toLocaleString()} lbs<br />
                            <span className="text-sm text-gray-500">({bol.netWeightTons} tons)</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(bol.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrint(bol.id)}
                                title="Print"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEmail(bol.id)}
                                title="Email"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/operations/bols/${bol.id}`)}
                                title="View/Edit"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                Showing {filteredBOLs.length} BOL{filteredBOLs.length !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
