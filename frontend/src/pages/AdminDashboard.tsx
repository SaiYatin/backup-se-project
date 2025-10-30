import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  pendingApproval: number;
  flaggedEvents: number;
  totalPledges: number;
  totalAmount: number;
}

interface PendingEvent {
  id: string;
  title: string;
  organizerName: string;
  category: string;
  targetAmount: number;
  description: string;
  createdAt: string;
  status: string;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);
  const [flaggedEvents, setFlaggedEvents] = useState<PendingEvent[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsResponse = await api.get('/admin/stats');
      setStats(statsResponse.data.data);

      // Load pending events
      const pendingResponse = await api.get('/admin/events/pending');
      setPendingEvents(pendingResponse.data.data || []);

      // Load flagged events
      const flaggedResponse = await api.get('/admin/events/flagged');
      setFlaggedEvents(flaggedResponse.data.data || []);

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      setActionLoading(eventId);
      await api.post(`/admin/events/${eventId}/approve`);
      toast.success('Event approved successfully');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to approve event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      setActionLoading(eventId);
      await api.post(`/admin/events/${eventId}/reject`);
      toast.success('Event rejected');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (eventId: string) => {
    try {
      setActionLoading(eventId);
      await api.post(`/admin/events/${eventId}/flag`);
      toast.success('Event flagged for review');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to flag event');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Manage events, approvals, and platform oversight
            </p>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeEvents} active
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                  <AlertCircle className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{stats.pendingApproval}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requires action
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pledges</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPledges}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Platform-wide
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    ${stats.totalAmount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All time
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Event Management Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="pending">
                Pending Approval ({pendingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="flagged">
                Flagged ({flaggedEvents.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending Events */}
            <TabsContent value="pending" className="space-y-4">
              {pendingEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No events pending approval
                  </CardContent>
                </Card>
              ) : (
                pendingEvents.map((event) => (
                  <Card key={event.id} className="shadow-card">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <CardDescription>
                            By {event.organizerName} • {event.category} • Target: ${event.targetAmount.toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground line-clamp-3">
                        {event.description}
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(event.id)}
                          disabled={actionLoading === event.id}
                          variant="default"
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(event.id)}
                          disabled={actionLoading === event.id}
                          variant="destructive"
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => handleFlag(event.id)}
                          disabled={actionLoading === event.id}
                          variant="outline"
                          className="gap-2"
                        >
                          <Flag className="h-4 w-4" />
                          Flag
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Flagged Events */}
            <TabsContent value="flagged" className="space-y-4">
              {flaggedEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No flagged events
                  </CardContent>
                </Card>
              ) : (
                flaggedEvents.map((event) => (
                  <Card key={event.id} className="shadow-card border-destructive/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <CardDescription>
                            By {event.organizerName} • {event.category}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">Flagged</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground line-clamp-3">
                        {event.description}
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(event.id)}
                          disabled={actionLoading === event.id}
                          variant="default"
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(event.id)}
                          disabled={actionLoading === event.id}
                          variant="destructive"
                          className="gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;