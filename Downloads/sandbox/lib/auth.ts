// lib/auth.ts

import jwt from "jsonwebtoken";

const SECRET = process.env.NEXT_PUBLIC_SECRET_TOKEN as string;

export const generateToken = (userId: number, username: string) => {
  return jwt.sign({ userId, username }, SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): { userId: number; username: string } | null => {
  try {
    const decoded = jwt.verify(token, SECRET) as { userId: number; username: string };
    return decoded;
  } catch {
    return null;
  }
};
