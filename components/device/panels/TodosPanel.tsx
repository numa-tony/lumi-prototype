"use client";

import { useState, useEffect } from "react";
import type { Todo, TodoStatus, TodoTag, TodoPriority } from "@/lib/todos";
import {
  INITIAL_TODOS,
  STORAGE_KEY,
  TAG_COLORS,
  STATUS_LABELS,
  NEXT_STATUS,
  PREV_STATUS,
  PRIORITY_ORDER,
  PRIORITY_LABELS,
  PRIORITY_BADGE,
  PRIORITY_DOT,
} from "@/lib/todos";

// ─── Persistence ─────────────────────────────────────────────────────────────

type SavedTodo = { id: string; title: string; description: string; status: TodoStatus; priority: TodoPriority };
interface Storage { overrides: SavedTodo[]; deleted: string[] }

function readStorage(): Storage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { overrides: [], deleted: [] };
    return JSON.parse(raw) as Storage;
  } catch {
    return { overrides: [], deleted: [] };
  }
}

function loadTodos(): Todo[] {
  if (typeof window === "undefined") return INITIAL_TODOS;
  const { overrides, deleted } = readStorage();
  const deletedSet = new Set(deleted);
  const map = new Map(overrides.map((s) => [s.id, s]));
  return INITIAL_TODOS.filter((t) => !deletedSet.has(t.id)).map((t) => {
    const s = map.get(t.id);
    return s ? { ...t, title: s.title, description: s.description, status: s.status, priority: s.priority ?? null } : t;
  });
}

function buildPayload(todos: Todo[], deletedIds: string[]): Storage {
  return {
    overrides: todos.map(({ id, title, description, status, priority }) => ({
      id, title, description, status, priority,
    })),
    deleted: deletedIds,
  };
}

function saveTodosLocal(payload: Storage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}

async function syncToServer(payload: Storage): Promise<boolean> {
  try {
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadFromServer(): Promise<Storage | null> {
  try {
    const res = await fetch("/api/todos");
    if (!res.ok) return null;
    return await res.json() as Storage;
  } catch {
    return null;
  }
}

function loadDeleted(): string[] {
  if (typeof window === "undefined") return [];
  return readStorage().deleted;
}

function applyStorage(s: Storage): Todo[] {
  const deletedSet = new Set(s.deleted);
  const map = new Map(s.overrides.map((o) => [o.id, o]));
  return INITIAL_TODOS.filter((t) => !deletedSet.has(t.id)).map((t) => {
    const o = map.get(t.id);
    return o ? { ...t, title: o.title, description: o.description, status: o.status, priority: o.priority ?? null } : t;
  });
}

function sortByPriority(items: Todo[]): Todo[] {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority ?? "none"];
    const pb = PRIORITY_ORDER[b.priority ?? "none"];
    return pa - pb;
  });
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: TodoStatus[] = ["backlog", "in-progress", "done"];

const COLUMN_DOT: Record<TodoStatus, string> = {
  backlog: "bg-[#555]",
  "in-progress": "bg-amber-400",
  done: "bg-green-500",
};

const ALL_TAGS: TodoTag[] = ["UX", "Cross-channel", "Prototype", "Stakeholder"];

// ─── Detail / edit view ──────────────────────────────────────────────────────

