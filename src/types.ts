export type GroupStatus = 'not_started' | 'in_progress' | 'submitted' | 'reviewed';

export interface Topic {
  id: string;
  number: number;
  title: string;
  scenario: string;
  iconType: 'shield' | 'image' | 'music' | 'file-badge';
  groupNumbers: number[];
  color: 'indigo' | 'sky' | 'purple' | 'emerald';
}

export interface Question {
  id: string;
  order: number;
  prompt: string;
  hint: string;
}

export interface GroupSubmission {
  groupId: number;
  groupName: string;
  topicId: string;
  answer1: string;
  answer2: string;
  answer3: string;
  status: GroupStatus;
  submittedAt: string | null;
  updatedAt: string;
  wordCount: number;
  deviceId?: string;
}

export interface TeacherFeedback {
  groupId: number;
  generalComment: string;
  strengths: string;
  improvements: string;
  suggestions: string;
  reviewedAt: string | null;
  isPublished: boolean;
}

export interface ClassSession {
  id: string;
  className: string;
  schoolName: string;
  teacherName: string;
  subject: string;
  sessionTitle: string;
  isLocked: boolean;
  pinCode: string;
  appUrl?: string;
  createdAt: string;
  topics: Topic[];
  questions: Question[];
  submissions: Record<number, GroupSubmission>;
  feedbacks: Record<number, TeacherFeedback>;
}

export interface BroadcastEvent {
  type: 'INIT' | 'SUBMISSION_UPDATED' | 'FEEDBACK_UPDATED' | 'SESSION_UPDATED' | 'RESET_ALL';
  data?: any;
  timestamp: string;
}
