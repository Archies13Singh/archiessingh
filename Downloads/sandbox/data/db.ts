export interface User {
  id: number;
  username: string;
  passwordHash: string;
}

export interface Task {
  id: number;
  boardId: number;
  title: string;
  description?: string;
  status: "pending" | "completed";
  dueDate?: string;
  createdAt: string;
  userId: number;
  position?: number;
}

export interface Board {
  id: number;
  name: string;
  userId: number;
}

export const db = {
  users: [] as User[],
  boards: [] as Board[],
  tasks: [] as Task[],
};
