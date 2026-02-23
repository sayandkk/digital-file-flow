import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Shield, Building2, Phone, Briefcase, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    SUPERVISOR: "Supervisor",
    DEPT_HEAD: "Department Head",
    OFFICER: "Officer",
    ASSISTANT: "Assistant",
};

const ProfileSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    // Form state (in a real app you might allow editing some fields)
    const [phone, setPhone] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                const res = await usersApi.get(user.id);
                setProfile(res.data);
                setPhone(res.data.phone || "");
            } catch (err: any) {
                toast.error("Failed to load profile details");
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user?.id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await usersApi.update(user!.id!, { phone });
            toast.success("Profile updated successfully");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;
    }

    if (!profile) {
        return <div className="p-8 text-center text-muted-foreground">Profile not found.</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground text-sm mt-1">View and manage your personal information</p>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                {/* ── Left Column: Summary Card ── */}
                <Card className="shadow-card h-fit">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center mb-4 shadow-md">
                            <span className="text-3xl font-bold text-primary-foreground tracking-wider">
                                {profile.firstName?.[0]}{profile.lastName?.[0]}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h2>
                        <p className="text-muted-foreground text-sm mb-4">{profile.email}</p>

                        <div className="flex flex-col gap-2 w-full mt-2">
                            <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                                <span className="text-muted-foreground flex items-center gap-1.5"><Shield className="w-4 h-4" /> Role</span>
                                <Badge variant="secondary">{roleLabels[profile.role] || profile.role}</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm py-2 border-b border-border/50">
                                <span className="text-muted-foreground flex items-center gap-1.5"><Building2 className="w-4 h-4" /> Dept</span>
                                <span className="font-medium">{profile.department?.name || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm py-2">
                                <span className="text-muted-foreground flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> Status</span>
                                <Badge className={profile.status === "ACTIVE" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-destructive/10 text-destructive hover:bg-destructive/10"} variant="outline">
                                    {profile.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Right Column: Details & Edit ── */}
                <div className="space-y-6">
                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" /> Personal Information
                            </CardTitle>
                            <CardDescription>Your account details managed by the system administrator.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">First Name</Label>
                                    <div className="font-medium px-3 py-2 bg-muted/30 rounded-md border border-border/50">{profile.firstName}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Last Name</Label>
                                    <div className="font-medium px-3 py-2 bg-muted/30 rounded-md border border-border/50">{profile.lastName}</div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <Label className="text-muted-foreground">Email Address</Label>
                                    <div className="font-medium px-3 py-2 bg-muted/30 rounded-md border border-border/50 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" /> {profile.email}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Designation</Label>
                                    <div className="font-medium px-3 py-2 bg-muted/30 rounded-md border border-border/50">{profile.designation || "—"}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Employee ID</Label>
                                    <div className="font-medium px-3 py-2 bg-muted/30 rounded-md border border-border/50">{profile.employeeId || "—"}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-card">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Phone className="w-5 h-5 text-primary" /> Contact Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        type="tel"
                                        placeholder="e.g. +1 234 567 8900"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">You can update your contact number here.</p>
                                </div>
                                <Button type="submit" disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
