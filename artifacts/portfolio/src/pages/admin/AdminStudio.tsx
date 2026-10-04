import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useListAllProjects, getListAllProjectsQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PHASES, studioJson } from "@/lib/studio-api";
import { Loader2 } from "lucide-react";

type ProjectRow = {
  id: number;
  title: string;
  client: string;
  startsOn?: string;
  endsOn?: string;
  phase?: string;
  published: boolean;
};

export default function AdminStudio() {
  const { data: projects = [], isLoading } = useListAllProjects();
  const rows = projects as ProjectRow[];
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    client: "",
    subtitle: "",
    role: "Architect",
    focus: "",
    tools: "",
    startsOn: "",
    endsOn: "",
    phase: "Concept",
  });

  const { data: me } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => studioJson<{ authenticated: boolean; user: { name: string } | null }>("/api/auth/me"),
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const created = await studioJson<{ id: number }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          category: "RESIDENTIAL",
          published: false,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: getListAllProjectsQueryKey() });
      toast({ title: "Project created" });
      setLocation(`/admin/studio/${created.id}`);
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Could not create the project",
        variant: "destructive",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8">
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-tighter text-primary">STUDIO</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            {me?.user ? `${me.user.name}, this is the internal job file. ` : "Sign in with a personal account. "}
            Keep the programme, site photos and video, issued drawings, and hours on each project.
            An issued drawing keeps the time it was uploaded. Locked hours cannot be rewritten.
          </p>
        </div>

        <form onSubmit={createProject} className="border border-border p-4 space-y-4">
          <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">NEW_PROJECT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input required placeholder="Project title" value={form.title} onChange={set("title")} className="rounded-none" />
            <Input required placeholder="Client" value={form.client} onChange={set("client")} className="rounded-none" />
            <Input required placeholder="Subtitle" value={form.subtitle} onChange={set("subtitle")} className="rounded-none" />
            <Input required placeholder="Role" value={form.role} onChange={set("role")} className="rounded-none" />
            <Input required placeholder="Focus" value={form.focus} onChange={set("focus")} className="rounded-none" />
            <Input required placeholder="Tools" value={form.tools} onChange={set("tools")} className="rounded-none" />
            <label className="text-xs text-muted-foreground">
              Start
              <Input type="date" value={form.startsOn} onChange={set("startsOn")} className="rounded-none mt-1" />
            </label>
            <label className="text-xs text-muted-foreground">
              Target completion
              <Input type="date" value={form.endsOn} onChange={set("endsOn")} className="rounded-none mt-1" />
            </label>
            <label className="text-xs text-muted-foreground md:col-span-2">
              Phase
              <select value={form.phase} onChange={set("phase")} className="mt-1 w-full border border-border bg-background h-9 px-2 text-sm">
                {PHASES.map((phase) => (
                  <option key={phase} value={phase}>{phase}</option>
                ))}
              </select>
            </label>
          </div>
          <Button type="submit" disabled={pending} className="rounded-none uppercase tracking-widest">
            {pending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Create project
          </Button>
        </form>

        <div>
          <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary mb-3">JOB_FILE</h2>
          {isLoading ? (
            <Loader2 className="animate-spin text-primary" />
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="border border-border divide-y divide-border">
              {rows.map((project) => (
                <Link
                  key={project.id}
                  href={`/admin/studio/${project.id}`}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 hover:bg-muted/40"
                >
                  <div>
                    <div className="font-bold">{project.title}</div>
                    <div className="text-sm text-muted-foreground">{project.client}</div>
                  </div>
                  <div className="text-xs mono text-muted-foreground">
                    {project.phase || "No phase"}
                    {project.startsOn ? ` · ${project.startsOn}` : ""}
                    {project.endsOn ? ` → ${project.endsOn}` : ""}
                    {project.published ? " · PUBLIC" : " · INTERNAL"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">What studios usually add next</p>
          <p>
            A transmittal log for who received each issue, an RFI and submittal register, consultant contacts,
            site-visit notes, and fee stages tied to programme milestones. The drawing issue time and locked
            hours are the audit trail those tools sit on.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
