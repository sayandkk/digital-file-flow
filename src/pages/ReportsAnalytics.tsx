import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import { BarChart3, Download, RefreshCw, TrendingUp, Clock, FileText, Users } from "lucide-react";
import { filesApi, dashboardApi } from "@/lib/api";
import type { FileRecord } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#f59e0b", FORWARDED: "#6366f1", APPROVED: "#22c55e",
    RETURNED: "#f97316", REJECTED: "#ef4444", CLOSED: "#94a3b8",
    ARCHIVED: "#a855f7", DISPOSED: "#6b7280",
};

const ReportsAnalytics = () => {
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [filesRes, statsRes] = await Promise.all([
                    filesApi.list({ limit: 500 }),
                    dashboardApi.getStats().catch(() => ({ data: null })),
                ]);
                const d = filesRes.data;
                setFiles(Array.isArray(d) ? d : d.data || []);
                setStats(statsRes.data);
            } catch { setFiles([]); } finally { setLoading(false); }
        };
        load();
    }, []);

    // Compute status distribution from files
    const statusDist = Object.entries(
        files.reduce((acc, f) => { acc[f.status] = (acc[f.status] || 0) + 1; return acc; }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }));

    // Simulate weekly activity (group by week)
    const weeklyData = (() => {
        const weeks: Record<string, number> = {};
        files.forEach(f => {
            const d = new Date(f.createdAt);
            const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString("default", { month: "short" })}`;
            weeks[week] = (weeks[week] || 0) + 1;
        });
        return Object.entries(weeks).slice(-6).map(([week, count]) => ({ week, count }));
    })();

    const kpis = [
        { label: "Total Files", value: files.length, icon: FileText, color: "text-primary" },
        { label: "Approved", value: files.filter(f => f.status === "APPROVED").length, icon: TrendingUp, color: "text-green-600" },
        { label: "Pending", value: files.filter(f => f.status === "PENDING").length, icon: Clock, color: "text-yellow-600" },
        { label: "Active Users", value: stats?.overview?.totalUsers ?? stats?.totalUsers ?? "—", icon: Users, color: "text-blue-600" },
    ];

    const exportCSV = () => {
        const rows = [
            ["File Number", "Subject", "Status", "Department", "Created"],
            ...files.map(f => [f.fileNumber, f.subject, f.status, f.department?.name || "", new Date(f.createdAt).toLocaleDateString()]),
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "ddfs-report.csv"; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
                    <p className="text-muted-foreground text-sm mt-1">Performance metrics and file activity overview</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-1">
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh
                    </Button>
                    <Button size="sm" onClick={exportCSV} className="gap-1">
                        <Download className="w-3.5 h-3.5" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.label} className="shadow-card">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                                    <p className="text-3xl font-bold mt-1">{loading ? "—" : kpi.value}</p>
                                </div>
                                <kpi.icon className={`w-8 h-8 ${kpi.color} opacity-70`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Activity Bar Chart */}
                <Card className="shadow-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-sans flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-primary" /> Files Created Per Period
                        </CardTitle>
                        <CardDescription>Recent file creation activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-48 text-muted-foreground">
                                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                            </div>
                        ) : weeklyData.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-muted-foreground">No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                    <Bar dataKey="count" name="Files" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Status Distribution Pie Chart */}
                <Card className="shadow-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-sans flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" /> Files by Status
                        </CardTitle>
                        <CardDescription>Current status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center h-48 text-muted-foreground">
                                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                            </div>
                        ) : statusDist.length === 0 ? (
                            <div className="flex items-center justify-center h-48 text-muted-foreground">No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {statusDist.map((entry) => (
                                            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Status Breakdown Table */}
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-sans">Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {statusDist.map(({ name, value }) => (
                            <div key={name} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[name] || "#94a3b8" }} />
                                <span className="text-sm flex-1">{name}</span>
                                <div className="flex-1 bg-muted rounded-full h-2 max-w-48">
                                    <div className="h-2 rounded-full" style={{
                                        width: `${files.length ? (value / files.length) * 100 : 0}%`,
                                        backgroundColor: STATUS_COLORS[name] || "#94a3b8"
                                    }} />
                                </div>
                                <Badge variant="secondary" className="text-xs">{value}</Badge>
                            </div>
                        ))}
                        {statusDist.length === 0 && !loading && (
                            <p className="text-sm text-muted-foreground text-center py-4">No files to report on yet.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportsAnalytics;
