export const WEEKS = [
  {
    number: 1,
    mission: "Complete every planned session. Do not miss one.",
    focusQuestion: "What is one habit I performed consistently this week without being reminded?"
  },
  {
    number: 2,
    mission: "Track your recovery. Log your sleep every morning.",
    focusQuestion: "What did I do in training this week that I would not have done six months ago?"
  },
  {
    number: 3,
    mission: "Show up to every session with a written training intention.",
    focusQuestion: "Where did I take ownership of my development without being told?"
  },
  {
    number: 4,
    mission: "Complete your Month 1 Check-In at the end of this week.",
    focusQuestion: "What small change to my daily routine would make next week better?"
  },
  {
    number: 5,
    mission: "Seek one difficult training moment this week — and study it.",
    focusQuestion: "What was the hardest moment this week and what did it reveal?"
  },
  {
    number: 6,
    mission: "After every session, write one challenge and what you tried.",
    focusQuestion: "Describe a mistake you made. What did you try? What did you learn?"
  },
  {
    number: 7,
    mission: "Identify your most common match mistake. Create a practice scenario to face it.",
    focusQuestion: "If you could change one competitive behaviour right now, what would it be?"
  },
  {
    number: 8,
    mission: "Complete a full competition review. Do not skip the decision section.",
    focusQuestion: "Looking at the last four weeks: what pattern do you notice?"
  },
  {
    number: 9,
    mission: "Write your performance plan before your most important session or match.",
    focusQuestion: "What does competing at your best actually look like — specifically?"
  },
  {
    number: 10,
    mission: "Identify one competitive behaviour to express in your next match.",
    focusQuestion: "Describe a decision you made under pressure. Was it right?"
  },
  {
    number: 11,
    mission: "Design and test your pre-competition routine this week.",
    focusQuestion: "What separates the athletes you want to beat from those you struggle against?"
  },
  {
    number: 12,
    mission: "Complete the Capstone preparation. Review Months 1 and 2.",
    focusQuestion: "In 12 weeks, what has changed about how you approach your development?"
  }
];

export const PHASE_LABELS: Record<number, string> = {
  0: "Establishment",
  1: "Foundation",
  2: "Intensification",
  3: "Performance Expression",
  4: "Capstone"
};

export const PHASE_COLORS: Record<number, string> = {
  0: "#0B7DF1", // Blue
  1: "#10AC6E", // Green
  2: "#F5B809", // Yellow
  3: "#FF4936", // Red
  4: "#111111"  // Black
};

export const DIMENSIONS = [
  { id: "effort", label: "Effort" },
  { id: "focus", label: "Focus" },
  { id: "consistency", label: "Consistency" },
  { id: "recovery", label: "Recovery" },
  { id: "ownership", label: "Ownership" }
];
