import type { InterviewQuestion } from "./questions";

export type PerQuestionFeedback = {
  questionId: string;
  score: number;
  strengths: string[];
  improve: string[];
  riskFlag: string;
};

export type Feedback = {
  perQuestion: PerQuestionFeedback[];
  overall: {
    score: number;
    summary: string;
    topStrengths: string[];
    topRisks: string[];
    topImprovements: string[];
    readiness: "Not Ready" | "Needs Practice" | "Ready";
  };
};

export type Answer = {
  questionId: string;
  question: string;
  transcript: string;
  durationSec: number;
};

// Words/phrases that signal genuine, specific answers per category.
// A hit means the student is naming real things instead of speaking generically.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Identity Verification": ["passport", "born", "date of birth", "ward", "municipality", "district", "street", "tole", "nepal", "address"],
  Motivation: ["ranking", "curriculum", "industry", "research", "module", "reputation", "recognition", "career", "specific"],
  "Course & University": ["module", "campus", "professor", "faculty", "ranking", "specialis", "course", "lecture", "facility"],
  "Finance & Sponsorship": ["sponsor", "father", "mother", "brother", "sister", "saving", "loan", "scholarship", "income", "salary", "bank", "tuition", "business"],
  "Post-Study Plan": ["return", "nepal", "job", "career", "company", "industry", "family business", "graduate route"],
  "Academic Background": ["percentage", "gpa", "grade", "subject", "college", "school", "bachelor"],
  General: [],
};

// Categories where a spoken figure/date/number is expected (finance amounts,
// or a date of birth / passport number for identity questions).
const NUMERIC_EXPECTED_CATEGORIES = new Set(["Finance & Sponsorship", "Identity Verification"]);

// Common vague/rehearsed-sounding filler phrases interviewers flag as low-credibility.
const GENERIC_PHRASES = [
  "better life",
  "good future",
  "bright future",
  "better opportunit",
  "better exposure",
  "quality education",
  "world class",
  "better environment",
];

const FILLER_WORDS = ["um", "uh", "umm", "uhh", "like", "you know", "basically", "actually", "so yeah"];

// Detects currency figures or plain numbers -- a strong signal of a specific,
// well-prepared answer versus a vague one, especially for finance questions.
const NUMBER_PATTERN = /(\d[\d,]*\.?\d*|£|\$|npr|rs\.?|rupees|lakh|lakhs)/i;

function countOccurrences(text: string, needle: string): number {
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (text.match(re) || []).length;
}

