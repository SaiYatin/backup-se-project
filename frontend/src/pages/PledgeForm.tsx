import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { pledgeService } from '@/services/pledgeService';
import { toast } from 'sonner';

interface PledgeFormProps {
  eventId: string;
  onSuccess?: (amount: number, newPledge?: any) => void;
}

const PledgeForm = ({ eventId, onSuccess }: PledgeFormProps) => {
  const [amount, setAmount] = useState<number>(0);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (amount <= 0) {
    toast.error('Please enter a valid pledge amount');
    return;
  }

  setLoading(true);

  try {
    const pledgeData = { eventId, amount, isAnonymous, message };
    const response = await pledgeService.submitPledge(pledgeData);

    // Safely get pledge data (backend returns { success, data })
    const newPledge = response?.data?.data || response?.data;

    toast.success('🎉 Pledge submitted successfully!');
    setAmount(0);
    setMessage('');
    setIsAnonymous(false);

    // ✅ Pass to parent safely
    if (onSuccess) onSuccess(Number(amount), newPledge);
  } catch (error: any) {
    console.error('Failed to submit pledge:', error);
    toast.error(error.response?.data?.error || 'Failed to submit pledge');
  } finally {
    setLoading(false);
  }
};


  return (
    <form onSubmit={handleSubmit} className="p-6 bg-card rounded-lg shadow-card border border-border">
      <h2 className="text-lg font-semibold mb-4">Make a Pledge</h2>

      <div className="space-y-4">
        <div>
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input
            id="amount"
            type="number"
            value={amount || ''}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            placeholder="Enter your pledge amount"
            min="1"
            required
          />
        </div>

        <div>
          <Label htmlFor="message">Message (optional)</Label>
          <Input id="message" type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a message of support" />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="anonymous" checked={isAnonymous} onCheckedChange={(checked) => setIsAnonymous(!!checked)} />
          <Label htmlFor="anonymous" className="text-sm text-muted-foreground">Make this pledge anonymous</Label>
        </div>

        <Button type="submit" variant="hero" className="w-full mt-2" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Pledge'}
        </Button>
      </div>
    </form>
  );
};

export default PledgeForm;
