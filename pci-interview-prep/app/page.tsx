"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QUESTION_BANK, CATEGORIES, TOTAL_TEST_MINUTES } from "@/lib/questions";
import { getPrepChecklist, getAttemptHistory, bestPreviousScore } from "@/lib/storage";

export default function Home() {
  const [preparedCount, setPreparedCount] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const scorable = QUESTION_BANK.filter((q) => !q.verificationOnly);

  useEffect(() => {
    const checklist = getPrepChecklist();
    setPreparedCount(scorable.filter((q) => checklist[q.id]).length);
    const history = getAttemptHistory();
    setAttemptCount(history.length);
    setBestScore(bestPreviousScore(history));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="shell">
      <span className="file-tab">Case File · Route 2 Uni</span>
      <div className="masthead">
        <div>
          <h1 style={{ fontSize: 22 }}>PCI Mock Interview</h1>
          <div className="case-ref">Ref. PCI-PREP · Credibility Interview Readiness Assessment</div>
        </div>
        <span className="stamp-badge">Practice Mode</span>
      </div>

      <span className="eyebrow" style={{ marginTop: 32 }}>Before your real PCI / credibility interview</span>
      <h2 className="hero-title">
        Prepare first.<br />Then see how you'd hold up.
      </h2>
      <p className="hero-sub">
        This exists because most students walk into the university's real AI credibility interview
        without ever having planned their answers. Use Study Prep to get every answer ready, then
        run the timed mock to test yourself under real conditions.
      </p>

      {preparedCount !== null && (preparedCount > 0 || attemptCount > 0) && (
        <div className="progress-teaser mono">
          {preparedCount > 0 && (
            <span>📘 {preparedCount}/{scorable.length} questions prepared</span>
          )}
          {attemptCount > 0 && (
            <span>🎯 {attemptCount} mock attempt{attemptCount !== 1 ? "s" : ""} · best {bestScore}/10</span>
          )}
        </div>
      )}

      <div className="path-grid">
        <Link href="/study" className="path-card-link">
          <div className="path-card">
            <span className="category-badge accent-general">Step 1 · No camera, no timer</span>
            <h3 className="path-title">Study Prep Mode</h3>
            <p className="path-desc">
              Read all {scorable.length} questions grouped by category, with a tip on how to
              structure each answer. Tick off each one as you prepare it.
            </p>
            <span className="path-cta">Start preparing →</span>
          </div>
        </Link>

        <Link href="/interview" className="path-card-link">
          <div className="path-card path-card-primary">
            <span className="category-badge accent-motivation">Step 2 · Timed, on camera</span>
            <h3 className="path-title">Full Mock Interview</h3>
            <p className="path-desc">
              {QUESTION_BANK.length} questions across {CATEGORIES.length} categories, {TOTAL_TEST_MINUTES}{" "}
              minutes on the clock, live transcript, and an instant scored report with a PDF you can
              keep.
            </p>
            <span className="path-cta">Start mock interview →</span>
          </div>
        </Link>
      </div>

      <div className="card" style={{ marginTop: 28 }}>
        <span className="category-badge">Rules &amp; Guidelines for the Full Mock</span>
        <ol className="how-list">
          <li>
            <span className="num">01</span>
            <span>
              This assessment covers {QUESTION_BANK.length} questions across {CATEGORIES.length}{" "}
              categories and must be completed within <strong>{TOTAL_TEST_MINUTES} minutes</strong>. A
              countdown timer is visible throughout the session.
            </span>
          </li>
          <li>
            <span className="num">02</span>
            <span>Face the camera at all times. Do not look away from the screen or turn away while answering.</span>
          </li>
          <li>
            <span className="num">03</span>
            <span>Do not read from notes, books, or any written material while recording your answers.</span>
          </li>
          <li>
            <span className="num">04</span>
            <span>Sit in a quiet room. No background conversation, music, or other audible sound is permitted during the session.</span>
          </li>
          <li>
            <span className="num">05</span>
            <span>Do not use AI tools, translators, or any other external assistance to generate or prompt your answers.</span>
          </li>
          <li>
            <span className="num">06</span>
            <span>Answer every question in English. Your camera, microphone, and speech are processed locally in this browser only — nothing is uploaded to a server.</span>
          </li>
          <li>
            <span className="num">07</span>
            <span>After each answer you can review your transcript and re-record before it's submitted. On completion, you get a category-wise feedback report with a downloadable PDF.</span>
          </li>
        </ol>
      </div>

      <p className="footer-note">
        Test build — for practice only. Not affiliated with UKVI, UEL, or any official
        credibility interview process.
      </p>
    </main>
  );
}
