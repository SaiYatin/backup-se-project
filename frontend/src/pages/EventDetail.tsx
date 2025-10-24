import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, User, ArrowLeft, Share2 } from 'lucide-react';
import ProgressChart from '@/components/events/ProgressChart';
import PledgeForm from '@/components/pledges/PledgeForm';
import { eventService, Event } from '@/services/eventService';
import { pledgeService, Pledge } from '@/services/pledgeService';
import { toast } from 'sonner';

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadEventDetails();
      loadPledges();
    }
  }, [id]);

  const loadEventDetails = async () => {
    try {
      const response = await eventService.getEventById(id!);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const loadPledges = async () => {
    try {
      const response = await pledgeService.getPledgesForEvent(id!);
      setPledges(response.data || []);
    } catch (error) {
      // Silent fail for pledges
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Event not found</h2>
          <Link to="/events">
            <Button variant="hero">Browse Events</Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = Math.ceil(
    (new Date(event.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        <Link to="/events">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-lg overflow-hidden shadow-card">
              <div className="h-96 bg-gradient-hero relative">
                {event.image ? (
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar className="h-32 w-32 text-primary-foreground opacity-50" />
                  </div>
                )}
                <Badge className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm">
                  {event.category}
                </Badge>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>By {event.organizerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(event.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <h2 className="text-xl font-semibold mb-3">About This Event</h2>
                  <p className="text-muted-foreground leading-relaxed">{event.description}</p>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">Recent Supporters</h2>
                  {pledges.length === 0 ? (
                    <p className="text-muted-foreground">Be the first to support this event!</p>
                  ) : (
                    <div className="space-y-3">
                      {pledges.slice(0, 5).map((pledge) => (
                        <div key={pledge.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Avatar>
                            <AvatarFallback>
                              {pledge.isAnonymous ? '?' : pledge.userName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">
                              {pledge.isAnonymous ? 'Anonymous' : pledge.userName || 'Supporter'}
                            </p>
                            <p className="text-sm text-muted-foreground">${pledge.amount}</p>
                            {pledge.message && (
                              <p className="text-sm mt-1 italic">{pledge.message}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 shadow-card sticky top-24">
              <ProgressChart
                currentAmount={event.currentAmount}
                targetAmount={event.targetAmount}
                backersCount={pledges.length}
                daysLeft={daysLeft > 0 ? daysLeft : undefined}
              />

              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full mt-6 gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Event
              </Button>
            </div>

            <PledgeForm eventId={event.id} onSuccess={loadPledges} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
