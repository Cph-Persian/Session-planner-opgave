'use client';

import Link from "next/link";
import { useRole } from "@/app/context/RoleContext";
import { useState, useEffect } from "react";

export function ConditionalNavBar() {
  const { role } = useRole();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null;

  return (
    <header style={{ padding: "1rem", borderBottom: "1px solid #ddd" }}>
      <nav style={{ display: "flex", gap: "1rem" }}>
        <Link href="/">Home</Link>
        <Link href="/om">Om</Link>
        <Link href="/sessioner">Sessioner</Link>
        <Link href="/kontakt">Kontakt</Link>
        <Link href="/login">Login</Link>
        
        {/* Only show "Opret Session" link if user is a teacher and logged in */}
        {role === 'teacher' && (
          <Link href="/events/createevent">Opret Session</Link>
        )}
      </nav>
    </header>
  );
}
