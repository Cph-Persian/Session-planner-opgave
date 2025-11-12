"use client";

import "@mantine/dates/styles.css";
import { 
  Modal, 
  Button, 
  TextInput, 
  Textarea, 
  Stack, 
  Group,
  Loader
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { notifications } from "@mantine/notifications";
import { useRole } from "@/app/context/RoleContext";

interface CreateSessionModalProps {
  opened: boolean;
  onClose: () => void;
  onSessionCreated?: () => void;
}

export function CreateSessionModal({ opened, onClose, onSessionCreated }: CreateSessionModalProps) {
  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { isTeacherLoggedIn } = useRole();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setStartsAt(null);
    setEndsAt(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!startsAt || !endsAt || !title.trim()) {
      notifications.show({
        title: "Valideringsfejl",
        message: "Udfyld venligst titel, start- og sluttidspunkt",
        color: "red",
      });
      return;
    }

    if (startsAt >= endsAt) {
      notifications.show({
        title: "Valideringsfejl",
        message: "Sluttidspunktet skal være efter starttidspunktet",
        color: "red",
      });
      return;
    }

    setLoading(true);

    try {
      // Get current user email if logged in
      const { data: { user } } = await supabase.auth.getUser();
      const createdBy = user?.email || "Ukendt";

      const { error } = await supabase
        .from('sessions')
        .insert([
          { 
            starts_at: startsAt.toISOString(), 
            ends_at: endsAt.toISOString(), 
            title: title.trim(),
            description: description.trim() || null,
            location: location.trim() || null,
            created_by: createdBy,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error creating session:", error);
        notifications.show({
          title: "Fejl",
          message: `Kunne ikke oprette session: ${error.message}`,
          color: "red",
        });
        setLoading(false);
        return;
      }

      notifications.show({
        title: "Succes!",
        message: "Sessionen er blevet oprettet",
        color: "green",
      });

      resetForm();
      onClose();
      if (onSessionCreated) {
        onSessionCreated();
      }
    } catch (err: any) {
      console.error("Unexpected error:", err);
      notifications.show({
        title: "Fejl",
        message: "Der opstod en uventet fejl",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isTeacherLoggedIn) {
    return null;
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Opret ny session"
      size="lg"
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Titel"
            placeholder="F.eks. Front-end udvikling"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />

          <Textarea
            label="Beskrivelse"
            placeholder="Beskriv sessionens indhold..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            minRows={3}
          />

          <DateTimePicker
            label="Start dato/tid"
            placeholder="Vælg starttidspunkt"
            required
            value={startsAt ? startsAt.toISOString() : null}
            onChange={(value) => setStartsAt(value ? new Date(value) : null)}
            maxDate={endsAt || undefined}
            disabled={loading}
          />

          <DateTimePicker
            label="Slut dato/tid"
            placeholder="Vælg sluttidspunkt"
            required
            value={endsAt ? endsAt.toISOString() : null}
            onChange={(value) => setEndsAt(value ? new Date(value) : null)}
            minDate={startsAt || undefined}
            disabled={loading}
          />

          <TextInput
            label="Sted / Link"
            placeholder="F.eks. Lokale 101 eller https://zoom.us/..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
            >
              Annuller
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size="sm" mr="sm" />
                  Opretter...
                </>
              ) : (
                "Opret session"
              )}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

