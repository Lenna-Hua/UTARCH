import { useGetPost, getGetPostQueryKey } from "@workspace/api-client-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link, useParams } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function PostDetail() {
  const { id } = useParams();
  const postId = parseInt(id || "0", 10);
  
  const { data: post, isLoading } = useGetPost(postId, {
    query: { enabled: !!postId, queryKey: getGetPostQueryKey(postId) }
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center p-16">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      </PublicLayout>
    );
  }

  if (!post) {
    return (
      <PublicLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Link href="/posts" className="text-accent hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Notes
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col max-w-screen-md mx-auto w-full border-x border-border bg-background">
        <div className="border-b border-border">
          <Link href="/posts" className="inline-flex items-center gap-2 px-6 py-4 text-sm font-bold text-primary hover:text-accent transition-colors mono uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" />
            BACK_TO_NOTES
          </Link>
        </div>

        {post.coverImage && (
          <div className="aspect-[21/9] border-b border-border overflow-hidden bg-muted">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
          </div>
        )}

        <article className="p-8 md:p-12 lg:p-16">
          <header className="mb-12 border-b border-border pb-8">
            <div className="mono text-sm text-muted-foreground mb-4 uppercase tracking-widest">
              {format(new Date(post.createdAt), 'MMMM dd, yyyy')}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-primary leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-6 text-xl text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {post.excerpt}
              </p>
            )}
          </header>

          <div className="prose prose-zinc prose-lg max-w-none prose-headings:text-primary prose-p:text-foreground prose-p:leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </div>
        </article>
      </div>
    </PublicLayout>
  );
}
