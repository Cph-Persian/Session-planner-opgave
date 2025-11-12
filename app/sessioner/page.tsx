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
import { IconCalendar, IconClock, IconMapPin, IconUser, IconPlus, IconTrash } from "@tabler/icons-react";
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
}

export default function Sessioner() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [detailsModalOpened, setDetailsModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [deleting, setDeleting] = useState(false);
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
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--mantine-shadow-md)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "var(--mantine-shadow-sm)";
                }}
                onClick={() => handleSessionClick(session)}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Title order={4} lineClamp={2} style={{ flex: 1 }}>
                      {session.title}
                    </Title>
                    <Group gap="xs">
                      {isUpcoming(session.starts_at) && (
                        <Badge color="blue" variant="light">
                          Kommende
                        </Badge>
                      )}
                      {canDeleteSession(session) && (
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
                      )}
                    </Group>
                  </Group>

                  {session.description && (
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {session.description}
                    </Text>
                  )}

                  <Divider />

                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconCalendar size={16} style={{ color: "var(--mantine-color-gray-6)" }} />
                      <Text size="sm">
                        {formatDateTime(session.starts_at)}
                      </Text>
                    </Group>

                    <Group gap="xs">
                      <IconClock size={16} style={{ color: "var(--mantine-color-gray-6)" }} />
                      <Text size="sm">
                        {formatTime(session.starts_at)} - {formatTime(session.ends_at)}
                      </Text>
                    </Group>

                    {session.location && (
                      <Group gap="xs">
                        <IconMapPin size={16} style={{ color: "var(--mantine-color-gray-6)" }} />
                        <Text size="sm" lineClamp={1}>
                          {session.location.startsWith("http") ? (
                            <Anchor href={session.location} target="_blank" size="sm">
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
                        <IconUser size={16} style={{ color: "var(--mantine-color-gray-6)" }} />
                        <Text size="sm" c="dimmed">
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
        title={selectedSession?.title}
        size="lg"
        centered
      >
        {selectedSession && (
          <Stack gap="md">
            {selectedSession.description && (
              <>
                <div>
                  <Text fw={600} size="sm" mb="xs">Beskrivelse</Text>
                  <Text>{selectedSession.description}</Text>
                </div>
                <Divider />
              </>
            )}

            <Group gap="md">
              <Box>
                <Text fw={600} size="sm" mb="xs">Start</Text>
                <Text size="sm">{formatDateTime(selectedSession.starts_at)}</Text>
              </Box>
              <Box>
                <Text fw={600} size="sm" mb="xs">Slut</Text>
                <Text size="sm">{formatDateTime(selectedSession.ends_at)}</Text>
              </Box>
            </Group>

            {selectedSession.location && (
              <>
                <Divider />
                <div>
                  <Text fw={600} size="sm" mb="xs">Sted</Text>
                  {selectedSession.location.startsWith("http") ? (
                    <Anchor href={selectedSession.location} target="_blank">
                      {selectedSession.location}
                    </Anchor>
                  ) : (
                    <Text>{selectedSession.location}</Text>
                  )}
                </div>
              </>
            )}

            {selectedSession.created_by && (
              <>
                <Divider />
                <div>
                  <Text fw={600} size="sm" mb="xs">Oprettet af</Text>
                  <Text size="sm" c="dimmed">{selectedSession.created_by}</Text>
                </div>
              </>
            )}

            {canDeleteSession(selectedSession) && (
              <>
                <Divider />
                <Group justify="flex-end">
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
              Denne handling kan ikke fortrydes.
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
