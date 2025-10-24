import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-subtle py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-lg text-muted-foreground">Manage your account information</p>
          </div>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal details and account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="bg-gradient-hero p-3 rounded-full">
                  <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold text-lg">{user?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold text-lg">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="bg-accent/10 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-gradient-hero text-primary-foreground">
                      {user?.role === 'organizer'
                        ? 'Organizer'
                        : user?.role === 'admin'
                        ? 'Admin'
                        : 'Donor'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
