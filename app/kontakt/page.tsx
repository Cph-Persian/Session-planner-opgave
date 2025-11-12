"use client";

import { Container, Title, Text, Stack, Card, Group, Anchor } from "@mantine/core";
import { IconMail, IconPhone } from "@tabler/icons-react";

export default function Kontakt() {
  return (
    <Container size="xl">
      <Stack gap="xl" py="xl">
        <Title order={1}>Kontakt os</Title>
        
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text size="lg">
              Har du spørgsmål eller brug for hjælp? Kontakt os gerne!
            </Text>
            
            <Group gap="md" mt="md">
              <IconMail size={24} color="var(--mantine-color-blue-6)" />
              <div>
                <Text fw={600} size="sm">Email</Text>
                <Anchor href="mailto:support@sessionplanner.dk" size="sm">
                  support@sessionplanner.dk
                </Anchor>
              </div>
            </Group>

            <Group gap="md">
              <IconPhone size={24} color="var(--mantine-color-blue-6)" />
              <div>
                <Text fw={600} size="sm">Telefon</Text>
                <Text size="sm">+45 12 34 56 78</Text>
              </div>
            </Group>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}