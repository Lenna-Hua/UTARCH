import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGetProject } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DISCIPLINES,
  PHASES,
  studioJson,
  type DrawingIssue,
  type StudioMedia,
  type TimeEntry,
} from "@/lib/studio-api";
import { ArrowLeft, Loader2, Lock } from "lucide-react";

function formatIssued(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminStudioProject() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: Number.isFinite(projectId) && projectId > 0, queryKey: [`/api/projects/${projectId}`] },
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const schedule = project as (typeof project & { startsOn?: string; endsOn?: string; phase?: string }) | undefined;

  const [programme, setProgramme] = useState<{ startsOn: string; endsOn: string; phase: string } | null>(null);
  const dates = programme ?? {
    startsOn: schedule?.startsOn ?? "",
    endsOn: schedule?.endsOn ?? "",
    phase: schedule?.phase || "Concept",
  };

  const mediaQuery = useQuery({
    queryKey: ["studio-media", projectId],
    enabled: projectId > 0,
    queryFn: () => studioJson<StudioMedia[]>(`/api/studio/media?projectId=${projectId}`),
  });
  const drawingQuery = useQuery({
    queryKey: ["studio-drawings", projectId],
    enabled: projectId > 0,
    queryFn: () => studioJson<DrawingIssue[]>(`/api/studio/drawings?projectId=${projectId}`),
  });
  const timeQuery = useQuery({
    queryKey: ["studio-time", projectId],
    enabled: projectId > 0,
    queryFn: () => studioJson<TimeEntry[]>(`/api/studio/time?projectId=${projectId}`),
  });

  const [caption, setCaption] = useState("");
  const [drawing, setDrawing] = useState({ title: "", sheetNumber: "", revision: "", discipline: "Architecture" });
  const [timeForm, setTimeForm] = useState({ workDate: "", hours: "", note: "" });
  const [busy, setBusy] = useState("");

  const fail = (err: unknown) =>
    toast({ title: err instanceof Error ? err.message : "Something went wrong", variant: "destructive" });

  const saveProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("programme");
    try {
      await studioJson(`/api/studio/projects/${projectId}/programme`, {
        method: "PUT",
        body: JSON.stringify(dates),
      });
      toast({ title: "Programme saved" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy("");
    }
  };

  const uploadMedia = async (file: File | undefined) => {
    if (!file) return;
    setBusy("media");
    try {
      const body = new FormData();
      body.set("projectId", String(projectId));
      body.set("caption", caption);
      body.set("file", file);
      await studioJson("/api/studio/media", { method: "POST", body });
      setCaption("");
      await queryClient.invalidateQueries({ queryKey: ["studio-media", projectId] });
      toast({ title: "Media stored" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy("");
    }
  };

  const issueDrawing = async (file: File | undefined) => {
    if (!file) return;
    setBusy("drawing");
    try {
      const body = new FormData();
      body.set("projectId", String(projectId));
      body.set("title", drawing.title);
      body.set("sheetNumber", drawing.sheetNumber);
      body.set("revision", drawing.revision);
      body.set("discipline", drawing.discipline);
      body.set("file", file);
      await studioJson("/api/studio/drawings", { method: "POST", body });
      setDrawing({ title: "", sheetNumber: "", revision: "", discipline: drawing.discipline });
      await queryClient.invalidateQueries({ queryKey: ["studio-drawings", projectId] });
      toast({ title: "Drawing issued. The time is locked." });
    } catch (err) {
      fail(err);
    } finally {
      setBusy("");
    }
  };

  const addTime = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("time");
    try {
      await studioJson("/api/studio/time", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          workDate: timeForm.workDate,
          hours: Number(timeForm.hours),
          note: timeForm.note,
        }),
      });
      setTimeForm({ workDate: "", hours: "", note: "" });
      await queryClient.invalidateQueries({ queryKey: ["studio-time", projectId] });
      toast({ title: "Time recorded" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy("");
    }
  };

  const lockTime = async (id: number) => {
    setBusy(`lock-${id}`);
    try {
      await studioJson(`/api/studio/time/${id}/lock`, { method: "POST" });
      await queryClient.invalidateQueries({ queryKey: ["studio-time", projectId] });
      toast({ title: "Time locked" });
    } catch (err) {
      fail(err);
    } finally {
      setBusy("");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="p-8">Project not found.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-4 border-b border-border pb-4">
          <Link href="/admin/studio" className="inline-flex items-center text-sm border border-border px-3 py-1.5">
            <ArrowLeft className="w-4 h-4 mr-2" /> Studio
          </Link>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tighter text-primary">{project.title}</h1>
            <p className="text-sm text-muted-foreground">{project.client}</p>
          </div>
        </div>

        <form onSubmit={saveProgramme} className="border border-border p-4 space-y-3">
          <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">PROGRAMME</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-xs text-muted-foreground">
              Start
              <Input type="date" value={dates.startsOn} onChange={(e) => setProgramme({ ...dates, startsOn: e.target.value })} className="rounded-none mt-1" />
            </label>
            <label className="text-xs text-muted-foreground">
              Target completion
              <Input type="date" value={dates.endsOn} onChange={(e) => setProgramme({ ...dates, endsOn: e.target.value })} className="rounded-none mt-1" />
            </label>
            <label className="text-xs text-muted-foreground">
              Phase
              <select
                value={dates.phase}
                onChange={(e) => setProgramme({ ...dates, phase: e.target.value })}
                className="mt-1 w-full border border-border bg-background h-9 px-2 text-sm"
              >
                {PHASES.map((phase) => <option key={phase} value={phase}>{phase}</option>)}
              </select>
            </label>
          </div>
          <Button type="submit" disabled={busy === "programme"} className="rounded-none uppercase tracking-widest">
            Save programme
          </Button>
        </form>

        <section className="border border-border p-4 space-y-3">
          <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">IMAGES_AND_VIDEO</h2>
          <p className="text-xs text-muted-foreground">Stored on Cloudinary. JPEG, PNG, WebP, GIF, MP4, WebM, or MOV.</p>
          <Input placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} className="rounded-none" />
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            disabled={busy === "media"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void uploadMedia(file);
            }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(mediaQuery.data ?? []).map((item) => (
              <figure key={item.id} className="border border-border">
                {item.kind === "video" ? (
                  <video src={item.url} controls className="w-full max-h-64 bg-black" />
                ) : (
                  <img src={item.url} alt={item.caption || item.originalName} className="w-full max-h-64 object-cover" />
                )}
                <figcaption className="p-2 text-xs text-muted-foreground">
                  {item.caption || item.originalName}
                  {item.uploaderName ? ` · ${item.uploaderName}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="border border-border p-4 space-y-3">
          <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">DRAWING_ISSUE</h2>
          <p className="text-xs text-muted-foreground">
            Upload a DWG, DXF, or PDF. The issue time is set by the server and cannot be changed or deleted. Issue a new revision instead.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input required placeholder="Sheet title" value={drawing.title} onChange={(e) => setDrawing({ ...drawing, title: e.target.value })} className="rounded-none" />
            <Input required placeholder="Sheet number (A-101)" value={drawing.sheetNumber} onChange={(e) => setDrawing({ ...drawing, sheetNumber: e.target.value })} className="rounded-none" />
            <Input required placeholder="Revision (P01)" value={drawing.revision} onChange={(e) => setDrawing({ ...drawing, revision: e.target.value })} className="rounded-none" />
            <select value={drawing.discipline} onChange={(e) => setDrawing({ ...drawing, discipline: e.target.value })} className="border border-border bg-background h-9 px-2 text-sm">
              {DISCIPLINES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <Input
            type="file"
            accept=".dwg,.dxf,.pdf,application/pdf"
            disabled={busy === "drawing" || !drawing.title || !drawing.sheetNumber || !drawing.revision}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void issueDrawing(file);
            }}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Sheet</th>
                  <th className="py-2 pr-3">Rev</th>
                  <th className="py-2 pr-3">Issued</th>
                  <th className="py-2 pr-3">File</th>
                </tr>
              </thead>
              <tbody>
                {(drawingQuery.data ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{item.sheetNumber}</div>
                      <div className="text-xs text-muted-foreground">{item.title} · {item.discipline}</div>
                    </td>
                    <td className="py-2 pr-3">{item.revision}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {formatIssued(item.issuedAt)}
                      </span>
                      {item.uploaderName ? <div className="text-xs text-muted-foreground">{item.uploaderName}</div> : null}
                    </td>
                    <td className="py-2 pr-3">
                      <a href={item.url} className="underline" target="_blank" rel="noreferrer">{item.fileName}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-border p-4 space-y-3">
          <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">TIME</h2>
          <form onSubmit={addTime} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input type="date" required value={timeForm.workDate} onChange={(e) => setTimeForm({ ...timeForm, workDate: e.target.value })} className="rounded-none" />
            <Input type="number" required min="0.25" max="24" step="0.25" placeholder="Hours" value={timeForm.hours} onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })} className="rounded-none" />
            <Textarea placeholder="Note" value={timeForm.note} onChange={(e) => setTimeForm({ ...timeForm, note: e.target.value })} className="rounded-none md:col-span-2 min-h-[38px]" />
            <Button type="submit" disabled={busy === "time"} className="rounded-none uppercase tracking-widest md:col-span-4 w-fit">
              Record time
            </Button>
          </form>
          <ul className="divide-y divide-border border border-border">
            {(timeQuery.data ?? []).map((entry) => (
              <li key={entry.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{entry.workDate} · {entry.hours} h</div>
                  <div className="text-xs text-muted-foreground">
                    {entry.personName || "You"}{entry.note ? ` · ${entry.note}` : ""}
                  </div>
                </div>
                {entry.locked ? (
                  <span className="inline-flex items-center gap-1 text-xs uppercase tracking-widest">
                    <Lock className="w-3 h-3" /> Locked {entry.lockedAt ? formatIssued(entry.lockedAt) : ""}
                  </span>
                ) : (
                  <Button type="button" variant="outline" className="rounded-none" disabled={busy === `lock-${entry.id}`} onClick={() => void lockTime(entry.id)}>
                    Lock time
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminLayout>
  );
}
