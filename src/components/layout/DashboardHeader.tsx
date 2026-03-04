import { Bell, Search, User } from "lucide-react";
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
import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";

const DashboardHeader = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("dms_user") || '{"email":"user@gov","role":"officer"}');
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useNotifications();

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {/* Connection Status Indicator */}
              <span
                className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-background ${isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-medium">Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">
                  Mark all as read
                </Button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.isRead ? "bg-muted/50 font-medium" : ""
                    }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <span className="text-sm line-clamp-2">{notification.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </DropdownMenuItem>
              ))
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
