export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string; // YYYY-MM-DD
  age?: number;
  sport?: string;
  level?: string;
  position?: string;
  team?: string; // or school
  graduationYear?: string;
  parentGuardianName?: string;
  parentGuardianEmail?: string;
  parentGuardianPhone?: string;
  dominantHand?: string;
  dominantEye?: string;
  correctiveLenses?: string;
  concussionHistory?: string;
  performanceGoal?: string;
  interestedInEvaluation?: string;
  interestedInTraining?: string;
  consentAccepted: boolean;
  createdAt: string;
  raffleId?: number;
  tickets?: number;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location?: string;
  createdAt: string;
}

export interface Drill {
  id: string;
  name: string;
  platform: string;
  metricsTracked: string[];
}

export type DrillCategory = "GUST" | "RRT" | "CRT" | "GoNoGo";

export interface Result {
  id: string;
  athleteId: string;
  eventId: string;
  drillId: string;
  drillCategory: DrillCategory;
  trialNumber: number;
  ticketAwarded: boolean;

  // Raw Reaction Time (RRT)
  reactionTimeMs?: number;

  // Choice Reaction Time (CRT)
  accuracyPercentage?: number;

  // Go/No-Go
  correctResponses?: number;
  incorrectResponses?: number;
  falseStarts?: number;

  // GUST specific
  score?: number;
  ballsBlocked?: number;
  ballsBlockedAverage?: number;
  bombsDodged?: number;
  bombsDodgedAverage?: number;
  multiplier?: number;
  bonus?: number;

  compositeScore: number;
  createdAt: string;
}

export interface FollowUp {
  id: string;
  athleteId: string;
  eventId: string;
  interestLevel: string; // 'High', 'Medium', 'Low'
  recommendedNextStep: string; // 'Evaluation', 'Training', 'Coach Contact'
  contacted: boolean;
  tags: string[]; // 'Hot Lead', 'Needs Visual Processing Review', etc.
  notes?: string;
}

export interface Contact {
  id: string; // Notion Page ID
  name: string;
  email: string;
  phone: string;
  tickets: number;
  raffleID: number;
}

export interface NotionConfig {
  token: string;
  databaseId: string;
}

export type TabType = "add-contact" | "contacts-list" | "draw-winner";
