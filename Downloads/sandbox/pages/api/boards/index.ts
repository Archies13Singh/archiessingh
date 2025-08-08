import { db } from "@/data/db"; // in-memory db
import { verify } from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";

function verifyToken(token: string | undefined): any {
  if (!token) {
    return null;
  }
  try {
    const decoded = verify(token, process.env.NEXT_PUBLIC_SECRET_TOKEN);
    return decoded;
  } catch (err) {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.split(" ")[1];
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Use user.userId from JWT, not user.id
  const userId = user.userId;

  if (req.method === "GET") {
    const userBoards = db.boards.filter((board) => board.userId === userId);
    return res.status(200).json({
      boards: userBoards,
      username: user.username,
    });
  }

  if (req.method === "POST") {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Board name is required" });
    }
    const newBoard = {
      id: Date.now(),
      name,
      userId: userId,
    };
    db.boards.push(newBoard);
    return res.status(201).json({ board: newBoard });
  }

  if (req.method === "PUT") {
    const { id, name } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "Board id and name are required" });
    }
    const board = db.boards.find((b) => b.id === id && b.userId === userId);
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    board.name = name;
    return res.status(200).json({ board });
  }

  if (req.method === "DELETE") {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Board id is required" });
    }
    const boardIdx = db.boards.findIndex((b) => b.id === id && b.userId === userId);
    if (boardIdx === -1) {
      return res.status(404).json({ error: "Board not found" });
    }
    db.boards.splice(boardIdx, 1);
    // Optionally, delete all tasks in this board
    db.tasks = db.tasks.filter((t) => t.boardId !== id);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
