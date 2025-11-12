"use client";

import { Container, Title, Text, Stack, Card } from "@mantine/core";

export default function About() {
  return (
    <Container size="xl">
      <Stack gap="xl" py="xl">
        <Title order={1}>Om Session Planner</Title>
        
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text size="lg">
              Session Planner er en moderne løsning til planlægning og deling af undervisningssessioner.
            </Text>
            <Text>
              Systemet er designet til at gøre det nemt for lærere at oprette og administrere sessioner,
              mens studerende kan se alle tilgængelige sessioner på en overskuelig måde.
            </Text>
            <Text>
              Alle sessioner er offentligt tilgængelige, så studerende ikke behøver at logge ind for at se dem.
              Lærere kan logge ind for at oprette nye sessioner med detaljer som titel, beskrivelse, tidspunkt og sted.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}