import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Tag, Plus, Trash2, Edit2, ChevronUp, ChevronDown, User, Check, X,
    GripVertical, ArrowRight, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { classificationsApi, usersApi } from "@/lib/api";

interface RouteUser {
    userId: string;
    order: number;
    user?: { id: string; firstName: string; lastName: string; role: string };
}

interface Classification {
    id: string;
    name: string;
    type: "NORMAL" | "CUSTOM";
    description?: string;
    createdBy: { firstName: string; lastName: string };
    routes: { id: string; order: number; userId: string; user: { id: string; firstName: string; lastName: string; role: string } }[];
    _count?: { files: number };
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Admin", DEPT_HEAD: "Dept Head", SUPERVISOR: "Supervisor",
    OFFICER: "Officer", ASSISTANT: "Assistant",
};

const ClassificationManagement = () => {
    const [classifications, setClassifications] = useState<Classification[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Classification | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Classification | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({ name: "", type: "NORMAL" as "NORMAL" | "CUSTOM", description: "" });
    const [routes, setRoutes] = useState<RouteUser[]>([]);
    const [addUserId, setAddUserId] = useState("");

    const load = async () => {
        setLoading(true);
        try {
            const [clRes, usrRes] = await Promise.all([
                classificationsApi.list(),
                usersApi.list({ limit: 100 }),
            ]);
            setClassifications(clRes.data);
            setUsers(usrRes.data?.data || usrRes.data || []);
        } catch {
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // DEBUG: Check data structure
    console.log("Classifications FULL:", classifications);
    if (classifications.length > 0) {
        console.log("First Item Type:", typeof classifications[0].type, classifications[0].type);
        console.log("First Item Name:", typeof classifications[0].name, classifications[0].name);
    }


    const openCreate = () => {
        setForm({ name: "", type: "NORMAL", description: "" });
        setRoutes([]);
        setAddUserId("");
        setEditing(null);
        setShowCreate(true);
    };

    const openEdit = (c: Classification) => {
        setForm({ name: c.name, type: c.type, description: c.description || "" });
        setRoutes(c.routes.map(r => ({ userId: r.userId, order: r.order, user: r.user })));
        setAddUserId("");
        setEditing(c);
        setShowCreate(true);
    };

    const addRoute = () => {
        if (!addUserId) return;
        if (routes.find(r => r.userId === addUserId)) {
            toast.error("This user is already in the route");
            return;
        }
        const usr = users.find(u => u.id === addUserId);
        const nextOrder = routes.length > 0 ? Math.max(...routes.map(r => r.order)) + 1 : 1;
        setRoutes(prev => [...prev, { userId: addUserId, order: nextOrder, user: usr }]);
        setAddUserId("");
    };

    const removeRoute = (userId: string) => {
        setRoutes(prev => prev.filter(r => r.userId !== userId)
            .map((r, i) => ({ ...r, order: i + 1 })));
    };

    const moveRoute = (index: number, dir: -1 | 1) => {
        const arr = [...routes];
        const target = index + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[index], arr[target]] = [arr[target], arr[index]];
        setRoutes(arr.map((r, i) => ({ ...r, order: i + 1 })));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return toast.error("Name is required");
        if (form.type === "CUSTOM" && routes.length < 1) return toast.error("Custom classification needs at least one route user");
        setSubmitting(true);
        try {
            if (editing) {
                await classificationsApi.update(editing.id, { name: form.name, description: form.description || undefined });
                if (form.type === "CUSTOM") {
                    await classificationsApi.setRoutes(editing.id, routes.map(r => ({ userId: r.userId, order: r.order })));
                }
                toast.success("Classification updated");
            } else {
                await classificationsApi.create({
                    name: form.name,
                    type: form.type,
                    description: form.description || undefined,
                    routes: form.type === "CUSTOM" ? routes.map(r => ({ userId: r.userId, order: r.order })) : [],
                });
                toast.success("Classification created");
            }
            setShowCreate(false);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to save");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await classificationsApi.delete(deleteTarget.id);
            toast.success("Classification deleted");
            setDeleteTarget(null);
            load();
        } catch {
            toast.error("Failed to delete");
        }
    };

    const availableUsers = users.filter(u => !routes.find(r => r.userId === u.id));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Tag className="w-6 h-6 text-primary" />
                        Work Flow Creations
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Define Work Flow Creations and their forwarding routes. Custom Work Flow Creations auto-route files to specified users in order.
                    </p>
                </div>
                <Button onClick={openCreate} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> New Classification
                </Button>
            </div>

            {/* Classification Cards */}
            {loading ? (
                <div className="text-center py-16 text-muted-foreground">Loading…</div>
            ) : classifications.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <Tag className="w-10 h-10 mx-auto mb-4 text-muted-foreground/40" />
                        <p className="font-medium text-muted-foreground">No classifications yet</p>
                        <p className="text-sm text-muted-foreground/60 mb-4">Create a classification to define how files are routed</p>
                        <Button onClick={openCreate} variant="outline"><Plus className="w-4 h-4 mr-2" /> Create First Classification</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {classifications.map(c => (
                        <Card key={c.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base">{String(c.name)}</CardTitle>
                                        <Badge variant={c.type === "CUSTOM" ? "default" : "secondary"} className="text-[10px]">
                                            {String(c.type)}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setDeleteTarget(c)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                {c.description && <p className="text-sm text-muted-foreground">{String(c.description)}</p>}
                            </CardHeader>
                            <CardContent className="pt-0">
                                {c.type === "CUSTOM" && c.routes?.length > 0 ? (
                                    <div>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Forwarding Route</p>
                                        <div className="flex flex-wrap items-center gap-1">
                                            {c.routes.map((r, i) => (
                                                <div key={r.id} className="flex items-center gap-1">
                                                    <div className="flex items-center gap-1.5 bg-muted/60 rounded-full px-2.5 py-1 text-xs">
                                                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">{r.order}</span>
                                                        <span className="font-medium">{r.user.firstName} {r.user.lastName}</span>
                                                        <span className="text-muted-foreground">({ROLE_LABELS[String(r.user.role)] || String(r.user.role)})</span>
                                                    </div>
                                                    {i < c.routes.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground/50" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : c.type === "NORMAL" ? (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        <span>Manual forwarding — user picks the next person</span>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground/60 italic">No routes defined</div>
                                )}
                                <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>By {c.createdBy?.firstName} {c.createdBy?.lastName}</span>
                                    <span>{c._count?.files || 0} files using this</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create / Edit Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            {editing ? "Edit Classification" : "New Classification"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name *</label>
                            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g., Confidential, Public, Internal" required />
                        </div>

                        {!editing && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type *</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(["NORMAL", "CUSTOM"] as const).map(t => (
                                        <button key={t} type="button" onClick={() => setForm(p => ({ ...p, type: t }))}
                                            className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${form.type === t ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                                            <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.type === t ? "border-primary" : "border-muted-foreground/40"}`}>
                                                {form.type === t && <div className="w-2 h-2 rounded-full bg-primary" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{t === "NORMAL" ? "Normal" : "Custom"}</p>
                                                <p className="text-xs text-muted-foreground">{t === "NORMAL" ? "User selects next person manually" : "Auto-routes through predefined order"}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description (optional)</label>
                            <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="Describe when to use this classification…" rows={2} />
                        </div>

                        {(form.type === "CUSTOM" || (editing && editing.type === "CUSTOM")) && (
                            <div className="space-y-3">
                                <Separator />
                                <div>
                                    <p className="text-sm font-medium mb-1">Forwarding Route</p>
                                    <p className="text-xs text-muted-foreground mb-3">Define the order in which the file is forwarded. Files auto-route to the next person in this list.</p>
                                </div>

                                {routes.length === 0 ? (
                                    <div className="text-center py-4 border border-dashed rounded-lg text-muted-foreground text-sm">
                                        No users added yet. Add users below.
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {routes.map((r, i) => (
                                            <div key={r.userId} className="flex items-center gap-2 p-2.5 bg-muted/40 rounded-lg">
                                                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">{r.order}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{r.user?.firstName} {r.user?.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[String(r.user?.role || "")] || String(r.user?.role)}</p>
                                                </div>
                                                <div className="flex gap-0.5 shrink-0">
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveRoute(i, -1)} disabled={i === 0}>
                                                        <ChevronUp className="w-3 h-3" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveRoute(i, 1)} disabled={i === routes.length - 1}>
                                                        <ChevronDown className="w-3 h-3" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => removeRoute(r.userId)}>
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Select value={addUserId} onValueChange={setAddUserId}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select user to add…" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUsers.map(u => (
                                                <SelectItem key={u.id} value={u.id}>
                                                    {u.firstName} {u.lastName} — {ROLE_LABELS[String(u.role)] || String(u.role)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" onClick={addRoute} disabled={!addUserId}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Saving…" : editing ? "Save Changes" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the classification and its route configuration.
                            Files already using it will retain the classification ID but routing will stop.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ClassificationManagement;
