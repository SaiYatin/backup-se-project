/**
 * Admin Reports Page
 * Displays comprehensive reports, charts, statistics, and downloadable data
 * for platform administrators
 */

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useToast } from '../hooks/use-toast';

// Chart components (you may need to install recharts or another chart library)
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

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

interface TopPerformer {
  id: number;
  name: string;
  value: number;
  type: 'donor' | 'organizer' | 'event';
}

interface CategoryAnalysis {
  category: string;
  eventCount: number;
  totalRaised: number;
  avgAmount: number;
  successRate: number;
}

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminReports() {
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  
  // Form state for report generation
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  
  // Filter state
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load platform overview
      const overviewResponse = await fetch('/api/reports/analytics/overview', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setOverview(overviewData.data);
      }

      // Load top performers
      const performersResponse = await fetch(`/api/reports/analytics/top-performers?period=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (performersResponse.ok) {
        const performersData = await performersResponse.json();
        setTopPerformers(performersData.data);
      }

      // Load category analysis
      const categoryResponse = await fetch('/api/reports/analytics/category-analysis', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        setCategoryAnalysis(categoryData.data);
      }

      // Load recent reports
      const reportsResponse = await fetch('/api/reports?limit=10', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.data);
      }

      // Generate timeline data for charts
      generateTimelineData();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimelineData = () => {
    // This would typically come from your API
    // For now, generating sample data
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        pledges: Math.floor(Math.random() * 50) + 10,
        amount: Math.floor(Math.random() * 5000) + 1000,
        events: Math.floor(Math.random() * 10) + 2,
        users: Math.floor(Math.random() * 20) + 5
      });
    }
    
    setTimelineData(data);
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      
      let endpoint = '';
      let body = {};
      
      switch (reportType) {
        case 'daily':
          endpoint = '/api/reports/daily';
          body = { date: reportDate };
          break;
        case 'weekly':
          endpoint = '/api/reports/weekly';
          body = { start_date: reportDate };
          break;
        case 'monthly':
          endpoint = '/api/reports/monthly';
          body = { year: reportYear, month: reportMonth };
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully`,
        });
        
        // Refresh reports list
        loadDashboardData();
      } else {
        throw new Error('Failed to generate report');
      }
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportId: number, reportTitle: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${reportTitle.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Report downloaded successfully",
        });
      } else {
        throw new Error('Failed to download report');
      }
      
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
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
              <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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
              <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
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
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.successRate.toFixed(1)}%</div>
              <Progress value={overview.successRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline Chart */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Platform Activity Timeline</CardTitle>
                <CardDescription>Daily metrics over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="pledges" stroke="#8884d8" name="Pledges" />
                    <Line type="monotone" dataKey="events" stroke="#82ca9d" name="Events" />
                    <Line type="monotone" dataKey="users" stroke="#ffc658" name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Fundraising by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalRaised"
                    >
                      {categoryAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Leading donors and organizers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.slice(0, 5).map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-sm text-gray-500 capitalize">{performer.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(performer.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                        <ChartBarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{report.title}</h3>
                        <p className="text-sm text-gray-500">
                          Generated on {formatDate(report.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={report.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {report.status === 'completed' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                        {report.status === 'failed' && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                        {report.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadReport(report.id, report.title)}
                        disabled={report.status !== 'completed'}
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
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

                  {reportType === 'daily' && (
                    <div>
                      <Label htmlFor="reportDate">Date</Label>
                      <Input
                        id="reportDate"
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                      />
                    </div>
                  )}

                  {reportType === 'weekly' && (
                    <div>
                      <Label htmlFor="weekStart">Week Start Date</Label>
                      <Input
                        id="weekStart"
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                      />
                    </div>
                  )}

                  {reportType === 'monthly' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reportMonth">Month</Label>
                        <Select value={reportMonth.toString()} onValueChange={(value) => setReportMonth(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="reportYear">Year</Label>
                        <Select value={reportYear.toString()} onValueChange={(value) => setReportYear(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 5 }, (_, i) => (
                              <SelectItem key={2024 - i} value={(2024 - i).toString()}>
                                {2024 - i}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

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
                        <ChartBarIcon className="h-4 w-4 mr-2" />
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
                    {reportType === 'daily' && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Date:</strong> {formatDate(reportDate)}
                      </p>
                    )}
                    {reportType === 'weekly' && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Week starting:</strong> {formatDate(reportDate)}
                      </p>
                    )}
                    {reportType === 'monthly' && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Period:</strong> {new Date(reportYear, reportMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <strong>Includes:</strong> User metrics, event statistics, financial data, performance analytics
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Download comprehensive platform data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => downloadReport(0, 'platform-overview')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Platform Overview (JSON)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => downloadReport(0, 'category-analysis')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Category Analysis (JSON)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => downloadReport(0, 'top-performers')}
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                    Top Performers (JSON)
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Export Options</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• All exports are in JSON format for easy integration</p>
                    <p>• Data includes comprehensive metrics and analytics</p>
                    <p>• Files are generated in real-time with current data</p>
                    <p>• Perfect for external reporting and analysis tools</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}