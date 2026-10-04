import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link, useParams } from "wouter";
import { ArrowLeft, Download, FileText, ZoomIn, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }
  })
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-0.5 h-5 bg-primary shrink-0" />
      <span className="mono text-sm text-primary uppercase tracking-widest font-bold">{children}</span>
    </div>
  );
}

function PlanViewer({ plan, index }: { plan: { title: string; url: string }; index: number }) {
  const [lightbox, setLightbox] = useState(false);
  const isPdf = plan.url.toLowerCase().endsWith(".pdf") || plan.url.includes(".pdf");

  return (
    <>
      <motion.div
        className="border border-border bg-background group"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        custom={index * 0.3}
        viewport={{ once: true }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            {isPdf
              ? <FileText className="w-4 h-4 text-primary shrink-0" />
              : <div className="w-4 h-4 border border-primary shrink-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-primary" /></div>
            }
            <span className="mono text-xs font-bold uppercase tracking-wider text-primary truncate">{plan.title}</span>
            <span className="mono text-[9px] text-muted-foreground/50 uppercase ml-1 border border-border px-1">
              {isPdf ? "PDF" : "IMG"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isPdf && (
              <button
                onClick={() => setLightbox(true)}
                className="p-1.5 border border-border hover:border-primary hover:bg-primary hover:text-white transition-colors"
                title="Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            )}
            <a
              href={plan.url}
              download
              target="_blank"
              rel="noreferrer"
              className="p-1.5 border border-border hover:border-primary hover:bg-primary hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Content */}
        {isPdf ? (
          <div className="relative bg-muted/30" style={{ height: "520px" }}>
            <iframe
              src={`${plan.url}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              title={plan.title}
            />
          </div>
        ) : (
          <div
            className="relative overflow-hidden bg-[#f5f5f0] cursor-zoom-in"
            style={{ minHeight: "360px" }}
            onClick={() => setLightbox(true)}
          >
            <img
              src={plan.url}
              alt={plan.title}
              className="w-full h-auto object-contain"
              style={{ imageRendering: "crisp-edges" }}
            />
          </div>
        )}

        {/* Sheet ref footer */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between bg-muted/10">
          <span className="mono text-[9px] text-muted-foreground/50 uppercase">
            SHEET_{String(index + 1).padStart(2, "0")}
          </span>
          <span className="mono text-[9px] text-muted-foreground/30 uppercase">UYEN TON | ARCHITECTURAL TECHNOLOGIST</span>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
          >
            <motion.img
              src={plan.url}
              alt={plan.title}
              className="max-w-full max-h-full object-contain"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 text-white border border-white/30 w-10 h-10 flex items-center justify-center hover:bg-white/10 mono text-sm"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const projectId = parseInt(id || "0", 10);

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const p = project as any;

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[100dvh] flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <Link href="/" className="text-primary hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Archive
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col">

        {/* 1. HEADER — title + back nav */}
        <motion.div
          className="border-b border-border flex"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/" className="px-6 py-4 border-r border-border hover:bg-primary hover:text-white transition-colors flex items-center shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-4 px-6 flex flex-col justify-center flex-1">
            <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-tighter text-primary">
              {project.title}
            </h1>
            <p className="text-muted-foreground mt-1">{project.subtitle}</p>
          </div>
        </motion.div>

        {/* 2. HERO IMAGE — full-width, first visual impact */}
        {(project.heroImage || project.coverImage) && (
          <motion.div
            className="aspect-[21/9] md:aspect-[3/1] bg-muted border-b border-border relative overflow-hidden"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src={project.heroImage || project.coverImage || ""}
              alt={project.title}
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
          </motion.div>
        )}

        {/* 3. METADATA STRIP — context (Client, Role, Focus, Tools) */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border border-b border-border bg-muted/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {[
            { label: "CLIENT", value: project.client },
            { label: "ROLE", value: project.role },
            { label: "FOCUS", value: project.focus },
            { label: "TOOLS", value: project.tools },
            ...((project as { phase?: string }).phase
              ? [{ label: "PHASE", value: (project as { phase?: string }).phase as string }]
              : []),
            ...((project as { startsOn?: string }).startsOn
              ? [{
                  label: "PROGRAMME",
                  value: `${(project as { startsOn?: string }).startsOn}${(project as { endsOn?: string }).endsOn ? ` → ${(project as { endsOn?: string }).endsOn}` : ""}`,
                }]
              : []),
          ].map((item) => (
            <div key={item.label} className="p-4 border-b md:border-b-0 border-border">
              <span className="mono text-[10px] text-muted-foreground uppercase block mb-1">{item.label}</span>
              <span className="mono text-sm font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </motion.div>

        {/* 4. HIGHLIGHT STATS */}
        {p?.highlightStats && p.highlightStats.length > 0 && (
          <motion.div
            className="grid border-b border-border bg-primary text-white"
            style={{ gridTemplateColumns: `repeat(${Math.min(p.highlightStats.length, 4)}, 1fr)` }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            {p.highlightStats.map((stat: { label: string; value: string }, i: number) => (
              <div key={i} className="p-5 border-r border-white/20 last:border-r-0 text-center">
                <div className="text-2xl md:text-3xl font-bold mono">{stat.value}</div>
                <div className="mono text-[10px] uppercase tracking-widest mt-1 opacity-75">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* 5. CONCEPT — project brief + methodology */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border border-b border-border">
          <motion.div
            className="lg:col-span-2 p-8 lg:p-12"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <div className="mb-6"><SectionLabel>CONCEPT</SectionLabel></div>
            <div className="prose prose-zinc max-w-none">
              {project.description
                ? <p className="whitespace-pre-wrap text-foreground leading-relaxed">{project.description}</p>
                : <p className="italic text-muted-foreground">No detailed description available.</p>
              }
            </div>
          </motion.div>

          <motion.div
            className="p-8 lg:p-12 bg-muted/10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            custom={1}
            viewport={{ once: true, margin: "-80px" }}
          >
            <div className="mb-6"><SectionLabel>METHODOLOGY</SectionLabel></div>
            {project.methodologySteps && project.methodologySteps.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[11px] before:h-full before:w-0.5 before:bg-border">
                {project.methodologySteps.map((step, i) => (
                  <motion.div
                    key={i}
                    className="relative flex items-start"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    custom={i * 0.5}
                    viewport={{ once: true }}
                  >
                    <div className="absolute left-0 w-6 h-6 bg-background border border-primary rounded-full flex items-center justify-center mono text-[10px] z-10 font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="pl-10">
                      <h3 className="font-bold text-primary uppercase text-sm mb-2">{step.title}</h3>
                      <p className="text-sm text-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No methodology steps documented.</p>
            )}
          </motion.div>
        </div>

        {/* 6. TECHNICAL DRAWINGS — plan viewer, maximum width */}
        {p?.plans && p.plans.length > 0 && (
          <motion.section
            className="border-b border-border"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-primary text-white">
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-2 gap-0.5 opacity-60">
                  {[...Array(4)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-white" />)}
                </div>
                <h2 className="mono text-sm font-bold uppercase tracking-widest">TECHNICAL_DRAWINGS</h2>
              </div>
              <span className="mono text-[10px] opacity-60 uppercase">{p.plans.length} SHEET{p.plans.length !== 1 ? "S" : ""}</span>
            </div>

            <div className="p-6 md:p-10 space-y-8 bg-[#f8f8f5]">
              {p.plans.map((plan: { title: string; url: string }, i: number) => (
                <PlanViewer key={i} plan={plan} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {/* 7. RENDERS & OUTCOMES — gallery (final photography) */}
        {project.galleryImages && project.galleryImages.length > 0 && (
          <motion.div
            className="border-b border-border"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
              <SectionLabel>RENDERS_&_OUTCOMES</SectionLabel>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-x divide-border">
              {project.galleryImages.map((img, i) => (
                <motion.div
                  key={i}
                  className="aspect-[4/3] bg-muted relative border-b border-border overflow-hidden group"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  custom={i * 0.3}
                  viewport={{ once: true }}
                >
                  <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute bottom-4 right-4 bg-background px-3 py-1 border border-border mono text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    FIG_{String(i + 1).padStart(2, "0")}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 8. OUTCOMES text (if present, after imagery) */}
        {p?.outcomes && (
          <motion.div
            className="border-b border-border"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
              <SectionLabel>OUTCOMES_&_RESULTS</SectionLabel>
            </div>
            <div className="p-8 lg:p-12 max-w-3xl">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">{p.outcomes}</p>
            </div>
          </motion.div>
        )}

      </main>

      <Footer />
    </div>
  );
}
