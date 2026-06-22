export const WEEKS = [
  {
    number: 1,
    phase: 1,
    colour: '#10AC6E',
    mission: 'Complete every planned session. Do not miss one. If something forces a change, reschedule within 48 hours.',
    focusQuestion: 'What is one habit I performed consistently this week without being reminded?',
  },
  {
    number: 2,
    phase: 1,
    colour: '#10AC6E',
    mission: 'Track your recovery. Log your sleep every morning this week. Notice the connection between sleep and training quality.',
    focusQuestion: 'What did I do in training this week that I would not have done six months ago?',
  },
  {
    number: 3,
    phase: 1,
    colour: '#10AC6E',
    mission: 'Show up to every session with a written training intention. Before you start: "Today I am working on ___."',
    focusQuestion: 'Where did I take ownership of my development — not because a coach told me to?',
  },
  {
    number: 4,
    phase: 1,
    colour: '#10AC6E',
    mission: 'Complete your Month 1 Check-In at the end of this week. Review Weeks 1–3 before you start.',
    focusQuestion: 'What small change to my daily routine would make next week better?',
  },
  {
    number: 5,
    phase: 2,
    colour: '#F5B809',
    mission: 'Seek one difficult training moment this week — not to survive it, but to study it. What does it tell you?',
    focusQuestion: 'What was the hardest moment in training this week, and what did it reveal about where you need to develop?',
  },
  {
    number: 6,
    phase: 2,
    colour: '#F5B809',
    mission: 'After every training session this week, write one specific thing that challenged you and what you tried in response.',
    focusQuestion: 'Describe a mistake you made this week. What did you try? What did you learn?',
  },
  {
    number: 7,
    phase: 2,
    colour: '#F5B809',
    mission: 'Identify your most common mistake in matches right now. Create a practice scenario that makes you face it. Discuss with your coach.',
    focusQuestion: 'If you could change one competitive behaviour right now — not physical ability, but behaviour — what would it be?',
  },
  {
    number: 8,
    phase: 2,
    colour: '#F5B809',
    mission: 'Complete a full competition review this week. Do not skip the decision-making section. That is where the real learning is.',
    focusQuestion: 'Looking at the last four weeks: what pattern do you notice? What does it tell you?',
  },
  {
    number: 9,
    phase: 3,
    colour: '#FF4936',
    mission: 'Before your most important session or match this week, write your performance plan: court strategy, emotional approach, physical focus. Review it after.',
    focusQuestion: 'What does "competing at my best" actually look like — specifically, not generally?',
  },
  {
    number: 10,
    phase: 3,
    colour: '#FF4936',
    mission: 'Identify one competitive behaviour you want to express in your next match. Not a technical goal — a behavioural one. Act on it.',
    focusQuestion: 'Describe one decision you made under pressure this week. Was it right? What would you do differently?',
  },
  {
    number: 11,
    phase: 3,
    colour: '#FF4936',
    mission: 'Design your pre-competition routine this week and test it. It should be no longer than 60 minutes. Cover physical, technical and mental preparation.',
    focusQuestion: 'What competitive behaviour separates the athletes you want to beat from those you currently struggle against?',
  },
  {
    number: 12,
    phase: 3,
    colour: '#FF4936',
    mission: 'Complete the Capstone preparation. Review your Month 1 and Month 2 Check-Ins. Identify three pieces of evidence of improvement. Bring them to your review session.',
    focusQuestion: 'In 12 weeks, what has changed — not about your results, but about how you approach your development?',
  },
];

export const PHASE_LABELS: Record<number, string> = {
  0: 'Establishment',
  1: 'Foundation',
  2: 'Intensification',
  3: 'Performance Expression',
  4: 'Capstone',
};

export const PHASE_COLORS: Record<number, string> = {
  0: '#0B7DF1',
  1: '#10AC6E',
  2: '#F5B809',
  3: '#FF4936',
  4: '#111111',
};

export const PHASE_SUBTITLES: Record<number, string> = {
  0: 'Before Week 1. Establish your foundations, map your environment, and commit to the program.',
  1: 'Weeks 1–4. Build the habits. Establish the rhythms. Own the process.',
  2: 'Weeks 5–8. Seek challenge. Study difficulty. Adapt deliberately.',
  3: 'Weeks 9–12. Express your competitive identity. Perform under pressure.',
  4: 'Review. Evidence. Reflection. Signature.',
};

export const PHASE_PILLS: Record<number, string[]> = {
  0: ['Assessment', 'Values', 'Goals', 'Roadmap', 'Commitment'],
  1: ['Consistency', 'Ownership', 'Habits', 'Training Intent', 'Recovery'],
  2: ['Challenge', 'Adaptation', 'Mistakes', 'Competition', 'Patterns'],
  3: ['Performance Plans', 'Decisions', 'Behaviour', 'Routine', 'Identity'],
  4: ['Domain Review', 'Evidence', 'Reflection', 'Signature'],
};

export const DIMENSIONS = [
  { id: 'effort', label: 'Effort' },
  { id: 'focus', label: 'Focus' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'ownership', label: 'Ownership' },
];

export const MILESTONES = [
  'Regular local competition and match play',
  'First state-level competition entry',
  'First interstate training exposure or tour',
  'First state ranking event',
  'First national ranking event',
  'First Tennis Australia developmental program',
  'First national tournament entry',
  'First national ranking achieved',
  'First Tennis Australia pathway event',
  'First international exposure (training or competition)',
  'First ITF junior tournament entry',
];

export function getPhaseColour(phase: number): string {
  return PHASE_COLORS[phase] ?? PHASE_COLORS[0];
}

export function getPhaseForWeek(weekNum: number): number {
  if (weekNum === 0) return 0;
  if (weekNum <= 4) return 1;
  if (weekNum <= 8) return 2;
  if (weekNum <= 12) return 3;
  return 4;
}
