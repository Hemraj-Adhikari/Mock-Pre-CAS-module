import type { Answer, Feedback } from "./feedback";

// Builds and downloads the feedback report as a PDF, entirely client-side.
// jsPDF runs in the browser -- no server call, no API key.
//
// Layout: a short cover strip up top (so the reader instantly sees their
// score), then the full Q + "what you said" + feedback for every question,
// and finally -- as its own clearly-labelled closing section -- the full
// "Overall Feedback & Improvement Plan" with a numbered action list. That
// final section is deliberately the last thing in the document.
export async function downloadFeedbackPdf(feedback: Feedback, answers: Answer[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const navy: [number, number, number] = [15, 27, 45];
  const ink: [number, number, number] = [22, 32, 47];
  const gold: [number, number, number] = [186, 130, 25];
  const stamp: [number, number, number] = [220, 38, 38];
  const good: [number, number, number] = [22, 163, 74];
  const soft: [number, number, number] = [91, 107, 130];
  const paleFill: [number, number, number] = [247, 244, 236];

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  function heading(text: string, size = 16, color: [number, number, number] = ink) {
    ensureSpace(size + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(text, margin, y);
    y += size + 8;
  }

  function label(text: string, color: [number, number, number] = gold) {
    ensureSpace(14);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...color);
    doc.text(text.toUpperCase(), margin, y);
    y += 14;
  }

  function paragraph(
    text: string,
    size = 10.5,
    color: [number, number, number] = ink,
    font: "helvetica" | "courier" = "helvetica",
    x = margin,
    width = contentWidth
  ) {
    doc.setFont(font, "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text || "-", width);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, x, y);
      y += size + 4;
    }
    y += 4;
  }

  function rule() {
    ensureSpace(10);
    doc.setDrawColor(225, 220, 205);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
  }

  // Draws a soft rounded background box behind whatever content is placed
  // starting at the returned y -- used to visually separate the transcript
  // ("what you said") from the score/feedback text above it.
  function fillBoxStart(color: [number, number, number] = paleFill) {
    return { startY: y, color };
  }
  function fillBoxEnd(box: { startY: number; color: [number, number, number] }, padding = 8) {
    const endY = y;
    doc.setFillColor(...box.color);
    doc.roundedRect(margin - padding, box.startY - padding, contentWidth + padding * 2, endY - box.startY + padding, 4, 4, "F");
  }

  // ---- Cover / header band ----
  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 86, "F");
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.text("CASE FILE · PCI MOCK INTERVIEW · CREDIBILITY READINESS REPORT", margin, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("PCI Mock Interview -- Feedback Report", margin, 60);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 225);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 76);
  y = 86 + 30;

  // ---- Quick score chip (detail lives in the closing section) ----
  const readinessColor = feedback.overall.readiness === "Ready" ? good : feedback.overall.readiness === "Needs Practice" ? gold : stamp;
  doc.setFillColor(...readinessColor);
  doc.roundedRect(margin, y, 150, 34, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(`${feedback.overall.score}/10 -- ${feedback.overall.readiness}`, margin + 12, y + 22);
  y += 34 + 10;
  paragraph(`${answers.length} questions answered. Full breakdown below; overall feedback and an improvement plan follow at the end of this report.`, 10, soft);
  rule();

  // ---- Per-question breakdown ----
  heading("Per-Question Breakdown", 15, navy);

  feedback.perQuestion.forEach((pq, i) => {
    const ans = answers.find((a) => a.questionId === pq.questionId);
    const scoreColor = pq.score >= 7 ? good : pq.score >= 4 ? gold : stamp;
    const durationLabel = ans
      ? `${Math.floor(ans.durationSec / 60)}m ${ans.durationSec % 60}s`
      : "-";

    ensureSpace(60);
    // Colored accent bar to the left of the question block
    const barY = y - 4;
    label(`Q${i + 1} · Score ${pq.score}/10 · Duration ${durationLabel}`, scoreColor);
    doc.setFillColor(...scoreColor);
    doc.rect(margin - 10, barY, 3, 14, "F");

    paragraph(ans?.question || "", 12.5, ink, "helvetica");

    if (pq.strengths.length) {
      label("Strengths", good);
      pq.strengths.forEach((s) => paragraph(`•  ${s}`, 10, good));
    }
    if (pq.improve.length) {
      label("Improve", stamp);
      pq.improve.forEach((s) => paragraph(`•  ${s}`, 10, stamp));
    }
    if (pq.riskFlag) {
      paragraph(`Risk flag: ${pq.riskFlag}`, 9.5, stamp);
    }

    ensureSpace(50);
    label("Student's answer (transcript)", soft);
    const box = fillBoxStart();
    paragraph(ans?.transcript?.trim() ? ans.transcript : "(no speech detected)", 9.5, soft, "courier");
    fillBoxEnd(box);
    y += 10;
    rule();
  });

  // ==================================================================
  // CLOSING SECTION -- Overall Feedback & Improvement Plan.
  // Deliberately placed last: this is the summary + action list the
  // student should read right before their real interview.
  // ==================================================================
  doc.addPage();
  y = margin;

  doc.setFillColor(...navy);
  doc.rect(0, 0, pageWidth, 70, "F");
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gold);
  doc.text("CLOSING SECTION", margin, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Overall Feedback & Improvement Plan", margin, 52);
  y = 70 + 30;

  // Big score badge
  doc.setFillColor(...readinessColor);
  doc.circle(margin + 34, y + 26, 34, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(`${feedback.overall.score}`, margin + 34, y + 22, { align: "center" });
  doc.setFontSize(8);
  doc.text("/ 10", margin + 34, y + 34, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...readinessColor);
  doc.text(feedback.overall.readiness, margin + 84, y + 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...soft);
  doc.text("Overall readiness for the real credibility interview", margin + 84, y + 34);

  y += 34 * 2 + 20;
  rule();

  label("Summary");
  paragraph(feedback.overall.summary, 11, ink);

  if (feedback.overall.topStrengths.length) {
    label("Strengths flagged", good);
    paragraph(feedback.overall.topStrengths.join("  ·  "), 10, good);
  }
  if (feedback.overall.topRisks.length) {
    label("Risks flagged", stamp);
    paragraph(feedback.overall.topRisks.join("  ·  "), 10, stamp);
  }

  rule();

  if (feedback.overall.topImprovements.length) {
    heading("Before your real interview, fix these", 13, navy);
    feedback.overall.topImprovements.forEach((imp, i) => {
      ensureSpace(20);
      doc.setFont("courier", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...gold);
      doc.text(String(i + 1).padStart(2, "0"), margin, y);
      paragraph(imp.charAt(0).toUpperCase() + imp.slice(1) + ".", 10.5, ink, "helvetica", margin + 22, contentWidth - 22);
    });
    y += 6;
    rule();
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...soft);
  ensureSpace(20);
  doc.text("Practice build -- not affiliated with UKVI, UEL, or any official credibility interview process.", margin, y);

  doc.save(`pci-mock-interview-feedback-${Date.now()}.pdf`);
}
