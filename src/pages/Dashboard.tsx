import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clock,
  CheckCircle2,
  RotateCcw,
  Archive,
  Plus,
  Inbox,
  Search,
  ArrowRight,
  TrendingUp,
  Users,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const kpiCards = [
  {
    label: "Pending Files",
    value: "24",
    change: "+3 today",
    icon: Clock,
    gradient: "bg-gradient-to-br from-warning/10 to-warning/5",
    iconColor: "text-warning",
    borderColor: "border-warning/20",
  },
  {
    label: "Approved Files",
    value: "156",
    change: "+12 this week",
    icon: CheckCircle2,
    gradient: "bg-gradient-to-br from-success/10 to-success/5",
    iconColor: "text-success",
    borderColor: "border-success/20",
  },
  {
    label: "Returned Files",
    value: "8",
    change: "2 urgent",
    icon: RotateCcw,
    gradient: "bg-gradient-to-br from-destructive/10 to-destructive/5",
    iconColor: "text-destructive",
    borderColor: "border-destructive/20",
  },
  {
    label: "Archived Files",
    value: "1,247",
    change: "Total records",
    icon: Archive,
    gradient: "bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5",
    iconColor: "text-muted-foreground",
    borderColor: "border-muted/50",
  },
];

const quickActions = [
  { label: "New Inward", icon: Inbox, desc: "Register new inward entry", path: "/dashboard/inward" },
  { label: "Create File", icon: Plus, desc: "Start a new file", path: "/dashboard/files" },
  { label: "Search Files", icon: Search, desc: "Find files & documents", path: "/dashboard/search" },
];

const recentFiles = [
  { id: "F-2024-0847", subject: "Budget Allocation Q4 2024", status: "pending", from: "Finance Dept", date: "2h ago" },
  { id: "F-2024-0846", subject: "Staff Transfer Proposal", status: "approved", from: "HR Dept", date: "4h ago" },
  { id: "F-2024-0845", subject: "Infrastructure Report", status: "returned", from: "Engineering", date: "6h ago" },
  { id: "F-2024-0844", subject: "Annual Compliance Review", status: "pending", from: "Legal Dept", date: "1d ago" },
  { id: "F-2024-0843", subject: "Vendor Contract Renewal", status: "approved", from: "Procurement", date: "1d ago" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  returned: { label: "Returned", variant: "destructive" },
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your document workflow and pending actions
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`${card.gradient} border ${card.borderColor} shadow-card`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold mt-1 font-sans">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-card/80 flex items-center justify-center ${card.iconColor}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Files */}
        <div className="lg:col-span-2">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-sans">Recent File Activity</CardTitle>
                <CardDescription>Latest file movements and updates</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{file.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.id} · {file.from}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={statusConfig[file.status].variant}>
                        {statusConfig[file.status].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:block">{file.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-sans">Quick Actions</CardTitle>
              <CardDescription>Common tasks at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.path}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-md gradient-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <action.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Summary stats */}
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-sans">This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm">Files Processed</span>
                </div>
                <span className="text-sm font-semibold">47</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-info" />
                  <span className="text-sm">Active Users</span>
                </div>
                <span className="text-sm font-semibold">18</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-sm">Overdue Files</span>
                </div>
                <span className="text-sm font-semibold text-warning">5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
