import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import EventCard from '@/components/events/EventCard';
import { eventService, Event } from '@/services/eventService';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  // ✅ Load all events initially
  useEffect(() => {
    loadEvents();
  }, []);

  // ✅ Fetch from backend
  const loadEvents = async (filters?: { search?: string; category?: string; status?: string }) => {
    try {
      setLoading(true);
      const response = await eventService.getAllEvents(filters);
      setEvents(response.data || []);
    } catch (error: any) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Search handler
  const handleSearch = async () => {
    if (!searchQuery.trim() && !category && !status) {
      loadEvents();
      return;
    }

    try {
      setLoading(true);
      const response = await eventService.getAllEvents({
        search: searchQuery.trim(),
        category,
        status,
      });
      setEvents(response.data || []);
    } catch (error: any) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Optional: auto-refresh results when filters change
  useEffect(() => {
    if (!loading) handleSearch();
  }, [category, status]);

  return (
    <div className="min-h-screen bg-gradient-subtle py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* 🏷️ Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">Browse Fundraising Events</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover amazing causes and make a difference today
            </p>
          </div>

          {/* 🔍 Search and Filters */}
          <div className="flex flex-col gap-3 max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="flex gap-2 w-full">
              <Input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="hero" className="gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </div>

            {/* Filter Row */}
            <div className="flex gap-2 w-full">
              {/* 🧭 Category filter */}
              <Select onValueChange={(val) => setCategory(val === 'all' ? '' : val)} value={category || 'all'}>
                <SelectTrigger className="flex-1 sm:flex-none sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="truncate">{category ? category : 'Category'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Environment">Environment</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Community">Community</SelectItem>
                </SelectContent>
              </Select>

              {/* ⚙️ Status filter */}
              <Select onValueChange={(val) => setStatus(val === 'all' ? '' : val)} value={status || 'all'}>
                <SelectTrigger className="flex-1 sm:flex-none sm:w-[160px]">
                  <span className="truncate">{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Status'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 🧾 Results */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                No events found. Try adjusting your filters or check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
