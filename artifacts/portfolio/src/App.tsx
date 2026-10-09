import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import ProjectDetail from "@/pages/ProjectDetail";
import Posts from "@/pages/Posts";
import PostDetail from "@/pages/PostDetail";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminRegister from "@/pages/admin/AdminRegister";
import AdminStudio from "@/pages/admin/AdminStudio";
import AdminStudioProject from "@/pages/admin/AdminStudioProject";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminProjectForm from "@/pages/admin/AdminProjectForm";
import AdminPosts from "@/pages/admin/AdminPosts";
import AdminPostForm from "@/pages/admin/AdminPostForm";
import AdminSkills from "@/pages/admin/AdminSkills";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminUploads from "@/pages/admin/AdminUploads";
import { apiBase } from "@/lib/studio-api";

const queryClient = new QueryClient();

function hexToHslComponents(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function ThemeApplicator() {
  const { data: settings } = useQuery({
    queryKey: ["settings-theme"],
    queryFn: async () => {
      const res = await fetch(`${apiBase()}/api/settings`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
      return res.json() as Promise<{ primaryColor?: string; accentColor?: string }>;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    if (settings.primaryColor) {
      const hsl = hexToHslComponents(settings.primaryColor);
      root.style.setProperty("--c-primary", hsl);
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--border", hsl);
      root.style.setProperty("--input", hsl);
      root.style.setProperty("--ring", hsl);
    }
    if (settings.accentColor) {
      const hsl = hexToHslComponents(settings.accentColor);
      root.style.setProperty("--c-accent", hsl);
      root.style.setProperty("--accent", hsl);
    }
  }, [settings]);

  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/posts" component={Posts} />
      <Route path="/posts/:id" component={PostDetail} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/register" component={AdminRegister} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/studio" component={AdminStudio} />
      <Route path="/admin/studio/:id" component={AdminStudioProject} />
      
      <Route path="/admin/projects" component={AdminProjects} />
      <Route path="/admin/projects/new" component={AdminProjectForm} />
      <Route path="/admin/projects/:id/edit" component={AdminProjectForm} />
      
      <Route path="/admin/posts" component={AdminPosts} />
      <Route path="/admin/posts/new" component={AdminPostForm} />
      <Route path="/admin/posts/:id/edit" component={AdminPostForm} />
      
      <Route path="/admin/skills" component={AdminSkills} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/uploads" component={AdminUploads} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeApplicator />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
