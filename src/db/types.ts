export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  date: string;               // yyyy-MM-dd the task is currently shown on
  time: string | null;        // HH:mm
  done: boolean;
  carriedFrom: string | null; // original date if rolled forward
  createdAt: number;
};

export type SessionStatus = 'completed' | 'broken';

export type Session = {
  id: string;
  date: string;
  goal: string;
  plannedMs: number;
  actualMs: number;
  status: SessionStatus;
  reason: string | null;
  startedAt: number;
};
