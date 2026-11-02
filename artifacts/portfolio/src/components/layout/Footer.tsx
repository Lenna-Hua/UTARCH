import { useGetSettings } from "@workspace/api-client-react";
import { Link } from "wouter";

export function Footer() {
  const { data: settings } = useGetSettings();

  return (
    <footer className="border-t border-border mt-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
        <div className="p-6">
          <h3 className="mono text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">Location</h3>
          <p className="text-sm font-medium">{settings?.location || "Toronto, ON"}</p>
        </div>
        <div className="p-6">
          <h3 className="mono text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">Email</h3>
          <a
            href={`mailto:${settings?.email || ""}`}
            className="text-sm font-medium hover:text-accent transition-colors block truncate"
          >
            {settings?.email || "hello@example.com"}
          </a>
        </div>
        <div className="p-6">
          <h3 className="mono text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">Phone</h3>
          <a
            href={`tel:${settings?.phone?.replace(/\D/g, "") || ""}`}
            className="text-sm font-medium hover:text-accent transition-colors block"
          >
            {settings?.phone || "+1 (555) 000-0000"}
          </a>
        </div>
        <div className="p-6">
          <h3 className="mono text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">LinkedIn</h3>
          <a
            href={settings?.linkedin || "#"}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium hover:text-accent transition-colors block"
          >
            View Profile →
          </a>
        </div>
      </div>
      <div className="border-t border-border p-4 px-6 lg:px-8 flex items-center justify-between">
        <p className="mono text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {settings?.ownerName || "Uyen Ton"}. All rights reserved.
        </p>
        <Link
          href="/admin"
          className="mono text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          admin
        </Link>
      </div>
    </footer>
  );
}
