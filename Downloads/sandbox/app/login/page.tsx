// app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../styles/AuthForm.module.css";
import Logostyle from "../styles/Logo.module.css";
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } else {
      setError(data.message || "Invalid credentials");
    }
  };

  return (
    <div className={styles.container}>
      <h1
        className={Logostyle.appName}
        style={{
          textAlign: "center",
          color: "#1976d2",
          fontWeight: 800,
          marginBottom: 12,
          fontSize: "2.1rem",
          letterSpacing: "0.01em",
        }}
      >
        TaskFlow Kanban
      </h1>
      <form onSubmit={handleLogin} className={styles.formBox}>
        <h2 className={styles.heading}>Login</h2>

        {error && <p className={styles.error}>{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className={styles.input}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className={styles.inputWithButton}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={styles.toggleButton}
          >
            {!showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button type="submit" className={styles.button}>
          Login
        </button>

        <p className={styles.link}>
          Do not have an account? <a href="/register">Register</a>
        </p>
      </form>
    </div>
  );
}

// Fix: Replace unescaped single quote in JSX with &apos; in login page
