import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { requestsApi, departmentsApi } from "@/lib/api";
import type { Department, RequestRecord } from "@/lib/types";
import { Plus, RefreshCw } from "lucide-react";

const requestTypeOptions = [
  "IT_SUPPORT",
  "PURCHASE_REQUEST",
  "HR_REQUEST",
  "LEAVE_REQUEST",
  "LEGAL_CASE",
  "CUSTOMER_COMPLAINT",
  "PROJECT_PROPOSAL",
  "INVOICE_APPROVAL",
  "CONTRACT_REVIEW",
  "GENERAL_REQUEST",
  "OTHER",
];

const RequestManagement = () => {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    requestType: "GENERAL_REQUEST",
    priority: "NORMAL",
    confidentiality: "INTERNAL",
    category: "OTHER",
    requestorName: "",
    requestorEmail: "",
    requestorPhone: "",
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [convertTarget, setConvertTarget] = useState<RequestRecord | null>(null);
  const [convertForm, setConvertForm] = useState({
    departmentId: "",
    subject: "",
    description: "",
  });
  const [converting, setConverting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await requestsApi.list();
      const data = res.data;
      setRequests(Array.isArray(data) ? data : data.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    departmentsApi
      .list()
      .then((r) => setDepartments(r.data))
      .catch(() => setDepartments([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.requestorEmail) delete (payload as any).requestorEmail;
      if (!payload.requestorPhone) delete (payload as any).requestorPhone;

      await requestsApi.create(payload);
      toast.success("Request created successfully");
      setShowCreate(false);
      setForm({
        title: "",
        description: "",
        requestType: "GENERAL_REQUEST",
        priority: "NORMAL",
        confidentiality: "INTERNAL",
        category: "OTHER",
        requestorName: "",
        requestorEmail: "",
        requestorPhone: "",
      });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create request");
    }
  };

  const openConvert = (r: RequestRecord) => {
    setConvertTarget(r);
    setConvertForm({
      departmentId: "",
      subject: r.title,
      description: r.description,
    });
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertTarget || !convertForm.departmentId) {
      toast.error("Department is required");
      return;
    }

    setConverting(true);
    try {
      const res = await requestsApi.convertToFile(convertTarget.id, {
        departmentId: convertForm.departmentId,
        subject: convertForm.subject || undefined,
        description: convertForm.description || undefined,
      });
      const file = res.data as any;
      toast.success(
        `Request converted to file ${file.fileNumber || file.id || ""}`.trim(),
      );
      setConvertTarget(null);
      load();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to convert request",
      );
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Requests / Cases</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and track enterprise requests before converting them into files.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={load}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Request
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg font-sans">Create Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Requestor Name *</label>
                  <Input
                    value={form.requestorName}
                    onChange={(e) => setForm({ ...form, requestorName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Requestor Email</label>
                  <Input
                    type="email"
                    value={form.requestorEmail}
                    onChange={(e) => setForm({ ...form, requestorEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Description</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Request Type</label>
                  <Select
                    value={form.requestType}
                    onValueChange={(v) => setForm({ ...form, requestType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {requestTypeOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Priority</label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => setForm({ ...form, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Confidentiality</label>
                  <Select
                    value={form.confidentiality}
                    onValueChange={(v) => setForm({ ...form, confidentiality: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="INTERNAL">Internal</SelectItem>
                      <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                      <SelectItem value="RESTRICTED">Restricted</SelectItem>
                      <SelectItem value="SECRET">Secret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg font-sans">Recent Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading...
            </div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{r.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.requestNumber} · {r.requestType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestManagement;
