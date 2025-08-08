import { db, Task } from "@/data/db";
import { verify } from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";

function verifyToken(token: string | undefined): { id: number } | null {
  if (!token) return null;
  try {
    const decoded = verify(token, process.env.NEXT_PUBLIC_SECRET_TOKEN as string) as { id: number };
    return decoded;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(" ")[1];
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const { boardId } = req.query;
    if (!boardId) return res.status(400).json({ error: "Board ID required" });
    const tasks = db.tasks.filter(
      (task) => task.boardId === Number(boardId) && task.userId === user.id
    );
    return res.status(200).json({ tasks });
  }

  if (req.method === "POST") {
    const { boardId, title, description, status, dueDate } = req.body;
    if (!boardId || !title) return res.status(400).json({ error: "Board ID and title required" });
    // Find max position in this board for this user
    const maxPos = Math.max(0, ...db.tasks.filter(t => t.boardId === Number(boardId) && t.userId === user.id).map((t: Task & { position?: number }) => t.position || 0));
    const newTask: Task & { position: number } = {
      id: Date.now(),
      boardId: Number(boardId),
      title,
      description: description || "",
      status: status || "pending",
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      userId: user.id,
      position: maxPos + 1,
    };
    db.tasks.push(newTask);
    return res.status(201).json({ task: newTask });
  }

  if (req.method === "PUT") {
    const { id, title, description, status, dueDate, position, boardId } = req.body;
    if (!id) return res.status(400).json({ error: "Task ID required" });
    const task = db.tasks.find((t) => t.id === Number(id) && t.userId === user.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (position !== undefined && "position" in task) (task as Task).position = position;
    if (boardId !== undefined) task.boardId = Number(boardId);
    return res.status(200).json({ task });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Task ID required" });
    const idx = db.tasks.findIndex((t) => t.id === Number(id) && t.userId === user.id);
    if (idx === -1) return res.status(404).json({ error: "Task not found" });
    db.tasks.splice(idx, 1);
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
