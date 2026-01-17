import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  Users,
  Mail,
  MailOpen,
  MousePointerClick,
  MessageSquare,
  AlertCircle,
  Building2,
  Leaf,
  GraduationCap,
  ArrowRight,
  Percent,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import ProtectedAdminRoute from '@/components/admin/ProtectedAdminRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

// Segment label mapping
const SEGMENT_LABELS: Record<string, string> = {
  operator: 'Operator',
  farmer_vineyard: 'Vineyard',
  farmer_orchard: 'Orchard',
  farmer_general: 'Farmer',
  waste_hauler: 'Hauler',
  landscaper: 'Landscaper',
  municipal: 'Municipal',
  equipment: 'Equipment',
  policy: 'Policy',
  esg: 'ESG',
  education: 'Education',
  other: 'Other',
  unknown: 'Unknown',
};

// Owner colors
const OWNER_COLORS: Record<string, string> = {
  ssw: 'bg-emerald-500',
  ufe: 'bg-blue-500',
  both: 'bg-purple-500',
};

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['adminAnalytics', dateRange],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      return response.json();
    },
  });

  const { data: emailCampaigns } = useQuery({
    queryKey: ['emailCampaigns'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/analytics/email-campaigns', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email campaigns');
      }

      return response.json();
    },
  });

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(1)}%`;
  };

  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <div className="space-y-6 p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">CRM Analytics</h1>
              <p className="text-muted-foreground text-sm">Track contacts, campaigns, and conversions</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Row */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalContacts || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.totalAllTime || 0} all time
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.emailMetrics?.sent || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.emailMetrics?.openRate || '0.0'}% open rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Replies</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.emailMetrics?.replied || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.emailMetrics?.replyRate || '0.0'}% reply rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.conversionFunnel?.conversion || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics?.totalContacts > 0
                        ? ((analytics.conversionFunnel?.conversion / analytics.totalContacts) * 100).toFixed(1)
                        : '0.0'}
                      % rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Pipeline Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Funnel</CardTitle>
                  <CardDescription>Contacts by sales pipeline stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['awareness', 'interest', 'consideration', 'conversion'].map((stage, index) => {
                      const count = analytics?.conversionFunnel?.[stage] || 0;
                      const total = analytics?.totalContacts || 1;
                      const percentage = (count / total) * 100;
                      const stageLabels: Record<string, string> = {
                        awareness: 'Awareness',
                        interest: 'Interest',
                        consideration: 'Consideration',
                        conversion: 'Conversion',
                      };
                      const stageColors = ['bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-green-500'];

                      return (
                        <div key={stage} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2">
                              {index > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                              {stageLabels[stage]}
                            </span>
                            <span className="font-medium">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className={stageColors[index]} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Breakdown Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* By Segment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Segment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics?.topSegments?.map((item: { name: string; count: number }) => (
                        <div key={item.name} className="flex justify-between items-center">
                          <span className="text-sm">{SEGMENT_LABELS[item.name] || item.name}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">No data</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* By Lead Source */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Lead Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics?.topSources?.map((item: { name: string; count: number }) => (
                        <div key={item.name} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{item.name?.replace(/_/g, ' ') || 'Unknown'}</span>
                          <Badge variant="secondary">{item.count}</Badge>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">No data</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* By Partner Owner */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Owner</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics?.byPartnerOwner || {}).map(([owner, count]) => (
                        <div key={owner} className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-sm">
                            {owner === 'ssw' && <Leaf className="h-4 w-4 text-emerald-500" />}
                            {owner === 'ufe' && <GraduationCap className="h-4 w-4 text-blue-500" />}
                            {owner === 'both' && <Building2 className="h-4 w-4 text-purple-500" />}
                            {owner.toUpperCase()}
                          </span>
                          <Badge className={`${OWNER_COLORS[owner]} text-white`}>{count as number}</Badge>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">No data</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(analytics?.byStatus || {}).map(([status, count]) => {
                      const statusColors: Record<string, string> = {
                        new: 'bg-gray-100 text-gray-800',
                        contacted: 'bg-amber-100 text-amber-800',
                        qualified: 'bg-blue-100 text-blue-800',
                        converted: 'bg-green-100 text-green-800',
                        replied: 'bg-purple-100 text-purple-800',
                        archived: 'bg-slate-100 text-slate-800',
                      };
                      return (
                        <Badge key={status} className={statusColors[status] || 'bg-gray-100'}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}: {count as number}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* EMAIL TAB */}
            <TabsContent value="email" className="space-y-6">
              {/* Email Metrics Cards */}
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Sent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.emailMetrics?.sent || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MailOpen className="h-4 w-4 text-blue-500" />
                      Delivered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.emailMetrics?.delivered || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MailOpen className="h-4 w-4 text-green-500" />
                      Opened
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.emailMetrics?.opened || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(analytics?.emailMetrics?.openRate || 0)} rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-purple-500" />
                      Clicked
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.emailMetrics?.clicked || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(analytics?.emailMetrics?.clickRate || 0)} rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-emerald-500" />
                      Replied
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.emailMetrics?.replied || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercent(analytics?.emailMetrics?.replyRate || 0)} rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      Bounced
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.emailMetrics?.bounced || 0}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Email Performance Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance Funnel</CardTitle>
                  <CardDescription>Conversion through email stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Sent', value: analytics?.emailMetrics?.sent || 0, color: 'bg-gray-500' },
                      { label: 'Delivered', value: analytics?.emailMetrics?.delivered || 0, color: 'bg-blue-500' },
                      { label: 'Opened', value: analytics?.emailMetrics?.opened || 0, color: 'bg-green-500' },
                      { label: 'Clicked', value: analytics?.emailMetrics?.clicked || 0, color: 'bg-purple-500' },
                      { label: 'Replied', value: analytics?.emailMetrics?.replied || 0, color: 'bg-emerald-500' },
                    ].map((item, index) => {
                      const maxValue = analytics?.emailMetrics?.sent || 1;
                      const percentage = (item.value / maxValue) * 100;
                      return (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.label}</span>
                            <span className="font-medium">{item.value}</span>
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CAMPAIGNS TAB */}
            <TabsContent value="campaigns" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Email campaign metrics by lead source</CardDescription>
                </CardHeader>
                <CardContent>
                  {emailCampaigns?.campaigns?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 font-medium">Campaign</th>
                            <th className="text-center py-3 px-2 font-medium">Sent</th>
                            <th className="text-center py-3 px-2 font-medium">Opened</th>
                            <th className="text-center py-3 px-2 font-medium">Open Rate</th>
                            <th className="text-center py-3 px-2 font-medium">Clicked</th>
                            <th className="text-center py-3 px-2 font-medium">Replied</th>
                            <th className="text-center py-3 px-2 font-medium">Reply Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailCampaigns.campaigns.map((campaign: any) => (
                            <tr key={campaign.name} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-2 font-medium capitalize">
                                {campaign.name?.replace(/_/g, ' ') || 'Unknown'}
                              </td>
                              <td className="text-center py-3 px-2">{campaign.sent}</td>
                              <td className="text-center py-3 px-2">{campaign.opened}</td>
                              <td className="text-center py-3 px-2">
                                <Badge
                                  variant={parseFloat(campaign.openRate) > 30 ? 'default' : 'secondary'}
                                  className={parseFloat(campaign.openRate) > 30 ? 'bg-green-500' : ''}
                                >
                                  {campaign.openRate}%
                                </Badge>
                              </td>
                              <td className="text-center py-3 px-2">{campaign.clicked}</td>
                              <td className="text-center py-3 px-2">{campaign.replied}</td>
                              <td className="text-center py-3 px-2">
                                <Badge
                                  variant={parseFloat(campaign.replyRate) > 10 ? 'default' : 'secondary'}
                                  className={parseFloat(campaign.replyRate) > 10 ? 'bg-emerald-500' : ''}
                                >
                                  {campaign.replyRate}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      No email campaigns found. Start sending follow-up emails to see campaign data.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Totals */}
              {emailCampaigns?.totals && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{emailCampaigns.totals.totalSent}</div>
                        <p className="text-xs text-muted-foreground">Total Sent</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{emailCampaigns.totals.totalOpened}</div>
                        <p className="text-xs text-muted-foreground">Total Opened</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{emailCampaigns.totals.totalClicked}</div>
                        <p className="text-xs text-muted-foreground">Total Clicked</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{emailCampaigns.totals.totalReplied}</div>
                        <p className="text-xs text-muted-foreground">Total Replied</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{emailCampaigns.totals.totalBounced}</div>
                        <p className="text-xs text-muted-foreground">Total Bounced</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {isLoading && (
            <div className="text-center py-10 text-muted-foreground">Loading analytics...</div>
          )}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}
