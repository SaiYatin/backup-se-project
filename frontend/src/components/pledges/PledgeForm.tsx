import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { pledgeService } from '@/services/pledgeService';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

const pledgeSchema = z.object({
  amount: z.number().min(10, 'Minimum pledge amount is $10'),
  isAnonymous: z.boolean().default(false),
  message: z.string().max(200, 'Message must be less than 200 characters').optional(),
});

type PledgeFormData = z.infer<typeof pledgeSchema>;

interface PledgeFormProps {
  eventId: string;
  onSuccess?: () => void;
}

const PledgeForm = ({ eventId, onSuccess }: PledgeFormProps) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<PledgeFormData>({
    resolver: zodResolver(pledgeSchema),
    defaultValues: {
      amount: 0,
      isAnonymous: false,
      message: '',
    },
  });

  const onSubmit = async (data: PledgeFormData) => {
    if (!isAuthenticated) {
      toast.error('Please login to make a pledge');
      return;
    }

    setLoading(true);
    try {
      await pledgeService.submitPledge({
        eventId,
        amount: data.amount,
        isAnonymous: data.isAnonymous,
        message: data.message,
      });

      toast.success('Pledge submitted successfully! 🎉');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit pledge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          Make a Pledge
        </CardTitle>
        <CardDescription>Support this fundraising event with your contribution</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pledge Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      min={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share a message of support..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Pledge anonymously</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Your name will not be displayed publicly
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              variant="hero"
              size="lg"
              disabled={loading || !isAuthenticated}
            >
              {loading ? 'Processing...' : 'Submit Pledge'}
            </Button>

            {!isAuthenticated && (
              <p className="text-sm text-center text-muted-foreground">
                Please login to make a pledge
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PledgeForm;
