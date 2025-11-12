'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { useRole } from "@/app/context/RoleContext";
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Alert,
  Box,
  Center,
  Loader,
} from "@mantine/core";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const { setRole, setIsTeacherLoggedIn } = useRole();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Login fejlet: ${error.message}`);
      setIsError(true);
      setLoading(false);
      return;
    }

    const accessToken = data.session?.access_token;
    console.log("Access token (JWT) from Supabase:", accessToken);

    setRole("teacher");
    setIsTeacherLoggedIn(true);

    setMessage("✓ Login vellykket! Omdirigerer...");
    setIsError(false);

    setTimeout(() => {
      router.push("/");
    }, 1500);
  }

  return (
    <Box style={{ minHeight: "100vh", display: "flex", alignItems: "center" }} bg="gray.0" py={40}>
      <Container size={420}>
        <Center mb="xl">
          <Title order={2} fw={700}>
            Lærer Login
          </Title>
        </Center>

        <Paper radius="md" p="xl" withBorder>
          <Stack gap="lg">
            <Text size="sm" ta="center" c="dimmed">
              Log ind med dine Supabase-legitimationsoplysninger for at få adgang til lærer-funktioner
            </Text>

            <form onSubmit={handleLogin}>
              <Stack gap="md">
                <TextInput
                  label="E-mail"
                  placeholder="din@email.dk"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />

                <PasswordInput
                  label="Adgangskode"
                  placeholder="Din adgangskode"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />

                {message && (
                  <Alert
                    color={isError ? "red" : "green"}
                    title={isError ? "Fejl" : "Succes"}
                  >
                    {message}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  onClick={handleLogin}
                >
                  {loading ? (
                    <>
                      <Loader size="sm" mr="sm" />
                      Logger ind...
                    </>
                  ) : (
                    "Log ind"
                  )}
                </Button>
              </Stack>
            </form>

            <Center>
              <Text size="sm" c="dimmed">
                Ikke lærer?{" "}
                <Text
                  component="button"
                  onClick={() => router.push("/")}
                  c="blue"
                  td="underline"
                  style={{ cursor: "pointer", border: "none", background: "none", padding: 0 }}
                >
                  Gå tilbage
                </Text>
              </Text>
            </Center>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}