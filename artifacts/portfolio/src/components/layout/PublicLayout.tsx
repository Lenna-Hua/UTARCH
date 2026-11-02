import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * PublicLayout frames the public portfolio pages with a consistent architectural border
 * and ensures an intentional side gap of at least 60px to 100px on desktop screens
 * (scaled gracefully on tablet and mobile).
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-[100dvh] bg-background w-full flex flex-col">
      {/* Outer side gap wrapper: at least 60px to 100px from the web browser edges on desktop */}
      <div className="w-full px-4 sm:px-8 md:px-[60px] lg:px-[80px] xl:px-[100px] flex-1 flex flex-col">
        {/* Architectural drafting frame with red boundary borders */}
        <div className="w-full max-w-screen-2xl mx-auto flex-1 flex flex-col border-x border-border bg-background">
          <Navbar />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}