function TodoDetail({
  todo,
  onBack,
  onSave,
  onDelete,
  syncStatus,
}: {
  todo: Todo;
  onBack: () => void;
  onSave: (updated: Todo) => void;
  onDelete: (id: string) => void;
  syncStatus: SyncStatus;
}) {
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description);
  const [status, setStatus] = useState<TodoStatus>(todo.status);
  const [tag, setTag] = useState<TodoTag>(todo.tag);
  const [priority, setPriority] = useState<TodoPriority>(todo.priority);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSave() {
    onSave({ ...todo, title, description, status, tag, priority });
  }

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    } else {
      onDelete(todo.id);
    }
  }

  return (
    <div className="flex min-h-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[#333] px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[13px] text-[#888] transition-colors hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          To-dos
        </button>
        <span className="text-[#444]">/</span>
        <span className="truncate text-[13px] text-[#666]">{todo.title}</span>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#555]">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-[#333] bg-[#1e1e1e] px-3 py-2.5 text-[15px] font-semibold text-white placeholder-[#555] outline-none transition-colors focus:border-[#555]"
          />
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#555]">
            Status
          </label>
          <div className="flex gap-2">
            {COLUMNS.map((col) => (
              <button
                key={col}
                onClick={() => setStatus(col)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                  status === col
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-[#333] bg-[#1e1e1e] text-[#888] hover:border-[#444] hover:text-[#ccc]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${COLUMN_DOT[col]}`} />
                {STATUS_LABELS[col]}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#555]">
            Priority
          </label>
          <div className="flex gap-2">
            {(["high", "medium", "low"] as NonNullable<TodoPriority>[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(priority === p ? null : p)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${
                  priority === p
                    ? "border-white/30 bg-white/10 text-white"
                    : "border-[#333] bg-[#1e1e1e] text-[#888] hover:border-[#444] hover:text-[#ccc]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[p]}`} />
                {PRIORITY_LABELS[p]}
              </button>
            ))}
            {priority !== null && (
              <button
                onClick={() => setPriority(null)}
                className="rounded-lg border border-[#333] bg-[#1e1e1e] px-3 py-2 text-[13px] text-[#666] transition-colors hover:text-[#aaa]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tag */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#555]">
            Tag
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_TAGS.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-opacity ${TAG_COLORS[t]} ${
                  tag === t ? "opacity-100 ring-1 ring-white/20" : "opacity-40 hover:opacity-70"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-[#555]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full resize-none rounded-lg border border-[#333] bg-[#1e1e1e] px-3 py-2.5 text-[13px] leading-relaxed text-[#ccc] placeholder-[#555] outline-none transition-colors focus:border-[#555]"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-[#333] px-6 py-4">
        <button
          onClick={handleDeleteClick}
          className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-all active:scale-95 ${
            confirmDelete
              ? "bg-red-600 text-white"
              : "text-[#666] hover:text-red-400"
          }`}
        >
          {confirmDelete ? "Confirm delete?" : "Delete"}
        </button>
        <button
          onClick={handleSave}
          className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition-all active:scale-95 ${
            syncStatus === "saving" ? "bg-amber-500 text-white" :
            syncStatus === "saved"  ? "bg-green-600 text-white" :
            syncStatus === "error"  ? "bg-red-600 text-white"   :
            "bg-white text-[#1a1a1a] hover:bg-gray-100"
          }`}
        >
          {syncStatus === "saving" ? "Saving…" :
           syncStatus === "saved"  ? "Synced ✓" :
           syncStatus === "error"  ? "Sync failed" :
           "Save changes"}
        </button>
      </div>
    </div>
  );
}

// ─── List view ───────────────────────────────────────────────────────────────

type SyncStatus = "idle" | "saving" | "saved" | "error";

export function TodosPanel() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [activeCol, setActiveCol] = useState<TodoStatus>("backlog");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    // Load localStorage immediately for instant render
    setTodos(loadTodos());
    setDeletedIds(loadDeleted());

    // Then fetch from server and override (server is source of truth)
    loadFromServer().then((s) => {
      if (!s) return;
      setTodos(applyStorage(s));
      setDeletedIds(s.deleted);
      saveTodosLocal(s); // keep local cache in sync
    });
  }, []);

  async function persist(nextTodos: Todo[], nextDeleted: string[]) {
    const payload = buildPayload(nextTodos, nextDeleted);
    saveTodosLocal(payload);
    setSyncStatus("saving");
    const ok = await syncToServer(payload);
    setSyncStatus(ok ? "saved" : "error");
    if (ok) setTimeout(() => setSyncStatus("idle"), 2000);
  }

  function updateStatus(id: string, status: TodoStatus) {
    const next = todos.map((t) => (t.id === id ? { ...t, status } : t));
    setTodos(next);
    persist(next, deletedIds);
  }

  function saveTodo(updated: Todo) {
    const next = todos.map((t) => (t.id === updated.id ? updated : t));
    setTodos(next);
    persist(next, deletedIds);
  }

  function deleteTodo(id: string) {
    const nextDeleted = [...deletedIds, id];
    const nextTodos = todos.filter((t) => t.id !== id);
    setDeletedIds(nextDeleted);
    setTodos(nextTodos);
    persist(nextTodos, nextDeleted);
    setDetailId(null);
  }

  const detailTodo = detailId ? todos.find((t) => t.id === detailId) : null;

  if (detailTodo) {
    return (
      <TodoDetail
        todo={detailTodo}
        onBack={() => setDetailId(null)}
        onSave={(updated) => {
          saveTodo(updated);
          setActiveCol(updated.status);
        }}
        onDelete={deleteTodo}
        syncStatus={syncStatus}
      />
    );
  }

  const byStatus: Record<TodoStatus, Todo[]> = {
    backlog: sortByPriority(todos.filter((t) => t.status === "backlog")),
    "in-progress": sortByPriority(todos.filter((t) => t.status === "in-progress")),
    done: sortByPriority(todos.filter((t) => t.status === "done")),
  };
  const visible = byStatus[activeCol];

  return (
    <div className="flex min-h-0 flex-col">
      {/* Modal title */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#333] px-6 py-4 pr-16">
        <h2 className="text-[17px] font-semibold text-white">To-dos</h2>
        <span className="text-[12px] text-[#555]">
          {todos.filter((t) => t.status !== "done").length} open
        </span>
      </div>

      {/* Column tabs */}
      <div className="flex shrink-0 gap-1 border-b border-[#333] px-5">
        {COLUMNS.map((col) => {
          const count = byStatus[col].length;
          const active = activeCol === col;
          return (
            <button
              key={col}
              onClick={() => setActiveCol(col)}
              className={`relative flex items-center gap-1.5 pb-3 pr-4 pt-3 text-[13px] font-medium transition-colors ${
                active ? "text-white" : "text-[#666] hover:text-[#aaa]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${COLUMN_DOT[col]}`} />
              {STATUS_LABELS[col]}
              <span
                className={`inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                  active ? "bg-white text-[#1a1a1a]" : "bg-[#2a2a2a] text-[#666]"
                }`}
              >
                {count}
              </span>
              {active && (
                <span className="absolute bottom-0 left-0 right-4 h-[2px] rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {visible.length === 0 && (
          <p className="py-8 text-center text-[13px] text-[#555]">Nothing here yet</p>
        )}
        {visible.map((todo) => {
          const prev = PREV_STATUS[todo.status];
          const next = NEXT_STATUS[todo.status];
          return (
            <button
              key={todo.id}
              onClick={() => setDetailId(todo.id)}
              className="group w-full rounded-xl border border-[#2e2e2e] bg-[#1e1e1e] p-3.5 text-left transition-colors hover:border-[#3a3a3a] hover:bg-[#232323]"
            >
              {/* Tag + priority + status controls */}
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TAG_COLORS[todo.tag]}`}
                  >
                    {todo.tag}
                  </span>
                  {todo.priority && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_BADGE[todo.priority]}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[todo.priority]}`} />
                      {PRIORITY_LABELS[todo.priority]}
                    </span>
                  )}
                </div>
                {/* Stop propagation so clicks on move buttons don't open detail */}
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {prev !== null && (
                    <button
                      onClick={() => updateStatus(todo.id, prev)}
                      title={`Move to ${STATUS_LABELS[prev]}`}
                      className="flex items-center gap-1 rounded-full bg-[#252525] px-2.5 py-1 text-[11px] font-medium text-[#666] transition-colors hover:bg-[#2e2e2e] hover:text-[#ccc] active:scale-95"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M8 5H2M4 3L2 5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {STATUS_LABELS[prev]}
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(todo.id, next)}
                    title={`Move to ${STATUS_LABELS[next]}`}
                    className="flex items-center gap-1 rounded-full bg-[#252525] px-2.5 py-1 text-[11px] font-medium text-[#666] transition-colors hover:bg-[#2e2e2e] hover:text-[#ccc] active:scale-95"
                  >
                    {STATUS_LABELS[next]}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5h6M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="text-[14px] font-semibold leading-snug text-[#f0f0f0]">
                {todo.title}
              </p>
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[#888]">
                {todo.description}
              </p>

              <p className="mt-2 text-[11px] text-[#444] opacity-0 transition-opacity group-hover:opacity-100">
                Click to edit →
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-[#333] px-6 py-3">
        <p className="text-[11px] text-[#555]">
          Oliver / Tony · Jun 4 · {todos.filter((t) => t.status === "done").length} done
        </p>
        <span className={`text-[11px] transition-colors ${
          syncStatus === "saving" ? "text-amber-400" :
          syncStatus === "saved"  ? "text-green-500" :
          syncStatus === "error"  ? "text-red-400"   : "text-[#444]"
        }`}>
          {syncStatus === "saving" ? "Saving…" :
           syncStatus === "saved"  ? "Synced ✓" :
           syncStatus === "error"  ? "Sync failed" : ""}
        </span>
      </div>
    </div>
  );
}
