"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QUESTION_BANK, categorySlug } from "@/lib/questions";
import { computeFeedback, type Answer, type Feedback } from "@/lib/feedback";
import { downloadFeedbackPdf } from "@/lib/pdf";
import { addAttemptRecord, getAttemptHistory, bestPreviousScore } from "@/lib/storage";

export default function ResultsPage() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const [attemptNumber, setAttemptNumber] = useState<number | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("pci_interview_answers");
    if (!raw) {
      setError("No interview session found. Please start a new mock interview.");
      return;
    }
    const parsed: Answer[] = JSON.parse(raw);
    setAnswers(parsed);
    // Fully client-side, rule-based scoring -- no API call, no server needed.
    const result = computeFeedback(parsed, QUESTION_BANK);
    setFeedback(result);

    // Compare against past attempts on this device *before* saving this one,
    // then record this attempt so the trend keeps building over time.
    const priorHistory = getAttemptHistory();
    setPreviousBest(bestPreviousScore(priorHistory));
    const updatedHistory = addAttemptRecord({
      dateISO: new Date().toISOString(),
      score: result.overall.score,
      readiness: result.overall.readiness,
      answered: parsed.length,
      total: QUESTION_BANK.length,
    });
    setAttemptNumber(updatedHistory.length);
  }, []);

  const handleDownload = async () => {
    if (!feedback) return;
    setDownloading(true);
    try {
      await downloadFeedbackPdf(feedback, answers);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="shell">
      <span className="file-tab">Case File · Assessment Result</span>
      <div className="masthead">
        <div>
          <span className="eyebrow" style={{ margin: 0 }}>Mock Interview Report</span>
          <div className="case-ref">{answers.length} of {QUESTION_BANK.length} questions answered</div>
        </div>
        <span className="stamp-badge">Instant Feedback</span>
      </div>

      {error && (
        <div className="card" style={{ marginTop: 32 }}>
          <p style={{ color: "var(--stamp)" }}>{error}</p>
          <Link href="/interview">
            <button className="btn secondary" style={{ marginTop: 12 }}>
              Start New Interview
            </button>
          </Link>
        </div>
      )}

      {feedback && (
        <>
          <div className="overall-band" style={{ marginTop: 32 }}>
            <div
              className={`verdict-stamp ${feedback.overall.readiness === "Ready" ? "ready" : ""}`}
            >
              <span className="v-score mono">{feedback.overall.score}/10</span>
              <span className="v-label">{feedback.overall.readiness}</span>
            </div>
            <div className="overall-text">
              <span className="eyebrow">Overall Readiness</span>
              <p style={{ marginTop: 4, lineHeight: 1.6 }}>{feedback.overall.summary}</p>
              <div style={{ marginTop: 12 }}>
                {feedback.overall.topStrengths.map((s, i) => (
                  <span key={i} className="flag strong">{s}</span>
                ))}
                {feedback.overall.topRisks.map((r, i) => (
                  <span key={i} className="flag risk">{r}</span>
                ))}
              </div>
            </div>
          </div>

          {attemptNumber !== null && (
            <div className="attempt-banner mono">
              Attempt #{attemptNumber} on this device
              {previousBest !== null && (
                <>
                  {" · "}previous best {previousBest}/10
                  {feedback.overall.score > previousBest && " · new best 🎉"}
                </>
              )}
            </div>
          )}

          <div className="btn-row" style={{ marginBottom: 32 }}>
            <button className="btn outline" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Preparing PDF…" : "⬇ Download Feedback PDF"}
            </button>
          </div>

          <div className="section-heading">
            <h2 style={{ fontSize: 18 }}>Per-Question Breakdown</h2>
            <span className="count">{feedback.perQuestion.length} questions</span>
          </div>

          {feedback.perQuestion.map((pq, i) => {
            const ans = answers.find((a) => a.questionId === pq.questionId);
            const q = QUESTION_BANK.find((qq) => qq.id === pq.questionId);
            const accent = categorySlug(q?.category || "General");
            return (
              <div key={pq.questionId} className={`card accent-${accent}`} style={{ marginBottom: 16 }}>
                <span className={`category-badge accent-${accent}`}>{q?.category} · Q{i + 1}</span>
                <div className="q-text" style={{ fontSize: 18 }}>
                  {ans?.question}
                </div>
                <div className="score-row">
                  <span>Score</span>
                  <span className="score-value">{pq.score}/10</span>
                </div>
                <p style={{ fontSize: 14, marginTop: 8 }}>
                  <strong>Strengths:</strong>
                </p>
                <ul className="feedback-list good">
                  {pq.strengths.map((s, si) => (
                    <li key={si}>{s}</li>
                  ))}
                </ul>
                <p style={{ fontSize: 14 }}>
                  <strong>Improve:</strong>
                </p>
                <ul className="feedback-list improve">
                  {pq.improve.map((s, si) => (
                    <li key={si}>{s}</li>
                  ))}
                </ul>
                {pq.riskFlag && <span className="flag risk">{pq.riskFlag}</span>}

                <div className="answer-block">
                  <div className="answer-label">Student's Answer</div>
                  <div className="answer-text">
                    {ans?.transcript?.trim() ? ans.transcript : "No speech was detected for this answer."}
                  </div>
                  <div className="answer-meta">
                    Duration: {ans ? `${Math.floor(ans.durationSec / 60)}m ${ans.durationSec % 60}s` : "-"}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="section-heading" style={{ marginTop: 8 }}>
            <h2 style={{ fontSize: 18 }}>Final Overall Feedback &amp; Improvement Plan</h2>
          </div>

          <div className="final-summary card">
            <div className="overall-band" style={{ margin: 0, padding: 24 }}>
              <div
                className={`verdict-stamp ${feedback.overall.readiness === "Ready" ? "ready" : ""}`}
                style={{ width: 104, height: 104 }}
              >
                <span className="v-score mono">{feedback.overall.score}/10</span>
                <span className="v-label">{feedback.overall.readiness}</span>
              </div>
              <div className="overall-text">
                <span className="eyebrow">Wrap-up</span>
                <p style={{ marginTop: 4, lineHeight: 1.6 }}>{feedback.overall.summary}</p>
              </div>
            </div>

            {feedback.overall.topImprovements.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <span className="eyebrow">Before your real interview, fix these</span>
                <ol className="how-list" style={{ marginTop: 8 }}>
                  {feedback.overall.topImprovements.map((imp, i) => (
                    <li key={i}>
                      <span className="num">{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ textTransform: "capitalize" }}>{imp}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="btn-row" style={{ marginTop: 24 }}>
            <Link href="/study">
              <button className="btn secondary">Revisit Study Prep</button>
            </Link>
            <Link href="/interview">
              <button className="btn secondary">Practice Again</button>
            </Link>
            <button className="btn outline" onClick={handleDownload} disabled={downloading}>
              {downloading ? "Preparing PDF…" : "⬇ Download Feedback PDF"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
