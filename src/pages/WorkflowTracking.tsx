import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Download, ChevronRight, GitBranch, AlertCircle, Clock } from "lucide-react";
import { filesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { FileRecord, FileMovement, MovementAction } from "@/lib/types";

const actionColors: Record<MovementAction, string> = {
    CREATE: "bg-blue-100 text-blue-700",
    FORWARD: "bg-indigo-100 text-indigo-700",
    APPROVE: "bg-green-100 text-green-700",
    RETURN: "bg-orange-100 text-orange-700",
    REJECT: "bg-red-100 text-red-700",
    CLOSE: "bg-slate-100 text-slate-700",
    ARCHIVE: "bg-purple-100 text-purple-700",
    RESTORE: "bg-teal-100 text-teal-700",
    DISPOSE: "bg-gray-100 text-gray-700",
};

const WorkflowTracking = () => {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [file, setFile] = useState<FileRecord | null>(null);
    const [movements, setMovements] = useState<FileMovement[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setLoading(true); setError(""); setFile(null); setMovements([]);
        try {
            const res = await filesApi.list({ search: query.trim() });
            const data = res.data;
            const list: FileRecord[] = Array.isArray(data) ? data : data.data || [];
            if (list.length === 0) { setError("No file found with that number or subject."); return; }
            const found = list[0];
            setFile(found);
            const movRes = await filesApi.getMovements(found.id);
            setMovements(movRes.data);
        } catch { setError("Failed to fetch file. Please try again."); }
        finally { setLoading(false); }
    };

    const exportCSV = () => {
        if (!file || movements.length === 0) return;
        const rows = [
            ["Step", "Action", "From", "To", "Remarks", "Timestamp"],
            ...movements.map((m, i) => [
                String(i + 1), m.action,
                m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}` : "System",
                m.toUser ? `${m.toUser.firstName} ${m.toUser.lastName}` : "—",
                m.remarks || "",
                new Date(m.createdAt).toLocaleString(),
            ]),
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `movement-trail-${file.fileNumber}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">File Tracking</h1>
                <p className="text-muted-foreground text-sm mt-1">View the complete movement trail of any file</p>
            </div>

            {/* Search */}
            <Card className="shadow-card">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search by file number or subject (e.g. F-2026-0001)..." className="pl-9"
                                value={query} onChange={(e) => setQuery(e.target.value)} />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Track"}
                        </Button>
                    </form>
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive mt-3">
                            <AlertCircle className="w-4 h-4" /> {error}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* File Info */}
            {file && (
                <Card className="shadow-card border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-sm">
                                <div><p className="text-muted-foreground text-xs">File Number</p><p className="font-semibold">{file.fileNumber}</p></div>
                                <div><p className="text-muted-foreground text-xs">Subject</p><p className="font-medium truncate">{file.subject}</p></div>
                                <div><p className="text-muted-foreground text-xs">Status</p>
                                    {(() => {
                                        const isOwner = file.currentOwnerId === user?.id;
                                        const isActive = ['PENDING', 'FORWARDED', 'RETURNED'].includes(file.status);

                                        if (isOwner && isActive) {
                                            return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border-orange-200 border">Action Required</span>;
                                        }

                                        return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${file.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                                file.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                                    file.status === "RETURNED" ? "bg-orange-100 text-orange-700" :
                                                        "bg-blue-100 text-blue-700"
                                            }`}>{file.status}</span>;
                                    })()}
                                </div>
                                <div><p className="text-muted-foreground text-xs">Department</p><p className="font-medium">{file.department?.name || "—"}</p></div>
                            </div>
                            <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={exportCSV}>
                                <Download className="w-3.5 h-3.5" /> Export CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Movement Trail */}
            {file && (
                <Card className="shadow-card">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-sans flex items-center gap-2">
                            <GitBranch className="w-5 h-5 text-primary" /> Movement Trail
                            <Badge variant="secondary" className="ml-2">{movements.length} steps</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {movements.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No movements recorded for this file.</p>
                        ) : (
                            <div className="relative">
                                {/* Vertical line */}
                                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
                                <div className="space-y-0">
                                    {movements.map((m, i) => (
                                        <div key={m.id} className="flex gap-4 pb-6 last:pb-0">
                                            {/* Step circle */}
                                            <div className="relative z-10 w-10 h-10 rounded-full bg-card border-2 border-primary flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                                                {i + 1}
                                            </div>
                                            {/* Content */}
                                            <div className="flex-1 bg-muted/30 rounded-lg p-4 border border-border/50">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionColors[m.action]}`}>{m.action}</span>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <span className="font-medium">{m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}` : "System"}</span>
                                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                                        <span className="font-medium">{m.toUser ? `${m.toUser.firstName} ${m.toUser.lastName}` : "—"}</span>
                                                    </div>
                                                </div>
                                                {m.remarks && <p className="text-sm text-muted-foreground mb-1">"{m.remarks}"</p>}
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {new Date(m.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {!file && !loading && !error && (
                <div className="text-center py-16 text-muted-foreground">
                    <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Search for a file to view its movement trail</p>
                    <p className="text-sm mt-1">Enter a file number like <code className="bg-muted px-1 rounded">F-2026-0001</code></p>
                </div>
            )}
        </div>
    );
};

export default WorkflowTracking;
