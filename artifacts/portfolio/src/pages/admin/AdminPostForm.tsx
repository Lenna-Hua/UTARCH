import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useCreatePost, useGetPost, useUpdatePost, getGetPostQueryKey, getListAllPostsQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postSchema } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, ImageIcon, Image, LayoutTemplate } from "lucide-react";
import { Uploader } from "@/components/ui/uploader";
import { ImagePicker } from "@/components/ui/image-picker";
import { MediaGalleryModal } from "@/components/ui/media-gallery-modal";

export default function AdminPostForm() {
  const { id } = useParams();
  const isEditing = id !== "new" && id !== undefined;
  const postId = isEditing ? parseInt(id, 10) : 0;
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [insertMarkdownGalleryOpen, setInsertMarkdownGalleryOpen] = useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  
  const { data: post, isLoading: isLoadingPost } = useGetPost(postId, {
    query: { enabled: isEditing, queryKey: getGetPostQueryKey(postId) }
  });
  
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      published: false
    }
  });

  useEffect(() => {
    if (post && isEditing) {
      form.reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt || "",
        content: post.content,
        coverImage: post.coverImage || "",
        published: post.published
      });
    }
  }, [post, isEditing, form]);

  const onSubmit = (values: any) => {
    if (isEditing) {
      updatePost.mutate(
        { id: postId, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
            queryClient.invalidateQueries({ queryKey: getListAllPostsQueryKey() });
            toast({ title: "Post updated" });
            setLocation("/admin/posts");
          }
        }
      );
    } else {
      createPost.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAllPostsQueryKey() });
            toast({ title: "Post created" });
            setLocation("/admin/posts");
          }
        }
      );
    }
  };

  const generateSlug = () => {
    const title = form.getValues("title");
    if (title) {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      form.setValue("slug", slug, { shouldValidate: true });
    }
  };

  if (isEditing && isLoadingPost) {
    return <AdminLayout><div className="p-8 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-4 border-b border-border pb-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => setLocation("/admin/posts")} className="rounded-none">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold uppercase tracking-tighter text-primary">
            {isEditing ? "EDIT_POST" : "NEW_POST"}
          </h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">BASIC_INFO</h2>
                  
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input className="rounded-none" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  
                  <div className="flex gap-4 items-end">
                    <FormField control={form.control} name="slug" render={({ field }) => (
                      <FormItem className="flex-1"><FormLabel>Slug</FormLabel><FormControl><Input className="rounded-none mono text-sm" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="outline" onClick={generateSlug} className="rounded-none">Generate</Button>
                  </div>

                  <FormField control={form.control} name="excerpt" render={({ field }) => (
                    <FormItem><FormLabel>Excerpt</FormLabel><FormControl><Textarea className="rounded-none h-20" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  
                  <FormField control={form.control} name="coverImage" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cover Image</FormLabel>
                      <FormControl>
                        <ImagePicker
                          value={field.value}
                          onChange={field.onChange}
                          modalTitle="SELECT_POST_COVER_IMAGE"
                          aspectRatio="video"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary">CONTENT</h2>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setInsertMarkdownGalleryOpen(true)}
                      className="rounded-none text-xs mono uppercase h-7"
                    >
                      <ImageIcon className="w-3 h-3 mr-1 text-primary" /> Insert Image from Gallery
                    </Button>
                  </div>
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Markdown Content</FormLabel>
                      <FormControl>
                        <Textarea className="rounded-none min-h-[400px] mono text-sm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="space-y-4 p-6 border border-border bg-muted/10">
                  <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">SETTINGS</h2>
                  <div className="flex items-center space-x-2">
                    <FormField control={form.control} name="published" render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border border-border bg-background w-full">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Publish Post</FormLabel>
                          <p className="text-sm text-muted-foreground">Visible to public on the website</p>
                        </div>
                      </FormItem>
                    )} />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <Button type="submit" disabled={createPost.isPending || updatePost.isPending} className="flex-1 rounded-none bg-primary hover:bg-accent mono font-bold uppercase tracking-widest text-white">
                    {createPost.isPending || updatePost.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {isEditing ? "SAVE_CHANGES" : "CREATE_POST"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
          
          <div className="xl:col-span-1">
            <div className="sticky top-4 space-y-4">
              <div className="border border-border p-4 bg-muted/10 space-y-3">
                <h3 className="font-bold text-sm uppercase mono text-primary">MEDIA_GALLERY</h3>
                <p className="text-xs text-muted-foreground">
                  Browse your Cloudinary gallery to select an image or upload new assets.
                </p>
                <Button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="w-full rounded-none mono font-bold text-xs uppercase bg-primary hover:bg-accent text-white h-9"
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> Open Media Gallery
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm uppercase mono text-primary">DIRECT_UPLOAD</h3>
                <Uploader onUploadComplete={(url) => setLastUploadedUrl(url)} />

                {lastUploadedUrl && (
                  <div className="border border-border p-3 bg-muted/20 space-y-2 animate-in fade-in-0 duration-200">
                    <p className="text-xs mono font-bold text-primary uppercase">Quick-apply uploaded image:</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-none justify-start text-xs h-8"
                        onClick={() => {
                          form.setValue("coverImage", lastUploadedUrl, { shouldDirty: true });
                          toast({ title: "Set as Cover Image" });
                        }}
                      >
                        <Image className="w-3.5 h-3.5 mr-2 text-primary" /> Set as Cover Image
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-none justify-start text-xs h-8"
                        onClick={() => {
                          const current = form.getValues("content") || "";
                          form.setValue("content", `${current}\n\n![Image](${lastUploadedUrl})\n`, { shouldDirty: true });
                          toast({ title: "Inserted into Markdown" });
                        }}
                      >
                        <LayoutTemplate className="w-3.5 h-3.5 mr-2 text-primary" /> Insert into Content
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: SIDEBAR GALLERY */}
      <MediaGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title="CLOUDINARY_MEDIA_GALLERY"
        onSelect={(url) => {
          setLastUploadedUrl(url);
          setGalleryOpen(false);
          toast({ title: "Image chosen" });
        }}
      />

      {/* MODAL: INSERT INTO MARKDOWN */}
      <MediaGalleryModal
        open={insertMarkdownGalleryOpen}
        onClose={() => setInsertMarkdownGalleryOpen(false)}
        title="INSERT_IMAGE_INTO_POST"
        onSelect={(url, item) => {
          const current = form.getValues("content") || "";
          const caption = item?.filename || "Image";
          form.setValue("content", `${current}\n\n![${caption}](${url})\n`, { shouldDirty: true });
          setInsertMarkdownGalleryOpen(false);
          toast({ title: "Inserted image markdown tag" });
        }}
      />
    </AdminLayout>
  );
}
