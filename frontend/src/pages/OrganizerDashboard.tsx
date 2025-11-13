import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  TrendingUp, 
  Calendar,
  Users,
  DollarSign,
  Eye,
  Pencil,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface EventWithStats {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  category: string;
  end_date: string;
  start_date?: string;
  image_url?: string;
  status: string;
  pledgeCount: number;
  created_at: string;
  pledges?: Pledge[];
}

interface Pledge {
  id: string;
  amount: number;
  is_anonymous: boolean;
  message?: string;
  created_at: string;
  donor?: {
    name: string;
  };
}

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [loadingPledges, setLoadingPledges] = useState(false);

  useEffect(() => {
    loadOrganizerEvents();
  }, []);

  const loadOrganizerEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/my/events');
      
      // Handle both possible response structures
      const eventsData = response.data?.data || response.data || [];
      setEvents(eventsData);
    } catch (error: any) {
      console.error('Error loading events:', error);
      toast.error('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const loadEventPledges = async (eventId: string) => {
    try {
      setLoadingPledges(true);
      const response = await api.get(`/pledges?event_id=${eventId}`);
      const pledges = response.data?.data || [];
      
      // Update the event with pledges
      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, pledges } : e
      ));
    } catch (error) {
      console.error('Error loading pledges:', error);
      toast.error('Failed to load pledges');
    } finally {
      setLoadingPledges(false);
    }
  };

  const toggleEventDetails = async (eventId: string) => {
    if (selectedEvent === eventId) {
      setSelectedEvent(null);
    } else {
      setSelectedEvent(eventId);
      const event = events.find(e => e.id === eventId);
      if (!event?.pledges) {
        await loadEventPledges(eventId);
      }
    }
  };

  const handleCloseEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to close "${eventTitle}"?`)) {
      return;
    }

    try {
      await api.put(`/events/${eventId}/close`);
      toast.success('Event closed successfully');
      loadOrganizerEvents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to close event');
    }
  };

  // Calculate statistics
  const stats = {
    totalEvents: events.length,
    activeEvents: events.filter(e => e.status === 'active').length,
    pendingEvents: events.filter(e => e.status === 'pending').length,
    completedEvents: events.filter(e => e.status === 'completed').length,
    totalRaised: events.reduce((sum, e) => sum + (parseFloat(String(e.current_amount)) || 0), 0),
    totalBackers: events.reduce((sum, e) => sum + (e.pledgeCount || 0), 0),
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          icon: CheckCircle, 
          color: 'text-green-600', 
          bgColor: 'bg-green-50', 
          label: 'Active',
          variant: 'default' as const
        };
      case 'pending':
        return { 
          icon: Clock, 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-50', 
          label: 'Pending Approval',
          variant: 'secondary' as const
        };
      case 'completed':
        return { 
          icon: CheckCircle, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-50', 
          label: 'Completed',
          variant: 'outline' as const
        };
      case 'flagged':
      case 'rejected':
        return { 
          icon: AlertCircle, 
          color: 'text-red-600', 
          bgColor: 'bg-red-50', 
          label: status === 'rejected' ? 'Rejected' : 'Flagged',
          variant: 'destructive' as const
        };
      default:
        return { 
          icon: AlertCircle, 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-50', 
          label: status,
          variant: 'outline' as const
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Organizer Dashboard</h1>
              <p className="text-lg text-muted-foreground">
                Manage your fundraising events and track progress
              </p>
            </div>
            <Link to="/events/new">
              <Button variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeEvents} active, {stats.pendingEvents} pending
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
                  ${stats.totalRaised.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all events
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBackers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Supporting your causes
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalEvents > 0 
                    ? Math.round((stats.completedEvents / stats.totalEvents) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completedEvents} completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Your Events</h2>
            
            {events.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first fundraising event to get started
                  </p>
                  <Link to="/events/new">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Event
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              events.map((event) => {
                const targetAmount = parseFloat(String(event.target_amount)) || 0;
                const currentAmount = parseFloat(String(event.current_amount)) || 0;
                const percentage = targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
                const isExpanded = selectedEvent === event.id;
                const pledges = event.pledges || [];
                const statusInfo = getStatusInfo(event.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={event.id} className="shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <CardTitle className="text-xl">{event.title}</CardTitle>
                            <Badge variant={statusInfo.variant}>
                              <StatusIcon className={`h-3 w-3 mr-1 ${statusInfo.color}`} />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <CardDescription>{event.category}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress Section */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold">${currentAmount.toLocaleString()}</span>
                          <span className="text-muted-foreground">
                            of ${targetAmount.toLocaleString()}
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
                          disabled={loadingPledges}
                        >
                          <Eye className="h-4 w-4" />
                          {isExpanded ? 'Hide' : 'View'} Supporters
                        </Button>
                        
                        <Link to={`/events/${event.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View Public Page
                          </Button>
                        </Link>

                        {event.status !== 'completed' && event.status !== 'rejected' && (
                          <>
                            <Link to={`/events/${event.id}/edit`}>
                              <Button variant="outline" size="sm" className="gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                            </Link>

                            {event.status === 'active' && (
                              <Button
                                onClick={() => handleCloseEvent(event.id, event.title)}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                              >
                                <XCircle className="h-4 w-4" />
                                Close Event
                              </Button>
                            )}
                          </>
                        )}
                      </div>

                      {/* Expanded Supporters List */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Supporters ({pledges.length})
                          </h4>
                          {loadingPledges ? (
                            <div className="text-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mx-auto"></div>
                            </div>
                          ) : pledges.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No pledges yet</p>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                              {pledges.map((pledge) => (
                                <div 
                                  key={pledge.id} 
                                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {pledge.is_anonymous ? '?' : pledge.donor?.name?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="font-semibold text-sm">
                                        {pledge.is_anonymous ? 'Anonymous Supporter' : pledge.donor?.name || 'Supporter'}
                                      </p>
                                      <p className="font-semibold text-sm text-primary">
                                        ${parseFloat(String(pledge.amount)).toLocaleString()}
                                      </p>
                                    </div>
                                    {pledge.message && (
                                      <p className="text-xs text-muted-foreground italic mt-1">
                                        "{pledge.message}"
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(pledge.created_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;