function analyzeAnswer(answer: Answer, question: InterviewQuestion): PerQuestionFeedback {
  const transcript = answer.transcript || "";
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const durationMin = answer.durationSec > 0 ? answer.durationSec / 60 : 0;
  const wpm = durationMin > 0 ? Math.round(wordCount / durationMin) : 0;

  const fillerCount = FILLER_WORDS.reduce((sum, f) => sum + countOccurrences(transcript, f), 0);
  const fillerRatio = wordCount > 0 ? fillerCount / wordCount : 0;

  const genericHits = GENERIC_PHRASES.filter((p) => transcript.toLowerCase().includes(p));
  const keywordList = CATEGORY_KEYWORDS[question.category] || [];
  const keywordHits = keywordList.filter((k) => transcript.toLowerCase().includes(k));
  const hasNumbers = NUMBER_PATTERN.test(transcript);
  const isNumericExpected = NUMERIC_EXPECTED_CATEGORIES.has(question.category);
  const isFinanceQuestion = question.category === "Finance & Sponsorship";

  let score = 5;
  const strengths: string[] = [];
  const improve: string[] = [];
  let riskFlag = "";

  // "Show your passport" is a visual completion check, not a spoken answer --
  // score it on whether the camera step was completed (duration), not on
  // transcript content, since there's usually nothing to say out loud.
  if (question.verificationOnly) {
    const completed = answer.durationSec >= 3;
    return {
      questionId: question.id,
      score: completed ? 10 : 0,
      strengths: completed
        ? ["Passport photo page was shown to the camera as requested."]
        : [],
      improve: [
        completed
          ? "In the real interview, keep the passport steady and well-lit so every detail is legible."
          : "Hold the passport photo page up to the camera for at least a few seconds before submitting.",
      ],
      riskFlag: completed ? "" : "Passport was not shown clearly to the camera",
    };
  }

  if (wordCount === 0) {
    return {
      questionId: question.id,
      score: 0,
      strengths: ["No speech was detected for this answer."],
      improve: ["Make sure your mic is working and try answering again in a quiet room."],
      riskFlag: "No answer detected",
    };
  }

  // Length / depth
  if (wordCount >= 45) {
    score += 1.5;
    strengths.push("gave a reasonably developed answer rather than a one-liner");
  } else if (wordCount < 15) {
    score -= 2;
    improve.push("the answer is quite short — add 1-2 more concrete details");
  }

  // Specificity via category keywords
  if (keywordHits.length > 0) {
    score += 1.5;
    strengths.push(`mentioned specific, relevant details (e.g. "${keywordHits[0]}")`);
  } else if (keywordList.length > 0) {
    score -= 1;
    improve.push(`try naming concrete specifics for this topic (e.g. ${keywordList.slice(0, 3).join(", ")})`);
  }

  // Numbers, especially for finance and identity (DOB / passport number)
  if (isNumericExpected) {
    if (hasNumbers) {
      score += 1.5;
      strengths.push(
        isFinanceQuestion
          ? "included actual figures, which strengthens credibility on finance questions"
          : "included specific numbers (date of birth / passport number)"
      );
    } else {
      score -= 1.5;
      improve.push(
        isFinanceQuestion
          ? "give exact numbers — tuition amount, annual living cost, sponsor's income"
          : "clearly state the exact date of birth and passport number, digit by digit"
      );
      riskFlag = isFinanceQuestion
        ? "No specific figures given for a finance question"
        : "No date of birth / passport number detected";
    }
  }

  // Generic/rehearsed phrasing
  if (genericHits.length > 0) {
    score -= 1.5;
    improve.push(`avoid generic phrases like "${genericHits[0]}" — interviewers read these as rehearsed`);
    if (!riskFlag) riskFlag = "Generic/rehearsed-sounding phrase used";
  }

  // Filler word ratio
  if (fillerRatio > 0.06) {
    score -= 1;
    improve.push("reduce filler words (um, like, actually) to sound more confident");
  }

  // Pace sanity check (very rough, since transcript timing is approximate)
  if (wpm > 0 && wpm < 60 && answer.durationSec > 20) {
    improve.push("try to keep a steadier pace — long pauses can come across as underprepared");
  }

  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));

  return {
    questionId: question.id,
    score,
    strengths: strengths.length > 0 ? strengths.map(capitalizeSentence) : ["Answered the question directly."],
    improve: improve.length > 0 ? improve.map(capitalizeSentence) : ["Solid answer — no major issues found."],
    riskFlag,
  };
}

function capitalizeSentence(s: string): string {
  const clean = s.trim().replace(/\.$/, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1) + ".";
}

export function computeFeedback(answers: Answer[], questions: InterviewQuestion[]): Feedback {
  const perQuestion = answers.map((a) => {
    const q = questions.find((qq) => qq.id === a.questionId)!;
    return analyzeAnswer(a, q);
  });

  const avgScore = perQuestion.reduce((s, p) => s + p.score, 0) / (perQuestion.length || 1);
  const overallScore = Math.round(avgScore * 10) / 10;

  const risks = perQuestion.filter((p) => p.riskFlag).map((p) => p.riskFlag);
  const strongQuestions = perQuestion.filter((p) => p.score >= 7);

  const topStrengths =
    strongQuestions.length > 0
      ? strongQuestions.slice(0, 2).map((p, i) => `Strong Q${i + 1} answer`)
      : ["Completed all questions"];

  const topRisks = risks.length > 0 ? Array.from(new Set(risks)).slice(0, 2) : [];

  // Aggregate a short, de-duplicated action plan from every question's
  // "improve" points -- this becomes the final "what to fix next" list.
  const improveSentences = perQuestion
    .flatMap((p) => p.improve)
    .map((s) => s.replace(/\.$/, "").trim())
    .filter((s) => s && !/^solid answer/i.test(s));
  const topImprovements = Array.from(new Set(improveSentences)).slice(0, 5);

  const readiness: Feedback["overall"]["readiness"] =
    overallScore >= 7.5 ? "Ready" : overallScore >= 5 ? "Needs Practice" : "Not Ready";

  const summary =
    readiness === "Ready"
      ? "Overall this is a solid set of answers — specific details and steady delivery came through in most responses. Keep practicing the weaker answers flagged below before the real interview."
      : readiness === "Needs Practice"
      ? "There's a reasonable foundation here, but several answers leaned generic or lacked concrete detail. Focus on adding specific numbers, names, and facts to the flagged questions before your real interview."
      : "Several answers were too short, too generic, or missing key specifics an interviewer would probe for. Spend more time preparing concrete details — real figures, real module names, a real post-study plan — before attempting the real interview.";

  return {
    perQuestion,
    overall: {
      score: overallScore,
      summary,
      topStrengths,
      topRisks,
      topImprovements,
      readiness,
    },
  };
}
