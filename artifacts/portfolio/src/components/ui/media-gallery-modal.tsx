import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Upload,
  Link as LinkIcon,
  X,
  Check,
  Loader2,
  RefreshCw,
  Trash2,
  Copy,
  ExternalLink,
  ImageIcon,
  Grid,
  CheckCircle2,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  fetchMediaUploads,
  uploadMediaFile,
  deleteMediaUpload,
  type CloudinaryMedia,
} from "@/lib/media-api";

export interface MediaGalleryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: CloudinaryMedia) => void;
  onSelectMultiple?: (urls: string[], items?: CloudinaryMedia[]) => void;
  multiple?: boolean;
  initialSelectedUrl?: string;
  title?: string;
}

export function MediaGalleryModal({
  open,
  onClose,
  onSelect,
  onSelectMultiple,
  multiple = false,
  initialSelectedUrl = "",
  title = "MEDIA_GALLERY",
}: MediaGalleryModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"library" | "upload" | "url">("library");
  const [items, setItems] = useState<CloudinaryMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [folder, setFolder] = useState<string>("utarch");
  const [selectedUrls, setSelectedUrls] = useState<string[]>(
    initialSelectedUrl ? [initialSelectedUrl] : []
  );
  const [selectedItems, setSelectedItems] = useState<CloudinaryMedia[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [directUrlInput, setDirectUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewItem, setPreviewItem] = useState<CloudinaryMedia | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial selection when modal opens
  useEffect(() => {
    if (open) {
      if (initialSelectedUrl) {
        setSelectedUrls([initialSelectedUrl]);
      } else {
        setSelectedUrls([]);
        setSelectedItems([]);
      }
      setActiveTab("library");
    }
  }, [open, initialSelectedUrl]);

  // Handle escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewItem) {
          setPreviewItem(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, previewItem]);

  // Load media from Cloudinary
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
        title: "Failed to load gallery",
        description: err.message || "Could not retrieve media from Cloudinary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-fetch when modal opens or folder/search changes
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      loadMedia(false);
    }, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [open, folder, searchTerm]);

  // Handle single / multiple click
  const handleItemClick = (item: CloudinaryMedia) => {
    if (multiple) {
      const exists = selectedUrls.includes(item.secureUrl);
      if (exists) {
        setSelectedUrls((prev) => prev.filter((u) => u !== item.secureUrl));
        setSelectedItems((prev) => prev.filter((i) => i.secureUrl !== item.secureUrl));
      } else {
        setSelectedUrls((prev) => [...prev, item.secureUrl]);
        setSelectedItems((prev) => [...prev, item]);
      }
    } else {
      setSelectedUrls([item.secureUrl]);
      setSelectedItems([item]);
    }
  };

  const handleDoubleClick = (item: CloudinaryMedia) => {
    if (!multiple) {
      onSelect(item.secureUrl, item);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (multiple) {
      if (onSelectMultiple) {
        onSelectMultiple(selectedUrls, selectedItems);
      } else if (selectedUrls[0]) {
        onSelect(selectedUrls[0], selectedItems[0]);
      }
    } else {
      if (selectedUrls[0]) {
        onSelect(selectedUrls[0], selectedItems[0]);
      }
    }
    onClose();
  };

  const copyToClipboard = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({ title: "Image URL copied to clipboard" });
  };

  const handleDelete = async (item: CloudinaryMedia, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${item.filename}" from Cloudinary?`)) return;

    try {
      await deleteMediaUpload(item.publicId);
      setItems((prev) => prev.filter((i) => i.publicId !== item.publicId));
      setSelectedUrls((prev) => prev.filter((u) => u !== item.secureUrl));
      setSelectedItems((prev) => prev.filter((i) => i.publicId !== item.publicId));
      toast({ title: "Image deleted" });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploadedUrls: string[] = [];
    const uploadedItemList: CloudinaryMedia[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadMediaFile(file);
        const newItem: CloudinaryMedia = {
          publicId: res.publicId || res.key,
          url: res.url,
          secureUrl: res.url,
          format: file.name.split(".").pop() || "image",
          width: 0,
          height: 0,
          bytes: file.size,
          createdAt: new Date().toISOString(),
          filename: res.originalName || file.name,
        };
        uploadedUrls.push(res.url);
        uploadedItemList.push(newItem);
      }

      toast({
        title: `Uploaded ${files.length} file${files.length > 1 ? "s" : ""}`,
      });

      // Refresh gallery list and prepend uploaded items
      setItems((prev) => [...uploadedItemList, ...prev]);

      if (multiple) {
        setSelectedUrls((prev) => [...uploadedUrls, ...prev]);
        setSelectedItems((prev) => [...uploadedItemList, ...prev]);
      } else {
        setSelectedUrls([uploadedUrls[0]]);
        setSelectedItems([uploadedItemList[0]]);
      }

      // Switch back to library view so user sees the newly uploaded image highlighted
      setActiveTab("library");
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDirectUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrlInput.trim()) return;
    if (multiple) {
      if (onSelectMultiple) {
        onSelectMultiple([directUrlInput.trim()]);
      } else {
        onSelect(directUrlInput.trim());
      }
    } else {
      onSelect(directUrlInput.trim());
    }
    onClose();
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div
        className="bg-background border border-border w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="mono text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                {title}
                <span className="text-[10px] font-normal px-2 py-0.5 border border-border text-muted-foreground uppercase">
                  {multiple ? "Multi-select" : "Single Image"}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Select from Cloudinary library or upload new media
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadMedia(false)}
              disabled={loading}
              className="h-8 px-2.5 rounded-none text-xs"
              title="Refresh images"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-none hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* TABS & TOOLBAR */}
        <div className="px-5 py-3 border-b border-border bg-muted/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* TAB BUTTONS */}
          <div className="flex items-center gap-1 border border-border p-0.5 bg-background">
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={`px-3 py-1.5 text-xs mono uppercase font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "library"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Gallery ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`px-3 py-1.5 text-xs mono uppercase font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`px-3 py-1.5 text-xs mono uppercase font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "url"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Custom URL
            </button>
          </div>

          {/* FILTERS & SEARCH (shown only on library tab) */}
          {activeTab === "library" && (
            <div className="flex items-center gap-2 flex-1 md:max-w-md md:justify-end">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by filename..."
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
          )}
        </div>

        {/* MAIN BODY */}
        <div className="flex-1 overflow-y-auto p-5 relative">
          {/* TAB 1: GALLERY */}
          {activeTab === "library" && (
            <>
              {loading && items.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs mono uppercase">Connecting to Cloudinary library...</p>
                </div>
              ) : items.length === 0 ? (
                <div className="h-64 border border-dashed border-border flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/60" />
                  <div>
                    <p className="text-sm font-bold text-foreground">No images found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {searchTerm
                        ? `No images matched "${searchTerm}". Try another term.`
                        : "No images found in this folder. Upload one to get started."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("upload")}
                    className="rounded-none mt-2 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {items.map((item) => {
                      const isSelected = selectedUrls.includes(item.secureUrl);
                      return (
                        <div
                          key={item.publicId}
                          onClick={() => handleItemClick(item)}
                          onDoubleClick={() => handleDoubleClick(item)}
                          className={`group relative border transition-all cursor-pointer bg-muted/10 flex flex-col overflow-hidden select-none ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/40 bg-primary/5"
                              : "border-border hover:border-primary/60"
                          }`}
                        >
                          {/* THUMBNAIL */}
                          <div className="relative aspect-video sm:aspect-square w-full bg-black/40 overflow-hidden">
                            <img
                              src={item.secureUrl}
                              alt={item.filename}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />

                            {/* SELECTION INDICATOR */}
                            {isSelected && (
                              <div className="absolute top-2 left-2 bg-primary text-primary-foreground p-1 shadow">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}

                            {/* HOVER OVERLAY ACTIONS */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                              <button
                                type="button"
                                onClick={(e) => copyToClipboard(item.secureUrl, e)}
                                className="p-1.5 bg-background text-foreground hover:bg-accent hover:text-white border border-border shadow text-xs"
                                title="Copy URL"
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
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 bg-background text-foreground hover:bg-accent hover:text-white border border-border shadow text-xs"
                                title="Open full resolution"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(item, e)}
                                className="p-1.5 bg-background text-destructive hover:bg-destructive hover:text-white border border-border shadow text-xs"
                                title="Delete image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* METADATA */}
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
                      );
                    })}
                  </div>

                  {/* LOAD MORE BUTTON */}
                  {nextCursor && (
                    <div className="pt-2 pb-4 text-center">
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
            </>
          )}

          {/* TAB 2: UPLOAD */}
          {activeTab === "upload" && (
            <div className="max-w-xl mx-auto py-8">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileUpload(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                  dragOver
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/60 bg-muted/5"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple={multiple}
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  {uploading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7" />
                  )}
                </div>

                <h3 className="text-sm font-bold uppercase mono text-foreground mb-1">
                  {uploading ? "Uploading to Cloudinary..." : "Drop images here or click to browse"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                  Accepts JPEG, PNG, WebP, GIF up to 15MB. Automatically saved into folder:{" "}
                  <code className="text-primary font-bold">utarch</code>
                </p>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  className="rounded-none mono text-xs uppercase"
                >
                  {uploading ? "Uploading..." : "Select Files from Computer"}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM URL */}
          {activeTab === "url" && (
            <div className="max-w-xl mx-auto py-8 space-y-4">
              <form onSubmit={handleDirectUrlSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase mono text-primary">
                    Paste Image URL
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      value={directUrlInput}
                      onChange={(e) => setDirectUrlInput(e.target.value)}
                      className="rounded-none font-mono text-xs flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!directUrlInput.trim()}
                      className="rounded-none mono uppercase text-xs shrink-0"
                    >
                      Use URL
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can paste any direct image URL (from Cloudinary or external CDN).
                  </p>
                </div>

                {directUrlInput && (
                  <div className="border border-border p-3 bg-muted/10 space-y-2">
                    <p className="text-xs font-bold mono text-primary uppercase">Preview:</p>
                    <div className="aspect-video w-full max-h-60 bg-black/40 overflow-hidden border border-border flex items-center justify-center">
                      <img
                        src={directUrlInput}
                        alt="URL Preview"
                        className="max-h-60 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3.5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* SELECTION SUMMARY */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedUrls.length > 0 ? (
              <div className="flex items-center gap-2 text-xs mono">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-foreground">
                  {selectedUrls.length} image{selectedUrls.length > 1 ? "s" : ""} selected
                </span>
                {selectedUrls[0] && (
                  <span className="text-muted-foreground truncate max-w-[200px] sm:max-w-[280px]">
                    ({selectedUrls[0].split("/").pop()})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Click an image from the gallery to select it.
              </span>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-none mono text-xs uppercase h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="rounded-none mono text-xs uppercase font-bold tracking-wider h-9 bg-primary hover:bg-accent text-white"
            >
              {multiple
                ? `Add Selected (${selectedUrls.length})`
                : "Select Image"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
