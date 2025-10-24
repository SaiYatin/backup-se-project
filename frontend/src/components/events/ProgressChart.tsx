import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Target } from 'lucide-react';

interface ProgressChartProps {
  currentAmount: number;
  targetAmount: number;
  backersCount?: number;
  daysLeft?: number;
}

const ProgressChart = ({
  currentAmount,
  targetAmount,
  backersCount = 0,
  daysLeft,
}: ProgressChartProps) => {
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const isComplete = currentAmount >= targetAmount;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-3xl font-bold text-foreground">
              ${currentAmount.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              raised of ${targetAmount.toLocaleString()} goal
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-primary">{percentage.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">funded</p>
          </div>
        </div>

        <Progress value={percentage} className="h-3" />

        {isComplete && (
          <div className="flex items-center gap-2 text-success animate-fade-in">
            <Target className="h-5 w-5" />
            <span className="font-semibold">Goal Reached! 🎉</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="bg-primary/10 p-2 rounded-full">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{backersCount}</p>
            <p className="text-xs text-muted-foreground">Backers</p>
          </div>
        </div>

        {daysLeft !== undefined && (
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="bg-accent/10 p-2 rounded-full">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{daysLeft}</p>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressChart;
