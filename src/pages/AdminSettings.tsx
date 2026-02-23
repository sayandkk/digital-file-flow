import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Settings, Users, Building2, Plus, Edit2, UserX, RefreshCw, AlertCircle, Shield, GitBranch, Trash2, ArrowRight } from "lucide-react";
import { usersApi, departmentsApi, workflowApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import type { User, Department, Role, UserStatus, WorkflowCategory, WorkflowStage } from "@/lib/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const roleColors: Record<Role, string> = {
    ADMIN: "bg-red-100 text-red-700",
    SUPERVISOR: "bg-purple-100 text-purple-700",
    DEPT_HEAD: "bg-blue-100 text-blue-700",
    OFFICER: "bg-green-100 text-green-700",
    ASSISTANT: "bg-slate-100 text-slate-700",
};

const roleLabels: Record<Role, string> = {
    ADMIN: "Admin", SUPERVISOR: "Supervisor", DEPT_HEAD: "Dept Head",
    OFFICER: "Officer", ASSISTANT: "Assistant",
};

const statusColors: Record<UserStatus, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-slate-100 text-slate-600",
    SUSPENDED: "bg-red-100 text-red-700",
};

const AdminSettings = () => {
    const { isAdmin, user } = useAuth();
    const isDeptHead = user?.role === "DEPT_HEAD";
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [workflows, setWorkflows] = useState<WorkflowCategory[]>([]);

    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingDepts, setLoadingDepts] = useState(true);
    const [loadingWorkflows, setLoadingWorkflows] = useState(true);

    // Forms & Dialogs
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showDeptForm, setShowDeptForm] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [showWorkflowForm, setShowWorkflowForm] = useState(false);
    const [showStageForm, setShowStageForm] = useState<{ categoryId: string } | null>(null);

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [userForm, setUserForm] = useState({
        email: "", password: "", firstName: "", lastName: "",
        role: "OFFICER" as Role, departmentId: "", designation: "", employeeId: "",
    });
    const [deptForm, setDeptForm] = useState({ name: "", code: "", description: "" });
    const [workflowForm, setWorkflowForm] = useState({ name: "", description: "" });
    const [stageForm, setStageForm] = useState({ role: "OFFICER" as Role, stageOrder: 1, isMandatory: true });

    // Alert Dialog State
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        actionText: string;
        actionVariant?: "default" | "destructive";
        onConfirm: () => void;
    }>({ isOpen: false, title: "", description: "", actionText: "", onConfirm: () => { } });

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await usersApi.list();
            const d = res.data;
            setUsers(Array.isArray(d) ? d : d.data || []);
        } catch { setUsers([]); } finally { setLoadingUsers(false); }
    };

    const fetchDepts = async () => {
        setLoadingDepts(true);
        try {
            const res = await departmentsApi.list();
            setDepartments(Array.isArray(res.data) ? res.data : []);
        } catch { setDepartments([]); } finally { setLoadingDepts(false); }
    };

    const fetchWorkflows = async () => {
        setLoadingWorkflows(true);
        try {
            const res = await workflowApi.listCategories();
            setWorkflows(Array.isArray(res.data) ? res.data : []);
        } catch { setWorkflows([]); } finally { setLoadingWorkflows(false); }
    };

    useEffect(() => {
        if (isAdmin || isDeptHead) {
            fetchUsers();
            fetchDepts(); // Needed for dropdown even if disabled
        }
        if (isAdmin) {
            fetchWorkflows();
        }
    }, [isAdmin, isDeptHead]);

    // --- Handlers ---
    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setError("");
        try {
            const payload: any = { ...userForm };
            // Sanitize optional fields to avoid unique constraint violations on empty strings
            if (!payload.departmentId) delete payload.departmentId;
            if (!payload.employeeId) delete payload.employeeId;
            if (!payload.designation) delete payload.designation;

            // Remove properties that backend rejects (added by {...u} spread when editing)
            delete payload.id;
            delete payload.status;
            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.lastLoginAt;
            delete payload.department;

            if (editingUser) {
                const { password, ...rest } = payload;
                if (password) rest.password = password; // Only send password if changed
                await usersApi.update(editingUser.id, rest);
            } else {
                await usersApi.create(payload);
            }
            setShowUserForm(false); setEditingUser(null);
            fetchUsers();
        } catch (err: any) { setError(err?.response?.data?.message || "Failed to save user"); }
        finally { setSubmitting(false); }
    };

    const handleDeactivate = async (user: User) => {
        try { await usersApi.deactivate(user.id); fetchUsers(); }
        catch (err: any) { alert(err?.response?.data?.message || "Failed to deactivate"); }
    };

    const handleReactivate = async (user: User) => {
        try { await usersApi.reactivate(user.id); fetchUsers(); }
        catch (err: any) { alert(err?.response?.data?.message || "Failed to reactivate"); }
    };

    const promptUserAction = (user: User, action: 'deactivate' | 'reactivate') => {
        setConfirmAction({
            isOpen: true,
            title: action === 'deactivate' ? "Deactivate User" : "Reactivate User",
            description: action === 'deactivate'
                ? `Are you sure you want to deactivate ${user.firstName} ${user.lastName}? They will no longer be able to log in.`
                : `Are you sure you want to reactivate ${user.firstName} ${user.lastName}? They will regain access to the system.`,
            actionText: action === 'deactivate' ? "Deactivate" : "Reactivate",
            actionVariant: action === 'deactivate' ? "destructive" : "default",
            onConfirm: () => {
                if (action === 'deactivate') handleDeactivate(user);
                else handleReactivate(user);
                setConfirmAction(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDeptSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setError("");
        try {
            if (editingDept) await departmentsApi.update(editingDept.id, deptForm);
            else await departmentsApi.create(deptForm);
            setShowDeptForm(false); setEditingDept(null);
            fetchDepts();
        } catch (err: any) { setError(err?.response?.data?.message || "Failed to save department"); }
        finally { setSubmitting(false); }
    };

    const handleWorkflowSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true); setError("");
        try {
            await workflowApi.createCategory(workflowForm);
            setShowWorkflowForm(false);
            setWorkflowForm({ name: "", description: "" });
            fetchWorkflows();
        } catch (err: any) { setError(err?.response?.data?.message || "Failed to create workflow"); }
        finally { setSubmitting(false); }
    };

    const handleStageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showStageForm) return;
        setSubmitting(true); setError("");
        try {
            await workflowApi.addStage({
                categoryId: showStageForm.categoryId,
                role: stageForm.role,
                stageOrder: Number(stageForm.stageOrder),
                isMandatory: stageForm.isMandatory
            });
            setShowStageForm(null);
            setStageForm({ role: "OFFICER", stageOrder: 1, isMandatory: true });
            fetchWorkflows();
        } catch (err: any) { setError(err?.response?.data?.message || "Failed to add stage"); }
        finally { setSubmitting(false); }
    };

    const handleRemoveStage = async (id: string) => {
        if (!confirm("Are you sure you want to remove this stage?")) return;
        try { await workflowApi.removeStage(id); fetchWorkflows(); }
        catch (err: any) { alert("Failed to remove stage"); }
    };

    if (!isAdmin && !isDeptHead) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Shield className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">Access Restricted</p>
                <p className="text-sm mt-1">Only Administrators can access Settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Administration & Settings</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage users, departments, workflows, and system configuration</p>
            </div>

            <Tabs defaultValue="users">
                <TabsList className="mb-4">
                    <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Users</TabsTrigger>
                    {isAdmin && (
                        <>
                            <TabsTrigger value="departments" className="gap-2"><Building2 className="w-4 h-4" /> Departments</TabsTrigger>
                            <TabsTrigger value="workflows" className="gap-2"><GitBranch className="w-4 h-4" /> Workflows</TabsTrigger>
                            <TabsTrigger value="system" className="gap-2"><Settings className="w-4 h-4" /> System</TabsTrigger>
                        </>
                    )}
                </TabsList>

                {/* ── Users Tab ── */}
                <TabsContent value="users">
                    <Card className="shadow-card">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-sans flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" /> User Management
                                <Badge variant="secondary" className="ml-2">{users.length}</Badge>
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={fetchUsers}><RefreshCw className="w-4 h-4" /></Button>
                                <Button size="sm" className="gap-1" onClick={() => {
                                    setEditingUser(null);
                                    setUserForm({
                                        email: "",
                                        password: "",
                                        firstName: "",
                                        lastName: "",
                                        role: "OFFICER",
                                        departmentId: isDeptHead ? (user?.departmentId || "") : "",
                                        designation: "",
                                        employeeId: ""
                                    });
                                    setShowUserForm(true);
                                }}>
                                    <Plus className="w-4 h-4" /> Add User
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingUsers ? <div className="py-12 text-center text-muted-foreground"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading accounts...</div> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/50 text-left">
                                                <th className="py-2 px-3 font-medium text-muted-foreground">Name</th>
                                                <th className="py-2 px-3 font-medium text-muted-foreground">Role</th>
                                                <th className="py-2 px-3 font-medium text-muted-foreground">Department</th>
                                                <th className="py-2 px-3 font-medium text-muted-foreground">Status</th>
                                                <th className="py-2 px-3 text-right font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => (
                                                <tr key={u.id} className="border-b border-border/30 hover:bg-muted/30">
                                                    <td className="py-3 px-3 font-medium">{u.firstName} {u.lastName}<div className="text-xs text-muted-foreground font-normal">{u.email}</div></td>
                                                    <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${roleColors[u.role]}`}>{roleLabels[u.role]}</span></td>
                                                    <td className="py-3 px-3 text-muted-foreground">{u.department?.name || "—"}</td>
                                                    <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[u.status]}`}>{u.status}</span></td>
                                                    <td className="py-3 px-3 text-right">
                                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingUser(u); setUserForm({ ...u, password: "", departmentId: u.departmentId || "", designation: u.designation || "", employeeId: u.employeeId || "" }); setShowUserForm(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                                                        {u.status === "ACTIVE" && <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => promptUserAction(u, 'deactivate')} title="Deactivate"><UserX className="w-3.5 h-3.5" /></Button>}
                                                        {u.status === "INACTIVE" && <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => promptUserAction(u, 'reactivate')} title="Reactivate"><RefreshCw className="w-3.5 h-3.5" /></Button>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Departments Tab ── */}
                <TabsContent value="departments">
                    <Card className="shadow-card">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-sans flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" /> Departments
                                <Badge variant="secondary" className="ml-2">{departments.length}</Badge>
                            </CardTitle>
                            <Button size="sm" className="gap-1" onClick={() => { setEditingDept(null); setDeptForm({ name: "", code: "", description: "" }); setShowDeptForm(true); }}>
                                <Plus className="w-4 h-4" /> Add Dept
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loadingDepts ? <div className="py-12 text-center text-muted-foreground">Loading...</div> : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {departments.map(d => (
                                        <div key={d.id} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{d.name}</p>
                                                    <p className="text-xs text-muted-foreground">{d.code}</p>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingDept(d); setDeptForm({ name: d.name, code: d.code, description: d.description || "" }); setShowDeptForm(true); }}><Edit2 className="w-3 h-3" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Workflows Tab ── */}
                <TabsContent value="workflows">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium">Workflow Categories</h3>
                                <p className="text-sm text-muted-foreground">Define file categories and their approval chains</p>
                            </div>
                            <Button onClick={() => setShowWorkflowForm(true)} className="gap-1"><Plus className="w-4 h-4" /> New Category</Button>
                        </div>

                        {loadingWorkflows ? <div className="py-12 text-center text-muted-foreground"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading workflows...</div> : (
                            <div className="grid gap-6">
                                {workflows.length === 0 && <p className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">No workflow categories defined. Create one to get started.</p>}
                                {workflows.map(wf => (
                                    <Card key={wf.id} className="shadow-sm border-l-4 border-l-primary/50">
                                        <CardHeader className="pb-3 border-b bg-muted/20">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-base">{wf.name}</CardTitle>
                                                    <CardDescription>{wf.description || "No description provided"}</CardDescription>
                                                </div>
                                                <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => { setStageForm({ role: "OFFICER", stageOrder: (wf.stages?.length || 0) + 1, isMandatory: true }); setShowStageForm({ categoryId: wf.id }); }}>
                                                    <Plus className="w-3.5 h-3.5" /> Add Stage
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">Approval Chain</h4>
                                            <div className="relative">
                                                {/* Connecting Line */}
                                                <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-border -z-10" />

                                                <div className="space-y-3">
                                                    {wf.stages?.length === 0 && <p className="text-sm text-muted-foreground pl-2 italic">No stages defined. Files in this category will have no approval workflow.</p>}
                                                    {wf.stages?.map((stage, idx) => (
                                                        <div key={stage.id} className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-full border-2 border-background bg-white shadow-sm flex items-center justify-center text-sm font-bold z-10 shrink-0">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 bg-card border rounded-md p-3 flex items-center justify-between shadow-sm">
                                                                <div>
                                                                    <p className="font-medium text-sm flex items-center gap-2">
                                                                        {roleLabels[stage.role]}
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${roleColors[stage.role]} bg-opacity-20`}>{stage.role}</span>
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">{stage.isMandatory ? "Mandatory Approval" : "Optional Review"}</p>
                                                                </div>
                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveStage(stage.id)}>
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                            {idx < (wf.stages?.length || 0) - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground/30" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ── System Tab ── */}
                <TabsContent value="system">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="shadow-card p-4"><p className="text-xs text-muted-foreground">App Name</p><p className="font-medium">DDFS Enterprise</p></Card>
                        <Card className="shadow-card p-4"><p className="text-xs text-muted-foreground">Version</p><p className="font-medium">2.0 (Workflow Engine)</p></Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
                <DialogContent><DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                        {error && <p className="text-destructive text-sm">{error}</p>}
                        <Input placeholder="First Name" value={userForm.firstName} onChange={e => setUserForm({ ...userForm, firstName: e.target.value })} required />
                        <Input placeholder="Last Name" value={userForm.lastName} onChange={e => setUserForm({ ...userForm, lastName: e.target.value })} required />
                        <Input placeholder="Email" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                        {!editingUser && <Input placeholder="Password" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required />}
                        <Select value={userForm.role} onValueChange={(v: Role) => setUserForm({ ...userForm, role: v })}>
                            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(roleLabels)
                                    .filter(([k]) => !isDeptHead || k !== "ADMIN") // Filter ADMIN if Dept Head
                                    .map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)
                                }
                            </SelectContent>
                        </Select>
                        <Select
                            value={isDeptHead ? (user?.departmentId || "") : (userForm.departmentId || "no_dept")}
                            onValueChange={(v) => setUserForm({ ...userForm, departmentId: v === "no_dept" ? "" : v })}
                            disabled={isDeptHead}
                        >
                            <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="no_dept">None</SelectItem>
                                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <DialogFooter><Button type="submit" disabled={submitting}>Save</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showDeptForm} onOpenChange={setShowDeptForm}>
                <DialogContent><DialogTitle>{editingDept ? "Edit Department" : "New Department"}</DialogTitle>
                    <form onSubmit={handleDeptSubmit} className="space-y-4">
                        {error && <p className="text-destructive text-sm">{error}</p>}
                        <Input placeholder="Name" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required />
                        <Input placeholder="Code" value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value })} required />
                        <DialogFooter><Button type="submit" disabled={submitting}>Save</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={showWorkflowForm} onOpenChange={setShowWorkflowForm}>
                <DialogContent>
                    <DialogHeader><DialogTitle>New Workflow Category</DialogTitle></DialogHeader>
                    <form onSubmit={handleWorkflowSubmit} className="space-y-4">
                        {error && <p className="text-destructive text-sm">{error}</p>}
                        <div className="space-y-2"><Label>Category Name</Label><Input placeholder="e.g. Confidential" value={workflowForm.name} onChange={e => setWorkflowForm({ ...workflowForm, name: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Description</Label><Input placeholder="Description" value={workflowForm.description} onChange={e => setWorkflowForm({ ...workflowForm, description: e.target.value })} /></div>
                        <DialogFooter><Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Category"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!showStageForm} onOpenChange={() => setShowStageForm(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Approval Stage</DialogTitle></DialogHeader>
                    <form onSubmit={handleStageSubmit} className="space-y-4">
                        {error && <p className="text-destructive text-sm">{error}</p>}
                        <div className="space-y-2">
                            <Label>Approver Role</Label>
                            <Select value={stageForm.role} onValueChange={(v: Role) => setStageForm({ ...stageForm, role: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Stage Order</Label>
                            <Input type="number" min="1" value={stageForm.stageOrder} onChange={e => setStageForm({ ...stageForm, stageOrder: parseInt(e.target.value) })} required />
                            <p className="text-xs text-muted-foreground">Sequence in the approval chain (1 = First)</p>
                        </div>
                        <DialogFooter><Button type="submit" disabled={submitting}>Add Stage</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmAction.isOpen} onOpenChange={(isOpen) => setConfirmAction(prev => ({ ...prev, isOpen }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmAction.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmAction.onConfirm(); }}
                            className={confirmAction.actionVariant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                            {confirmAction.actionText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default AdminSettings;
