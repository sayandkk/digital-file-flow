import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Archive, Search, RefreshCw, RotateCcw, Trash2, AlertCircle, FolderOpen } from "lucide-react";
import { archiveApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { FileRecord, FileStatus } from "@/lib/types";

const classificationColors: Record<string, string> = {
    ARCHIVED: "bg-purple-100 text-purple-700",
    CLOSED: "bg-slate-100 text-slate-700",
    DISPOSED: "bg-gray-100 text-gray-600",
};

const ArchiveManagement = () => {
    const { isAdmin } = useAuth();
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showDisposal, setShowDisposal] = useState<FileRecord | null>(null);
    const [disposalReason, setDisposalReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await archiveApi.list({ search, status: statusFilter === "ALL" ? undefined : statusFilter });
            const d = res.data;
            setFiles(Array.isArray(d) ? d : d.data || []);
        } catch { setFiles([]); } finally { setLoading(false); }
    };

    useEffect(() => { fetchFiles(); }, [search, statusFilter]);

    const handleRestore = async (file: FileRecord) => {
        if (!confirm(`Restore file ${file.fileNumber}?`)) return;
        try { await archiveApi.restore(file.id); fetchFiles(); }
        catch (err: any) { alert(err?.response?.data?.message || "Restore failed"); }
    };

    const handleDisposal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showDisposal) return;
        setSubmitting(true); setError("");
        try {
            await archiveApi.requestDisposal(showDisposal.id, { reason: disposalReason });
            setShowDisposal(null); setDisposalReason("");
            fetchFiles();
        } catch (err: any) { setError(err?.response?.data?.message || "Disposal request failed"); }
        finally { setSubmitting(false); }
    };

    const statusLabel = (status: FileStatus) => {
        const map: Partial<Record<FileStatus, string>> = {
            ARCHIVED: "Archived", CLOSED: "Closed", DISPOSED: "Disposed"
        };
        return map[status] || status;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Archive & Disposal</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage archived, closed, and disposed files</p>
            </div>

            {/* Filters */}
            <Card className="shadow-card">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search archived files..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Classification" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Classifications</SelectItem>
                                <SelectItem value="CLOSED">Closed</SelectItem>
                                <SelectItem value="ARCHIVED">Archived</SelectItem>
                                <SelectItem value="DISPOSED">Disposed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={fetchFiles}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            {/* Archive Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Closed", status: "CLOSED", color: "border-slate-200 bg-slate-50", textColor: "text-slate-700" },
                    { label: "Archived", status: "ARCHIVED", color: "border-purple-200 bg-purple-50", textColor: "text-purple-700" },
                    { label: "Disposed", status: "DISPOSED", color: "border-gray-200 bg-gray-50", textColor: "text-gray-600" },
                ].map(({ label, status, color, textColor }) => (
                    <Card key={status} className={`border ${color} shadow-card cursor-pointer`} onClick={() => setStatusFilter(status)}>
                        <CardContent className="p-4 text-center">
                            <p className={`text-2xl font-bold ${textColor}`}>
                                {files.filter(f => f.status === status).length}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* File List */}
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <Archive className="w-5 h-5 text-primary" /> Archived Files
                        <Badge variant="secondary" className="ml-2">{files.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Archive className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No archived files found</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                                            <FolderOpen className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{file.subject}</p>
                                            <p className="text-xs text-muted-foreground">{file.fileNumber} · {file.department?.name || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${classificationColors[file.status] || "bg-gray-100 text-gray-600"}`}>
                                            {statusLabel(file.status)}
                                        </span>
                                        <span className="text-xs text-muted-foreground hidden sm:block">
                                            {new Date(file.updatedAt).toLocaleDateString()}
                                        </span>
                                        {isAdmin && file.status !== "DISPOSED" && (
                                            <div className="flex gap-1">
                                                {file.status === "ARCHIVED" && (
                                                    <Button size="icon" variant="ghost" className="w-7 h-7 text-teal-600 hover:text-teal-700" title="Restore" onClick={() => handleRestore(file)}>
                                                        <RotateCcw className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive" title="Request Disposal" onClick={() => setShowDisposal(file)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Disposal Dialog */}
            <Dialog open={!!showDisposal} onOpenChange={() => setShowDisposal(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="w-5 h-5" /> Request Disposal
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleDisposal} className="space-y-4">
                        {error && <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                        <div className="bg-muted/50 rounded-md p-3 text-sm">
                            <p className="font-medium">{showDisposal?.fileNumber}</p>
                            <p className="text-muted-foreground">{showDisposal?.subject}</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Reason for Disposal *</Label>
                            <Textarea required value={disposalReason} onChange={(e) => setDisposalReason(e.target.value)}
                                placeholder="Provide justification for disposal..." rows={4} />
                        </div>
                        <div className="text-xs text-muted-foreground bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                            ⚠️ This action will mark the file for disposal. Final destruction requires approval.
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowDisposal(null)}>Cancel</Button>
                            <Button type="submit" variant="destructive" disabled={submitting}>{submitting ? "Submitting..." : "Request Disposal"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ArchiveManagement;
