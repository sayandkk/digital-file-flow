import { Bell, Search, User, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("dms_user") || '{"email":"user@gov","role":"officer"}');
  const { notifications, unreadCount, connected, markAllRead, markRead, refresh } = useNotifications();

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    officer: "Officer",
    assistant: "Assistant",
    supervisor: "Supervisor",
    dept_head: "Department Head",
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between gap-4 sticky top-0 z-10">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search files, documents, inwards..."
          className="pl-10 bg-muted/50 border-none"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => { if (open) refresh(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className={`w-5 h-5 ${connected ? 'text-foreground' : 'text-muted-foreground'}`} />
              {/* Connection status dot */}
              <span
                className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
                  connected ? 'bg-green-500' : 'bg-red-500'
                }`}
                title={connected ? 'Notifications connected' : 'Notifications disconnected'}
              />
              {/* Unread badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-[10px] font-normal ${
                  connected ? 'text-green-500' : 'text-red-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  {connected ? 'Live' : 'Offline'}
                </span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={markAllRead}
                  >
                    <CheckCheck className="w-3 h-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    className={`flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer ${!n.read ? "bg-muted/50" : ""}`}
                    onClick={() => {
                      markRead(n.id);
                      // Navigate to the relevant entity
                      if (n.entityType === 'file' && n.entityId) {
                        navigate('/dashboard/files', { state: { selectedFileId: n.entityId } });
                      } else if (n.entityType === 'request' && n.entityId) {
                        navigate('/dashboard/requests', { state: { selectedRequestId: n.entityId } });
                      } else if (n.link) {
                        navigate(n.link);
                      }
                    }}
                  >
                    <span className="font-medium text-sm leading-tight">{n.title}</span>
                    <span className="text-xs text-muted-foreground leading-tight whitespace-normal">{n.message}</span>
                    <div className="flex items-center justify-between w-full mt-0.5">
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(n.timestamp).toLocaleString()}
                      </span>
                      {(n.entityType === 'file' || n.entityType === 'request' || n.link) && (
                        <span className="text-[10px] text-primary/70 font-medium">View →</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium leading-none">{user.email}</p>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
              Profile
            </DropdownMenuItem>
            {/* <DropdownMenuItem>Settings</DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                localStorage.removeItem("dms_user");
                window.location.href = "/";
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardHeader;
