import { useState } from "react";
import { useGetSettings, useListProjects, useListSkills } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { MoveRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BuildingModel } from "@/components/BuildingModel";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] as const }
  })
};

function effectiveCategory(p: { category?: string; role?: string }): string {
  const cat = (p.category || "").trim();
  return cat !== "" ? cat.toUpperCase() : (p.role || "PROJECT").toUpperCase();
}

export default function Home() {
  const { data: settings } = useGetSettings();
  const { data: projects = [] } = useListProjects();
  const { data: skills = [] } = useListSkills();
  const [activeFilter, setActiveFilter] = useState("ALL");

  const availableFilters = [
    "ALL",
    ...Array.from(new Set(projects.map(effectiveCategory))).sort(),
  ];

  const filteredProjects = activeFilter === "ALL"
    ? projects
    : projects.filter((p) => effectiveCategory(p) === activeFilter);

  return (
    <PublicLayout>
      {/* HERO SECTION */}
      <section className="border-b border-border grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="p-8 lg:p-16 flex flex-col justify-center">
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold uppercase tracking-tighter leading-[0.92] text-primary hyphens-none"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              {settings?.title || "ARCHITECTURAL TECHNOLOGIST"}
            </motion.h1>
            <motion.p
              className="mt-6 text-xl text-foreground font-medium max-w-md whitespace-pre-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              {settings?.subtitle || "Bridging the gap between conceptual design and technical reality."}
            </motion.p>
          </div>
          <motion.div
            className="aspect-square lg:aspect-auto relative bg-muted flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          >
            {settings?.heroImage ? (
              <img src={settings.heroImage} alt="Hero" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
            ) : (
              <BuildingModel />
            )}
          </motion.div>
        </section>

        {/* INFO BAR — scrolling marquee */}
        <motion.div
          className="bg-primary text-white border-b border-border py-3 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(3)].map((_, rep) =>
              (settings?.infoItems || ["BASED IN TORONTO", "AVAILABLE FOR HIRE", "OBC & LEED COMPLIANT", "PERMIT DRAWINGS", "3D MODELING", "CONSTRUCTION DOCS"]).map((item, i, arr) => (
                <span key={`${rep}-${i}`} className="mono text-xs uppercase tracking-wider mx-6 flex items-center gap-6">
                  {item}
                  <span className="opacity-40">+</span>
                </span>
              ))
            )}
          </div>
        </motion.div>

        {/* ABOUT & SKILLS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 border-b border-border divide-y lg:divide-y-0 lg:divide-x divide-border">
          <motion.div
            className="p-8 lg:p-12 lg:pr-24"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <h2 className="mono text-sm text-muted-foreground uppercase mb-6 tracking-widest">{settings?.aboutHeading || "ABOUT_ME"}</h2>
            <div className="prose prose-zinc prose-p:text-foreground prose-p:leading-relaxed max-w-none">
              <p className="whitespace-pre-wrap">{settings?.aboutBody || "I specialize in transforming architectural concepts into precise, actionable technical drawings."}</p>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 divide-x divide-y divide-border -mt-[1px] -ml-[1px]">
            {(skills.length > 0 ? skills : [{ id: -1, name: "AUTOCAD", sortOrder: 0 }, { id: -2, name: "REVIT", sortOrder: 1 }, { id: -3, name: "SKETCHUP", sortOrder: 2 }, { id: -4, name: "LUMION", sortOrder: 3 }]).map((skill, i) => (
              <motion.div
                key={skill.id}
                className="p-6 flex items-center justify-center text-center group hover:bg-primary hover:text-white transition-colors cursor-default border-t border-l border-border"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                custom={i * 0.5}
                viewport={{ once: true }}
              >
                <span className="mono uppercase font-bold tracking-widest group-hover:scale-105 transition-transform">{skill.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PROJECTS ARCHIVE */}
        <section className="flex-1 flex flex-col">
          <motion.div
            className="p-4 border-b border-border flex justify-between items-center bg-muted/30"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="mono text-sm text-primary uppercase font-bold tracking-widest">PROJECT_ARCHIVE</h2>
            <span className="mono text-xs text-muted-foreground">{settings?.archiveDateRange || "2020-PRESENT"}</span>
          </motion.div>

          {/* FILTER TABS */}
          <motion.div
            className="flex flex-wrap gap-0 border-b border-border overflow-x-auto"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {availableFilters.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`mono text-xs uppercase tracking-widest px-5 py-3 border-r border-border transition-colors shrink-0 ${
                  activeFilter === cat
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 border-b border-border flex-1">
            <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                custom={i * 0.5}
                viewport={{ once: true, margin: "-40px" }}
                className="border-b sm:border-b-0 border-r border-border flex flex-col"
              >
                <Link href={`/projects/${project.id}`} className="group block flex flex-col h-full">
                  <div className="aspect-[4/3] sm:aspect-square relative overflow-hidden bg-muted border-b border-border">
                    {project.coverImage ? (
                      <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 grayscale group-hover:grayscale-0" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 mono text-xs">NO_IMG</div>
                    )}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/15 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </div>
                  <div className="p-5 flex-1 flex flex-col bg-background group-hover:bg-primary/5 transition-colors">
                    <div className="mono text-[10px] text-muted-foreground mb-2 flex justify-between">
                      <span>{project.role}</span>
                      <span>{new Date(project.createdAt).getFullYear()}</span>
                    </div>
                    <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.subtitle}</p>
                    <div className="mt-auto flex items-center text-primary font-medium text-sm">
                      <span className="mono uppercase tracking-wider text-[11px]">VIEW_DETAILS</span>
                      <MoveRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            </AnimatePresence>
            {filteredProjects.length === 0 && (
              <div className="col-span-full p-16 text-center mono text-xs text-muted-foreground uppercase tracking-widest">
                NO_PROJECTS_RECORDED_IN_THIS_CATEGORY
              </div>
            )}
          </div>
        </section>
        {/* CONTACT / CTA SECTION */}
        <motion.section
          className="border-t border-border grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          <div className="p-10 lg:p-16 flex flex-col justify-center">
            <p className="mono text-xs text-muted-foreground uppercase tracking-widest mb-4">CONTACT</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tighter leading-tight text-primary mb-4">
              Let's work<br />together.
            </h2>
            <p className="text-base text-muted-foreground max-w-sm leading-relaxed">
              Have a project in mind or looking to collaborate? Reach out — I'd love to hear from you.
            </p>
          </div>
          <div className="p-10 lg:p-16 flex flex-col justify-center gap-6">
            {settings?.email && (
              <div>
                <p className="mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Email</p>
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex items-center gap-3 bg-primary text-white font-bold uppercase tracking-widest mono text-sm px-6 py-4 hover:bg-primary/90 transition-colors group"
                >
                  {settings.email}
                  <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            )}
            {settings?.linkedin && (
              <div>
                <p className="mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">LinkedIn</p>
                <a
                  href={settings.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 border border-border text-foreground font-bold uppercase tracking-widest mono text-sm px-6 py-4 hover:border-primary hover:text-primary transition-colors group"
                >
                  View Profile
                  <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            )}
            {settings?.location && (
              <div>
                <p className="mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Based in</p>
                <p className="mono text-sm font-medium">{settings.location}</p>
              </div>
            )}
          </div>
        </motion.section>
    </PublicLayout>
  );
}
