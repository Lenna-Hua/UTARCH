import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Uploader } from "@/components/ui/uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ImageIcon,
  Search,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Loader2,
  Upload,
} from "lucide-react";
import {
  fetchMediaUploads,
  deleteMediaUpload,
  type CloudinaryMedia,
} from "@/lib/media-api";
import { MediaGalleryModal } from "@/components/ui/media-gallery-modal";

export default function AdminUploads() {
  const { toast } = useToast();
  const [items, setItems] = useState<CloudinaryMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [folder, setFolder] = useState<string>("utarch");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadMedia = async (isLoadMore = false, cursor?: string) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetchMediaUploads({
        folder: folder === "all" ? "" : folder,
        maxResults: 40,
        nextCursor: cursor,
        search: searchTerm.trim() || undefined,
      });

      if (isLoadMore) {
        setItems((prev) => [...prev, ...res.resources]);
      } else {
        setItems(res.resources || []);
      }
      setNextCursor(res.nextCursor);
    } catch (err: any) {
      toast({
        title: "Failed to load media",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedia(false);
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [folder, searchTerm]);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({ title: "Image URL copied to clipboard" });
  };

  const handleDelete = async (item: CloudinaryMedia) => {
    if (!window.confirm(`Delete "${item.filename}" from Cloudinary?`)) return;

    try {
      await deleteMediaUpload(item.publicId);
      setItems((prev) => prev.filter((i) => i.publicId !== item.publicId));
      toast({ title: "Image deleted" });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between border-b border-border pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-tighter text-primary">
              MEDIA_GALLERY
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Browse, search, and manage your Cloudinary assets. Select any image to copy its URL.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-none mono text-xs uppercase font-bold bg-primary hover:bg-accent text-white h-9"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Pop-up Gallery View
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadMedia(false)}
              disabled={loading}
              className="rounded-none h-9 px-3 text-xs mono"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* UPLOADER SECTION */}
        <div className="border border-border p-6 bg-muted/10 space-y-4">
          <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary border-b border-border pb-2">
            UPLOAD_NEW_ASSET
          </h2>
          <Uploader
            onUploadComplete={(url) => {
              loadMedia(false);
              toast({ title: "New asset added to gallery" });
            }}
          />
        </div>

        {/* GALLERY CONTROLS */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border pb-3">
            <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              CLOUDINARY_LIBRARY
              <span className="text-xs font-normal px-2 py-0.5 border border-border text-muted-foreground">
                {items.length} items
              </span>
            </h2>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter images..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs rounded-none bg-background"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="h-8 text-xs bg-background border border-border px-2 rounded-none mono"
              >
                <option value="utarch">utarch</option>
                <option value="all">All Media</option>
              </select>
            </div>
          </div>

          {/* GALLERY GRID */}
          {loading && items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground border border-border">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs mono uppercase">Loading media from Cloudinary...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-64 border border-dashed border-border flex flex-col items-center justify-center gap-2 text-center p-6">
              <ImageIcon className="w-10 h-10 text-muted-foreground/60" />
              <p className="text-sm font-bold text-foreground">No media found</p>
              <p className="text-xs text-muted-foreground">
                {searchTerm
                  ? `No images matched "${searchTerm}".`
                  : "No images found in this folder."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {items.map((item) => (
                  <div
                    key={item.publicId}
                    className="group border border-border hover:border-primary transition-all bg-background flex flex-col overflow-hidden"
                  >
                    <div className="relative aspect-square w-full bg-black/40 overflow-hidden">
                      <img
                        src={item.secureUrl}
                        alt={item.filename}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* HOVER ACTIONS */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={() => copyUrl(item.secureUrl)}
                          className="p-1.5 bg-background text-foreground hover:bg-accent hover:text-white border border-border shadow text-xs"
                          title="Copy image URL"
                        >
                          {copiedUrl === item.secureUrl ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={item.secureUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-background text-foreground hover:bg-accent hover:text-white border border-border shadow text-xs"
                          title="View full image"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="p-1.5 bg-background text-destructive hover:bg-destructive hover:text-white border border-border shadow text-xs"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 border-t border-border bg-background">
                      <p
                        className="text-xs font-mono truncate text-foreground"
                        title={item.filename}
                      >
                        {item.filename}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mono mt-0.5">
                        <span>
                          {item.width && item.height
                            ? `${item.width}×${item.height}`
                            : item.format?.toUpperCase()}
                        </span>
                        <span>{formatBytes(item.bytes)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {nextCursor && (
                <div className="text-center pt-2 pb-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => loadMedia(true, nextCursor)}
                    disabled={loadingMore}
                    className="rounded-none mono text-xs uppercase"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Loading more...
                      </>
                    ) : (
                      "Load More Images"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MediaGalleryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="CLOUDINARY_MEDIA_GALLERY"
        onSelect={(url) => {
          copyUrl(url);
          setModalOpen(false);
        }}
      />
    </AdminLayout>
  );
}
