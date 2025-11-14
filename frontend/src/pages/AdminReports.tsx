import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import api from '@/services/api';
import { Link } from 'react-router-dom';

interface PlatformOverview {
  totalUsers: number;
  totalEvents: number;
  totalPledges: number;
  activeEvents: number;
  completedEvents: number;
  pendingEvents: number;
  totalAmount: number;
  averagePledge: number;
  totalRaised: number;
  totalTarget: number;
  successRate: number;
  usersByRole?: Record<string, number>;
}

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadPlatformOverview();
  }, []);

  const loadPlatformOverview = async () => {
    try {
      setOverviewLoading(true);
      
      // Fetch real data from analytics endpoint
      const response = await api.get('/reports/analytics/overview');
      
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        setOverview({
          totalUsers: data.totalUsers || 0,
          totalEvents: data.totalEvents || 0,
          totalPledges: data.totalPledges || 0,
          activeEvents: data.activeEvents || 0,
          completedEvents: data.completedEvents || 0,
          pendingEvents: data.pendingEvents || 0,
          totalAmount: data.totalAmount || 0,
          averagePledge: data.averagePledge || 0,
          totalRaised: data.totalRaised || 0,
          totalTarget: data.totalTarget || 0,
          successRate: data.successRate || 0,
          usersByRole: data.usersByRole || {}
        });
      }
    } catch (error: any) {
      console.error('Error loading platform overview:', error);
      toast.error(error.response?.data?.error || 'Failed to load platform statistics');
      
      // Set empty state instead of keeping loading
      setOverview({
        totalUsers: 0,
        totalEvents: 0,
        totalPledges: 0,
        activeEvents: 0,
        completedEvents: 0,
        pendingEvents: 0,
        totalAmount: 0,
        averagePledge: 0,
        totalRaised: 0,
        totalTarget: 0,
        successRate: 0
      });
    } finally {
      setOverviewLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGeneratingReport(true);
      
      let endpoint = '';
      let payload: any = {};

      switch (reportType) {
        case 'daily':
          endpoint = '/reports/daily';
          payload = { date: reportDate };
          break;
        case 'weekly':
          endpoint = '/reports/weekly';
          payload = { start_date: reportDate };
          break;
        case 'monthly':
          const [year, month] = reportDate.split('-');
          endpoint = '/reports/monthly';
          payload = { year: parseInt(year), month: parseInt(month) };
          break;
      }

      const response = await api.post(endpoint, payload);

      if (response.data?.success) {
        toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully`);
        
        // Download the generated report
        if (response.data?.data?.id) {
          await downloadGeneratedReport(response.data.data);
        }
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadGeneratedReport = async (reportData: any) => {
    try {
      // Create a formatted JSON file with the report data
      const formattedData = {
        report_id: reportData.id,
        type: reportData.type,
        title: reportData.title,
        status: reportData.status,
        generated_at: reportData.created_at || new Date().toISOString(),
        data: reportData.data || reportData
      };

      const blob = new Blob([JSON.stringify(formattedData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `${reportData.type}-report-${reportDate}.json`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading platform statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Admin Reports & Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive platform insights and reporting dashboard
              </p>
            </div>
            <Link to="/admin/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Overview Cards */}
          {overview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card className="shadow-md hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalUsers.toLocaleString()}</div>
                  {overview.usersByRole && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {overview.usersByRole.donor || 0} donors, {overview.usersByRole.organizer || 0} organizers
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalEvents.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview.activeEvents} active, {overview.pendingEvents} pending
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(overview.totalAmount)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {overview.totalPledges.toLocaleString()} pledges
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md hover:shadow-lg transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.successRate.toFixed(1)}%</div>
                  <Progress value={overview.successRate} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview.completedEvents} completed events
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Additional Stats Row */}
          {overview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Pledge</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatCurrency(overview.averagePledge)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Per contribution
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Platform Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {formatCurrency(overview.totalTarget)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all events
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Funding Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">
                    {overview.totalTarget > 0 
                      ? ((overview.totalRaised / overview.totalTarget) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <Progress 
                    value={overview.totalTarget > 0 
                      ? (overview.totalRaised / overview.totalTarget) * 100
                      : 0
                    } 
                    className="mt-2" 
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Report Generation */}
          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="generate">Generate Report</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate New Report</CardTitle>
                  <CardDescription>
                    Create detailed reports for specific time periods with comprehensive analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column - Form */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reportType">Report Type</Label>
                        <Select 
                          value={reportType} 
                          onValueChange={(value: any) => setReportType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily Report</SelectItem>
                            <SelectItem value="weekly">Weekly Report</SelectItem>
                            <SelectItem value="monthly">Monthly Report</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reportType === 'daily' && 'Detailed breakdown for a specific day'}
                          {reportType === 'weekly' && 'Weekly summary starting from selected date'}
                          {reportType === 'monthly' && 'Complete monthly overview'}
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="reportDate">
                          {reportType === 'daily' ? 'Date' : reportType === 'weekly' ? 'Week Start Date' : 'Month'}
                        </Label>
                        <Input
                          id="reportDate"
                          type={reportType === 'monthly' ? 'month' : 'date'}
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      <Button 
                        onClick={generateReport} 
                        disabled={generatingReport || !reportDate}
                        className="w-full"
                        size="lg"
                      >
                        {generatingReport ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Generate & Download Report
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Report Preview</h3>
                      <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Report Type</p>
                            <p className="text-sm text-muted-foreground">
                              {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Period</p>
                            <p className="text-sm text-muted-foreground">
                              {reportDate ? new Date(reportDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                ...(reportType !== 'monthly' && { day: 'numeric' })
                              }) : 'Select a date'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Includes</p>
                            <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                              <li>• User activity metrics</li>
                              <li>• Event performance statistics</li>
                              <li>• Pledge and financial data</li>
                              <li>• Category breakdown</li>
                              <li>• Top performers analysis</li>
                              {reportType === 'monthly' && <li>• Growth comparison</li>}
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Format</p>
                            <p className="text-sm text-muted-foreground">
                              JSON (machine-readable, can be imported into analytics tools)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-900">
                          <strong>💡 Tip:</strong> Reports are generated in real-time and include
                          all data up to the current moment. Use these for auditing, analysis,
                          and stakeholder presentations.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity Summary</CardTitle>
                  <CardDescription>
                    Live platform activity (updates automatically)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {overview?.totalUsers || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Total Users</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {overview?.activeEvents || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Active Events</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {overview?.totalPledges || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Total Pledges</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {overview?.pendingEvents || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Pending Approval</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;