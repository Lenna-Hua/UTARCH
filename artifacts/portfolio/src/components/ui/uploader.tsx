import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiBase } from "@/lib/studio-api";

export function Uploader({ onUploadComplete }: { onUploadComplete?: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch(`${apiBase()}/api/uploads`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      setUploadedUrl(data.url);
      
      if (onUploadComplete) {
        onUploadComplete(data.url);
      }
      
      toast({ title: "Upload successful" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = () => {
    if (!uploadedUrl) return;
    navigator.clipboard.writeText(uploadedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "URL copied to clipboard" });
  };

  return (
    <div className="border border-border p-4 space-y-4 rounded-sm">
      <div className="space-y-2">
        <Label>Upload Image</Label>
        <div className="flex gap-2">
          <Input 
            type="file" 
            accept="image/*" 
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="flex-1"
          />
          <Button onClick={handleUpload} disabled={!file || uploading} className="shrink-0">
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload
          </Button>
        </div>
      </div>
      
      {uploadedUrl && (
        <div className="p-3 bg-muted border border-border rounded-sm flex items-center justify-between gap-2">
          <div className="truncate text-sm mono text-muted-foreground flex-1">
            {uploadedUrl}
          </div>
          <Button variant="outline" size="sm" onClick={copyUrl} className="shrink-0">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copied!" : "Copy URL"}
          </Button>
        </div>
      )}
    </div>
  );
}
