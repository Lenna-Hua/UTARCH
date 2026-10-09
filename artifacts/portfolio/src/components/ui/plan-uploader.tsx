import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Image, Loader2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiBase } from "@/lib/studio-api";
import { Button } from "./button";

interface PlanUploaderProps {
  onUpload: (url: string, filename: string) => void;
}

export function PlanUploader({ onUpload }: PlanUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    setDone(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${apiBase()}/api/uploads`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json() as { url: string };
      onUpload(data.url, file.name.replace(/\.[^/.]+$/, ""));
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      toast({ title: `${file.name} uploaded` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [onUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }, [upload]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-none p-6 text-center transition-colors cursor-pointer select-none
        ${dragging ? "border-accent bg-accent/5" : "border-border hover:border-primary/60 hover:bg-muted/20"}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFile}
      />
      <div className="flex flex-col items-center gap-2 pointer-events-none">
        {uploading ? (
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        ) : done ? (
          <Check className="w-8 h-8 text-green-600" />
        ) : (
          <div className="flex gap-2 justify-center">
            <Image className="w-6 h-6 text-muted-foreground" />
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <p className="text-sm text-muted-foreground mono uppercase tracking-wider">
          {uploading ? "UPLOADING..." : done ? "DONE — DROP ANOTHER" : "DROP FILE OR CLICK TO BROWSE"}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mono">Accepts images & PDF files</p>
      </div>
    </div>
  );
}
