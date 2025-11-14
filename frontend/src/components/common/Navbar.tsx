import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Heart, User, LogOut, LayoutDashboard, Plus, Shield, BarChart3, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-hero p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Heart className="h-6 w-6 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              FundRaise
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/events" className="text-sm font-medium hover:text-primary transition-colors">
              Browse Events
            </Link>

            {isAuthenticated ? (
              <>
                {user?.role === 'organizer' && (
                  <Link to="/events/new">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      <span className="hidden lg:inline">Create Event</span>
                    </Button>
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="hidden lg:inline">Admin Panel</span>
                    </Button>
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {user?.role === 'admin' ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/admin/reports')}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Reports
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    ) : (
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <Link 
                  to="/events" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium hover:text-primary transition-colors py-2"
                >
                  Browse Events
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium hover:text-primary transition-colors py-2"
                    >
                      Dashboard
                    </Link>
                    
                    <Link 
                      to="/profile" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium hover:text-primary transition-colors py-2"
                    >
                      Profile
                    </Link>

                    {user?.role === 'organizer' && (
                      <Link 
                        to="/events/new" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium hover:text-primary transition-colors py-2"
                      >
                        Create Event
                      </Link>
                    )}

                    {user?.role === 'admin' && (
                      <>
                        <Link 
                          to="/admin/dashboard" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-lg font-medium hover:text-primary transition-colors py-2"
                        >
                          Admin Dashboard
                        </Link>
                        <Link 
                          to="/admin/reports" 
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-lg font-medium hover:text-primary transition-colors py-2"
                        >
                          Reports
                        </Link>
                      </>
                    )}

                    <div className="border-t pt-4 mt-4">
                      <Button 
                        onClick={handleLogout} 
                        variant="destructive" 
                        className="w-full gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="hero" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;