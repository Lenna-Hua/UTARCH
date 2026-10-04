import { Link, useLocation } from "wouter";
import { useAdminLogout, useAdminMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, LayoutDashboard, FolderKanban, FileText, Wrench, Settings, Upload, Building2 } from "lucide-react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { studioJson, type AuthMe } from "@/lib/studio-api";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: auth, isLoading } = useAdminMe({
    query: {
      refetchOnMount: "always",
      staleTime: 0,
    }
  });
  const logout = useAdminLogout();
  const { toast } = useToast();
  const { data: me } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => studioJson<AuthMe>("/api/auth/me"),
    enabled: Boolean(auth?.authenticated),
  });

  useEffect(() => {
    if (!isLoading && !auth?.authenticated) {
      setLocation("/admin/login");
    }
  }, [auth, isLoading, setLocation]);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation("/");
        toast({ title: "Logged out successfully" });
      }
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!auth?.authenticated) return null;

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/studio", label: "Studio", icon: Building2 },
    { href: "/admin/projects", label: "Projects", icon: FolderKanban },
    { href: "/admin/posts", label: "Posts", icon: FileText },
    { href: "/admin/skills", label: "Skills", icon: Wrench },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/uploads", label: "Uploads", icon: Upload },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/20">
      <aside className="w-full md:w-64 border-r border-border bg-background shrink-0 flex flex-col">
        <div className="h-14 border-b border-border flex items-center px-4 shrink-0">
          <Link href="/" className="font-bold text-primary tracking-tight truncate">
            PORTFOLIO ADMIN
          </Link>
        </div>
        <div className="p-4 flex-1 overflow-auto">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-border shrink-0 space-y-3">
          {me?.user ? (
            <div className="text-xs">
              <div className="font-medium truncate">{me.user.name}</div>
              <div className="text-muted-foreground truncate">{me.user.email}</div>
            </div>
          ) : null}
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto border border-border bg-background rounded-sm shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
