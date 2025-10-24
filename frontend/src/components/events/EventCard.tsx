import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp } from 'lucide-react';
import { Event } from '@/services/eventService';

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const percentage = Math.min((event.currentAmount / event.targetAmount) * 100, 100);
  const daysLeft = Math.ceil(
    (new Date(event.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link to={`/events/${event.id}`}>
      <Card className="group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
        <CardHeader className="p-0">
          <div className="relative h-48 bg-gradient-subtle rounded-t-lg overflow-hidden">
            {event.image ? (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-hero">
                <TrendingUp className="h-16 w-16 text-primary-foreground opacity-50" />
              </div>
            )}
            <Badge
              className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm"
              variant="secondary"
            >
              {event.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-semibold">${event.currentAmount.toLocaleString()}</span>
              <span className="text-muted-foreground">
                of ${event.targetAmount.toLocaleString()}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
          </div>
          <span className="font-semibold text-primary">{percentage.toFixed(0)}% funded</span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default EventCard;
