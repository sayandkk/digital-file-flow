import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Inbox, Plus, Search, RefreshCw, Eye, Link2, AlertCircle, FileText, Upload, Download, Trash2, XCircle } from "lucide-react";
import { inwardApi, documentsApi } from "@/lib/api";
import type { Inward, InwardType, Priority, Document } from "@/lib/types";

const priorityColors: Record<Priority, string> = {
    LOW: "bg-slate-100 text-slate-700",
    NORMAL: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
};

const typeLabels: Record<InwardType, string> = {
    LETTER: "Letter", MEMO: "Memo", REPORT: "Report", APPLICATION: "Application", OTHER: "Other",
};

const InwardManagement = () => {
    const [inwards, setInwards] = useState<Inward[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [showForm, setShowForm] = useState(false);
    const [selected, setSelected] = useState<Inward | null>(null);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        subject: "", source: "", type: "LETTER" as InwardType,
        priority: "NORMAL" as Priority, description: "",
    });
    const [submitting, setSubmitting] = useState(false);

    // Document handling
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [docsLoading, setDocsLoading] = useState(false);
    const [uploadHeading, setUploadHeading] = useState("");
    const [isNewHeading, setIsNewHeading] = useState(false);

    const user = JSON.parse(localStorage.getItem("dms_user") || "{}");

    const fetchInwards = async () => {
        setLoading(true);
        try {
            const res = await inwardApi.list({ search, priority: priorityFilter === "ALL" ? undefined : priorityFilter });
            const data = res.data;
            setInwards(Array.isArray(data) ? data : data.data || []);
        } catch {
            setInwards([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async (inwardId: string) => {
        setDocsLoading(true);
        try {
            const res = await documentsApi.findByInward(inwardId);
            setDocuments(res.data);
        } catch (error) {
            console.error("Failed to fetch documents", error);
            setDocuments([]);
        } finally {
            setDocsLoading(false);
        }
    };

    useEffect(() => { fetchInwards(); }, [search, priorityFilter]);

    useEffect(() => {
        if (selected) {
            fetchDocuments(selected.id);
        } else {
            setDocuments([]);
        }
    }, [selected]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !selected) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        setUploading(true);
        try {
            await documentsApi.upload(formData, {
                inwardId: selected.id,
                description: "Uploaded via Inward Management",
                heading: uploadHeading.trim() || undefined
            });
            fetchDocuments(selected.id);
            setUploadHeading(""); // Reset heading
            setIsNewHeading(false);
        } catch (error) {
            console.error("Upload failed", error);
            setError("Failed to upload document");
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = "";
        }
    };

    const handleDownload = async (doc: Document) => {
        try {
            const res = await documentsApi.download(doc.id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", doc.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("For download failed", error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const payload = {
            subject: form.subject,
            senderName: form.source,
            inwardType: form.type,
            description: form.description,
            departmentId: user.departmentId || user.department?.id,
        };

        try {
            await inwardApi.create(payload);
            setShowForm(false);
            setForm({ subject: "", source: "", type: "LETTER", priority: "NORMAL", description: "" });
            fetchInwards();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create inward entry");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Inward Register</h1>
                    <p className="text-muted-foreground text-sm mt-1">Register and track incoming correspondence</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> New Inward
                </Button>
            </div>

            {/* Filters */}
            <Card className="shadow-card">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search by subject or source..." className="pl-9" value={search}
                                onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Priorities</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="NORMAL">Normal</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={fetchInwards}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-primary" /> Inward Entries
                        <Badge variant="secondary" className="ml-2">{inwards.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                        </div>
                    ) : inwards.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No inward entries found</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
                                Register First Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {inwards.map((item) => (
                                <div key={item.id}
                                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                                    onClick={() => setSelected(item)}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                            <Inbox className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{item.subject}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.inwardNumber} · {item.source || "—"} · {typeLabels[item.type]}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[item.priority]}`}>
                                            {item.priority}
                                        </span>
                                        {item.fileId && <Link2 className="w-4 h-4 text-success" />}
                                        <span className="text-xs text-muted-foreground hidden sm:block">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* New Inward Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Register New Inward Entry</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                placeholder="Brief subject of the correspondence" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as InwardType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(typeLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="NORMAL">Normal</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="URGENT">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Source / Sender</Label>
                            <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                                placeholder="Department or external sender" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Additional details..." rows={3} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : "Register"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{selected?.inwardNumber} — Detail</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div><p className="text-muted-foreground text-xs">Subject</p><p className="font-medium">{selected.subject}</p></div>
                                <div><p className="text-muted-foreground text-xs">Type</p><p className="font-medium">{typeLabels[selected.type]}</p></div>
                                <div><p className="text-muted-foreground text-xs">Source</p><p className="font-medium">{selected.source || "—"}</p></div>
                                <div><p className="text-muted-foreground text-xs">Priority</p>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                                </div>
                                <div><p className="text-muted-foreground text-xs">Received</p><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
                                <div><p className="text-muted-foreground text-xs">Linked File</p>
                                    <p className="font-medium">{selected.fileId ? <span className="text-success flex items-center gap-1"><Link2 className="w-3 h-3" /> Linked</span> : "Not linked"}</p>
                                </div>
                            </div>
                            {selected.description && (
                                <div><p className="text-muted-foreground text-xs">Description</p><p>{selected.description}</p></div>
                            )}

                            <div className="pt-4 border-t">
                                <div className="flex flex-col gap-3 mb-3">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Attached Documents
                                    </h3>

                                    <div className="flex gap-2">
                                        {Array.from(new Set(documents.map(d => d.heading).filter(Boolean))).length > 0 && !isNewHeading ? (
                                            <Select
                                                value={uploadHeading}
                                                onValueChange={(val) => {
                                                    if (val === "NEW_HEADING_OPTION") {
                                                        setIsNewHeading(true);
                                                        setUploadHeading("");
                                                    } else {
                                                        setUploadHeading(val);
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-sm w-[200px]">
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
                                        ) : (
                                            <div className="flex gap-1 items-center">
                                                <Input
                                                    placeholder="Heading..."
                                                    value={uploadHeading}
                                                    onChange={(e) => setUploadHeading(e.target.value)}
                                                    className="h-8 text-sm w-[200px]"
                                                    autoFocus={isNewHeading}
                                                />
                                                {Array.from(new Set(documents.map(d => d.heading).filter(Boolean))).length > 0 && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => setIsNewHeading(false)}
                                                        title="Select existing heading"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                        <div className="relative shrink-0">
                                            <input
                                                type="file"
                                                id="doc-upload"
                                                className="hidden"
                                                onChange={handleUpload}
                                                disabled={uploading}
                                            />
                                            <Button size="sm" variant="outline" className="h-8 gap-2" disabled={uploading}
                                                onClick={() => document.getElementById("doc-upload")?.click()}>
                                                {uploading ? (
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Upload className="w-3 h-3" />
                                                )}
                                                Upload Version
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {docsLoading ? (
                                    <div className="text-center py-4 text-muted-foreground text-sm">Loading documents...</div>
                                ) : documents.length === 0 ? (
                                    <div className="text-center py-6 border rounded-md border-dashed text-muted-foreground text-sm">
                                        No documents attached yet
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                        {Object.entries(documents.reduce((acc, doc) => {
                                            const h = doc.heading || "General Documents";
                                            if (!acc[h]) acc[h] = [];
                                            acc[h].push(doc);
                                            return acc;
                                        }, {} as Record<string, Document[]>)).map(([heading, docs]) => (
                                            <div key={heading} className="space-y-2">
                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{heading}</h4>
                                                {docs.map((doc) => (
                                                    <div key={doc.id} className="flex items-center justify-between p-2 rounded border bg-card/50 text-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xs">
                                                                v{doc.version}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium truncate">{doc.originalName}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {(doc.size / 1024).toFixed(1)} KB · {new Date(doc.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(doc)}>
                                                            <Download className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default InwardManagement;
