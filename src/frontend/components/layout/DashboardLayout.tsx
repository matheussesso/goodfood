"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Safe to read localStorage in the initializer: until the session check
  // resolves this component renders only a spinner, so the persisted layout
  // preference never causes a hydration mismatch in visible markup.
  const [layoutMode, setLayoutMode] = useState<"horizontal" | "vertical">(() => {
    if (typeof window === "undefined") return "horizontal";
    const saved = localStorage.getItem("goodfood_layout");
    return saved === "vertical" ? "vertical" : "horizontal";
  });
  const { isAuthenticated, isSessionResolved } = useAuth();
  const router = useRouter();

  const toggleLayout = () => {
    const newLayout = layoutMode === "horizontal" ? "vertical" : "horizontal";
    setLayoutMode(newLayout);
    localStorage.setItem("goodfood_layout", newLayout);
  };

  // Wait for the initial GET /me session check before deciding to redirect,
  // so a page refresh does not bounce authenticated users to /login.
  useEffect(() => {
    if (isSessionResolved && !isAuthenticated) {
      router.push("/login");
    }
  }, [isSessionResolved, isAuthenticated, router]);

  if (!isSessionResolved || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={layoutMode === "vertical" ? "flex min-h-screen bg-muted/30" : "min-h-screen bg-muted/30 flex flex-col"}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} layoutMode={layoutMode} />
      
      <div className="flex flex-1 flex-col">
        <Navbar 
          onMenuClick={() => setSidebarOpen(true)} 
          layoutMode={layoutMode} 
          toggleLayout={toggleLayout} 
        />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
