"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"horizontal" | "vertical">("horizontal");
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedLayout = localStorage.getItem("goodfood_layout");
    if (savedLayout === "horizontal" || savedLayout === "vertical") {
      setLayoutMode(savedLayout);
    }
  }, []);

  const toggleLayout = () => {
    const newLayout = layoutMode === "horizontal" ? "vertical" : "horizontal";
    setLayoutMode(newLayout);
    localStorage.setItem("goodfood_layout", newLayout);
  };

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [isMounted, isAuthenticated, router]);

  if (!isMounted || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={layoutMode === "vertical" ? "flex min-h-screen bg-muted/30" : "min-h-screen bg-muted/30 flex flex-col"}>
      {layoutMode === "vertical" && (
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      )}
      
      <div className={layoutMode === "vertical" ? "flex flex-1 flex-col overflow-hidden" : "flex flex-1 flex-col"}>
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
