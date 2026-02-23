import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InwardManagement from "./pages/InwardManagement";
import FileManagement from "./pages/FileManagement";
import NotesManagement from "./pages/NotesManagement";
import DocumentManagement from "./pages/DocumentManagement";
import WorkflowTracking from "./pages/WorkflowTracking";
import ArchiveManagement from "./pages/ArchiveManagement";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import MasterFiles from "./pages/MasterFiles";
import AdminSettings from "./pages/AdminSettings";
import ProfileSettings from "./pages/ProfileSettings";
import ClassificationManagement from "./pages/ClassificationManagement";
import RequestManagement from "./pages/RequestManagement";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inward" element={<InwardManagement />} />
            <Route path="files" element={<FileManagement />} />
            <Route path="master-files" element={<MasterFiles />} />
            <Route path="requests" element={<RequestManagement />} />
            <Route path="notes" element={<NotesManagement />} />
            <Route path="documents" element={<DocumentManagement />} />
            <Route path="workflow" element={<WorkflowTracking />} />
            <Route path="archive" element={<ArchiveManagement />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="users" element={<AdminSettings />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="classifications" element={<ClassificationManagement />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
