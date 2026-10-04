import { useState } from "react";
import { getAdminMeQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { studioJson } from "@/lib/studio-api";

export default function AdminRegister() {
  const [name, setName] = useState("");
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
      await studioJson("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      await queryClient.resetQueries({ queryKey: getAdminMeQueryKey() });
      setLocation("/admin/studio");
      toast({ title: "Account created" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Could not create the account",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md bg-background border border-border p-8 shadow-sm">
        <h1 className="text-2xl font-bold uppercase tracking-tighter text-primary mb-2">CREATE_ACCOUNT</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Staff accounts are email and password only. Your projects, drawings, and time stay tied to you.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border rounded-none"
            required
            minLength={2}
          />
          <Input
            type="email"
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-border rounded-none"
            required
          />
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="Password (12+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-border rounded-none"
            required
            minLength={12}
          />
          <Button
            type="submit"
            className="w-full rounded-none font-bold tracking-widest uppercase bg-primary hover:bg-accent text-white"
            disabled={pending || name.trim().length < 2 || password.length < 12}
          >
            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create account
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-6">
          Already registered?{" "}
          <Link href="/admin/login" className="text-primary font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
