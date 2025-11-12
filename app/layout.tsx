// app/layout.tsx
import "./globals.css";
import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { RoleProvider } from "@/app/context/RoleContext";
import { LoginModal } from "@/app/components/LoginModal";
import { ConditionalNavBar } from "./components/ConditionalNavBar";


export const metadata = {
  title: "Session Planner",
  // point Next.js metadata to the favicon in `public/favicon.ico`
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png"  />
      </head>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <MantineProvider>
          <RoleProvider>
            <ConditionalNavBar />
            <LoginModal />
            <main style={{ padding: "1rem", flex: 1 }}>{children}</main>

            <footer className="bg-slate-100 text-center text-sm py-20 text-slate-500">
              © {new Date().getFullYear()} Session Planner · All rights reserved
            </footer>
          </RoleProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
