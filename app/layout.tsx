// app/layout.tsx
import "./globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { RoleProvider } from "@/app/context/RoleContext";
import { LoginModal } from "@/app/components/LoginModal";
import { ConditionalNavBar } from "./components/ConditionalNavBar";

const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: "md",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headings: {
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
});

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
    <html lang="da">
      <head>
        <link rel="icon" href="/favicon.png"  />
      </head>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh", margin: 0 }}>
        <MantineProvider theme={theme}>
          <Notifications position="top-right" />
          <RoleProvider>
            <ConditionalNavBar />
            <LoginModal />
            <main style={{ padding: "2rem", flex: 1, maxWidth: "1400px", width: "100%", margin: "0 auto" }}>
              {children}
            </main>

            <footer style={{ 
              background: "var(--mantine-color-gray-0)", 
              textAlign: "center", 
              fontSize: "0.875rem", 
              padding: "2rem", 
              color: "var(--mantine-color-gray-6)",
              marginTop: "auto"
            }}>
              © {new Date().getFullYear()} Session Planner · All rights reserved
            </footer>
          </RoleProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
