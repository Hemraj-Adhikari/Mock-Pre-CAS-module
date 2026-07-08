export const TOTAL_TEST_MINUTES = 45;

export type InterviewQuestion = {
  id: string;
  category: "Identity Verification" | "Motivation" | "Course & University" | "Academic Background" | "Finance & Sponsorship" | "Post-Study Plan" | "General";
  question: string;
  hint: string;
  timeLimitSeconds: number;
  // Some identity-check questions (e.g. "show your passport") aren't scored
  // like a normal spoken answer -- they're a completion/visual check.
  verificationOnly?: boolean;
  // A short "how to structure this answer" framework shown only in Study
  // Prep mode -- one level more actionable than the in-interview hint,
  // since here there's no time pressure and the student is meant to
  // actually plan the answer before ever facing the camera.
  prepTip: string;
};

// Maps each category to an accent color used across the UI (card top-strip,
// category badge, folder tab) and in the PDF report -- keeps every surface
// visually consistent without hardcoding colors in every component.
export const CATEGORY_ACCENT: Record<InterviewQuestion["category"], string> = {
  "Identity Verification": "blue",
  Motivation: "gold",
  "Course & University": "green",
  "Academic Background": "purple",
  "Finance & Sponsorship": "red",
  "Post-Study Plan": "navy",
  General: "teal",
};

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// PCI (Pre-CAS Interview) / UEL-style credibility interview question bank.
// Grouped by the categories UK Home Office / university interviewers
// typically probe for genuine-student credibility checks.
export const QUESTION_BANK: InterviewQuestion[] = [
  // ---- Identity Verification (opening ID check, mirrors the real PCI) ----
  {
    id: "q0",
    category: "Identity Verification",
    question: "Please state your full name and date of birth clearly for the camera.",
    hint: "Say your full legal name exactly as printed on your passport, then your date of birth (DD/MM/YYYY).",
    timeLimitSeconds: 30,
    prepTip:
      "Write your name and DOB exactly as on the passport on a sticky note and read it aloud 3-4 times until it's automatic — no hesitation, no rounding the date.",
  },
  {
    id: "q0b",
    category: "Identity Verification",
    question: "Please state your passport number and your permanent address as shown on your passport.",
    hint: "Give the passport number digit by digit, then your full permanent address — tole/street, ward, municipality, district, and country.",
    timeLimitSeconds: 45,
    prepTip:
      "Practice reading your passport number digit-by-digit, then say your full address in one clean sequence: tole/street -> ward -> municipality -> district -> country.",
  },
  {
    id: "q0c",
    category: "Identity Verification",
    question: "Please hold up your passport and show the photo page fully and clearly to the camera.",
    hint: "Hold the passport steady and close enough that the photo, name, and passport number are readable on camera.",
    timeLimitSeconds: 30,
    verificationOnly: true,
    prepTip:
      "Do a dry run: hold the actual passport at the distance and angle you'll use on the real call and check the photo page is fully readable, not just visible.",
  },

  // ---- Motivation ----
  {
    id: "q1",
    category: "Motivation",
    question: "Why do you want to study in the UK instead of Nepal or another country?",
    hint: "Be specific: course quality, industry recognition, career pathway. Avoid generic answers like 'better life'.",
    timeLimitSeconds: 90,
    prepTip:
      "Structure: (1) one specific reason the UK/this course beats local options, (2) one fact about the course/university that backs it up, (3) how it connects to your career goal. Avoid 'better life' phrasing entirely.",
  },
  {
    id: "q2",
    category: "Motivation",
    question: "Why did you choose to study now, at this stage of your life?",
    hint: "Connect it to a real event or decision in your academic/career timeline, not a vague 'right time' answer.",
    timeLimitSeconds: 60,
    prepTip:
      "Pick one real trigger event (finished a qualification, a job, a specific realisation) and build the timeline around it — don't just say 'the time felt right'.",
  },
  {
    id: "q3",
    category: "Motivation",
    question: "What makes you confident you'll succeed academically studying in English, in a new country?",
    hint: "Mention IELTS/PTE score, prior English-medium study, or specific preparation you've done.",
    timeLimitSeconds: 60,
    prepTip:
      "Lead with your actual IELTS/PTE band score, then one concrete thing you've done to prepare for English-medium study (a course, past English-medium schooling, self-study routine).",
  },

  // ---- Course & University ----
  {
    id: "q4",
    category: "Course & University",
    question: "Why did you choose this specific university and this specific course?",
    hint: "Mention course modules, university ranking/strengths, and how it fits your career goal.",
    timeLimitSeconds: 90,
    prepTip:
      "Name 2 real facts about the university (ranking, a specific strength) and 2 real facts about the course (a module or approach) — write them down first so you're not inventing them live.",
  },
  {
    id: "q5",
    category: "Course & University",
    question: "What modules or units in this course are you most looking forward to, and why?",
    hint: "Name 2-3 real module titles from the course page and connect each to a specific goal.",
    timeLimitSeconds: 90,
    prepTip:
      "Open the actual course page, pick 2-3 real module titles, and write one sentence for each on why it matters to your goal — generic 'I like all of it' answers get flagged.",
  },
  {
    id: "q6",
    category: "Course & University",
    question: "Did you apply to any other universities or courses? Why is this one your first choice?",
    hint: "Honest, consistent answer — interviewers cross-check this against your application history.",
    timeLimitSeconds: 60,
    prepTip:
      "Decide your honest, consistent story now: which other unis/courses you applied to (if any) and why this one is first choice — and make sure it matches what's on your application.",
  },
  {
    id: "q7",
    category: "Course & University",
    question: "How does this course connect to what you studied previously in Nepal?",
    hint: "Draw a clear, logical line from your last qualification's subjects to this course's content.",
    timeLimitSeconds: 60,
    prepTip:
      "Draw a literal line: 'I studied [subject] in [qualification], which covers [specific overlap], and this course builds on that through [specific module/skill].'",
  },

  // ---- Academic Background ----
  {
    id: "q8",
    category: "Academic Background",
    question: "Tell me about your most recent qualification — what did you study and what was your result?",
    hint: "Know your exact grade/percentage/GPA, board/university name, and graduation year.",
    timeLimitSeconds: 60,
    prepTip:
      "Memorise the exact numbers: grade/percentage/GPA, board or university name, and graduation year. Don't approximate — interviewers probe exact figures.",
  },
  {
    id: "q9",
    category: "Academic Background",
    question: "Was there any gap in your education? If so, explain what you were doing during that time.",
    hint: "Be honest and specific — work, family responsibility, exam preparation. Unexplained gaps raise flags.",
    timeLimitSeconds: 60,
    prepTip:
      "If there's a gap, prepare one honest sentence per gap period (work, family responsibility, exam prep) — vague or unexplained gaps are a major credibility flag.",
  },
  {
    id: "q10",
    category: "Academic Background",
    question: "Which subject were you strongest in during school/college, and how does it relate to this course?",
    hint: "Pick a subject that genuinely links to your chosen course, not just your best grade.",
    timeLimitSeconds: 60,
    prepTip:
      "Choose a subject that has a real, explainable link to your course — not just your highest grade — and prepare one sentence connecting the two.",
  },

  // ---- Finance & Sponsorship ----
  {
    id: "q11",
    category: "Finance & Sponsorship",
    question: "Who is sponsoring your studies and how will they fund your tuition and living costs?",
    hint: "Know exact figures: tuition, living cost per year, sponsor's income source and relationship to you.",
    timeLimitSeconds: 90,
    prepTip:
      "Know the exact numbers cold: annual tuition, annual living cost, who the sponsor is, and their income source. Say the relationship clearly (father/mother/self/loan).",
  },
  {
    id: "q12",
    category: "Finance & Sponsorship",
    question: "What is the total cost of your course and living expenses for the full duration, and how was that money arranged?",
    hint: "State the exact tuition fee, annual living cost (e.g. as per UKVI's maintenance requirement), and source of funds.",
    timeLimitSeconds: 90,
    prepTip:
      "Add up the full-course tuition + living costs for the whole duration and know the total figure, plus exactly how that amount was arranged (savings, loan, sponsor income).",
  },
  {
    id: "q13",
    category: "Finance & Sponsorship",
    question: "What does your sponsor do for a living, and how long have they been earning this income?",
    hint: "Name the sponsor's occupation/business, approximate years of income history, and relationship to you.",
    timeLimitSeconds: 60,
    prepTip:
      "Prepare the sponsor's occupation/business name, roughly how many years they've earned this income, and your relationship to them — in one short, confident sentence.",
  },
  {
    id: "q14",
    category: "Finance & Sponsorship",
    question: "If your sponsorship suddenly stopped, what is your backup plan to cover your costs?",
    hint: "A believable, specific contingency (second sponsor, savings buffer) shows real financial planning.",
    timeLimitSeconds: 60,
    prepTip:
      "Have one real backup plan ready (a second sponsor, a savings buffer, a specific alternative) — 'I don't know' on this question is a strong risk flag.",
  },

  // ---- Post-Study Plan ----
  {
    id: "q15",
    category: "Post-Study Plan",
    question: "What are your plans after completing this course? Will you return to Nepal?",
    hint: "Show a genuine, believable post-study plan tied to your home country or Graduate Route rules.",
    timeLimitSeconds: 90,
    prepTip:
      "Build a genuine, specific post-study plan tied to Nepal or the Graduate Route — a role, industry, or family business you can actually name.",
  },
  {
    id: "q16",
    category: "Post-Study Plan",
    question: "How will this specific degree help your career back in Nepal?",
    hint: "Name a real industry, job role, or family business in Nepal where this qualification is directly useful.",
    timeLimitSeconds: 60,
    prepTip:
      "Name a real job role, industry, or business in Nepal where this exact degree is directly useful — not a generic 'it will help my career'.",
  },
  {
    id: "q17",
    category: "Post-Study Plan",
    question: "Do you plan to use the Graduate Route visa? If so, what would you do during that period?",
    hint: "Be clear and honest about post-study work plans, and how they still lead back to Nepal eventually.",
    timeLimitSeconds: 60,
    prepTip:
      "Decide your honest position on the Graduate Route now (yes/no/undecided) and prepare one sentence on what you'd do during that period that still ends with returning to Nepal.",
  },

  // ---- General ----
  {
    id: "q18",
    category: "General",
    question: "What do you know about the city and university where you will be studying?",
    hint: "Mention the city, campus facilities, and student life basics — shows genuine research.",
    timeLimitSeconds: 60,
    prepTip:
      "Look up the city and campus for 5 minutes: one fact about the city, one about campus facilities, one about student life — shows real research, not a script.",
  },
  {
    id: "q19",
    category: "General",
    question: "Do you have any family or relatives currently living in the UK?",
    hint: "Answer honestly and precisely — undisclosed or inconsistent ties are a major credibility risk.",
    timeLimitSeconds: 45,
    prepTip:
      "Answer honestly and know the exact detail (name, relationship, visa status) if you do have relatives in the UK — undisclosed ties are a major credibility risk.",
  },
  {
    id: "q20",
    category: "General",
    question: "How will you manage accommodation and daily life as a new international student?",
    hint: "Mention a concrete plan — university halls, agency, or contact — not just 'I will manage'.",
    timeLimitSeconds: 60,
    prepTip:
      "Have one concrete accommodation plan ready (university halls, an agency name, a specific contact) rather than 'I will manage when I get there'.",
  },
];

export const CATEGORIES = Array.from(new Set(QUESTION_BANK.map((q) => q.category)));
