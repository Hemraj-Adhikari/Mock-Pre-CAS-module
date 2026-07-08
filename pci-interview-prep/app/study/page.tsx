"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { QUESTION_BANK, CATEGORIES, categorySlug, type InterviewQuestion } from "@/lib/questions";
import { getPrepChecklist, setPrepChecked, type PrepChecklist } from "@/lib/storage";

export default function StudyPage() {
  const [checklist, setChecklist] = useState<PrepChecklist>({});
  const [openCategory, setOpenCategory] = useState<string | null>(CATEGORIES[0]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setChecklist(getPrepChecklist());
    setHydrated(true);
  }, []);

  const scorable = QUESTION_BANK.filter((q) => !q.verificationOnly);
  const preparedCount = scorable.filter((q) => checklist[q.id]).length;
  const pct = Math.round((preparedCount / scorable.length) * 100);

  const grouped = useMemo(() => {
    const map = new Map<string, InterviewQuestion[]>();
    for (const cat of CATEGORIES) {
      map.set(cat, QUESTION_BANK.filter((q) => q.category === cat));
    }
    return map;
  }, []);

  const toggle = (id: string) => {
    const next = setPrepChecked(id, !checklist[id]);
    setChecklist(next);
  };

  return (
    <main className="shell">
      <span className="file-tab">Case File · Study Prep</span>
      <div className="masthead">
        <div>
          <h1 style={{ fontSize: 22 }}>Study Prep Mode</h1>
          <div className="case-ref">Ref. PCI-PREP · Untimed · No camera · Plan every answer first</div>
        </div>
        <span className="stamp-badge">Prep Mode</span>
      </div>

      <span className="eyebrow" style={{ marginTop: 28 }}>Before you ever face the camera</span>
      <h2 className="hero-title" style={{ fontSize: "clamp(22px, 4vw, 30px)" }}>
        Read every question.<br />Plan your answer. Then check it off.
      </h2>
      <p className="hero-sub">
        This is where the real preparation happens — no timer, no recording. Go through all{" "}
        {scorable.length} questions, write or say your answer out loud a couple of times using the
        tip under each one, then tick it as prepared. Your progress is saved on this device.
      </p>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="prep-progress-row">
          <div>
            <span className="eyebrow" style={{ marginBottom: 4 }}>Your prep progress</span>
            <div className="prep-progress-count mono">
              {hydrated ? preparedCount : "…"} / {scorable.length} questions prepared
            </div>
          </div>
          <div className="prep-progress-bar-wrap">
            <div className="prep-progress-bar">
              <div className="prep-progress-fill" style={{ width: `${hydrated ? pct : 0}%` }} />
            </div>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              {hydrated ? pct : 0}%
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        {CATEGORIES.map((cat) => {
          const questions = grouped.get(cat) || [];
          const catSlug = categorySlug(cat);
          const catScorable = questions.filter((q) => !q.verificationOnly);
          const catDone = catScorable.filter((q) => checklist[q.id]).length;
          const isOpen = openCategory === cat;

          return (
            <div key={cat} className={`card accent-${catSlug} study-category-card`}>
              <button
                className="study-category-header"
                onClick={() => setOpenCategory(isOpen ? null : cat)}
                aria-expanded={isOpen}
              >
                <div>
                  <span className={`category-badge accent-${catSlug}`}>{cat}</span>
                  <div className="study-category-count mono">
                    {catDone}/{catScorable.length} prepared · {questions.length} question
                    {questions.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <span className={`study-chevron ${isOpen ? "open" : ""}`}>⌄</span>
              </button>

              {isOpen && (
                <div className="study-question-list">
                  {questions.map((q, i) => (
                    <div key={q.id} className="study-question">
                      <label className="study-check">
                        <input
                          type="checkbox"
                          checked={!!checklist[q.id]}
                          onChange={() => toggle(q.id)}
                        />
                        <span className="study-check-box" aria-hidden="true" />
                      </label>
                      <div className="study-question-body">
                        <div className="q-index mono">Q{i + 1}</div>
                        <div className="study-question-text">{q.question}</div>
                        {q.verificationOnly ? (
                          <div className="q-hint" style={{ marginTop: 10, marginBottom: 0 }}>
                            {q.hint}
                          </div>
                        ) : (
                          <div className="study-preptip" style={{ marginTop: 10 }}>
                            <span className="answer-label" style={{ color: `var(--${categoryAccentVar(cat)})` }}>
                              How to structure it
                            </span>
                            <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
                              {q.prepTip}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24, textAlign: "center" }}>
        <span className="eyebrow">Ready to test yourself?</span>
        <p style={{ marginTop: 6, color: "var(--ink-soft)" }}>
          Once most questions are checked off, try the full timed mock with camera and instant
          feedback — it's the closest simulation to the real interview.
        </p>
        <div className="btn-row" style={{ marginTop: 16, justifyContent: "center" }}>
          <Link href="/interview">
            <button className="btn">Start Full Mock Interview →</button>
          </Link>
        </div>
      </div>

      <p className="footer-note">
        Test build — for practice only. Not affiliated with UKVI, UEL, or any official
        credibility interview process.
      </p>
    </main>
  );
}

function categoryAccentVar(category: string): string {
  const map: Record<string, string> = {
    "Identity Verification": "blue",
    Motivation: "gold",
    "Course & University": "good",
    "Academic Background": "purple",
    "Finance & Sponsorship": "stamp",
    "Post-Study Plan": "navy",
    General: "teal",
  };
  return map[category] || "gold";
}
