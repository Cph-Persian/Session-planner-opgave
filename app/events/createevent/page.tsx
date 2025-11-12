"use client";

import "@mantine/dates/styles.css";
import { Button, Text, TextInput } from "@mantine/core";

import { DateTimePicker } from "@mantine/dates";

import { useState } from "react";
import classes from './ContainedInput.module.css';
import { supabase } from "@/app/lib/supabaseClient";
export default function CreateEventForm() {
  const date = new Date();

  const [startsAt, setStartsAt] = useState<Date | null>(null);
  const [endsAt, setEndsAt] = useState<Date | null>(null);
  const [title, setTitle] = useState<string>("");


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!startsAt || !endsAt) return;

  
    // Insert new session into Supabase

  const {data, error} = await supabase
      .from('sessions')
      .insert([
        { starts_at: startsAt.toISOString(), 
          ends_at: endsAt.toISOString(), 
          title: title },
      ])
      .select()
      .single();

      if (error) {
        console.log(error);
      } else {
        console.log(data);
      }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Text size="xl" fw={700} mb="md">
        Opret ny session!
      </Text>

      <TextInput 
      label="Session Titel" 
      placeholder="Front-end" 
      classNames={classes} 
      style={{ width: "180px" }}
      onChange={(e) => setTitle(e.target.value)} value={title}
      />

      <DateTimePicker
        style={{ width: "180px" }}
        label="Start dato/tid"
        maxDate={endsAt ? endsAt : undefined}
        value={startsAt ? startsAt.toISOString() : null} // or your preferred format
        onChange={(value) => {setStartsAt(value ? new Date(value) : null);}}
      />

      <DateTimePicker
        style={{ width: "180px" }}
        label="Slut dato/tid"
        minDate={startsAt ? startsAt : undefined}
        value={endsAt ? endsAt.toISOString() : null} // or your preferred format
        onChange={(value) => {setEndsAt(value ? new Date(value) : null);}}
      />

      <Button className="mt-4" type="submit" variant="filled">
        Opret session!
      </Button>
    </form>
  );
}
