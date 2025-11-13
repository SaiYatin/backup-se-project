import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Home from "./pages/Home";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
// Admin & Organizer imports
import AdminDashboard from "./pages/AdminDashboard";
import AdminReports from "./pages/AdminReports";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import EditEvent from "./pages/EditEvent";
import CreateEvent from "./pages/CreateEvent";

const queryClient = new QueryClient();

// Role-based dashboard redirect component
const DashboardRedirect = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'organizer':
      return <Navigate to="/organizer/dashboard" replace />;
    case 'donor':
    default:
      return <Dashboard />;
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected User Routes - Auto-redirect based on role */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardRedirect />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                
                {/* Protected Organizer Routes */}
                <Route
                  path="/organizer/dashboard"
                  element={
                    <ProtectedRoute requiredRole="organizer">
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/new"
                  element={
                    <ProtectedRoute requiredRole="organizer">
                      <CreateEvent />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="organizer">
                      <EditEvent />
                    </ProtectedRoute>
                  }
                />
                
                {/* Protected Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminReports />
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;