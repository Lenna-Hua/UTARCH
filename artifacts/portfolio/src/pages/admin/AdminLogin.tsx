import { useState } from "react";
import { getAdminMeQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiBase, studioJson } from "@/lib/studio-api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const data = await studioJson<{ authenticated: boolean }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // #region agent log
      {
        const payload = {
          sessionId: "5420",
          hypothesisId: "C,D",
          location: "AdminLogin.tsx:after-login",
          message: "Login API returned; about to reset admin me + redirect",
          data: {
            authenticated: data.authenticated,
            pageOrigin: window.location.origin,
            apiBaseConfigured: (import.meta.env.VITE_API_URL as string | undefined) ?? "",
            apiBaseResolved: apiBase(),
            runId: "post-fix",
            nextPath: "/admin",
            adminMeQueryKey: getAdminMeQueryKey(),
          },
          timestamp: Date.now(),
        };
        fetch("http://127.0.0.1:7242/ingest/a91bd5e4-91f9-4e64-b963-d5a518b0315e", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "5420" },
          body: JSON.stringify(payload),
        }).catch(() => {});
      }
      // #endregion
      if (!data.authenticated) {
        toast({ title: "Invalid email or password", variant: "destructive" });
        return;
      }
      await queryClient.resetQueries({ queryKey: getAdminMeQueryKey() });
      setLocation("/admin");
      toast({ title: "Logged in" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md bg-background border border-border p-8 shadow-sm">
        <h1 className="text-2xl font-bold uppercase tracking-tighter text-primary mb-2">STAFF_LOGIN</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Each person uses their own account. No shared password, and no Google sign-in.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-border rounded-none focus-visible:ring-primary"
            required
          />
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-border rounded-none focus-visible:ring-primary"
            required
          />
          <Button
            type="submit"
            className="w-full rounded-none font-bold tracking-widest uppercase bg-primary hover:bg-accent text-white"
            disabled={pending || !email || !password}
          >
            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Sign in
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-6">
          New to the studio?{" "}
          <Link href="/admin/register" className="text-primary font-medium underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
