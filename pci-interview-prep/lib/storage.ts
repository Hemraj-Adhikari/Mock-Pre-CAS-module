// Small localStorage helpers, kept in one place so Study Prep and the
// Results page agree on the same keys/shape. Everything here is
// best-effort: if localStorage is unavailable (SSR, privacy mode, quota),
// functions quietly fall back to empty state instead of throwing.

const PREP_KEY = "pci_prep_checklist_v1";
const HISTORY_KEY = "pci_attempt_history_v1";
const MAX_HISTORY = 10;

export type PrepChecklist = Record<string, boolean>;

export function getPrepChecklist(): PrepChecklist {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(PREP_KEY) || "{}");
  } catch {
    return {};
  }
}

export function setPrepChecked(questionId: string, checked: boolean): PrepChecklist {
  const current = getPrepChecklist();
  const updated = { ...current, [questionId]: checked };
  try {
    window.localStorage.setItem(PREP_KEY, JSON.stringify(updated));
  } catch {
    // ignore quota/availability errors -- UI still reflects the state in memory
  }
  return updated;
}

export type AttemptRecord = {
  dateISO: string;
  score: number;
  readiness: string;
  answered: number;
  total: number;
};

export function getAttemptHistory(): AttemptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addAttemptRecord(record: AttemptRecord): AttemptRecord[] {
  const history = getAttemptHistory();
  const updated = [...history, record].slice(-MAX_HISTORY);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  return updated;
}

export function bestPreviousScore(history: AttemptRecord[]): number | null {
  if (history.length === 0) return null;
  return Math.max(...history.map((h) => h.score));
}
