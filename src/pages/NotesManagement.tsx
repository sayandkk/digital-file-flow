import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Plus, RefreshCw, CheckCircle2, Edit2, Trash2, AlertCircle, Clock } from "lucide-react";
import { notesApi, filesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { Note, FileRecord } from "@/lib/types";

const NotesManagement = () => {
    const { isApprover } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [files, setFiles] = useState<FileRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("ALL");
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Note | null>(null);
    const [selected, setSelected] = useState<Note | null>(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ content: "", fileId: "" });

    const fetchNotes = async () => {
        setLoading(true);
        try {
            const res = await notesApi.list({ type: tab === "ALL" ? undefined : tab });
            const d = res.data;
            setNotes(Array.isArray(d) ? d : d.data || []);
        } catch { setNotes([]); } finally { setLoading(false); }
    };

    useEffect(() => { fetchNotes(); }, [tab]);

    useEffect(() => {
        filesApi.list().then(r => { const d = r.data; setFiles(Array.isArray(d) ? d : d.data || []); }).catch(() => { });
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setError("");
        try {
            if (editing) {
                await notesApi.update(editing.id, { content: form.content });
            } else {
                await notesApi.create(form);
            }
            setShowCreate(false); setEditing(null); setForm({ content: "", fileId: "" });
            fetchNotes();
        } catch (err: any) { setError(err?.response?.data?.message || "Failed to save note"); }
        finally { setSubmitting(false); }
    };

    const handleApprove = async (note: Note) => {
        try {
            await notesApi.approve(note.id);
            fetchNotes();
        } catch (err: any) { alert(err?.response?.data?.message || "Failed to approve note"); }
    };

    const handleDelete = async (note: Note) => {
        if (!confirm("Delete this draft note?")) return;
        try { await notesApi.delete(note.id); fetchNotes(); }
        catch (err: any) { alert(err?.response?.data?.message || "Failed to delete"); }
    };

    const openEdit = (note: Note) => {
        setEditing(note);
        setForm({ content: note.content, fileId: note.fileId || "" });
        setShowCreate(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notes & Drafts</h1>
                    <p className="text-muted-foreground text-sm mt-1">Manage draft and approved notes for files</p>
                </div>
                <Button onClick={() => { setEditing(null); setForm({ content: "", fileId: "" }); setShowCreate(true); }} className="gap-2">
                    <Plus className="w-4 h-4" /> New Note
                </Button>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="ALL">All Notes</TabsTrigger>
                    <TabsTrigger value="DRAFT">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-yellow-400" /> Yellow (Draft)
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="APPROVED">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-300" /> White (Approved)
                        </span>
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Card className="shadow-card">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" /> Notes
                        <Badge variant="secondary" className="ml-2">{notes.length}</Badge>
                        <Button variant="ghost" size="icon" className="ml-auto" onClick={fetchNotes}><RefreshCw className="w-4 h-4" /></Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p>No notes found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notes.map((note) => (
                                <div key={note.id}
                                    className={`p-4 rounded-lg border transition-colors ${note.type === "DRAFT" ? "border-yellow-200 bg-yellow-50/50" : "border-slate-200 bg-white"}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${note.type === "DRAFT" ? "bg-yellow-400" : "bg-slate-300"}`} />
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {note.type === "DRAFT" ? "Draft Note" : "Approved Note"} · v{note.version}
                                                </span>
                                                {note.file && <span className="text-xs text-muted-foreground">· {note.file.fileNumber}</span>}
                                            </div>
                                            <p className="text-sm line-clamp-3 cursor-pointer" onClick={() => setSelected(note)}>{note.content}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {new Date(note.createdAt).toLocaleString()}
                                                </span>
                                                {note.author && (
                                                    <span className="text-xs text-muted-foreground">by {note.author.firstName} {note.author.lastName}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            {note.type === "DRAFT" && (
                                                <>
                                                    <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => openEdit(note)}>
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    {isApprover && (
                                                        <Button size="icon" variant="ghost" className="w-7 h-7 text-green-600 hover:text-green-700" onClick={() => handleApprove(note)}>
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    )}
                                                    <Button size="icon" variant="ghost" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => handleDelete(note)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditing(null); } }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? "Edit Draft Note" : "Create New Note"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        {error && <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                        {!editing && (
                            <div className="space-y-2">
                                <Label>Linked File (optional)</Label>
                                <Select value={form.fileId || "no_file"} onValueChange={(v) => setForm({ ...form, fileId: v === "no_file" ? "" : v })}>
                                    <SelectTrigger><SelectValue placeholder="Select a file" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no_file">No file</SelectItem>
                                        {files.map(f => <SelectItem key={f.id} value={f.id}>{f.fileNumber} — {f.subject}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Note Content *</Label>
                            <Textarea required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                                placeholder="Write your note here..." rows={8} className="resize-none" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                            This will be saved as a <strong>Yellow (Draft)</strong> note. An approver can convert it to a White Note.
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => { setShowCreate(false); setEditing(null); }}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : editing ? "Update Note" : "Save Draft"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Full Note View */}
            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${selected?.type === "DRAFT" ? "bg-yellow-400" : "bg-slate-300"}`} />
                            {selected?.type === "DRAFT" ? "Draft Note" : "Approved Note"} · v{selected?.version}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-sm whitespace-pre-wrap">{selected?.content}</p>
                        <div className="text-xs text-muted-foreground border-t pt-2">
                            {selected?.author && <p>Author: {selected.author.firstName} {selected.author.lastName}</p>}
                            <p>Created: {selected && new Date(selected.createdAt).toLocaleString()}</p>
                            {selected?.file && <p>File: {selected.file.fileNumber}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NotesManagement;
