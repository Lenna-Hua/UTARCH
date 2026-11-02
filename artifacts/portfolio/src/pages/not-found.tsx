import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <Card className="w-full max-w-md mx-4 border-border">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-3 items-center">
              <AlertCircle className="h-7 w-7 text-primary shrink-0" />
              <h1 className="text-xl font-bold text-primary mono uppercase tracking-tight">404 Page Not Found</h1>
            </div>

            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              The requested page could not be located on this portfolio.
            </p>

            <div className="mt-6">
              <Link href="/" className="mono text-xs uppercase tracking-widest text-primary font-bold inline-flex items-center gap-2 hover:underline">
                <ArrowLeft className="w-4 h-4" /> Return to Archive
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
