import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import api from '@/services/api';

interface PlatformOverview {
  totalUsers: number;
  totalEvents: number;
  totalPledges: number;
  totalAmount: number;
  activeEvents: number;
  completedEvents: number;
  pendingPayments: number;
  successRate: number;
}

interface ReportData {
  id: number;
  type: string;
  title: string;
  status: string;
  created_at: string;
  data: any;
}

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for now - replace with actual API calls
      setOverview({
        totalUsers: 150,
        totalEvents: 45,
        totalPledges: 320,
        totalAmount: 125000,
        activeEvents: 12,
        completedEvents: 33,
        pendingPayments: 5,
        successRate: 85.5
      });

      setReports([
        {
          id: 1,
          type: 'daily',
          title: 'Daily Report - Oct 31, 2025',
          status: 'completed',
          created_at: new Date().toISOString(),
          data: {}
        }
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully`);
      loadDashboardData();
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId: number, reportTitle: string) => {
    try {
      const data = { id: reportId, title: reportTitle, generatedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportTitle.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Reports & Analytics</h1>
            <p className="text-gray-600 mt-2">Comprehensive platform insights and reporting dashboard</p>
          </div>

          {/* Overview Cards */}
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalEvents.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {overview.activeEvents} active, {overview.completedEvents} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(overview.totalAmount)}</div>
                  <p className="text-xs text-muted-foreground">
                    From {overview.totalPledges.toLocaleString()} pledges
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.successRate.toFixed(1)}%</div>
                  <Progress value={overview.successRate} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
            </TabsList>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generated Reports</CardTitle>
                  <CardDescription>Recent system reports and analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{report.title}</h3>
                            <p className="text-sm text-gray-500">
                              Generated on {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant={report.status === 'completed' ? 'default' : 'secondary'}>
                            {report.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {report.status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {report.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report.id, report.title)}
                            disabled={report.status !== 'completed'}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate New Report</CardTitle>
                  <CardDescription>Create detailed reports for specific time periods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reportType">Report Type</Label>
                        <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily Report</SelectItem>
                            <SelectItem value="weekly">Weekly Report</SelectItem>
                            <SelectItem value="monthly">Monthly Report</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="reportDate">Date</Label>
                        <Input
                          id="reportDate"
                          type="date"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                        />
                      </div>

                      <Button 
                        onClick={generateReport} 
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">Report Preview</h3>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Type:</strong> {reportType.charAt(0).toUpperCase() + reportType.slice(1)}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Date:</strong> {reportDate}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Includes:</strong> User metrics, event statistics, financial data, performance analytics
                        </p>
                      </div>
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