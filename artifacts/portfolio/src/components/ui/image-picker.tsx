import { useState, useRef } from "react";
import {
  ImageIcon,
  Upload,
  X,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Edit2,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MediaGalleryModal } from "@/components/ui/media-gallery-modal";
import { uploadMediaFile } from "@/lib/media-api";

export interface ImagePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  modalTitle?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide" | "auto";
}

export function ImagePicker({
  value,
  onChange,
  label,
  placeholder = "Select or upload an image...",
  modalTitle = "SELECT_IMAGE",
  className = "",
  aspectRatio = "wide",
}: ImagePickerProps) {
  const { toast } = useToast();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanValue = value?.trim() || "";

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cleanValue) return;
    navigator.clipboard.writeText(cleanValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "URL copied to clipboard" });
  };

  const handleDirectUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadMediaFile(file);
      onChange(res.url);
      toast({ title: "Image uploaded and applied" });
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

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-video"
      : aspectRatio === "square"
        ? "aspect-square"
        : aspectRatio === "wide"
          ? "aspect-[21/9]"
          : "max-h-64";

  return (
    <div className={`space-y-2 ${className}`}>
      {/* HIDDEN FILE INPUT FOR DIRECT UPLOAD */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleDirectUpload(file);
        }}
        className="hidden"
      />

      {cleanValue ? (
        /* HAS IMAGE PREVIEW CARD */
        <div className="border border-border bg-background p-3 space-y-3">
          <div className="relative group overflow-hidden border border-border bg-black/40">
            <div className={`w-full ${aspectClass} overflow-hidden flex items-center justify-center bg-black/30`}>
              <img
                src={cleanValue}
                alt={label || "Selected Image"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                onError={(e) => {
                  (e.target as HTMLImageElement).alt = "Image failed to load";
                }}
              />
            </div>

            {/* QUICK ACTIONS OVERLAY ON IMAGE */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              <a
                href={cleanValue}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 bg-background/90 hover:bg-background border border-border text-foreground text-xs shadow hover:text-accent"
                title="Open in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="p-1.5 bg-background/90 hover:bg-background border border-border text-foreground text-xs shadow hover:text-accent"
                title="Copy URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS & URL */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50">
            <div className="truncate text-xs font-mono text-muted-foreground max-w-[280px] sm:max-w-[420px]" title={cleanValue}>
              {cleanValue}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGalleryOpen(true)}
                className="h-8 rounded-none text-xs mono uppercase"
              >
                <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
                Change Image
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange("")}
                className="h-8 rounded-none text-xs text-destructive hover:bg-destructive/10 mono uppercase px-2"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* EMPTY STATE - NO IMAGE SET */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleDirectUpload(file);
          }}
          className={`border-2 border-dashed p-5 transition-all text-center ${
            dragOver
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 bg-muted/5"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase mono text-foreground">
                {uploading ? "Uploading image to Cloudinary..." : "No image selected"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Choose an image from your Cloudinary gallery or upload directly
              </p>
            </div>

            {/* PRIMARY BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => setGalleryOpen(true)}
                disabled={uploading}
                className="rounded-none mono text-xs uppercase bg-primary hover:bg-accent text-white font-bold h-8 px-4"
              >
                <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                Select from Gallery
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-none mono text-xs uppercase h-8 px-3"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Upload New
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowManualInput(!showManualInput)}
                className="rounded-none mono text-[11px] text-muted-foreground hover:text-foreground h-8 px-2"
              >
                <LinkIcon className="w-3 h-3 mr-1" />
                {showManualInput ? "Hide URL" : "Paste URL"}
              </Button>
            </div>

            {/* MANUAL URL INPUT ACCORDION */}
            {showManualInput && (
              <div className="w-full max-w-md pt-3 mt-1 border-t border-border flex gap-2 animate-in fade-in-0 duration-200">
                <Input
                  type="url"
                  placeholder="https://res.cloudinary.com/..."
                  className="h-8 text-xs font-mono rounded-none flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const target = e.currentTarget;
                      if (target.value.trim()) onChange(target.value.trim());
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) onChange(e.target.value.trim());
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP GALLERY MODAL */}
      <MediaGalleryModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        initialSelectedUrl={cleanValue}
        title={modalTitle}
        onSelect={(url) => {
          onChange(url);
          setGalleryOpen(false);
          toast({ title: "Image selected" });
        }}
      />
    </div>
  );
}
