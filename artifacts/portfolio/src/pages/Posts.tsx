import { useListPosts } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const }
  })
};

export default function Posts() {
  const { data: posts = [], isLoading } = useListPosts();

  return (
    <PublicLayout>
        {/* HEADER */}
        <motion.div
          className="border-b border-border p-8 md:p-16"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-primary">
            NOTES & THOUGHTS
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
            Observations on architecture, technology, and the built environment.
          </p>
        </motion.div>

        {/* CONTENT */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="mono text-sm text-muted-foreground animate-pulse">LOADING_POSTS...</div>
          </div>
        ) : posts.length === 0 ? (
          /* ── BLUEPRINT EMPTY STATE ── */
          <div className="flex-1 flex flex-col items-center justify-center p-16 text-center relative overflow-hidden">
            {/* Blueprint grid background */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="bp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" className="stroke-primary" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#bp-grid)" />
              </svg>
            </div>

            <div className="relative border border-dashed border-border p-12 max-w-md">
              {/* Corner marks */}
              <span className="absolute top-2 left-2 mono text-[9px] text-muted-foreground/40">A1</span>
              <span className="absolute top-2 right-2 mono text-[9px] text-muted-foreground/40">B1</span>
              <span className="absolute bottom-2 left-2 mono text-[9px] text-muted-foreground/40">A2</span>
              <span className="absolute bottom-2 right-2 mono text-[9px] text-muted-foreground/40">B2</span>

              <div className="text-6xl font-bold text-primary/10 mono mb-4">∅</div>
              <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary mb-2">NO_POSTS_FOUND</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Notes & observations will appear here once published from the admin panel.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                custom={i * 0.5}
                viewport={{ once: true }}
              >
                <Link
                  href={`/posts/${post.id}`}
                  className="group flex flex-col h-full border-b border-border md:border-b-0 hover:bg-accent/5 transition-colors"
                >
                  {post.coverImage && (
                    <div className="aspect-[4/3] border-b border-border overflow-hidden bg-muted relative">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="mono text-[10px] text-muted-foreground mb-3 uppercase tracking-widest">
                      {format(new Date(post.createdAt), 'dd MMM yyyy')}
                    </div>
                    <h2 className="text-xl font-bold text-primary mb-3 leading-tight group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-6 leading-relaxed whitespace-pre-line">
                      {post.excerpt}
                    </p>
                    <div className="mt-auto flex items-center text-primary group-hover:text-accent font-medium text-sm mono uppercase tracking-wider transition-colors">
                      READ_NOTE
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
    </PublicLayout>
  );
}
