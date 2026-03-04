import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    FileText, Upload, Search, RefreshCw, Download, Trash2,
    Eye, AlertCircle, Tag, File, CheckSquare, Square
} from "lucide-react";
import { documentsApi, filesApi, API_BASE_URL } from "@/lib/api";
import type { Document, FileRecord } from "@/lib/types";

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const DocumentManagement = () => {
    const [docs, setDocs] = useState<Document[]>([]);
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showUpload, setShowUpload] = useState(false);
    const [viewing, setViewing] = useState<Document | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [uploadForm, setUploadForm] = useState({ fileId: "", tags: "" });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const res = await documentsApi.list({ search });
            const d = res.data;
            setDocs(Array.isArray(d) ? d : d.data || []);
        } catch { setDocs([]); } finally { setLoading(false); }
    };

    useEffect(() => { fetchDocs(); }, [search]);

    useEffect(() => {
        filesApi.list().then(r => { const d = r.data; setFiles(Array.isArray(d) ? d : d.data || []); }).catch(() => { });
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) { setError("Please select a file"); return; }
        setUploading(true); setError("");
        try {
            const fd = new FormData();
            fd.append("file", uploadFile);
            if (uploadForm.fileId) fd.append("fileId", uploadForm.fileId);
            if (uploadForm.tags) fd.append("tags", uploadForm.tags);
            await documentsApi.upload(fd);
            setShowUpload(false);
            setUploadFile(null);
            setUploadForm({ fileId: "", tags: "" });
            fetchDocs();
        } catch (err: any) { setError(err?.response?.data?.message || "Upload failed"); }
        finally { setUploading(false); }
    };

    const handleDownload = async (doc: Document) => {
        try {
            const res = await documentsApi.download(doc.id);
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement("a");
            a.href = url; a.download = doc.originalName; a.click();
            URL.revokeObjectURL(url);
        } catch { alert("Download failed"); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this document?")) return;
        try { await documentsApi.delete(id); fetchDocs(); }
        catch { alert("Delete failed"); }
    };

    const handleBatchDelete = async () => {
        if (!confirm(`Delete ${selected.size} document(s)?`)) return;
        for (const id of selected) { try { await documentsApi.delete(id); } catch { } }
        setSelected(new Set()); fetchDocs();
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };

    const isPdf = (doc: Document) => doc.mimeType === "application/pdf";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">Upload, view, and manage documents with version control</p>
                </div>
                <Button onClick={() => setShowUpload(true)} className="gap-2">
                    <Upload className="w-4 h-4" /> Upload Document
                </Button>
            </div>

            {/* Toolbar */}
            <Card className="shadow-card">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                        {selected.size > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{selected.size} selected</Badge>
                                <Button variant="outline" size="sm" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleBatchDelete}>
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                                </Button>
                            </div>
                        )}
                        <Button variant="outline" size="icon" onClick={fetchDocs}><RefreshCw className="w-4 h-4" /></Button>
                    </div>
                </CardContent>
            </Card>

            {/* Document Grid */}
            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Documents
                        <Badge variant="secondary" className="ml-2">{docs.length}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                        </div>
                    ) : docs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No documents found</p>
                            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowUpload(true)}>Upload First Document</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {docs.map((doc) => (
                                <div key={doc.id}
                                    className={`relative p-4 rounded-lg border transition-all ${selected.has(doc.id) ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"}`}>
                                    <button className="absolute top-3 left-3" onClick={() => toggleSelect(doc.id)}>
                                        {selected.has(doc.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                                    </button>
                                    <div className="pl-6">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                                                <File className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex gap-1">
                                                {isPdf(doc) && (
                                                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => setViewing(doc)} title="View PDF">
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </Button>
                                                )}
                                                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => handleDownload(doc)} title="Download">
                                                    <Download className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive" onClick={() => handleDelete(doc.id)} title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium truncate" title={doc.originalName}>{doc.originalName}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-xs text-muted-foreground">{formatBytes(doc.size)}</span>
                                            <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">v{doc.version}</span>
                                            {doc.isReference && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" /> Ref</span>}
                                        </div>
                                        {doc.file && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.file.fileNumber}</p>}
                                        <p className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Upload Dialog */}
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
                    <form onSubmit={handleUpload} className="space-y-4">
                        {error && <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
                            onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            {uploadFile ? (
                                <p className="text-sm font-medium text-primary">{uploadFile.name}</p>
                            ) : (
                                <>
                                    <p className="text-sm text-muted-foreground">Drag & drop or click to select</p>
                                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, XLS, XLSX, images</p>
                                </>
                            )}
                            <input ref={fileInputRef} type="file" className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f); }} />
                        </div>
                        <div className="space-y-2">
                            <Label>Link to File (optional)</Label>
                            <Select value={uploadForm.fileId || "no_file"} onValueChange={(v) => setUploadForm({ ...uploadForm, fileId: v === "no_file" ? "" : v })}>
                                <SelectTrigger><SelectValue placeholder="Select a file" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="no_file">No file</SelectItem>
                                    {files.map(f => <SelectItem key={f.id} value={f.id}>{f.fileNumber} — {f.subject}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tags (comma separated)</Label>
                            <Input value={uploadForm.tags} onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })} placeholder="e.g. finance, q1, budget" />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setShowUpload(false)}>Cancel</Button>
                            <Button type="submit" disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* PDF Viewer Dialog */}
            <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <File className="w-4 h-4 text-primary" /> {viewing?.originalName}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 min-h-0">
                        {viewing && (
                            <iframe
                                src={`${API_BASE_URL}/documents/${viewing.id}/download`}
                                className="w-full h-full rounded-md border"
                                title={viewing.originalName}
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => viewing && handleDownload(viewing)}>
                            <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                        <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DocumentManagement;
