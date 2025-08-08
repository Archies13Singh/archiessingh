// lib/auth.ts

import jwt from "jsonwebtoken";

const SECRET = process.env.NEXT_PUBLIC_SECRET_TOKEN;

export const generateToken = (userId: number, username: string) => {
  return jwt.sign({ userId, username }, SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET) as { userId: number };
  } catch (err) {
    return null;
  }
};
