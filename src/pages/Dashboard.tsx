import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Clock, CheckCircle2, RotateCcw, Archive, Plus, Inbox,
  Search, ArrowRight, TrendingUp, Users, AlertCircle, RefreshCw,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { dashboardApi, filesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { FileRecord, FileStatus } from "@/lib/types";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  RETURNED: { label: "Returned", variant: "destructive" },
  FORWARDED: { label: "Forwarded", variant: "secondary" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    returned: 0,
    archived: 0,
    filesProcessedThisWeek: 0,
    activeUsers: 0,
    overdueFiles: 0,
    slaEscalationsOpen: 0,
  });
  const [recentFiles, setRecentFiles] = useState<FileRecord[]>([]);
  const [workflowStats, setWorkflowStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, filesRes, wfRes] = await Promise.all([
          dashboardApi.getStats().catch(() => ({ data: null })),
          filesApi.list({ limit: 5 }).catch(() => ({ data: [] })),
          dashboardApi.getWorkflowStats().catch(() => ({ data: [] })),
        ]);

        if (statsRes.data) {
          const s = statsRes.data as any;
          const overview = s.overview || s;

          setStats({
            pending: s.personal?.myPendingFiles ?? overview.pendingFiles ?? overview.pending ?? 0,
            approved: overview.approvedFiles ?? overview.approved ?? 0,
            returned: overview.returnedFiles ?? overview.returned ?? 0,
            archived: overview.archivedFiles ?? overview.archived ?? 0,
            filesProcessedThisWeek: 0,
            activeUsers: overview.totalUsers ?? 0,
            overdueFiles: overview.overdueFiles ?? 0,
            slaEscalationsOpen: overview.slaEscalationsOpen ?? 0,
          });
        }
        const d = filesRes.data;
        setRecentFiles(Array.isArray(d) ? d.slice(0, 5) : (d.data || []).slice(0, 5));

        const wfData = wfRes.data;
        setWorkflowStats(Array.isArray(wfData) ? wfData : []);
      } catch { }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const kpiCards = [
    { label: "Pending Files", value: stats.pending, change: "Awaiting action", icon: Clock, gradient: "bg-gradient-to-br from-warning/10 to-warning/5", iconColor: "text-warning", borderColor: "border-warning/20" },
    { label: "Approved Files", value: stats.approved, change: "Successfully closed", icon: CheckCircle2, gradient: "bg-gradient-to-br from-success/10 to-success/5", iconColor: "text-success", borderColor: "border-success/20" },
    { label: "Returned Files", value: stats.returned, change: "Needs attention", icon: RotateCcw, gradient: "bg-gradient-to-br from-destructive/10 to-destructive/5", iconColor: "text-destructive", borderColor: "border-destructive/20" },
    { label: "Overdue Files", value: stats.overdueFiles, change: "Past SLA due date", icon: AlertCircle, gradient: "bg-gradient-to-br from-warning/10 to-warning/5", iconColor: "text-warning", borderColor: "border-warning/30" },
  ];

  const quickActions = [
    { label: "Create File", icon: Plus, desc: "Start a new file", path: "/dashboard/files" },
    { label: "Search Files", icon: Search, desc: "Find files & track movements", path: "/dashboard/workflow" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user ? `, ${user.firstName}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your document workflow and pending actions
          </p>
        </div>
        {loading && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground mt-1" />}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className={`${card.gradient} border ${card.borderColor} shadow-card`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold mt-1 font-sans">{loading ? "—" : card.value}</p>
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
              <Button variant="ghost" size="sm" className="text-primary" asChild>
                <Link to="/dashboard/files">View All <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading...
                </div>
              ) : recentFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No files yet. <Link to="/dashboard/files" className="text-primary underline">Create one</Link></p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentFiles.map((file) => {
                    const isOwner = file.currentOwnerId === user?.id;
                    const isActive = ['PENDING', 'FORWARDED', 'RETURNED'].includes(file.status);
                    let cfg = statusConfig[file.status] || { label: file.status, variant: "outline" as const };

                    if (isOwner && isActive) {
                      cfg = { label: "Action Required", variant: "destructive" as const };
                    }

                    return (
                      <div key={file.id}
                        onClick={() => navigate('/dashboard/files', { state: { selectedFileId: file.id } })}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{file.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.fileNumber} · {file.department?.name || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {new Date(file.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-sans">Quick Actions</CardTitle>
              <CardDescription>Common tasks at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.path}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-primary/5 hover:border-primary/20 transition-colors group">
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
                <span className="text-sm font-semibold">{loading ? "—" : stats.filesProcessedThisWeek}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-info" />
                  <span className="text-sm">Active Users</span>
                </div>
                <span className="text-sm font-semibold">{loading ? "—" : stats.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" />
                  <span className="text-sm">Overdue Files</span>
                </div>
                <span className="text-sm font-semibold text-warning">{loading ? "—" : stats.overdueFiles}</span>
              </div>
            </CardContent>
          </Card>

          {workflowStats.length > 0 && (
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-sans">Workflow Bottlenecks</CardTitle>
                <CardDescription>Stages with the most pending files</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {workflowStats.slice(0, 5).map((s) => (
                  <div
                    key={s.stageId}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {(s.categoryName || "Uncategorized") + " – " + (s.role || "")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Stage {s.stageOrder} · Avg age {Number(s.avgAgeHours || 0).toFixed(1)}h
                      </span>
                    </div>
                    <Badge variant="outline">{s.pendingCount} pending</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
