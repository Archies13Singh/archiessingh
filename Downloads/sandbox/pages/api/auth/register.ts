import { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/data/db";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  const userExists = db.users.find((u) => u.username === username);
  if (userExists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    username,
    passwordHash: hashed,
  };

  db.users.push(newUser);
  const token = generateToken(newUser.id, newUser.username);
  res.status(201).json({ token });
}
