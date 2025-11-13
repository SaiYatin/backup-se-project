import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  CheckCircle, 
  XCircle, 
  Flag, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertCircle,
  DollarSign,
  Eye,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { Link } from 'react-router-dom';

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  pendingApproval: number;
  flaggedEvents: number;
  totalPledges: number;
  totalAmount: number;
}

interface EventWithDetails {
  id: string;
  title: string;
  organizerName: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  description: string;
  createdAt: string;
  endDate: string;
  status: string;
  image?: string;
  pledgeCount?: number;
  pledges?: Pledge[];
}

interface Pledge {
  id: string;
  userName: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [pendingEvents, setPendingEvents] = useState<EventWithDetails[]>([]);
  const [flaggedEvents, setFlaggedEvents] = useState<EventWithDetails[]>([]);
  const [allEvents, setAllEvents] = useState<EventWithDetails[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [eventPledges, setEventPledges] = useState<Record<string, Pledge[]>>({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load all events
      const eventsResponse = await api.get('/admin/events');
      const events = eventsResponse.data.data || [];
      
      // Get all pledges
      const pledgesResponse = await api.get('/admin/pledges');
      const allPledges = pledgesResponse.data.data || [];
      
      // Process events with pledge data
      const processedEvents = events.map((event: any) => {
        const eventPledges = allPledges.filter((p: any) => 
          String(p.event_id) === String(event.id)
        );
        
        const currentAmount = eventPledges.reduce((sum: number, p: any) => 
          sum + Number(p.amount), 0
        );
        
        return {
          id: event.id,
          title: event.title,
          organizerName: event.organizer?.name || 'Unknown',
          category: event.category,
          targetAmount: Number(event.target_amount),
          currentAmount: currentAmount,
          description: event.description,
          createdAt: event.created_at,
          endDate: event.end_date,
          status: event.status,
          image: event.image_url,
          pledgeCount: eventPledges.length,
        };
      });

      // Separate events by status
      const pending = processedEvents.filter((e: EventWithDetails) => e.status === 'pending');
      const flagged = processedEvents.filter((e: EventWithDetails) => e.status === 'flagged');
      const active = processedEvents.filter((e: EventWithDetails) => e.status === 'active');
      
      setPendingEvents(pending);
      setFlaggedEvents(flagged);
      setAllEvents(processedEvents);

      // Calculate stats
      const totalAmount = processedEvents.reduce((sum: number, e: EventWithDetails) => 
        sum + e.currentAmount, 0
      );
      
      setStats({
        totalEvents: processedEvents.length,
        activeEvents: active.length,
        pendingApproval: pending.length,
        flaggedEvents: flagged.length,
        totalPledges: allPledges.length,
        totalAmount: totalAmount,
      });

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadEventPledges = async (eventId: string) => {
    if (eventPledges[eventId]) {
      return; // Already loaded
    }

    try {
      const response = await api.get(`/pledges?event_id=${eventId}`);
      const pledges = (response.data.data || []).map((p: any) => ({
        id: p.id,
        userName: p.donor?.name || 'Anonymous',
        amount: Number(p.amount),
        isAnonymous: p.is_anonymous,
        message: p.message,
        createdAt: p.created_at,
      }));
      
      setEventPledges(prev => ({ ...prev, [eventId]: pledges }));
    } catch (error) {
      console.error('Error loading pledges:', error);
      toast.error('Failed to load pledges');
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      setActionLoading(eventId);
      await api.put(`/admin/events/${eventId}/approve`);
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
      await api.put(`/admin/events/${eventId}/reject`);
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
      await api.put(`/admin/events/${eventId}/flag`);
      toast.success('Event flagged for review');
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to flag event');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleEventDetails = async (eventId: string) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null);
    } else {
      setExpandedEvent(eventId);
      await loadEventPledges(eventId);
    }
  };

  const EventCard = ({ event, showActions = true }: { event: EventWithDetails; showActions?: boolean }) => {
    const percentage = Math.min((event.currentAmount / event.targetAmount) * 100, 100);
    const isExpanded = expandedEvent === event.id;
    const pledges = eventPledges[event.id] || [];

    return (
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <CardDescription>
                By {event.organizerName} • {event.category}
              </CardDescription>
            </div>
            <Badge variant={
              event.status === 'active' ? 'default' : 
              event.status === 'pending' ? 'secondary' : 
              'destructive'
            }>
              {event.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">${event.currentAmount.toLocaleString()}</span>
              <span className="text-muted-foreground">
                of ${event.targetAmount.toLocaleString()}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{event.pledgeCount || 0} backers</span>
              <span>{percentage.toFixed(0)}% funded</span>
            </div>
          </div>

          <p className="text-muted-foreground line-clamp-2 text-sm">
            {event.description}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => toggleEventDetails(event.id)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {isExpanded ? 'Hide' : 'View'} Details
            </Button>
            
            <Link to={`/events/${event.id}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <DollarSign className="h-4 w-4" />
                View Event Page
              </Button>
            </Link>

            {showActions && (
              <>
                {event.status !== 'active' && (
                  <Button
                    onClick={() => handleApprove(event.id)}
                    disabled={actionLoading === event.id}
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                )}
                
                <Button
                  onClick={() => handleReject(event.id)}
                  disabled={actionLoading === event.id}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
                
                {event.status !== 'flagged' && (
                  <Button
                    onClick={() => handleFlag(event.id)}
                    disabled={actionLoading === event.id}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Flag className="h-4 w-4" />
                    Flag
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Donors ({pledges.length})
              </h4>
              {pledges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pledges yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pledges.map((pledge) => (
                    <div key={pledge.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {pledge.isAnonymous ? '?' : pledge.userName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">
                            {pledge.isAnonymous ? 'Anonymous' : pledge.userName}
                          </p>
                          <p className="font-semibold text-sm text-primary">
                            ${pledge.amount.toLocaleString()}
                          </p>
                        </div>
                        {pledge.message && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            "{pledge.message}"
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(pledge.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-lg text-muted-foreground">
                Manage events, approvals, and platform oversight
              </p>
            </div>
            <Link to="/admin/reports">
              <Button variant="outline" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Reports
              </Button>
            </Link>
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
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="all">
                All Events ({allEvents.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="flagged">
                Flagged ({flaggedEvents.length})
              </TabsTrigger>
            </TabsList>

            {/* All Events */}
            <TabsContent value="all" className="space-y-4">
              {allEvents.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No events found
                  </CardContent>
                </Card>
              ) : (
                allEvents.map((event) => (
                  <EventCard key={event.id} event={event} showActions={false} />
                ))
              )}
            </TabsContent>

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
                  <EventCard key={event.id} event={event} />
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
                  <EventCard key={event.id} event={event} />
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