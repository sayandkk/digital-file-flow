import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
    FolderOpen, Plus, Search, RefreshCw, Eye, ChevronRight, ChevronLeft,
    CheckCircle2, RotateCcw, XCircle, Send, AlertCircle, Clock, Archive, GitBranch,
    FileText, Upload, Download, Trash2, Paperclip
} from "lucide-react";
import { filesApi, departmentsApi, usersApi, workflowApi, documentsApi, classificationsApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { FileRecord, FileStatus, FileMovement, Department, User, WorkflowCategory, Document } from "@/lib/types";

const statusConfig: Record<FileStatus, { label: string; color: string; icon: any }> = {
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    FORWARDED: { label: "Forwarded", color: "bg-blue-100 text-blue-800", icon: Send },
    APPROVED: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
    RETURNED: { label: "Returned", color: "bg-orange-100 text-orange-800", icon: RotateCcw },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
    CLOSED: { label: "Closed", color: "bg-slate-100 text-slate-700", icon: Archive },
    ARCHIVED: { label: "Archived", color: "bg-purple-100 text-purple-800", icon: Archive },
    DISPOSED: { label: "Disposed", color: "bg-gray-100 text-gray-600", icon: Archive },
};

const FileManagement = () => {
    const { user, isApprover } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<FileRecord | null>(null);
    const [movements, setMovements] = useState<FileMovement[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showAction, setShowAction] = useState<string | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [workflowCategories, setWorkflowCategories] = useState<WorkflowCategory[]>([]);
    const [classifications, setClassifications] = useState<{ id: string, name: string }[]>([]);
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [confidentialityFilter, setConfidentialityFilter] = useState("ALL");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [actionForm, setActionForm] = useState({ toUserId: "", remarks: "" });
    const [createForm, setCreateForm] = useState({
        subject: "",
        description: "",
        classificationId: "",
        departmentId: "",
        workflowCategoryId: "",
        priority: "NORMAL",
        confidentiality: "INTERNAL",
        category: "OTHER",
        dueDate: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [showUpload, setShowUpload] = useState(false);
    const [uploadForm, setUploadForm] = useState({ file: null as File | null, description: "", heading: "" });
    const [isNewHeading, setIsNewHeading] = useState(false);

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const params: any = {
                status: statusFilter === "ALL" ? undefined : statusFilter,
                search,
                isMaster: false,
            };
            if (priorityFilter && priorityFilter !== "ALL") params.priority = priorityFilter;
            if (categoryFilter && categoryFilter !== "ALL") params.category = categoryFilter;
            if (confidentialityFilter && confidentialityFilter !== "ALL") params.confidentiality = confidentialityFilter;

            const res = await filesApi.list(params);
            const data = res.data;
            setFiles(Array.isArray(data) ? data : data.data || []);
        } catch { setFiles([]); } finally { setLoading(false); }
    };

    useEffect(() => { fetchFiles(); }, [statusFilter, search, priorityFilter, categoryFilter, confidentialityFilter]);

    useEffect(() => {
        departmentsApi.list().then(r => setDepartments(r.data)).catch(() => { });
        usersApi.list({ directory: true }).then(r => { const d = r.data; setUsers(Array.isArray(d) ? d : d.data || []); }).catch(() => { });
        workflowApi.listCategories().then(r => setWorkflowCategories(Array.isArray(r.data) ? r.data : [])).catch(() => { });
        classificationsApi.list().then(r => setClassifications(r.data)).catch(() => { });
    }, []);

    const openFile = async (file: FileRecord) => {
        let fullFile = file;

        // If file is missing full relations or fields (e.g., clicked from a Master File's sub-file list), fetch it fully
        // The sub-files only contain id, subject, fileNumber, status
        if (!fullFile.createdAt || !(fullFile as any).department) {
            try {
                const res = await filesApi.get(fullFile.id);
                fullFile = { ...fullFile, ...(res.data?.data || res.data) };
            } catch (err) {
                console.error("Failed to load full file details:", err);
                toast.error("Could not load full file details");
            }
        }

        setSelected(fullFile);
        try {
            const [movRes, docRes] = await Promise.all([
                filesApi.getMovements(fullFile.id),
                documentsApi.findByFile(fullFile.id)
            ]);
            setMovements(movRes.data);
            setDocuments(Array.isArray(docRes.data) ? docRes.data : []);
        } catch {
            setMovements([]);
            setDocuments([]);
        }
    };

    // Handle auto-selection of file passed via react-router location state
    useEffect(() => {
        const state = location.state as { selectedFileId?: string, isMasterView?: boolean };
        if (state?.selectedFileId && !loading) {
            const fileToSelect = files.find(f => f.id === state.selectedFileId);
            if (fileToSelect && (!selected || selected.id !== fileToSelect.id)) {
                openFile(fileToSelect);
                navigate(location.pathname, { replace: true, state: {} });
            } else if (state.isMasterView && (!selected || selected.id !== state.selectedFileId)) {
                // Master file is not in 'files' list, so pass partial object to openFile to trigger fetch
                openFile({ id: state.selectedFileId } as any);
                navigate(location.pathname, { replace: true, state: {} });
            }
        }
    }, [location.state, loading, files, selected, navigate, location.pathname]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setError("");
        try {
            const payload = { ...createForm };
            if (!payload.workflowCategoryId) delete (payload as any).workflowCategoryId;
            if (!payload.classificationId) delete (payload as any).classificationId;

            await filesApi.create(payload);
            toast.success("File created successfully");
            setShowCreate(false);
            setCreateForm({
                subject: "",
                description: "",
                classificationId: "",
                departmentId: "",
                workflowCategoryId: "",
                priority: "NORMAL",
                confidentiality: "INTERNAL",
                category: "OTHER",
                dueDate: "",
            });
            fetchFiles();
        } catch (err: any) { setError(err?.response?.data?.message || "Failed to create file"); }
        finally { setSubmitting(false); }
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault(); if (!selected || !showAction) return;
        setSubmitting(true); setError("");
        try {
            // Check if file is in advanced workflow
            if (selected.workflowCategoryId && (showAction === 'approve' || showAction === 'reject' || showAction === 'return')) {
                await workflowApi.processAction(selected.id, {
                    status: showAction === 'approve' ? 'APPROVED' : showAction === 'reject' ? 'REJECTED' : 'RETURNED',
                    comments: actionForm.remarks
                });
            } else {
                // Standard actions — only include toUserId when it's set (approve/reject don't need it)
                const payload = actionForm.toUserId
                    ? { ...actionForm }
                    : { remarks: actionForm.remarks };
                if (showAction === "forward") await filesApi.forward(selected.id, payload);
                else if (showAction === "approve") await filesApi.approve(selected.id, payload);
                else if (showAction === "return") await filesApi.return(selected.id, payload);
                else if (showAction === "reject") await filesApi.reject(selected.id, payload);
            }



            toast.success(`File ${showAction === 'return' ? 'returned' : showAction + 'd'} successfully`);
            setShowAction(null);
            setActionForm({ toUserId: "", remarks: "" });
            // Close the file detail dialog and refresh the list
            setSelected(null);
            setMovements([]);
            setDocuments([]);
            fetchFiles();
        } catch (err: any) { setError(err?.response?.data?.message || "Action failed"); }
        finally { setSubmitting(false); }
    };

    const handleUpload = async () => {
        if (!uploadForm.file || !selected) return;
        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append('file', uploadForm.file);

            await documentsApi.upload(formData, {
                fileId: selected.id,
                description: uploadForm.description || undefined,
                heading: uploadForm.heading.trim() || undefined
            });
            toast.success("Document uploaded successfully");

            // Refresh documents
            const res = await documentsApi.findByFile(selected.id);
            setDocuments(Array.isArray(res.data) ? res.data : []);
            setShowUpload(false);
            setUploadForm({ file: null, description: "", heading: "" });
        } catch (err: any) {
            setError(err?.response?.data?.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc: Document) => {
        try {
            const res = await documentsApi.download(doc.id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.originalName || doc.name || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            // Error handling
        }
    };

    const handleDeleteDocument = async (id: string) => {
        if (!selected) return;
        if (!confirm("Are you sure you want to delete this document?")) return;
        try {
            await documentsApi.delete(id);
            const res = await documentsApi.findByFile(selected.id);
            setDocuments(Array.isArray(res.data) ? res.data : []);
        } catch (err: any) {
            alert("Failed to delete document");
        }
    };

    const StatusBadge = ({ file }: { file: FileRecord }) => {
        const isOwner = file.currentOwnerId === user?.id;
        const isActive = ['PENDING', 'FORWARDED', 'RETURNED'].includes(file.status);

        const cfg = statusConfig[file.status] || statusConfig.PENDING;
        let label = cfg.label;
        let color = cfg.color;
        let Icon = cfg.icon;

        if (isOwner && isActive) {
            label = "Action Required";
            color = "bg-orange-100 text-orange-800 border-orange-200 border";
            Icon = AlertCircle;
        }

        return <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${color} flex items-center gap-1 w-fit`}>
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </span>;
    };

    const actionLabels: Record<string, string> = {
        forward: "Forward File", approve: "Approve File", return: "Return File", reject: "Reject File"
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">File Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Create, track, and manage files through the approval workflow</p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create File
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-card">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search files..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                            <TabsList>
                                <TabsTrigger value="ALL">All</TabsTrigger>
                                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                                <TabsTrigger value="FORWARDED">Forwarded</TabsTrigger>
                                <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                                <TabsTrigger value="RETURNED">Returned</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All priorities</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="NORMAL">Normal</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All categories</SelectItem>
                                <SelectItem value="FINANCE">Finance</SelectItem>
                                <SelectItem value="HR">HR</SelectItem>
                                <SelectItem value="LEGAL">Legal</SelectItem>
                                <SelectItem value="OPERATIONS">Operations</SelectItem>
                                <SelectItem value="IT">IT</SelectItem>
                                <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="CUSTOMER_SERVICE">Customer Service</SelectItem>
                                <SelectItem value="PROJECT">Project</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={confidentialityFilter} onValueChange={setConfidentialityFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Confidentiality" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All levels</SelectItem>
                                <SelectItem value="PUBLIC">Public</SelectItem>
                                <SelectItem value="INTERNAL">Internal</SelectItem>
                                <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                                <SelectItem value="RESTRICTED">Restricted</SelectItem>
                                <SelectItem value="SECRET">Secret</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={fetchFiles}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            {/* File List */}
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-primary" /> Files
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
                            <FolderOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No files found</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>Create First File</Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map((file) => (
                                <div key={file.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                                    onClick={() => openFile(file)}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                            <FolderOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">{file.subject}</p>
                                                {file.workflowCategory && <Badge variant="outline" className="text-[10px] h-5">{file.workflowCategory.name}</Badge>}
                                                {(file as any).isMaster && <Badge variant="default" className="text-[10px] h-5 bg-indigo-500 hover:bg-indigo-600">Master File</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {file.fileNumber} · {file.department?.name || "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <StatusBadge file={file} />
                                        {file.priority && (
                                            <Badge variant="outline" className="text-[10px] h-5">
                                                {file.priority}
                                            </Badge>
                                        )}
                                        {file.currentStage && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Stage {file.currentStage.stageOrder}</span>}
                                        {file.dueDate && file.status === 'PENDING' && new Date(file.dueDate) < new Date() && (
                                            <Badge variant="destructive" className="text-[10px] h-5">
                                                Overdue
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground hidden sm:block">
                                            {new Date(file.createdAt).toLocaleDateString()}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* File Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setMovements([]); setDocuments([]); }}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto flex flex-col p-0 gap-0">
                    <div className="p-6 pb-2">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                {(selected as any)?.parentId && (selected as any)?.parent && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 mr-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                                        onClick={() => openFile((selected as any).parent)}
                                        title="Back to Master File"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                )}
                                <FolderOpen className="w-6 h-6 text-primary" />
                                <span className="truncate">{selected?.fileNumber}</span>
                            </DialogTitle>
                            <p className="text-sm text-muted-foreground pl-10">
                                {selected?.subject}
                            </p>
                        </DialogHeader>

                        {selected?.workflowCategory && (
                            <div className="mt-4 bg-slate-50 border rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Workflow</p>
                                    <p className="font-medium text-sm">{selected.workflowCategory.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Current Stage</p>
                                    {selected.currentStage ? (
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <Badge variant="secondary">Stage {selected.currentStage.stageOrder}</Badge>
                                            <span className="text-sm font-medium">{selected.currentStage.role}</span>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-green-600 font-medium">Completed</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                        <div className="px-6 border-b">
                            <TabsList className="w-full justify-start h-12 bg-transparent p-0">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">Overview</TabsTrigger>
                                {!(selected as any)?.isMaster && (
                                    <>
                                        <TabsTrigger value="documents" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">Documents <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1">{documents.length}</Badge></TabsTrigger>
                                        <TabsTrigger value="remarks" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">
                                            Remarks
                                            {movements.filter(m => m.remarks).length > 0 && (
                                                <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1">{movements.filter(m => m.remarks).length}</Badge>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-4">History</TabsTrigger>
                                    </>
                                )}
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <TabsContent value="overview" className="mt-0 space-y-6">
                                {/* Metadata */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                    <div className="space-y-1"><p className="text-muted-foreground text-xs">Status</p>{selected && <StatusBadge file={selected} />}</div>
                                    <div className="space-y-1"><p className="text-muted-foreground text-xs">Department</p><p className="font-medium">{selected?.department?.name}</p></div>
                                    <div className="space-y-1"><p className="text-muted-foreground text-xs">Created By</p><p className="font-medium">{selected?.createdBy?.firstName} {selected?.createdBy?.lastName}</p></div>
                                    <div className="space-y-1"><p className="text-muted-foreground text-xs">Current Owner</p><p className="font-medium">{selected?.currentOwner?.firstName || "—"} {selected?.currentOwner?.lastName}</p></div>
                                    <div className="space-y-1"><p className="text-muted-foreground text-xs">Workflow</p><p className="font-medium">{(selected?.classification as any)?.name || String(selected?.classification || "—")}</p></div>
                                    <div className="space-y-1"><p className="text-muted-foreground text-xs">Created Date</p><p className="font-medium">{selected && new Date(selected.createdAt).toLocaleDateString()}</p></div>
                                    <div className="space-y-1"><p className="text-muted-foreground text-xs">Priority</p><p className="font-medium">{selected?.priority || "—"}</p></div>
                                </div>

                                {selected?.description && (
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <div className="text-sm bg-muted/30 p-3 rounded-md border text-foreground/80 leading-relaxed">
                                            {selected.description}
                                        </div>
                                    </div>
                                )}

                                {selected && (selected as any).isMaster && (selected as any).children && ((selected as any).children.length > 0) && (
                                    <div className="space-y-2 mt-4">
                                        <Label>Sub-Files</Label>
                                        <div className="space-y-2 bg-muted/20 p-3 rounded-md border">
                                            {(selected as any).children.map((child: any) => (
                                                <div
                                                    key={child.id}
                                                    className="flex justify-between items-center bg-background p-2 rounded border text-sm hover:bg-muted/50 cursor-pointer group transition-colors"
                                                    onClick={() => openFile(child)}
                                                >
                                                    <span className="font-medium truncate pr-4">{child.fileNumber} - {child.subject}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${child.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                            child.status === 'CLOSED' ? 'bg-slate-100 text-slate-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>{child.status}</span>
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selected && (selected as any).parentId && (selected as any).parent && (
                                    <div className="space-y-2 mt-4">
                                        <Label>Part of Master File</Label>
                                        <div className="bg-muted/20 p-3 rounded-md border text-sm flex justify-between items-center">
                                            <span className="font-medium truncate pr-4">{(selected as any).parent.fileNumber} - {(selected as any).parent.subject}</span>
                                            <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">Master ({((selected as any).parent.status)})</span>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                {/* Action Buttons */}
                                {!(selected as any)?.isMaster && ((selected?.status === "PENDING" || selected?.status === "FORWARDED" || selected?.status === "RETURNED") && (
                                    (!selected.currentStage && selected.currentOwnerId === user?.id && user?.role !== 'DEPT_HEAD' && user?.role !== 'ADMIN') ||
                                    ((isApprover && selected.currentStage && selected.currentStage.role === user?.role) ||
                                        ((user?.role === 'DEPT_HEAD' || user?.role === 'ADMIN') && (selected.currentOwnerId === user?.id || selected.departmentId === user?.departmentId))) ||
                                    (selected.currentOwnerId === user?.id)
                                )) && (
                                        <div>
                                            <p className="text-sm font-medium mb-3">Available Actions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {/* Forward: only for current owner, non-workflow files, non-DEPT_HEAD */}
                                                {!selected.currentStage && selected.currentOwnerId === user?.id && user?.role !== 'DEPT_HEAD' && user?.role !== 'ADMIN' && (
                                                    <Button size="sm" variant="outline" className="gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                                                        onClick={() => { setShowAction("forward"); setError(""); }}>
                                                        <Send className="w-3.5 h-3.5" /> {(selected?.status === "RETURNED") ? "Resubmit" : "Forward"}
                                                    </Button>
                                                )}
                                                {/* Approve: workflow stage match OR dept head of the file's department */}
                                                {((isApprover && selected.currentStage && selected.currentStage.role === user?.role) ||
                                                    ((user?.role === 'DEPT_HEAD' || user?.role === 'ADMIN') && (selected.currentOwnerId === user?.id || selected.departmentId === user?.departmentId))) && (
                                                        <Button size="sm" variant="outline" className="gap-1 text-green-700 border-green-200 hover:bg-green-50"
                                                            onClick={() => { setShowAction("approve"); setError(""); }}>
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                                        </Button>
                                                    )}
                                                {/* Return: current owner OR dept head of the file's department */}
                                                {(selected.currentOwnerId === user?.id || ((user?.role === 'DEPT_HEAD' || user?.role === 'ADMIN') && selected.departmentId === user?.departmentId)) && (
                                                    <Button size="sm" variant="outline" className="gap-1 text-orange-700 border-orange-200 hover:bg-orange-50"
                                                        onClick={() => { setShowAction("return"); setError(""); }}>
                                                        <RotateCcw className="w-3.5 h-3.5" /> Return
                                                    </Button>
                                                )}
                                                {/* Reject: workflow stage match OR dept head of the file's department */}
                                                {((isApprover && selected.currentStage && selected.currentStage.role === user?.role) ||
                                                    ((user?.role === 'DEPT_HEAD' || user?.role === 'ADMIN') && (selected.currentOwnerId === user?.id || selected.departmentId === user?.departmentId))) && (
                                                        <Button size="sm" variant="outline" className="gap-1 text-red-700 border-red-200 hover:bg-red-50"
                                                            onClick={() => { setShowAction("reject"); setError(""); }}>
                                                            <XCircle className="w-3.5 h-3.5" /> Reject
                                                        </Button>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                            </TabsContent>

                            <TabsContent value="documents" className="mt-0">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-medium">Attached Documents</h3>
                                        {((selected?.status === "PENDING" || selected?.status === "FORWARDED" || selected?.status === "RETURNED") && (
                                            (!selected.currentStage && selected.currentOwnerId === user?.id && user?.role !== 'DEPT_HEAD' && user?.role !== 'ADMIN') ||
                                            ((isApprover && selected.currentStage && selected.currentStage.role === user?.role) ||
                                                ((user?.role === 'DEPT_HEAD' || user?.role === 'ADMIN') && (selected.currentOwnerId === user?.id || selected.departmentId === user?.departmentId))) ||
                                            (selected.currentOwnerId === user?.id)
                                        )) && (
                                                <Button size="sm" variant="outline" className="gap-2" onClick={() => { setShowUpload(true); setError(""); }}>
                                                    <Upload className="w-4 h-4" /> Upload Version
                                                </Button>
                                            )}
                                    </div>

                                    {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded flex gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

                                    {documents.length === 0 ? (
                                        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
                                            <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p>No documents attached</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {Object.entries(documents.reduce((acc, doc) => {
                                                const h = doc.heading || "General Documents";
                                                if (!acc[h]) acc[h] = [];
                                                acc[h].push(doc);
                                                return acc;
                                            }, {} as Record<string, Document[]>)).map(([heading, docs]) => (
                                                <div key={heading} className="space-y-2">
                                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{heading}</h4>
                                                    {docs.map((doc) => (
                                                        <div key={doc.id} className="border rounded-md bg-card hover:bg-muted/30 overflow-hidden">
                                                            <div className="flex items-center justify-between p-3">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
                                                                        v{doc.version}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium truncate">{doc.originalName || doc.name}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {(doc.size / 1024).toFixed(1)} KB · {new Date(doc.createdAt).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                        onClick={() => handleDownload(doc)} title="Download">
                                                                        <Download className="w-4 h-4" />
                                                                    </Button>
                                                                    {selected?.status === 'PENDING' && (
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                            onClick={() => handleDeleteDocument(doc.id)} title="Delete">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {doc.description && (
                                                                <div className="border-t bg-blue-50/50 px-3 py-2">
                                                                    <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wide mb-0.5">Remarks</p>
                                                                    <p className="text-xs text-blue-800">{doc.description}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="history" className="mt-0 space-y-6">
                                {/* Workflow History */}
                                {selected?.approvals && selected.approvals.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium mb-3 flex items-center gap-2"><GitBranch className="w-4 h-4" /> Workflow Approval Log</p>
                                        <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                                            {selected.approvals.map((approval) => (
                                                <div key={approval.id} className="relative pl-4">
                                                    <div className="absolute -left-[9px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-background bg-primary/20" />
                                                    <div className="flex justify-between items-start text-sm">
                                                        <div>
                                                            <p className="font-medium">Stage {approval.stage?.stageOrder} - {approval.stage?.role}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Status: <span className={
                                                                    approval.status === 'APPROVED' ? 'text-green-600' :
                                                                        approval.status === 'REJECTED' ? 'text-red-600' : 'text-orange-600'
                                                                }>{approval.status}</span>
                                                            </p>
                                                            {approval.comments && <p className="text-xs mt-1 italic">"{approval.comments}"</p>}
                                                        </div>
                                                        {approval.actionDate && <span className="text-xs text-muted-foreground">{new Date(approval.actionDate).toLocaleDateString()}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="my-4" />
                                    </div>
                                )}

                                {/* Movement Trail */}
                                <div>
                                    <p className="text-sm font-medium mb-3">Audit Trail (File Movements)</p>
                                    {movements.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No movements recorded yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {movements.map((m, i) => (
                                                <div key={m.id} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">{i + 1}</div>
                                                        {i < movements.length - 1 && <div className="w-0.5 h-6 bg-border mt-1" />}
                                                    </div>
                                                    <div className="pb-2 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {(() => {
                                                                const fromName = m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}` : "System";
                                                                const toName = m.toUser ? `${m.toUser.firstName} ${m.toUser.lastName}` : "—";

                                                                if (m.action === 'CREATE') {
                                                                    return <span className="text-xs font-medium">{toName}</span>;
                                                                }

                                                                if (m.fromUser && m.toUser && m.fromUser.id === m.toUser.id) {
                                                                    return <span className="text-xs font-medium">{fromName}</span>;
                                                                }

                                                                return (
                                                                    <>
                                                                        <span className="text-xs font-medium">{fromName}</span>
                                                                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                                                        <span className="text-xs font-medium">{toName}</span>
                                                                    </>
                                                                );
                                                            })()}
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${m.action === "APPROVE" ? "bg-green-50 text-green-700" :
                                                                m.action === "RETURN" ? "bg-orange-50 text-orange-700" :
                                                                    m.action === "REJECT" ? "bg-red-50 text-red-700" :
                                                                        "bg-blue-50 text-blue-700"}`}>{m.action}</span>
                                                        </div>
                                                        {m.remarks && <p className="text-xs text-muted-foreground mt-0.5">{m.remarks}</p>}
                                                        <p className="text-[10px] text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* ── Remarks Tab ──────────────────────────────── */}
                            <TabsContent value="remarks" className="mt-0">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium">Remarks History</h3>
                                    {movements.filter(m => m.remarks).length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <p className="text-sm">No remarks have been added yet.</p>
                                            <p className="text-xs mt-1">Remarks are added when a file is forwarded, approved, returned or rejected.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {movements.filter(m => m.remarks).map((m, i) => {
                                                const colorMap: Record<string, { card: string; badge: string }> = {
                                                    FORWARD: { card: "border-l-blue-400 bg-blue-50/40", badge: "bg-blue-100 text-blue-700" },
                                                    APPROVE: { card: "border-l-green-400 bg-green-50/40", badge: "bg-green-100 text-green-700" },
                                                    RETURN: { card: "border-l-orange-400 bg-orange-50/40", badge: "bg-orange-100 text-orange-700" },
                                                    REJECT: { card: "border-l-red-400 bg-red-50/40", badge: "bg-red-100 text-red-700" },
                                                };
                                                const c = colorMap[m.action] || { card: "border-l-gray-300 bg-muted/20", badge: "bg-gray-100 text-gray-700" };
                                                return (
                                                    <div key={m.id} className={`border-l-4 rounded-md p-4 ${c.card}`}>
                                                        {/* Header row */}
                                                        <div className="flex items-start justify-between gap-2 flex-wrap">
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-sm font-semibold">
                                                                        {m.fromUser ? `${m.fromUser.firstName} ${m.fromUser.lastName}` : "System"}
                                                                    </span>
                                                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {m.toUser ? `${m.toUser.firstName} ${m.toUser.lastName}` : "—"}
                                                                    </span>
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${c.badge}`}>
                                                                        {m.action}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    {new Date(m.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                                </p>
                                                            </div>
                                                            <span className="text-[11px] text-muted-foreground font-medium shrink-0">#{i + 1}</span>
                                                        </div>
                                                        {/* Remarks body */}
                                                        <div className="mt-3 border-t border-black/10 pt-3">
                                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Remarks</p>
                                                            <p className="text-sm leading-relaxed">{m.remarks}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                        </div>
                    </Tabs>
                    <DialogFooter className="p-4 border-t bg-muted/20">
                        <Button variant="outline" onClick={() => { setSelected(null); setMovements([]); setDocuments([]); }}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create File Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Create New File</DialogTitle></DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        {error && <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Input required value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} placeholder="File subject" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Select value={createForm.departmentId} onValueChange={(v) => setCreateForm({ ...createForm, departmentId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select dept." /></SelectTrigger>
                                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Classification</Label>
                                <Select value={createForm.classificationId} onValueChange={(v) => setCreateForm({ ...createForm, classificationId: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select classification" /></SelectTrigger>
                                    <SelectContent>
                                        {classifications.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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



                        <div className="space-y-2">
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={createForm.dueDate}
                                onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Brief description..." rows={3} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create File"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Action Dialog */}
            <Dialog open={!!showAction} onOpenChange={() => setShowAction(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{showAction ? actionLabels[showAction] : ""}</DialogTitle></DialogHeader>
                    <form onSubmit={handleAction} className="space-y-4">
                        {error && <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

                        {/* Show user selector only for forward (normal/no classification) and return actions */}
                        {((showAction === "forward" && (selected as any)?.classification?.type !== "CUSTOM") ||
                            (!selected?.workflowCategoryId && showAction === "return")) && (
                                <div className="space-y-2">
                                    <Label>{showAction === "return" ? "Return To *" : "Assign To *"}</Label>
                                    <Select value={actionForm.toUserId} onValueChange={(v) => setActionForm({ ...actionForm, toUserId: v })}>
                                        <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                                        <SelectContent>
                                            {users.filter(u => {
                                                if (u.id === user?.id) return false;
                                                if (showAction === "return") {
                                                    // Only show users who have been involved in the file (creator + previous owners from movements)
                                                    const involvedUserIds = new Set<string>();
                                                    if (selected?.createdById) involvedUserIds.add(selected.createdById);
                                                    movements.forEach(m => {
                                                        if (m.fromUserId) involvedUserIds.add(m.fromUserId);
                                                        if (m.toUserId) involvedUserIds.add(m.toUserId);
                                                    });
                                                    return involvedUserIds.has(u.id);
                                                }
                                                return true; // For forward, show all users (except self)
                                            }).map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        {showAction === "forward" && (selected as any)?.classification?.type === "CUSTOM" && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2.5">
                                <span className="shrink-0">🔀</span>
                                <span>This file uses the <strong>{(selected as any)?.classification?.name}</strong> classification. It will be auto-routed to the next person in the predefined route.</span>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Remarks</Label>
                            <Textarea value={actionForm.remarks} onChange={(e) => setActionForm({ ...actionForm, remarks: e.target.value })} placeholder="Add remarks..." rows={3} />
                        </div>

                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowAction(null)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? "Processing..." : "Confirm"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Upload Document Dialog */}
            <Dialog open={showUpload} onOpenChange={(open) => { setShowUpload(open); if (!open) { setUploadForm({ file: null, description: "", heading: "" }); setError(""); setIsNewHeading(false); } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Upload Document</DialogTitle>
                        <DialogDescription>Select a file and add remarks for this document.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={async (e) => { e.preventDefault(); await handleUpload(); }} className="space-y-4">
                        {error && <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                        <div className="space-y-2">
                            <Label>File *</Label>
                            <Input
                                type="file"
                                required
                                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] ?? null })}
                            />
                            {uploadForm.file && (
                                <p className="text-xs text-muted-foreground">{uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(1)} KB)</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Heading</Label>
                            {Array.from(new Set(documents.map(d => d.heading).filter(Boolean))).length > 0 && !isNewHeading ? (
                                <div className="flex gap-2">
                                    <Select
                                        value={uploadForm.heading}
                                        onValueChange={(val) => {
                                            if (val === "NEW_HEADING_OPTION") {
                                                setIsNewHeading(true);
                                                setUploadForm({ ...uploadForm, heading: "" });
                                            } else {
                                                setUploadForm({ ...uploadForm, heading: val });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select heading..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from(new Set(documents.map(d => d.heading).filter(Boolean))).map((h) => (
                                                <SelectItem key={h as string} value={h as string}>{h as string}</SelectItem>
                                            ))}
                                            <SelectItem value="NEW_HEADING_OPTION" className="text-muted-foreground font-medium">
                                                + Create New Heading
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="E.g. Contract, Invoice..."
                                        value={uploadForm.heading}
                                        onChange={(e) => setUploadForm({ ...uploadForm, heading: e.target.value })}
                                        autoFocus={isNewHeading}
                                    />
                                    {Array.from(new Set(documents.map(d => d.heading).filter(Boolean))).length > 0 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsNewHeading(false)}
                                            className="shrink-0"
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Remarks / Description</Label>
                            <Textarea
                                placeholder="Add remarks for this document..."
                                value={uploadForm.description}
                                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowUpload(false)}>Cancel</Button>
                            <Button type="submit" disabled={uploading || !uploadForm.file}>
                                {uploading ? <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Upload Version</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FileManagement;
