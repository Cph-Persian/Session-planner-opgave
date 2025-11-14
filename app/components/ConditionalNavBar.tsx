'use client';

import Link from "next/link";
import { useRole } from "@/app/context/RoleContext";
import { useState, useEffect } from "react";
import { Container, Group, Button, Text, Box } from "@mantine/core";
import { usePathname } from "next/navigation";

export function ConditionalNavBar() {
  const { role, isTeacherLoggedIn, setRole, setIsTeacherLoggedIn } = useRole();
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null;

  const navLinks = [
    { href: "/", label: "Hjem" },
    { href: "/om", label: "Om" },
    { href: "/sessioner", label: "Sessioner" },
    { href: "/kontakt", label: "Kontakt" },
  ];

  return (
    <Box
      component="header"
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-3)",
        background: "var(--mantine-color-white)",
      }}
    >
      <Container size="xl">
        <Group justify="space-between" h={70} gap="md">
          <Text
            component={Link}
            href="/"
            fw={700}
            size="xl"
            c="blue"
            style={{ textDecoration: "none" }}
          >
            Session Planner
          </Text>

          <Group gap="xs">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                variant={pathname === link.href ? "light" : "subtle"}
                color={pathname === link.href ? "blue" : "gray"}
                size="sm"
              >
                {link.label}
              </Button>
            ))}

            {!isTeacherLoggedIn ? (
              <Button
                component={Link}
                href="/login"
                variant="light"
                color="blue"
                size="sm"
              >
                Lærer Login
              </Button>
            ) : (
              <Button
                variant="subtle"
                color="gray"
                size="sm"
                onClick={async () => {
                  const { supabase } = await import("@/app/lib/supabaseClient");
                  await supabase.auth.signOut();
                  // Clear role context
                  setRole(null);
                  setIsTeacherLoggedIn(false);
                  window.location.href = "/";
                }}
              >
                Logout
              </Button>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
