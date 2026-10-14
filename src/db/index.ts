// Native (Android/iOS) storage backed by expo-sqlite.
import * as SQLite from 'expo-sqlite';
import type { Session, Task } from './types';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('focusday.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY NOT NULL, title TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
          priority TEXT NOT NULL DEFAULT 'medium', date TEXT NOT NULL, time TEXT,
          done INTEGER NOT NULL DEFAULT 0, carriedFrom TEXT, createdAt INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY NOT NULL, date TEXT NOT NULL, goal TEXT NOT NULL,
          plannedMs INTEGER NOT NULL, actualMs INTEGER NOT NULL, status TEXT NOT NULL,
          reason TEXT, startedAt INTEGER NOT NULL
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

const rowToTask = (r: any): Task => ({ ...r, done: !!r.done });

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDb();
  return (await db.getAllAsync<any>('SELECT * FROM tasks ORDER BY createdAt')).map(rowToTask);
}

export async function upsertTask(t: Task) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO tasks (id,title,notes,priority,date,time,done,carriedFrom,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [t.id, t.title, t.notes, t.priority, t.date, t.time, t.done ? 1 : 0, t.carriedFrom, t.createdAt],
  );
}

export async function deleteTask(id: string) {
  const db = await getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function rollForward(today: string): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    `UPDATE tasks SET carriedFrom = COALESCE(carriedFrom, date), date = ? WHERE done = 0 AND date < ?`,
    [today, today],
  );
  return res.changes;
}

export async function getSessions(): Promise<Session[]> {
  const db = await getDb();
  return db.getAllAsync<Session>('SELECT * FROM sessions ORDER BY startedAt DESC');
}

export async function addSession(s: Session) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO sessions (id,date,goal,plannedMs,actualMs,status,reason,startedAt)
     VALUES (?,?,?,?,?,?,?,?)`,
    [s.id, s.date, s.goal, s.plannedMs, s.actualMs, s.status, s.reason, s.startedAt],
  );
}

export async function clearSessions() {
  const db = await getDb();
  await db.runAsync('DELETE FROM sessions');
}
