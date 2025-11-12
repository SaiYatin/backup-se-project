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

const normalizeEventFromApi = (raw: any): Event => {
  // Accept either snake_case or camelCase from backend
  const currentAmount = Number(raw.currentAmount ?? raw.current_amount ?? 0) || 0;
  const targetAmount = Number(raw.targetAmount ?? raw.target_amount ?? 0) || 0;

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    targetAmount,
    currentAmount,
    category: raw.category,
    endDate: raw.end_date ?? raw.endDate,
    startDate: raw.start_date ?? raw.startDate,
    image: raw.image_url ?? raw.image,
    organizerId: raw.organizer_id ?? raw.organizerId,
    organizerName: raw.organizer?.name ?? raw.organizerName ?? 'Unknown',
    status: raw.status,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt
  };
};

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

const loadEventDetails = async () => {
  setLoading(true);
  try {
    // 👇 Add a cache-busting query param to always fetch fresh data
    const resp = await eventService.getEventById(`${id}?t=${Date.now()}`);
    const raw = resp.data;

    // ✅ Normalize naming & types for consistency
    const normalized = {
      ...raw,
      currentAmount: Number(raw.current_amount ?? raw.currentAmount ?? 0),
      targetAmount: Number(raw.target_amount ?? raw.targetAmount ?? 0),
    };

    setEvent(normalized);
  } catch (err) {
    console.error("❌ loadEventDetails error:", err);
    toast.error("Failed to load event details");
  } finally {
    setLoading(false);
  }
};


  const loadPledges = async () => {
    try {
      // fetch pledges and latest event snapshot in parallel
      const [pledgeResp, eventResp] = await Promise.all([
        pledgeService.getPledgesForEvent(id!),
        eventService.getEventById(id!)
      ]);

      const rawEvent = eventResp.data;
      setEvent(normalizeEventFromApi(rawEvent));

      // Normalize pledge amounts to numbers
      const normalizedPledges: Pledge[] = (pledgeResp.data || []).map((p: any) => ({
        id: p.id,
        eventId: p.event_id ?? p.eventId,
        userId: p.donor_id ?? p.userId,
        userName: p.donor?.name ?? p.userName,
        amount: Number(p.amount) || 0,
        isAnonymous: !!p.is_anonymous,
        message: p.message,
        createdAt: p.created_at ?? p.createdAt
      }));

      setPledges(normalizedPledges);
    } catch (err) {
      console.error('loadPledges error', err);
      // silent fail for pledges UI
    }
  };

  // Called when pledge submitted successfully:
  // amount: number, newPledge?: object returned by backend
const handlePledgeSuccess = async (pledgeAmount: number, newPledge?: any) => {
  const amountNum = Number(pledgeAmount ?? 0);

  // ✅ Step 1: Optimistic update for instant UI feedback
  setEvent((prev) => {
    if (!prev) return prev;
    const current = Number(prev.currentAmount ?? prev.current_amount ?? 0);
    const updated = current + amountNum;

    return {
      ...prev,
      currentAmount: updated,
      current_amount: updated,
    };
  });

  // ✅ Step 2: Add new pledge immediately
  if (newPledge) {
    const normalized: Pledge = {
      id: newPledge.id,
      eventId: newPledge.event_id ?? newPledge.eventId,
      userId: newPledge.donor_id ?? newPledge.userId,
      userName: newPledge.donor?.name ?? newPledge.userName ?? "Supporter",
      amount: Number(newPledge.amount ?? 0),
      isAnonymous: !!newPledge.is_anonymous,
      message: newPledge.message ?? "",
      createdAt: newPledge.created_at ?? newPledge.createdAt ?? new Date().toISOString(),
    };
    setPledges((prev) => [normalized, ...prev]);
  }

  // ✅ Step 3: Wait for DB to finish, then re-fetch fresh data
  try {
    await new Promise((resolve) => setTimeout(resolve, 1200)); // give backend time
    await loadPledges(); // ensures correct totals from DB
  } catch (err) {
    console.warn("Refresh failed:", err);
  }
};


  const handleShare = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
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

  const daysLeft = Math.ceil((new Date(event.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

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
                        {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
                      {pledges.slice(0, 5).map((p) => (
                        <div key={p.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <Avatar>
                            <AvatarFallback>{p.isAnonymous ? '?' : p.userName?.[0] || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{p.isAnonymous ? 'Anonymous' : p.userName || 'Supporter'}</p>
                            <p className="text-sm text-muted-foreground">${Number(p.amount).toLocaleString()}</p>
                            {p.message && <p className="text-sm mt-1 italic">{p.message}</p>}
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
                currentAmount={Number(event.currentAmount) || 0}
                targetAmount={Number(event.targetAmount) || 0}
                backersCount={pledges.length}
                daysLeft={daysLeft > 0 ? daysLeft : undefined}
              />

              <Button onClick={handleShare} variant="outline" className="w-full mt-6 gap-2">
                <Share2 className="h-4 w-4" /> Share Event
              </Button>
            </div>

            <PledgeForm
  eventId={event.id}
  onSuccess={(amount?: number, newPledge?: any) =>
    handlePledgeSuccess(Number(amount ?? 0), newPledge)
  }
/>

          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
