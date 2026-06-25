"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login page initially
    router.push("/login");
  }, [router]);

  return null;
}
