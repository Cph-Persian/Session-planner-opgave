"use client";

import { Container, Title, Text, Button, Stack, Group, Card, Grid } from "@mantine/core";
import { IconCalendar, IconUsers, IconSchool } from "@tabler/icons-react";
import Link from "next/link";
import { useRole } from "@/app/context/RoleContext";

export default function Home() {
  const { isTeacherLoggedIn } = useRole();

  return (
    <Container size="xl">
      <Stack gap="xl" py="xl">
        <Stack gap="md" align="center" ta="center">
          <Title order={1} size="3rem" fw={800} c="blue">
            Velkommen til Session Planner
          </Title>
          <Text size="lg" c="dimmed" maw={600}>
            Planlæg og del dine undervisningssessioner med studerende. 
            Lærere kan oprette sessioner, og studerende kan se dem alle på en overskuelig måde.
          </Text>
          <Group mt="md">
            <Button
              component={Link}
              href="/sessioner"
              size="lg"
              leftSection={<IconCalendar size={20} />}
            >
              Se alle sessioner
            </Button>
            {isTeacherLoggedIn && (
              <Button
                component={Link}
                href="/sessioner"
                variant="light"
                size="lg"
              >
                Opret session
              </Button>
            )}
          </Group>
        </Stack>

        <Grid mt="xl">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Stack gap="md">
                <IconCalendar size={48} color="var(--mantine-color-blue-6)" />
                <Title order={3}>Planlæg Sessioner</Title>
                <Text c="dimmed">
                  Lærere kan nemt oprette og administrere undervisningssessioner 
                  med alle relevante detaljer som tid, sted og beskrivelse.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Stack gap="md">
                <IconUsers size={48} color="var(--mantine-color-blue-6)" />
                <Title order={3}>Offentlig Tilgængelig</Title>
                <Text c="dimmed">
                  Studerende kan se alle sessioner uden at være logget ind. 
                  Alle relevante oplysninger er let tilgængelige.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
              <Stack gap="md">
                <IconSchool size={48} color="var(--mantine-color-blue-6)" />
                <Title order={3}>Real-time Opdateringer</Title>
                <Text c="dimmed">
                  Sessioner opdateres automatisk i realtid, så alle altid ser 
                  de seneste oplysninger.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}


