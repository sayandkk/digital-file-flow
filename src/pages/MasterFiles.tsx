import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { filesApi, departmentsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Plus, RefreshCw, AlertCircle, ChevronRight, Edit } from "lucide-react";
import { toast } from "sonner";
import type { FileRecord as File } from "@/lib/types";

export default function MasterFiles() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const canEdit = user?.role === "ADMIN" || user?.role === "DEPT_HEAD";

    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [createForm, setCreateForm] = useState({
        subject: "",
        description: "",
        departmentId: "",
        priority: "NORMAL",
    });
    const [childFileIds, setChildFileIds] = useState<string[]>([]);
    const [availableFiles, setAvailableFiles] = useState<File[]>([]);

    const { data: departmentsData } = useQuery({
        queryKey: ["departments"],
        queryFn: () => departmentsApi.list().then(res => res.data)
    });
    const departments = Array.isArray(departmentsData) ? departmentsData : (departmentsData as any)?.data || [];

    const fetchMasterFiles = async () => {
        setLoading(true);
        try {
            const res = await filesApi.list({ isMaster: true });
            setFiles(res.data.data);
        } catch (err) {
            console.error("Failed to fetch master files:", err);
            toast.error("Failed to fetch master files");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableFiles = async (deptId?: string, currentEditId?: string | null) => {
        try {
            // Fetch normal files to be grouped
            const params: any = { isMaster: false };
            if (deptId) params.departmentId = deptId;
            const res = await filesApi.list(params);
            const pFiles = res.data.data.filter((f: any) => !f.parentId || (currentEditId && f.parentId === currentEditId));
            setAvailableFiles(pFiles);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchMasterFiles();
    }, []);

    useEffect(() => {
        if (!showCreate) {
            setChildFileIds([]);
            setCreateForm({ subject: "", description: "", departmentId: "", priority: "NORMAL" });
            setIsEditing(false);
            setEditId(null);
            setError("");
        }
    }, [showCreate]);

    useEffect(() => {
        if (showCreate) {
            fetchAvailableFiles(createForm.departmentId, editId);
        }
    }, [showCreate, createForm.departmentId, editId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (childFileIds.length === 0) {
            setError("Please select at least one sub-file to group.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const payload = {
                ...createForm,
                isMaster: true,
                childFileIds
            };

            if (isEditing && editId) {
                await filesApi.update(editId, payload);
                toast.success("Master File updated successfully");
            } else {
                await filesApi.create(payload);
                toast.success("Master File created successfully");
            }
            setShowCreate(false);
            fetchMasterFiles();
        } catch (err: any) {
            setError(err?.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} master file`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (e: React.MouseEvent, file: any) => {
        e.stopPropagation();
        setCreateForm({
            subject: file.subject || "",
            description: file.description || "",
            departmentId: file.departmentId || "",
            priority: file.priority || "NORMAL",
        });
        setChildFileIds(file.children?.map((c: any) => c.id) || []);
        setEditId(file.id);
        setIsEditing(true);
        setShowCreate(true);
    };

    return (
        <div className="space-y-6 max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground/90">Master Files</h1>
                    <p className="text-muted-foreground text-sm">Create and manage grouped files (Master Data)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchMasterFiles} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowCreate(true)} className="gap-2 shadow-sm">
                        <Plus className="w-4 h-4" /> Create Master File
                    </Button>
                </div>
            </div>

            <Card className="shadow-card">
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-indigo-500" /> Master Files
                        <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-100">{files.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <div className="w-12 h-12 rounded-full bg-indigo-100/50 flex items-center justify-center mx-auto mb-3">
                                <FolderOpen className="w-6 h-6 text-indigo-400" />
                            </div>
                            <p className="font-medium text-foreground/80">No Master Files found</p>
                            <p className="text-sm mt-1 mb-4">You have not created or been assigned any master files.</p>
                            <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>Create First Master File</Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                                    onClick={() => navigate('/dashboard/files', { state: { selectedFileId: file.id, isMasterView: true } })}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-100/80 flex items-center justify-center shrink-0 border border-indigo-200/50">
                                                <FolderOpen className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-sm truncate">{file.subject}</p>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${file.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                        file.status === 'CLOSED' ? 'bg-slate-100 text-slate-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>{file.status}</span>
                                                </div>
                                                <div className="flex items-center text-xs text-muted-foreground gap-3">
                                                    <span className="font-medium">{file.fileNumber}</span>
                                                    {(file as any).children && (
                                                        <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-medium border border-indigo-100">
                                                            {(file as any).children.length} Sub-Files
                                                        </span>
                                                    )}
                                                    <span>•</span>
                                                    <span>{file.department?.name || "—"}</span>
                                                </div>
                                                {(file as any).children && ((file as any).children.length > 0) && (
                                                    <div className="mt-2 text-xs flex gap-2 text-muted-foreground">
                                                        <span className="font-medium">Sub-files:</span>
                                                        <span className="truncate">{(file as any).children.map((c: any) => c.fileNumber).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canEdit && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-muted-foreground hover:text-primary z-10"
                                                    onClick={(e) => handleEditClick(e, file)}
                                                >
                                                    <Edit className="w-4 h-4 mr-1" /> Edit
                                                </Button>
                                            )}
                                            <div className="flex items-center text-muted-foreground ml-2">
                                                <span className="text-xs mr-1">Open File</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Edit Master File" : "Create Master File"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-5 py-2">
                        {error && <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Input required value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} placeholder="Master File subject" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Department *</Label>
                                <Select required value={createForm.departmentId} onValueChange={(v) => setCreateForm({ ...createForm, departmentId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select dept." /></SelectTrigger>
                                    <SelectContent>{departments.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={createForm.priority} onValueChange={(v) => setCreateForm({ ...createForm, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="NORMAL">Normal</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Brief description..." rows={3} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Select Sub-Files *</Label>
                                <span className="text-xs text-muted-foreground">{availableFiles.length} available files</span>
                            </div>
                            <ScrollArea className="h-48 border rounded-md p-3 bg-muted/20">
                                {availableFiles.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center space-y-2">
                                        <AlertCircle className="w-8 h-8 opacity-30" />
                                        <p className="text-sm">No available ungrouped files found.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {availableFiles.map(f => (
                                            <div key={f.id} className="flex items-start space-x-3 bg-background p-2.5 rounded-md border shadow-sm">
                                                <Checkbox
                                                    id={`child-${f.id}`}
                                                    className="mt-1"
                                                    checked={childFileIds.includes(f.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) setChildFileIds(prev => [...prev, f.id]);
                                                        else setChildFileIds(prev => prev.filter(id => id !== f.id));
                                                    }}
                                                />
                                                <div className="grid leading-tight">
                                                    <label htmlFor={`child-${f.id}`} className="text-sm font-semibold cursor-pointer select-none">
                                                        {f.fileNumber}
                                                    </label>
                                                    <span className="text-xs text-muted-foreground mt-0.5">{f.subject}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                            <p className="text-[11px] text-muted-foreground mt-1">Master file will auto-approve when all selected sub-files are approved or closed.</p>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting || childFileIds.length === 0}>
                                {submitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Save Changes" : "Create Master File")}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
