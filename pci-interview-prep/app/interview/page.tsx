"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { QUESTION_BANK, categorySlug, TOTAL_TEST_MINUTES } from "@/lib/questions";
import Recorder from "@/components/Recorder";

type Answer = { questionId: string; question: string; transcript: string; durationSec: number };

const TOTAL_SECONDS = TOTAL_TEST_MINUTES * 60;

export default function InterviewPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const answersRef = useRef<Answer[]>([]);
  const finishedRef = useRef(false);

  const question = QUESTION_BANK[index];
  const isLast = index === QUESTION_BANK.length - 1;

  // Camera/mic are requested ONCE for the whole session, not per-question --
  // repeatedly calling getUserMedia 21 times back-to-back was unreliable and
  // is the likely cause of speech recognition silently dying partway through
  // a session (as seen in real test reports: fine for the first few
  // questions, then "no speech detected" for everything after).
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        activeStream = s;
        setStream(s);
      })
      .catch(() => setCameraError("Camera/microphone access was denied or unavailable. Allow access and reload this page."));

    return () => {
      activeStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const finishInterview = (finalAnswers: Answer[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    sessionStorage.setItem("pci_interview_answers", JSON.stringify(finalAnswers));
    router.push("/results");
  };

  // Whole-assessment countdown -- mirrors a real timed credibility interview.
  // If time runs out mid-way, whatever has been answered so far is submitted.
  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(tick);
          finishInterview(answersRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDone = (result: { transcript: string; durationSec: number }) => {
    const updated = [
      ...answersRef.current,
      {
        questionId: question.id,
        question: question.question,
        transcript: result.transcript,
        durationSec: result.durationSec,
      },
    ];
    answersRef.current = updated;
    setAnswers(updated);

    if (isLast) {
      finishInterview(updated);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const timeMM = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const timeSS = String(secondsLeft % 60).padStart(2, "0");
  const timeLow = secondsLeft <= 300;
  const catSlug = categorySlug(question.category);

  return (
    <main className="shell">
      <div className="timer-row">
        <span className={`time-badge ${timeLow ? "low" : ""}`}>⏱ {timeMM}:{timeSS}</span>
      </div>

      <div className="progress-dots">
        {QUESTION_BANK.map((q, i) => (
          <span
            key={q.id}
            className={`progress-dot accent-${categorySlug(q.category)} ${
              i < index ? "done" : i === index ? "current" : ""
            }`}
            title={`Q${i + 1} · ${q.category}`}
          />
        ))}
      </div>

      <div className={`card accent-${catSlug}`}>
        <span className={`category-badge accent-${catSlug}`}>{question.category}</span>
        <div className="q-index mono">
          Q{index + 1} <span className="q-total">of {QUESTION_BANK.length}</span>
        </div>
        <div className="q-text">{question.question}</div>
        <div className="q-hint">{question.hint}</div>

        {cameraError ? (
          <p style={{ color: "var(--stamp)", fontSize: 14 }}>{cameraError}</p>
        ) : (
          // key forces remount per question so recognition resets cleanly;
          // the underlying camera/mic stream itself is NOT re-requested.
          <Recorder key={question.id} question={question} stream={stream} onDone={handleDone} />
        )}
      </div>
    </main>
  );
}
