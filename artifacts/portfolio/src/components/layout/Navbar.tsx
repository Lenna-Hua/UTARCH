import { Link, useLocation } from "wouter";
import { useGetSettings } from "@workspace/api-client-react";

export function Navbar() {
  const { data: settings } = useGetSettings();
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Work" },
    { href: "/posts", label: "Notes" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border w-full">
      <div className="flex h-14 items-center px-6 lg:px-8 w-full">
        <Link href="/" className="font-bold tracking-tight text-primary uppercase text-lg shrink-0 hover:opacity-70 transition-opacity">
          {settings?.ownerName || "UYEN TON"}
        </Link>
        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center">
            {links.map((link) => {
              const active = link.href === "/"
                ? location === "/"
                : location.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors border-l border-border pl-6 ml-6 mono uppercase tracking-widest
                    ${active ? "text-primary" : "hover:text-primary text-foreground"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
