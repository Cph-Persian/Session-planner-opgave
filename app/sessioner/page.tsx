"use client";

import { useState, useEffect } from "react";
import { 
  Container, 
  Title, 
  Grid, 
  Card, 
  Text, 
  Group, 
  Badge, 
  Stack, 
  Button,
  Loader,
  Center,
  Modal,
  Divider,
  Anchor,
  Box,
  ActionIcon,
  Tooltip
} from "@mantine/core";
import { IconCalendar, IconClock, IconMapPin, IconUser, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { supabase } from "@/app/lib/supabaseClient";
import { useRole } from "@/app/context/RoleContext";
import { CreateSessionModal } from "@/app/components/CreateSessionModal";
import { notifications } from "@mantine/notifications";
import dayjs from "dayjs";
import "dayjs/locale/da";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("da");

interface Session {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  created_by: string | null;
  created_at: string;
  is_cancelled?: boolean;
}

export default function Sessioner() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [detailsModalOpened, setDetailsModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [cancelModalOpened, setCancelModalOpened] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const { isTeacherLoggedIn } = useRole();

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('starts_at', { ascending: true });

      if (error) {
        console.error("Error fetching sessions:", error);
        return;
      }

      setSessions(data || []);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    // Set up real-time subscription
    const channel = supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          // Refetch sessions when any change occurs
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get current user email when login status changes
  useEffect(() => {
    const getCurrentUser = async () => {
      if (isTeacherLoggedIn) {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserEmail(user?.email || null);
      } else {
        setCurrentUserEmail(null);
      }
    };
    getCurrentUser();
  }, [isTeacherLoggedIn]);

  const formatDateTime = (dateString: string) => {
    return dayjs(dateString).format("DD. MMM YYYY [kl.] HH:mm");
  };

  const formatTime = (dateString: string) => {
    return dayjs(dateString).format("HH:mm");
  };

  const isUpcoming = (dateString: string) => {
    return dayjs(dateString).isAfter(dayjs());
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setDetailsModalOpened(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation(); // Prevent card click
    setSessionToDelete(session);
    setDeleteModalOpened(true);
  };

  const handleCancelClick = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation(); // Prevent card click
    setSessionToCancel(session);
    setCancelModalOpened(true);
  };

  const handleCancelConfirm = async () => {
    if (!sessionToCancel) return;

    setCancelling(true);
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Auth error:", authError);
        notifications.show({
          title: "Fejl",
          message: "Du skal være logget ind for at aflyse sessioner",
          color: "red",
        });
        setCancelling(false);
        return;
      }

      // Use API route with service role to bypass RLS
      const response = await fetch('/api/sessions', {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionToCancel.id,
          is_cancelled: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Cancel error:", result);
        notifications.show({
          title: "Fejl",
          message: `Kunne ikke aflyse session: ${result.error || "Ukendt fejl"}`,
          color: "red",
        });
        setCancelling(false);
        return;
      }

      console.log("Session cancelled successfully:", result);

      notifications.show({
        title: "Succes!",
        message: "Sessionen er blevet aflyst",
        color: "orange",
      });

      setCancelModalOpened(false);
      setSessionToCancel(null);
      
      // Close details modal if open
      if (selectedSession?.id === sessionToCancel.id) {
        setDetailsModalOpened(false);
        setSelectedSession(null);
      }
      
      // Force refresh the list
      await fetchSessions();
      
      // Also update local state immediately for better UX
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionToCancel.id 
            ? { ...session, is_cancelled: true }
            : session
        )
      );
    } catch (err: any) {
      console.error("Unexpected error:", err);
      notifications.show({
        title: "Fejl",
        message: `Der opstod en uventet fejl: ${err.message || "Ukendt fejl"}`,
        color: "red",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;

    setDeleting(true);
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Auth error:", authError);
        notifications.show({
          title: "Fejl",
          message: "Du skal være logget ind for at slette sessioner",
          color: "red",
        });
        setDeleting(false);
        return;
      }

      console.log("Attempting to delete session:", sessionToDelete.id);
      console.log("Current user:", user.email);

      // Use API route with service role to bypass RLS
      const response = await fetch(`/api/sessions?id=${sessionToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Delete error:", result);
        notifications.show({
          title: "Fejl",
          message: `Kunne ikke slette session: ${result.error || "Ukendt fejl"}`,
          color: "red",
        });
        setDeleting(false);
        return;
      }

      console.log("Session deleted successfully:", result);

      notifications.show({
        title: "Succes!",
        message: "Sessionen er blevet slettet",
        color: "green",
      });

      setDeleteModalOpened(false);
      setSessionToDelete(null);
      
      // Force refresh the list
      await fetchSessions();
    } catch (err: any) {
      console.error("Unexpected error:", err);
      notifications.show({
        title: "Fejl",
        message: `Der opstod en uventet fejl: ${err.message || "Ukendt fejl"}`,
        color: "red",
      });
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteSession = (session: Session) => {
    if (!isTeacherLoggedIn || !currentUserEmail) {
      return false;
    }
    
    // If created_by is not set, allow deletion if user is logged in as teacher
    if (!session.created_by) {
      return true;
    }
    
    // Compare emails (case-insensitive, trimmed)
    return session.created_by.toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
  };

  if (loading) {
    return (
      <Container size="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">Henter sessioner...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <div>
          <Title order={1} mb="xs">Sessioner</Title>
          <Text c="dimmed" size="sm">
            {sessions.length} {sessions.length === 1 ? "session" : "sessioner"} fundet
          </Text>
        </div>
        {isTeacherLoggedIn && (
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => setModalOpened(true)}
          >
            Opret Session
          </Button>
        )}
      </Group>

      {sessions.length === 0 ? (
        <Card p="xl" radius="md" withBorder>
          <Center py="xl">
            <Stack align="center" gap="md">
              <Text size="lg" c="dimmed" ta="center">
                Ingen sessioner fundet
              </Text>
              {isTeacherLoggedIn && (
                <Button onClick={() => setModalOpened(true)}>
                  Opret din første session
                </Button>
              )}
            </Stack>
          </Center>
        </Card>
      ) : (
        <Grid>
          {sessions.map((session) => (
            <Grid.Col key={session.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card
                shadow="sm"
                padding="lg"
                radius="md"
                withBorder
                style={{ 
                  height: "100%",
                  cursor: session.is_cancelled ? "not-allowed" : "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  opacity: session.is_cancelled ? 0.6 : 1,
                  borderColor: session.is_cancelled ? "var(--mantine-color-red-4)" : undefined,
                  backgroundColor: session.is_cancelled ? "var(--mantine-color-gray-1)" : undefined,
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!session.is_cancelled) {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--mantine-shadow-md)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--mantine-shadow-sm)";
                }}
                onClick={() => handleSessionClick(session)}
              >
                {session.is_cancelled && (
                  <Box
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "linear-gradient(135deg, rgba(255,0,0,0.05) 0%, rgba(255,0,0,0.1) 100%)",
                      pointerEvents: "none",
                      zIndex: 1,
                    }}
                  />
                )}
                <Stack gap="sm" style={{ position: "relative", zIndex: 2 }}>
                  <Group justify="space-between" align="flex-start">
                    <Title 
                      order={4} 
                      lineClamp={2} 
                      style={{ 
                        flex: 1,
                        textDecoration: session.is_cancelled ? "line-through" : "none",
                        color: session.is_cancelled ? "var(--mantine-color-gray-6)" : undefined,
                      }}
                    >
                      {session.title}
                    </Title>
                    <Group gap="xs">
                      {session.is_cancelled ? (
                        <Badge color="red" variant="filled" size="lg">
                          Aflyst
                        </Badge>
                      ) : isUpcoming(session.starts_at) && (
                        <Badge color="blue" variant="light">
                          Kommende
                        </Badge>
                      )}
                      {canDeleteSession(session) && !session.is_cancelled && (
                        <>
                          <Tooltip label="Aflys session">
                            <ActionIcon
                              color="orange"
                              variant="light"
                              size="sm"
                              onClick={(e) => handleCancelClick(e, session)}
                              style={{ cursor: "pointer" }}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Slet session">
                            <ActionIcon
                              color="red"
                              variant="light"
                              size="sm"
                              onClick={(e) => handleDeleteClick(e, session)}
                              style={{ cursor: "pointer" }}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      )}
                    </Group>
                  </Group>

                  {session.description && (
                    <Text 
                      size="sm" 
                      c={session.is_cancelled ? "dimmed" : "dimmed"} 
                      lineClamp={2}
                      style={{
                        opacity: session.is_cancelled ? 0.7 : 1,
                      }}
                    >
                      {session.description}
                    </Text>
                  )}

                  <Divider />

                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconCalendar size={16} style={{ 
                        color: session.is_cancelled ? "var(--mantine-color-gray-4)" : "var(--mantine-color-gray-6)" 
                      }} />
                      <Text 
                        size="sm"
                        style={{
                          opacity: session.is_cancelled ? 0.6 : 1,
                          color: session.is_cancelled ? "var(--mantine-color-gray-6)" : undefined,
                        }}
                      >
                        {formatDateTime(session.starts_at)}
                      </Text>
                    </Group>

                    <Group gap="xs">
                      <IconClock size={16} style={{ 
                        color: session.is_cancelled ? "var(--mantine-color-gray-4)" : "var(--mantine-color-gray-6)" 
                      }} />
                      <Text 
                        size="sm"
                        style={{
                          opacity: session.is_cancelled ? 0.6 : 1,
                          color: session.is_cancelled ? "var(--mantine-color-gray-6)" : undefined,
                        }}
                      >
                        {formatTime(session.starts_at)} - {formatTime(session.ends_at)}
                      </Text>
                    </Group>

                    {session.location && (
                      <Group gap="xs">
                        <IconMapPin size={16} style={{ 
                          color: session.is_cancelled ? "var(--mantine-color-gray-4)" : "var(--mantine-color-gray-6)" 
                        }} />
                        <Text 
                          size="sm" 
                          lineClamp={1}
                          style={{
                            opacity: session.is_cancelled ? 0.6 : 1,
                            color: session.is_cancelled ? "var(--mantine-color-gray-6)" : undefined,
                          }}
                        >
                          {session.location.startsWith("http") ? (
                            <Anchor 
                              href={session.location} 
                              target="_blank" 
                              size="sm"
                              style={{
                                pointerEvents: session.is_cancelled ? "none" : "auto",
                                opacity: session.is_cancelled ? 0.6 : 1,
                              }}
                            >
                              Online link
                            </Anchor>
                          ) : (
                            session.location
                          )}
                        </Text>
                      </Group>
                    )}

                    {session.created_by && (
                      <Group gap="xs">
                        <IconUser size={16} style={{ 
                          color: session.is_cancelled ? "var(--mantine-color-gray-4)" : "var(--mantine-color-gray-6)" 
                        }} />
                        <Text 
                          size="sm" 
                          c="dimmed"
                          style={{
                            opacity: session.is_cancelled ? 0.6 : 1,
                          }}
                        >
                          {session.created_by}
                        </Text>
                      </Group>
                    )}
                  </Stack>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      <CreateSessionModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSessionCreated={fetchSessions}
      />

      {/* Session Details Modal */}
      <Modal
        opened={detailsModalOpened}
        onClose={() => setDetailsModalOpened(false)}
        title={
          <Group gap="md" align="center">
            <Text>{selectedSession?.title}</Text>
            {selectedSession?.is_cancelled && (
              <Badge color="red" variant="filled">
                Aflyst
              </Badge>
            )}
          </Group>
        }
        size="lg"
        centered
      >
        {selectedSession && (
          <Stack gap="md">
            {selectedSession.is_cancelled && (
              <>
                <Box
                  p="md"
                  style={{
                    backgroundColor: "var(--mantine-color-red-0)",
                    border: "1px solid var(--mantine-color-red-3)",
                    borderRadius: "var(--mantine-radius-md)",
                  }}
                >
                  <Group gap="sm">
                    <IconX size={24} color="var(--mantine-color-red-6)" />
                    <div>
                      <Text fw={600} c="red" size="sm">Denne session er aflyst</Text>
                      <Text size="xs" c="dimmed">Sessionen er ikke længere tilgængelig</Text>
                    </div>
                  </Group>
                </Box>
                <Divider />
              </>
            )}

            {selectedSession.description && (
              <>
                <div>
                  <Text fw={600} size="sm" mb="xs">Beskrivelse</Text>
                  <Text 
                    style={{
                      opacity: selectedSession.is_cancelled ? 0.7 : 1,
                      textDecoration: selectedSession.is_cancelled ? "line-through" : "none",
                    }}
                  >
                    {selectedSession.description}
                  </Text>
                </div>
                <Divider />
              </>
            )}

            <Group gap="md">
              <Box>
                <Text fw={600} size="sm" mb="xs">Start</Text>
                <Text 
                  size="sm"
                  style={{
                    opacity: selectedSession.is_cancelled ? 0.7 : 1,
                    textDecoration: selectedSession.is_cancelled ? "line-through" : "none",
                  }}
                >
                  {formatDateTime(selectedSession.starts_at)}
                </Text>
              </Box>
              <Box>
                <Text fw={600} size="sm" mb="xs">Slut</Text>
                <Text 
                  size="sm"
                  style={{
                    opacity: selectedSession.is_cancelled ? 0.7 : 1,
                    textDecoration: selectedSession.is_cancelled ? "line-through" : "none",
                  }}
                >
                  {formatDateTime(selectedSession.ends_at)}
                </Text>
              </Box>
            </Group>

            {selectedSession.location && (
              <>
                <Divider />
                <div>
                  <Text fw={600} size="sm" mb="xs">Sted</Text>
                  {selectedSession.location.startsWith("http") ? (
                    <Anchor 
                      href={selectedSession.location} 
                      target="_blank"
                      style={{
                        pointerEvents: selectedSession.is_cancelled ? "none" : "auto",
                        opacity: selectedSession.is_cancelled ? 0.7 : 1,
                        textDecoration: selectedSession.is_cancelled ? "line-through" : "none",
                      }}
                    >
                      {selectedSession.location}
                    </Anchor>
                  ) : (
                    <Text
                      style={{
                        opacity: selectedSession.is_cancelled ? 0.7 : 1,
                        textDecoration: selectedSession.is_cancelled ? "line-through" : "none",
                      }}
                    >
                      {selectedSession.location}
                    </Text>
                  )}
                </div>
              </>
            )}

            {selectedSession.created_by && (
              <>
                <Divider />
                <div>
                  <Text fw={600} size="sm" mb="xs">Oprettet af</Text>
                  <Text 
                    size="sm" 
                    c="dimmed"
                    style={{
                      opacity: selectedSession.is_cancelled ? 0.7 : 1,
                    }}
                  >
                    {selectedSession.created_by}
                  </Text>
                </div>
              </>
            )}

            {canDeleteSession(selectedSession) && !selectedSession.is_cancelled && (
              <>
                <Divider />
                <Group justify="flex-end">
                  <Button
                    color="orange"
                    variant="light"
                    leftSection={<IconX size={16} />}
                    onClick={() => {
                      setDetailsModalOpened(false);
                      setSessionToCancel(selectedSession);
                      setCancelModalOpened(true);
                    }}
                  >
                    Aflys session
                  </Button>
                  <Button
                    color="red"
                    variant="light"
                    leftSection={<IconTrash size={16} />}
                    onClick={() => {
                      setDetailsModalOpened(false);
                      setSessionToDelete(selectedSession);
                      setDeleteModalOpened(true);
                    }}
                  >
                    Slet session
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        )}
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        opened={cancelModalOpened}
        onClose={() => {
          setCancelModalOpened(false);
          setSessionToCancel(null);
        }}
        title="Bekræft aflysning"
        centered
      >
        {sessionToCancel && (
          <Stack gap="md">
            <Text>
              Er du sikker på, at du vil aflyse sessionen <strong>"{sessionToCancel.title}"</strong>?
            </Text>
            <Text size="sm" c="dimmed">
              Sessionen vil blive markeret som aflyst, men forblive i systemet. Du kan stadig slette den senere hvis nødvendigt.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setCancelModalOpened(false);
                  setSessionToCancel(null);
                }}
                disabled={cancelling}
              >
                Annuller
              </Button>
              <Button
                color="orange"
                onClick={handleCancelConfirm}
                disabled={cancelling}
                leftSection={cancelling ? <Loader size="sm" /> : <IconX size={16} />}
              >
                {cancelling ? "Aflyser..." : "Aflys session"}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          setDeleteModalOpened(false);
          setSessionToDelete(null);
        }}
        title="Bekræft sletning"
        centered
      >
        {sessionToDelete && (
          <Stack gap="md">
            <Text>
              Er du sikker på, at du vil slette sessionen <strong>"{sessionToDelete.title}"</strong>?
            </Text>
            <Text size="sm" c="dimmed">
              Denne handling kan ikke fortrydes. Sessionen vil blive permanent slettet fra databasen.
            </Text>
            <Group justify="flex-end" mt="md">
              <Button
                variant="subtle"
                onClick={() => {
                  setDeleteModalOpened(false);
                  setSessionToDelete(null);
                }}
                disabled={deleting}
              >
                Annuller
              </Button>
              <Button
                color="red"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                leftSection={deleting ? <Loader size="sm" /> : <IconTrash size={16} />}
              >
                {deleting ? "Sletter..." : "Slet session"}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
}
