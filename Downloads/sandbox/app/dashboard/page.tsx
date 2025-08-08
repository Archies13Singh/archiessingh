"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../styles/Dashboard.module.css";
import Logostyle from "../styles/Logo.module.css";
interface Board {
  id: number;
  name: string;
  userId: number;
}

interface Task {
  id: number;
  boardId: number;
  title: string;
  description?: string;
  status: "pending" | "completed";
  dueDate?: string;
  createdAt: string;
  userId: number;
  position: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeFade, setWelcomeFade] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showBoardModal, setShowBoardModal] = useState(false);
  console.log("DashboardPage rendered", selectedBoardId);
  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState<"pending" | "completed">(
    "pending"
  );
  const [taskDueDate, setTaskDueDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "completed">(
    "pending"
  );
  const [editDueDate, setEditDueDate] = useState("");

  // Board edit state
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null);
  const [editBoardName, setEditBoardName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBoards(token);
  }, [router]);

  const fetchBoards = async (token: string) => {
    try {
      const res = await fetch("/api/boards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        console.log(data, "data");
        setBoards(data.boards || []);
        setUsername(data.username || "User");
        if (data.boards && data.boards.length > 0) {
          setSelectedBoardId(data.boards[0].id);
        }
      } else {
        const errorText = await res.text();
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
    } catch (error) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (boardId: number, token: string) => {
    try {
      const res = await fetch(`/api/tasks?boardId=${boardId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      // Handle error silently
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || selectedBoardId === null) return;
    fetchTasks(selectedBoardId, token);
  }, [selectedBoardId]);
  useEffect(() => {
    if (showWelcome) {
      const fadeTimer = setTimeout(() => setWelcomeFade(true), 6000); // Start fade after 6s
      const hideTimer = setTimeout(() => setShowWelcome(false), 7000); // Hide after 7s
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [showWelcome]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleAddBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newBoardName }),
      });
      if (res.ok) {
        setNewBoardName("");
        setShowBoardModal(false);
        fetchBoards(token);
      } else {
        const errorText = await res.text();
        if (res.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
    } catch (error) {
      // Optionally handle error
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !selectedBoardId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          boardId: selectedBoardId,
          title: taskTitle,
          description: taskDescription,
          status: taskStatus,
          dueDate: taskDueDate,
        }),
      });
      if (res.ok) {
        setTaskTitle("");
        setTaskDescription("");
        setTaskStatus("pending");
        setTaskDueDate(() => {
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, "0");
          const dd = String(today.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        });
        fetchTasks(selectedBoardId, token);
      }
    } catch (error) {
      // Optionally handle error
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await fetch("/api/tasks", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      if (selectedBoardId) fetchTasks(selectedBoardId, token);
    } catch {}
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const newStatus = task.status === "completed" ? "pending" : "completed";
      await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      if (selectedBoardId) fetchTasks(selectedBoardId, token);
    } catch {}
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditStatus(task.status);
    setEditDueDate(task.dueDate || "");
  };

  const handleEditTask = async () => {
    if (!editingTaskId) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      await fetch("/api/tasks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingTaskId,
          title: editTitle,
          description: editDescription,
          status: editStatus,
          dueDate: editDueDate,
        }),
      });
      setEditingTaskId(null);
      if (selectedBoardId) fetchTasks(selectedBoardId, token);
    } catch {}
  };

  const cancelEdit = () => setEditingTaskId(null);

  const startEditBoard = (board: Board) => {
    setEditingBoardId(board.id);
    setEditBoardName(board.name);
  };

  const handleEditBoard = async () => {
    if (!editingBoardId || !editBoardName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/boards", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: editingBoardId, name: editBoardName }),
      });
      if (res.ok) {
        setEditingBoardId(null);
        setEditBoardName("");
        fetchBoards(token);
      }
    } catch {}
  };

  const cancelEditBoard = () => {
    setEditingBoardId(null);
    setEditBoardName("");
  };

  const handleDeleteBoard = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      // Delete board
      const res = await fetch("/api/boards", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      // Delete all tasks for this board
      await fetch(`/api/tasks?boardId=${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setBoards((prev) => prev.filter((b) => b.id !== id));
        if (selectedBoardId === id) {
          const remaining = boards.filter((b) => b.id !== id);
          setSelectedBoardId(remaining.length > 0 ? remaining[0].id : null);
        }
        fetchBoards(token);
      }
    } catch {}
  };

  // Close sidebar on mobile when route changes (optional, for better UX)
  useEffect(() => {
    setSidebarOpen(true);
  }, [selectedBoardId]);

  if (loading) {
    return (
      <div className={styles.loadingSpinner}>
        <div
          className="spinner"
          style={{
            border: "4px solid #e0e0e0",
            borderTop: "4px solid #1976d2",
            borderRadius: "50%",
            width: 48,
            height: 48,
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Sidebar toggle button for mobile/desktop */}
      <button
        className={styles.sidebarToggleBtn}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        onClick={() => setSidebarOpen((open) => !open)}
        style={{
          position: "fixed",
          top: 18,
          left: 18,
          zIndex: 100,
          background: sidebarOpen ? "#1976d2" : "#fff",
          color: sidebarOpen ? "#fff" : "#1976d2",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {sidebarOpen ? (
          <span style={{ fontSize: 22, fontWeight: 700 }}>&times;</span>
        ) : (
          <span style={{ fontSize: 22, fontWeight: 700 }}>&#9776;</span>
        )}
      </button>
      {/* Sidebar (aside) */}
      {sidebarOpen && (
        <>
          <aside
            className={styles.sidebar}
            style={{
              position: window.innerWidth <= 900 ? "fixed" : "relative",
              minHeight: "100vh",
              left: 0,
              top: 0,
              zIndex: 99,
            }}
          >
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
            {showWelcome && (
              <h3
                style={{
                  textAlign: "center",
                  color: "green",
                  opacity: welcomeFade ? 0 : 1,
                  transition: "opacity 1s ease",
                }}
              >
                Welcome, {username || "User"} 🎉
              </h3>
            )}
            <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Your Boards
              {boards.length !== 0 && (
                <button
                  onClick={() => setShowBoardModal(true)}
                  style={{
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  +
                </button>
              )}
            </h3>
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxHeight: "80vh",
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {Array.isArray(boards) &&
                boards
                  .filter((b): b is Board => b !== undefined && b !== null)
                  .map((board) => (
                    <li
                      key={board.id}
                      className={
                        board.id === selectedBoardId ? styles.activeBoard : ""
                      }
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                      onClick={() => setSelectedBoardId(board.id)}
                    >
                      {editingBoardId === board.id ? (
                        <>
                          <input
                            type="text"
                            value={editBoardName}
                            onChange={(e) => setEditBoardName(e.target.value)}
                            style={{ flex: 1, padding: 4 }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditBoard();
                              if (e.key === "Escape") cancelEditBoard();
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleEditBoard}
                            className={styles.iconBtn}
                            title="Save"
                          >
                            <span style={{ fontWeight: 600, color: "white" }}>
                              ✔
                            </span>
                          </button>
                          <button
                            onClick={cancelEditBoard}
                            className={styles.iconBtn}
                            title="Cancel"
                          >
                            <span style={{ fontWeight: 600, color: "white" }}>
                              ✖
                            </span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex: 1, cursor: "pointer" }}>
                            {board.name?.length > 16
                              ? board.name.slice(0, 16) + "..."
                              : board.name}
                          </span>
                          <button
                            onClick={() => startEditBoard(board)}
                            className={styles.iconBtn}
                            title="Edit"
                          >
                            <Image
                              src={
                                board.id !== selectedBoardId
                                  ? "/edit.png"
                                  : "/editActive.png"
                              } // Assuming image is in the /public folder
                              alt="Delete"
                              width={28}
                              height={28}
                            />
                          </button>
                          <button
                            onClick={() => handleDeleteBoard(board.id)}
                            className={styles.iconBtn}
                            title="Delete"
                          >
                            <Image
                              src={
                                board.id !== selectedBoardId
                                  ? "/bin.png"
                                  : "/activeBin.png"
                              } // Assuming image is in the /public folder
                              alt="Delete"
                              width={28}
                              height={28}
                            />
                          </button>
                        </>
                      )}
                    </li>
                  ))}
            </ul>
            {/* No boards message in sidebar */}
            {boards.length === 0 && (
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8fafc",
                  borderRadius: 16,
                  border: "1.5px dashed #b0b0b0",
                  padding: "1rem 1rem",
                }}
              >
                <h2 style={{ color: "#1976d2", marginBottom: 8 }}>
                  No Boards Yet
                </h2>
              </div>
            )}
            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </aside>
          {/* Overlay for mobile to close sidebar when clicking outside */}
          {typeof window !== "undefined" && window.innerWidth <= 900 && (
            <div
              className={styles.sidebarOverlay}
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                background: "rgba(0,0,0,0.18)",
                zIndex: 98,
              }}
            />
          )}
        </>
      )}
      <main className={styles.main}>
        {/* Only show tasks if there are boards */}
        {boards.length === 0 ? (
          <div
            className={styles.noBoardSection}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "40vh",
              background: "#f8fafc",
              borderRadius: 16,
              border: "1.5px dashed #b0b0b0",
              padding: "3rem 1rem",
            }}
          >
            <h2 style={{ color: "#1976d2", marginBottom: 8 }}>No Boards Yet</h2>
            <p style={{ fontSize: "1.1rem", color: "#555", marginBottom: 0 }}>
              Start by creating your first board to organize your tasks!
            </p>
            <button
              style={{
                marginTop: 16,
                background: "#1976d2",
                color: "#fff",
                borderRadius: 24,
                padding: "8px 24px",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(25,118,210,0.08)",
                border: "none",
                fontSize: "1.1rem",
                cursor: "pointer",
              }}
              onClick={() => setShowBoardModal(true)}
              type="button"
            >
              + Add Board
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: 0 }}>Tasks</h2>
            <div
              style={{
                width: "100%",
                maxWidth: "100vw",
                overflowX: "auto",
                boxSizing: "border-box",
              }}
            >
              <div className={`${styles.card} ${styles.addTaskCard}`}>
                <h3 style={{ marginTop: 0 }}>Add Task</h3>
                <input
                  type="text"
                  placeholder="Title (required)"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={styles.addTaskInput}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className={styles.addTaskInput}
                />
                <div className={styles.addTaskRow}>
                  <div className={styles.addTaskInlineInputs}>
                    <select
                      value={taskStatus}
                      onChange={(e) =>
                        setTaskStatus(e.target.value as "pending" | "completed")
                      }
                      className={styles.addTaskInput}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className={styles.addTaskInput}
                    />
                  </div>
                  <button
                    disabled={!taskTitle}
                    onClick={handleAddTask}
                    className={styles.addTaskInput}
                    style={{
                      background: taskTitle.length > 2 ? "#1976d2" : "#a2c6e9",
                      color: "white",
                      border: 0,
                      borderRadius: 6,
                      fontWeight: 600,
                    }}
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
            {tasks.length === 0 ? (
              <div className={styles.card}>
                <p style={{ margin: 0 }}>No tasks in this board yet.</p>
              </div>
            ) : (
              <ul className={styles.taskList}>
                {tasks
                  .slice()
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((task) => {
                    if (editingTaskId === task.id) {
                      return (
                        <li key={task.id} className={styles.taskCard}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            style={{
                              width: "100%",
                              marginBottom: 8,
                              padding: 6,
                              borderRadius: 6,
                              border: "1px solid #e0e0e0",
                            }}
                          />
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            style={{
                              width: "100%",
                              marginBottom: 8,
                              padding: 6,
                              borderRadius: 6,
                              border: "1px solid #e0e0e0",
                            }}
                          />
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              marginBottom: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <select
                              value={editStatus}
                              onChange={(e) =>
                                setEditStatus(
                                  e.target.value as "pending" | "completed"
                                )
                              }
                              style={{
                                borderRadius: 6,
                                padding: 6,
                                border: "1px solid #e0e0e0",
                              }}
                            >
                              <option value="pending">Pending</option>
                              <option value="completed">Completed</option>
                            </select>
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              style={{
                                padding: 6,
                                borderRadius: 6,
                                border: "1px solid #e0e0e0",
                              }}
                            />
                          </div>
                          <div className={styles.taskActions}>
                            <button
                              onClick={handleEditTask}
                              style={{
                                background: "#1976d2",
                                color: "white",
                                border: 0,
                                borderRadius: 6,
                                padding: "6px 16px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                background: "#aaa",
                                color: "white",
                                border: 0,
                                borderRadius: 6,
                                padding: "6px 16px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </li>
                      );
                    }
                    const createdDate = new Date(task.createdAt);
                    const dueDate = task.dueDate
                      ? new Date(task.dueDate)
                      : new Date(task.createdAt);
                    const isCompleted = task.status === "completed";
                    let daysUntilDue: string | null = null;
                    if (task.dueDate) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      dueDate.setHours(0, 0, 0, 0);
                      const diffMs = dueDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(
                        diffMs / (1000 * 60 * 60 * 24)
                      );
                      if (diffDays > 1)
                        daysUntilDue = `Due in ${diffDays} days`;
                      else if (diffDays === 1) daysUntilDue = "Due tomorrow";
                      else if (diffDays === 0) daysUntilDue = "Due today";
                      else
                        daysUntilDue = `Overdue by ${Math.abs(diffDays)} day${
                          Math.abs(diffDays) > 1 ? "s" : ""
                        }`;
                    }
                    return (
                      <li key={task.id} className={styles.taskCard}>
                        <div className={styles.taskCardTopRow}>
                          <div
                            className={styles.taskCardTitle}
                            title={task.title}
                          >
                            {task.title.length > 24
                              ? task.title.slice(0, 24) + "…"
                              : task.title}
                          </div>
                          <div className={styles.taskCardStatusToggle}>
                            <span className={styles.taskStatusLabel}>
                              {isCompleted ? "Completed" : "Pending"}
                            </span>
                            <button
                              className={`${styles.statusSwitch} ${
                                isCompleted ? styles.completed : ""
                              }`}
                              onClick={() => handleToggleStatus(task)}
                              title={
                                isCompleted
                                  ? "Mark as Pending"
                                  : "Mark as Completed"
                              }
                              type="button"
                            >
                              <span>
                                <span className={styles.statusDot}></span>
                              </span>
                            </button>
                          </div>
                        </div>
                        {task.description && (
                          <div className={styles.taskCardDesc}>
                            <span>{task.description}</span>
                          </div>
                        )}
                        <div className={styles.taskCardDatesRow}>
                          <span>
                            Due: {dueDate ? dueDate.toLocaleDateString() : "-"}
                          </span>
                          <span>
                            Created: {createdDate.toLocaleDateString()}
                          </span>
                        </div>
                        {daysUntilDue && (
                          <div
                            className={styles.taskCardDueIndicator}
                            style={{
                              marginTop: 4,
                              fontWeight: 500,
                              color: daysUntilDue.startsWith("Overdue")
                                ? "#d32f2f"
                                : "#1976d2",
                            }}
                          >
                            {daysUntilDue}
                          </div>
                        )}

                        <div className={styles.taskCardActions}>
                          <button
                            className="editIcon"
                            onClick={() => startEditTask(task)}
                            title="Edit"
                          >
                            <Image
                              src="/edit.png" // Assuming image is in the /public folder
                              alt="Delete"
                              width={28}
                              height={28}
                            />
                          </button>
                          <button
                            className="deleteIcon"
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete"
                          >
                            <Image
                              src="/bin.png" // Assuming image is in the /public folder
                              alt="Delete"
                              width={28}
                              height={28}
                            />
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </>
        )}
      </main>
      {showBoardModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowBoardModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>Create New Board</h2>
            <input
              type="text"
              placeholder="Board name"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              className={styles.boardInput}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddBoard();
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button
                onClick={handleAddBoard}
                className={styles.addBoardBtn}
                style={{ flex: 1 }}
              >
                Create
              </button>
              <button
                onClick={() => setShowBoardModal(false)}
                className={styles.logoutBtn}
                style={{ flex: 1, background: "#aaa" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
