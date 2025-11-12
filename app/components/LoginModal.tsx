'use client';

import { useEffect, useState } from 'react';
import { useRole } from '@/app/context/RoleContext';
import { Button, Modal, Group, Stack, Text } from '@mantine/core';

export function LoginModal() {
  const { role, setRole } = useRole();
  const [opened, setOpened] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Only show modal on first load if no role is selected
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Show modal only if role is not set and page is hydrated
  useEffect(() => {
    if (isHydrated) {
      setOpened(!role); // Open if role is null, close if role is set
    }
  }, [role, isHydrated]);


  if (!isHydrated) return null;

  const handleStudentClick = () => {
    setRole('student');
    setOpened(false);
  };

  const handleTeacherClick = () => {
    setRole('teacher');
    setOpened(false);
    // Redirect to login page for teachers
    window.location.href = '/login';
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {}} // Don't allow closing without selecting
      title="Velkomst til Session Planner"
      centered
      withCloseButton={false}
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          Vælg din rolle for at fortsætte:
        </Text>
        <Group grow>
          <Button
            variant="light"
            size="md"
            onClick={handleStudentClick}
          >
            Jeg er Studerende
          </Button>
          <Button
            variant="filled"
            size="md"
            onClick={handleTeacherClick}
          >
            Jeg er Lærer
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
