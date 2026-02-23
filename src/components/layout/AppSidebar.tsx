import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Inbox,
  FolderOpen,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  GitBranch,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  // { label: "Requests", icon: Inbox, path: "/dashboard/requests" },
  // { label: "Inward Register", icon: Inbox, path: "/dashboard/inward" },
  { label: "File Management", icon: FolderOpen, path: "/dashboard/files" },
  { label: "Master Files", icon: ClipboardList, path: "/dashboard/master-files" },
  // { label: "Notes & Drafts", icon: ClipboardList, path: "/dashboard/notes" },
  // { label: "Documents", icon: FileText, path: "/dashboard/documents" },
  { label: "File Tracker", icon: GitBranch, path: "/dashboard/workflow" },
  // { label: "Archive", icon: Archive, path: "/dashboard/archive" },
  { label: "Reports", icon: BarChart3, path: "/dashboard/reports" },
  // { label: "Search", icon: Search, path: "/dashboard/search" },
];

const deptHeadItems = [
  { label: "Work Flow Creations", icon: Tag, path: "/dashboard/classifications" },
  { label: "Manage Users", icon: Users, path: "/dashboard/users" },
];

const bottomItems = [
  // { label: "Settings", icon: Settings, path: "/dashboard/settings" },
];

const AppSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = JSON.parse(localStorage.getItem("dms_user") || "{}");
  const isDeptHead = user?.role === "DEPT_HEAD";
  const isAdmin = user?.role === "ADMIN";
  const showManagement = isDeptHead || isAdmin;

  const handleLogout = () => {
    localStorage.removeItem("dms_user");
    window.location.href = "/";
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-md gradient-primary flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-sidebar-primary font-sans">
            DocFlow
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        {showManagement && (
          <>
            {!collapsed && <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold">Management</p>}
            {deptHeadItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive transition-colors w-full"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-border bg-card shadow-sm hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-foreground" />
        )}
      </Button>
    </aside>
  );
};

export default AppSidebar;
