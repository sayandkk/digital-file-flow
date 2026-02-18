import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Shield, Lock } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login for now — will integrate with backend auth later
    if (email && password && role) {
      localStorage.setItem("dms_user", JSON.stringify({ email, role }));
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-primary-foreground/20 rounded-full" />
          <div className="absolute bottom-32 right-16 w-96 h-96 border border-primary-foreground/20 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 border border-primary-foreground/20 rounded-full" />
        </div>
        <div className="relative z-10 text-primary-foreground max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-lg bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20">
              <FileText className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold font-sans tracking-tight">DocFlow</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Digital Document Filing & Workflow Management
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Streamline file movement, approvals, and document storage with enterprise-grade security and complete audit trails.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: "Secure Filing", desc: "End-to-end encryption" },
              { label: "Audit Trail", desc: "Complete tracking" },
              { label: "Role-Based", desc: "Granular access control" },
              { label: "Compliance", desc: "Regulatory ready" },
            ].map((item) => (
              <div key={item.label} className="bg-primary-foreground/5 backdrop-blur-sm rounded-lg p-3 border border-primary-foreground/10">
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-primary-foreground/60 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DocFlow</span>
          </div>

          <Card className="shadow-elevated border-border/50">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl font-sans">Sign In</CardTitle>
              </div>
              <CardDescription>
                Access your document management workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@department.gov"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Login As</Label>
                  <Select value={role} onValueChange={setRole} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="officer">Officer</SelectItem>
                      <SelectItem value="assistant">Assistant</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="dept_head">Department Head</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Sign In
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Authorized personnel only. All access is monitored and logged.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
