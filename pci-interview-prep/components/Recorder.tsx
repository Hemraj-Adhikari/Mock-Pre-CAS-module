"use client";

import { useEffect, useRef, useState } from "react";
import type { InterviewQuestion } from "@/lib/questions";

type Props = {
  question: InterviewQuestion;
  stream: MediaStream | null;
  onDone: (result: { transcript: string; durationSec: number }) => void;
};

// Uses the browser's native SpeechRecognition (Web Speech API) for
// transcription -- free, no API key, runs entirely client-side.
// Chrome/Edge support it well; Safari/Firefox support is partial.
//
// The camera/mic MediaStream is acquired ONCE for the whole interview by the
// parent page and passed in as a prop -- re-requesting getUserMedia on every
// single question (21 times back-to-back) was unreliable and is the likely
// cause of speech recognition silently going dead partway through a session.
export default function Recorder({ question, stream, onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const finalTranscriptRef = useRef<string>("");
  // Chrome's SpeechRecognition silently fires "end" after a pause or after
  // roughly a minute even with continuous=true, which used to cut the
  // transcript short mid-answer. This ref tracks intent so onend/onerror
  // can restart recognition automatically while the person is still
  // recording, instead of the transcript just stopping.
  const shouldListenRef = useRef(false);
  // Counts consecutive *real* recognition errors (not "no-speech", which
  // fires constantly during natural pauses). If recognition genuinely
  // breaks (network drop, mic taken by another app, browser throttling
  // after many restarts), this stops the silent retry loop and tells the
  // student instead of quietly submitting an empty transcript.
  const errorStreakRef = useRef(0);

  const [status, setStatus] = useState<"idle" | "recording" | "review">("idle");
  const [pendingDuration, setPendingDuration] = useState(0);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [recognitionWarning, setRecognitionWarning] = useState(false);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, stream]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === "recording") {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const createRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      errorStreakRef.current = 0;
      setRecognitionWarning(false);
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPiece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcriptPiece.trim() + " ";
        } else {
          interim += transcriptPiece;
        }
      }
      setLiveTranscript((finalTranscriptRef.current + interim).trim());
    };

    recognition.onerror = (event: any) => {
      // "no-speech" fires often during natural pauses, and "aborted" fires
      // on our own intentional restarts -- neither is a real failure.
      if (event?.error === "no-speech" || event?.error === "aborted") return;
      // Real failures (network, audio-capture, not-allowed, service down):
      // count them, and if they keep happening, stop retrying silently and
      // surface a visible warning so the student can type their answer
      // instead of submitting an empty transcript without knowing why.
      errorStreakRef.current += 1;
      if (errorStreakRef.current >= 2) {
        shouldListenRef.current = false;
        setRecognitionWarning(true);
      }
    };

    recognition.onend = () => {
      if (shouldListenRef.current) {
        // Restart immediately so a pause never truncates the transcript.
        try {
          const next = createRecognition();
          if (next) {
            recognitionRef.current = next;
            next.start();
          }
        } catch {
          errorStreakRef.current += 1;
          if (errorStreakRef.current >= 2) setRecognitionWarning(true);
        }
      }
    };

    return recognition;
  };

  const startRecording = () => {
    finalTranscriptRef.current = "";
    setLiveTranscript("");
    setRecognitionWarning(false);
    errorStreakRef.current = 0;
    startTimeRef.current = Date.now();
    setStatus("recording");
    shouldListenRef.current = true;

    const recognition = createRecognition();
    if (!recognition) return;
    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      setRecognitionWarning(true);
    }
  };

  const stopRecording = () => {
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
    // Hold the result for review instead of submitting immediately -- gives
    // the person a chance to fix or re-record before it's locked in. The
    // transcript is editable here too, since live transcription can drop
    // words or (rarely) stop entirely mid-answer.
    setPendingDuration(durationSec);
    setEditedTranscript(liveTranscript.trim());
    setStatus("review");
  };

  const confirmAnswer = () => {
    onDone({ transcript: editedTranscript.trim(), durationSec: pendingDuration });
  };

  const redoAnswer = () => {
    setEditedTranscript("");
    setLiveTranscript("");
    finalTranscriptRef.current = "";
    setElapsed(0);
    setRecognitionWarning(false);
    setStatus("idle");
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const reviewMM = String(Math.floor(pendingDuration / 60)).padStart(2, "0");
  const reviewSS = String(pendingDuration % 60).padStart(2, "0");

  return (
    <div>
      <div className={`rec-frame ${status === "recording" ? "live" : ""}`}>
        <video ref={videoRef} className="preview" autoPlay muted playsInline />
        {status === "recording" && (
          <span className="rec-frame-timer mono">
            {mm}:{ss} / {Math.floor(question.timeLimitSeconds / 60)}:
            {String(question.timeLimitSeconds % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      {!speechSupported && (
        <p style={{ fontSize: 13, color: "var(--stamp)" }}>
          Live transcript needs Chrome or Edge. Recording will still work, but text
          feedback needs a supported browser.
        </p>
      )}

      {recognitionWarning && status === "recording" && (
        <p className="recognition-warning">
          ⚠ Live transcription seems to have stopped responding. Keep speaking, then use
          Stop Answer — you'll be able to type or fix the transcript before it's submitted.
        </p>
      )}

      <div className="controls">
        {status === "idle" && (
          <button className="btn" onClick={startRecording}>
            ● Start Answer
          </button>
        )}
        {status === "recording" && (
          <button className="btn danger" onClick={stopRecording}>
            <span className="rec-dot" />
            Stop Answer
          </button>
        )}
        {status === "recording" && (
          <span className="timer mono">
            {mm}:{ss} / limit {Math.floor(question.timeLimitSeconds / 60)}:
            {String(question.timeLimitSeconds % 60).padStart(2, "0")}
          </span>
        )}
        {status === "review" && (
          <>
            <button className="btn secondary" onClick={redoAnswer}>
              ↺ Re-record
            </button>
            <button className="btn" onClick={confirmAnswer}>
              Confirm & Continue →
            </button>
            <span className="timer mono">Answered in {reviewMM}:{reviewSS}</span>
          </>
        )}
      </div>

      {(status === "recording" || liveTranscript) && status !== "review" && (
        <div className={`transcript-box ${!liveTranscript ? "empty" : ""}`}>
          {liveTranscript || "Start speaking — your transcript will appear here..."}
        </div>
      )}

      {status === "review" && (
        <>
          <p className="review-note">
            Review your transcript below and edit it if anything was missed or transcribed
            wrong, then confirm to move to the next question.
          </p>
          <textarea
            className="transcript-edit"
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            placeholder="No speech was captured — type what you said here."
            rows={4}
          />
        </>
      )}
    </div>
  );
}
