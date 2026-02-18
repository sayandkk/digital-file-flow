import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Inbox, Plus, Search, RefreshCw, Eye, Link2, AlertCircle } from "lucide-react";
import { inwardApi } from "@/lib/api";
import type { Inward, InwardType, Priority } from "@/lib/types";

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

    useEffect(() => { fetchInwards(); }, [search, priorityFilter]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            await inwardApi.create(form);
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
                                        {item.fileId && <Link2 className="w-4 h-4 text-success" title="Linked to file" />}
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
