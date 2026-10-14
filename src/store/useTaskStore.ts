import { create } from 'zustand';
import * as db from '../db';
import type { Priority, Task } from '../db/types';
import { todayKey } from '../utils/dates';

export type TaskInput = {
  title: string;
  notes: string;
  priority: Priority;
  date: string;
  time: string | null;
};

type State = {
  tasks: Task[];
  loaded: boolean;
  load: () => Promise<void>;
  add: (input: TaskInput) => Promise<void>;
  update: (id: string, input: Partial<TaskInput>) => Promise<void>;
  toggle: (id: string) => Promise<boolean>; // returns new done value
  remove: (id: string) => Promise<void>;
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const useTaskStore = create<State>((set, get) => ({
  tasks: [],
  loaded: false,

  load: async () => {
    await db.rollForward(todayKey());
    set({ tasks: await db.getAllTasks(), loaded: true });
  },

  add: async (input) => {
    const task: Task = { id: uid(), ...input, done: false, carriedFrom: null, createdAt: Date.now() };
    set({ tasks: [...get().tasks, task] });
    await db.upsertTask(task);
  },

  update: async (id, input) => {
    const cur = get().tasks.find((t) => t.id === id);
    if (!cur) return;
    // moving to another date clears the "carried over" label
    const moved = input.date && input.date !== cur.date;
    const next: Task = { ...cur, ...input, carriedFrom: moved ? null : cur.carriedFrom };
    set({ tasks: get().tasks.map((t) => (t.id === id ? next : t)) });
    await db.upsertTask(next);
  },

  toggle: async (id) => {
    const cur = get().tasks.find((t) => t.id === id);
    if (!cur) return false;
    const next = { ...cur, done: !cur.done };
    set({ tasks: get().tasks.map((t) => (t.id === id ? next : t)) });
    await db.upsertTask(next);
    return next.done;
  },

  remove: async (id) => {
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
    await db.deleteTask(id);
  },
}));
