import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Users, TrendingUp, Shield } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-subtle overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Empower Change Through
              <span className="bg-gradient-hero bg-clip-text text-transparent"> Fundraising</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Connect donors with causes that matter. Create, support, and track fundraising events
              that make a real difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/events">
                <Button variant="hero" size="lg" className="gap-2 w-full sm:w-auto">
                  Browse Events
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Start Fundraising
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose FundRaise?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed to make fundraising simple, transparent, and
              effective
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-4 p-6 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-2xl group-hover:scale-110 transition-transform">
                <Heart className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Easy to Start</h3>
              <p className="text-muted-foreground">
                Create your fundraising event in minutes with our intuitive platform
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-warm rounded-2xl group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Build Community</h3>
              <p className="text-muted-foreground">
                Connect with donors who care about the same causes as you
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-success rounded-2xl group-hover:scale-110 transition-transform">
                <TrendingUp className="h-8 w-8 text-success-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Track Progress</h3>
              <p className="text-muted-foreground">
                Real-time analytics and beautiful charts to visualize your impact
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Transparent</h3>
              <p className="text-muted-foreground">
                Every donation is tracked and organizers are vetted for trust
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">Ready to Make a Difference?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of donors and organizers using FundRaise to create positive change
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg" className="gap-2">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
