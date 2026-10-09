import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useCreateProject, useGetProject, useUpdateProject, getGetProjectQueryKey, getListAllProjectsQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { projectSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, ArrowLeft, Loader2, FileText, ImageIcon } from "lucide-react";
import { Uploader } from "@/components/ui/uploader";
import { PlanUploader } from "@/components/ui/plan-uploader";

export default function AdminProjectForm() {
  const { id } = useParams();
  const isEditing = id !== "new" && id !== undefined;
  const projectId = isEditing ? parseInt(id, 10) : 0;

  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading: isLoadingProject } = useGetProject(projectId, {
    query: { enabled: isEditing, queryKey: getGetProjectQueryKey(projectId) }
  });

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "", client: "", subtitle: "", category: "", role: "", focus: "", tools: "",
      coverImage: "", heroImage: "", description: "", outcomes: "",
      highlightStats: [] as { label: string; value: string }[],
      plans: [] as { title: string; url: string }[],
      methodologySteps: [],
      galleryImages: [""],
      sortOrder: 0, published: false,
      startsOn: "", endsOn: "", phase: ""
    }
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control: form.control, name: "methodologySteps" });
  const { fields: galleryFields, append: appendGallery, remove: removeGallery } = useFieldArray({ control: form.control, name: "galleryImages" as never });
  const { fields: statFields, append: appendStat, remove: removeStat } = useFieldArray({ control: form.control, name: "highlightStats" });
  const { fields: planFields, append: appendPlan, remove: removePlan } = useFieldArray({ control: form.control, name: "plans" });

  useEffect(() => {
    if (project && isEditing) {
      const p = project as any;
      form.reset({
        title: project.title, client: project.client, subtitle: project.subtitle,
        category: project.category || "",
        role: project.role, focus: project.focus, tools: project.tools,
        coverImage: project.coverImage || "", heroImage: project.heroImage || "",
        description: project.description || "", outcomes: p.outcomes || "",
        highlightStats: p.highlightStats || [],
        plans: p.plans || [],
        methodologySteps: project.methodologySteps || [],
        galleryImages: project.galleryImages.length > 0 ? project.galleryImages : [""],
        sortOrder: project.sortOrder, published: project.published,
        startsOn: (project as { startsOn?: string }).startsOn || "",
        endsOn: (project as { endsOn?: string }).endsOn || "",
        phase: (project as { phase?: string }).phase || "",
      });
    }
  }, [project, isEditing, form]);

  const onSubmit = (values: any) => {
    const cleanValues = {
      ...values,
      galleryImages: values.galleryImages.filter((img: string) => img.trim() !== ""),
      outcomes: values.outcomes?.trim() || null,
    };
    if (isEditing) {
      updateProject.mutate({ id: projectId, data: cleanValues }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getListAllProjectsQueryKey() });
          toast({ title: "Project updated" });
          setLocation("/admin/projects");
        }
      });
    } else {
      createProject.mutate({ data: cleanValues }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAllProjectsQueryKey() });
          toast({ title: "Project created" });
          setLocation("/admin/projects");
        }
      });
    }
  };

  if (isEditing && isLoadingProject) {
    return <AdminLayout><div className="p-8 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-4 border-b border-border pb-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/projects")} className="rounded-none">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold uppercase tracking-tighter text-primary">
            {isEditing ? "EDIT_PROJECT" : "NEW_PROJECT"}
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* BASIC INFO */}
                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">BASIC_INFO</h2>
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input className="rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="subtitle" render={({ field }) => (
                    <FormItem><FormLabel>Subtitle</FormLabel><FormControl><Input className="rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Select a category..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                          <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                          <SelectItem value="MIXED USE">Mixed Use</SelectItem>
                          <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
                          <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="client" render={({ field }) => (
                      <FormItem><FormLabel>Client</FormLabel><FormControl><Input className="rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem><FormLabel>Role</FormLabel><FormControl><Input className="rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="focus" render={({ field }) => (
                      <FormItem><FormLabel>Focus</FormLabel><FormControl><Input className="rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="tools" render={({ field }) => (
                      <FormItem><FormLabel>Tools</FormLabel><FormControl><Input className="rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">PROGRAMME</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="startsOn" render={({ field }) => (
                      <FormItem><FormLabel>Start</FormLabel><FormControl><Input type="date" className="rounded-none" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="endsOn" render={({ field }) => (
                      <FormItem><FormLabel>Target completion</FormLabel><FormControl><Input type="date" className="rounded-none" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phase" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phase</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="rounded-none"><SelectValue placeholder="Phase" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["Concept", "Schematic Design", "Design Development", "Construction Documents", "Construction Administration", "Complete"].map((phase) => (
                              <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* MEDIA */}
                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">MEDIA</h2>
                  <FormField control={form.control} name="coverImage" render={({ field }) => (
                    <FormItem><FormLabel>Cover Image URL</FormLabel><FormControl><Input className="rounded-none" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="heroImage" render={({ field }) => (
                    <FormItem><FormLabel>Hero Image URL</FormLabel><FormControl><Input className="rounded-none" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                {/* CONTENT */}
                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">CONTENT</h2>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Project Brief</FormLabel><FormControl><Textarea className="rounded-none min-h-[140px]" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="outcomes" render={({ field }) => (
                    <FormItem><FormLabel>Outcomes & Results</FormLabel><FormControl><Textarea className="rounded-none min-h-[100px]" {...field} value={field.value || ""} placeholder="What was achieved, delivered, or learned..." /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>

                {/* ── ARCHITECTURAL PLANS ── */}
                <div className="space-y-4 p-6 border-2 border-primary/40 bg-primary/5">
                  <div className="border-b border-primary/20 pb-2">
                    <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">ARCHITECTURAL_PLANS</h2>
                    <p className="text-xs text-muted-foreground mt-1">Upload floor plans, elevations, sections, or any drawing files. Drag & drop images or PDFs directly.</p>
                  </div>

                  {/* Drop zone */}
                  <PlanUploader
                    onUpload={(url, filename) => {
                      appendPlan({ title: filename, url });
                    }}
                  />

                  {/* Plan list */}
                  {planFields.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {planFields.map((field, index) => {
                        const url = form.watch(`plans.${index}.url`);
                        const isPdf = url?.toLowerCase().endsWith(".pdf") || url?.includes("pdf");
                        return (
                          <div key={field.id} className="flex gap-2 items-center bg-background border border-border p-3">
                            <div className="shrink-0 text-primary">
                              {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                            </div>
                            <FormField control={form.control} name={`plans.${index}.title`} render={({ field }) => (
                              <FormItem className="flex-1 mb-0">
                                <FormControl>
                                  <Input
                                    className="rounded-none h-8 text-sm mono border-0 border-b border-border focus-visible:ring-0 px-0"
                                    placeholder="Plan title (e.g. Ground Floor Plan)"
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )} />
                            <a
                              href={form.watch(`plans.${index}.url`)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] mono text-muted-foreground hover:text-accent shrink-0 underline"
                            >
                              VIEW
                            </a>
                            <Button type="button" variant="ghost" onClick={() => removePlan(index)} className="rounded-none text-destructive shrink-0 h-8 w-8 p-0 hover:bg-destructive/10">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {planFields.length === 0 && (
                    <p className="text-xs text-muted-foreground mono italic text-center">No plans uploaded yet.</p>
                  )}
                </div>

                {/* HIGHLIGHT STATS */}
                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <div>
                      <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">PROJECT_STATS</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Key numbers (e.g. Area: 2,400 sq ft)</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendStat({ label: "", value: "" })} className="h-7 text-xs rounded-none">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  {statFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField control={form.control} name={`highlightStats.${index}.label`} render={({ field }) => (
                        <FormItem className="flex-1"><FormControl><Input placeholder="Label" className="rounded-none" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name={`highlightStats.${index}.value`} render={({ field }) => (
                        <FormItem className="flex-1"><FormControl><Input placeholder="Value" className="rounded-none" {...field} /></FormControl></FormItem>
                      )} />
                      <Button type="button" variant="outline" onClick={() => removeStat(index)} className="rounded-none text-destructive h-9 w-9 p-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {statFields.length === 0 && <p className="text-sm text-muted-foreground italic">No stats added.</p>}
                </div>

                {/* METHODOLOGY */}
                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">METHODOLOGY</h2>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendStep({ title: "", description: "" })} className="h-7 text-xs rounded-none">
                      <Plus className="w-3 h-3 mr-1" /> Add Step
                    </Button>
                  </div>
                  {stepFields.map((field, index) => (
                    <div key={field.id} className="relative p-4 border border-border bg-background space-y-3">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeStep(index)} className="absolute top-2 right-2 text-destructive h-6 w-6 p-0 rounded-none">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <FormField control={form.control} name={`methodologySteps.${index}.title`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Step {index + 1} Title</FormLabel><FormControl><Input className="rounded-none h-8" {...field} /></FormControl></FormItem>
                      )} />
                      <FormField control={form.control} name={`methodologySteps.${index}.description`} render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Description</FormLabel><FormControl><Textarea className="rounded-none text-sm" {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                  ))}
                  {stepFields.length === 0 && <p className="text-sm text-muted-foreground italic">No steps added.</p>}
                </div>

                {/* GALLERY */}
                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">PHOTO_GALLERY</h2>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendGallery("")} className="h-7 text-xs rounded-none">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  </div>
                  {galleryFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <FormField control={form.control} name={`galleryImages.${index}`} render={({ field }) => (
                        <FormItem className="flex-1"><FormControl><Input placeholder="Image URL" className="rounded-none" {...field} /></FormControl></FormItem>
                      )} />
                      <Button type="button" variant="outline" onClick={() => removeGallery(index)} className="rounded-none text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* SETTINGS */}
                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">SETTINGS</h2>
                  <FormField control={form.control} name="published" render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0 p-4 border border-border bg-background">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div>
                        <FormLabel>Publish Project</FormLabel>
                        <p className="text-sm text-muted-foreground">Visible to public on the website</p>
                      </div>
                    </FormItem>
                  )} />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={createProject.isPending || updateProject.isPending} className="w-full rounded-none bg-primary hover:bg-accent mono font-bold uppercase tracking-widest text-white">
                    {createProject.isPending || updateProject.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isEditing ? "SAVE_CHANGES" : "CREATE_PROJECT"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="xl:col-span-1">
            <div className="sticky top-4">
              <h3 className="font-bold text-sm uppercase mono mb-4 text-primary">IMAGE_UPLOADER</h3>
              <Uploader />
              <p className="text-xs text-muted-foreground mt-4">
                Upload images here and paste URLs into Cover, Hero, or Gallery fields above.
                For plans, use the drop zone in the ARCHITECTURAL_PLANS section — it adds them automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
