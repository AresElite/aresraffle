export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  age?: number;
  sport?: string;
  level?: string;
  position?: string;
  team?: string;
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
  reactionTimeMs?: number;
  accuracyPercentage?: number;
  correctResponses?: number;
  falseStarts?: number;
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
  interestLevel: string;
  recommendedNextStep: string;
  contacted: boolean;
  tags: string[];
  notes?: string;
}

export interface Contact {
  id: string;
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

// ─── Upgraded Event-Isolated Schema ───────────────────────────────────────────

export interface Event {
  id: string;
  name: string;
  type: "conference" | "trade show" | "team event" | "clinic" | "speaking event" | "internal demo" | "other";
  location: string;
  start_datetime: string; // ISO string
  end_datetime: string;   // ISO string
  timezone: string;
  description: string;
  internal_notes?: string;
  website_url?: string;
  instagram_url?: string;
  leaderboard_url?: string;
  raffle_live_url?: string;
  cta_url?: string;
  assigned_staff?: string[];
  status: "draft" | "scheduled" | "active" | "ended" | "archived";
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EventDay {
  id: string;
  event_id: string;
  day_number: number;
  date: string; // YYYY-MM-DD
  start_datetime: string;
  end_datetime: string;
  status: "active" | "inactive";
}

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  organization: string;
  role: "athlete" | "coach" | "parent" | "performance staff" | "medical staff" | "executive" | "vendor" | "other";
  sport_or_industry: string;
  age_group: "youth" | "high school" | "college" | "professional" | "tactical" | "corporate" | "other";
  consent_email: boolean;
  consent_sms: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventLead {
  id: string;
  event_id: string;
  event_day_id?: string;
  lead_id: string;
  referral_code?: string;
  lead_source: string;
  staff_member?: string;
  interest_type?: string;
  submission_timestamp: string;
  leaderboard_score?: number;
  raffle_eligible: boolean;
  follow_up_status: "pending" | "sequence_active" | "sequence_paused" | "converted" | "unsubscribed";
  crm_status?: string;
  biggest_challenge?: string;
  notes?: string;
}

export interface Prize {
  id: string;
  event_id: string;
  event_day_id?: string; // empty means grand prize
  name: string;
  description: string;
  value: number;
  sponsor?: string;
  quantity: number;
  eligibility_rules?: string;
  drawing_datetime: string;
  drawing_method: "random draw" | "leaderboard winner" | "staff-selected" | "hybrid";
  status: "active" | "drawn" | "cancelled";
}

export interface RaffleEntry {
  id: string;
  event_id: string;
  event_day_id?: string;
  prize_id?: string;
  lead_id: string;
  entry_timestamp: string;
  entry_count: number;
  winner_status: "eligible" | "winner" | "backup";
}

export interface RaffleDraw {
  id: string;
  event_id: string;
  prize_id: string;
  winner_lead_id: string;
  backup_winner_lead_ids: string[];
  drawing_timestamp: string;
  drawn_by: string;
  notes?: string;
}

export interface LeaderboardEntry {
  id: string;
  event_id: string;
  event_day_id?: string;
  lead_id: string;
  category: "GUST" | "RRT" | "GoNoGo" | "CRT";
  score: number;
  rank?: number;
  timestamp: string;
  ballsBlocked?: number;
  bombsDodged?: number;
  ballsBlockedAverage?: number;
  bombsDodgedAverage?: number;
  multiplier?: number;
  bonus?: number;
  reactionTimeMs?: number;
  accuracyPercentage?: number;
  correctResponses?: number;
  falseStarts?: number;
}

export interface EmailSequence {
  id: string;
  event_id: string;
  name: string;
  status: "enabled" | "disabled" | "paused";
  trigger_type: "event_end";
  trigger_offset: number; // offset in hours/days
  created_at: string;
}

export interface EmailMessage {
  id: string;
  sequence_id: string;
  subject: string;
  body: string;
  send_offset: number; // offset in hours/days
  status: "active" | "inactive";
}

export interface EmailLog {
  id: string;
  event_id: string;
  lead_id: string;
  message_id: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  unsubscribed_at?: string;
  status: "scheduled" | "sent" | "failed" | "opened" | "clicked" | "replied" | "unsubscribed";
}
