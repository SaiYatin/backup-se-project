import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { eventService } from '@/services/eventService';

const eventSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  targetAmount: z.number().min(100, 'Target amount must be at least $100'),
  category: z.string().min(1, 'Please select a category'),
  endDate: z.string().min(1, 'End date is required'),
  image: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

const categories = [
  'Healthcare',
  'Education',
  'Environment',
  'Community',
  'Arts',
  'Sports',
  'Technology',
  'Other',
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      targetAmount: 0,
      category: '',
      endDate: '',
      image: '',
    },
  });

  const onSubmit = async (data: EventFormData) => {
    try {
      setLoading(true);
      const response = await eventService.createEvent(data);
      toast.success('Event created successfully! 🎉');
      
      // Navigate to the newly created event
      if (response.data?.id) {
        navigate(`/events/${response.data.id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gradient-subtle py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <Link to="/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold">Create New Event</h1>
            <p className="text-lg text-muted-foreground">
              Start your fundraising journey and make a difference
            </p>
          </div>

          {/* Create Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>
                Provide information about your fundraising event. Be clear and specific to attract donors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Help Build a Community Center" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          A clear, compelling title that describes your cause
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell your story... Why is this important? How will the funds be used?"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Share your story and explain how donations will make an impact
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="targetAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Amount ($) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5000"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Your fundraising goal
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Help donors find your cause
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            min={today}
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          When should this fundraiser end?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Add a compelling image to attract donors
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="submit"
                      variant="hero"
                      className="flex-1 gap-2 w-full"
                      size="lg"
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4" />
                      {loading ? 'Creating...' : 'Create Event'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full sm:w-auto"
                      onClick={() => navigate('/dashboard')}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✨ Use a clear, specific title that explains your cause</p>
              <p>📸 Add a high-quality image to make your event stand out</p>
              <p>📝 Tell a compelling story in your description</p>
              <p>🎯 Set a realistic funding goal</p>
              <p>⏰ Give yourself enough time to reach your target</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;