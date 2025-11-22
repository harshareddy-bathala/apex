import type {
  ChatContact,
  CommunityPost,
  DailyCheckIn,
  Habit,
  Homework,
  PeerMessage,
  ResourceItem,
  StudentProfile,
  Test,
} from '@/types';

const DEFAULT_BACKEND_URL =
  import.meta.env.VITE_MENTOR_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';
const SSE_PREFIX = 'data:';
const DONE_MARKER = '[DONE]';

type Nullable<T> = T | null;

export type StudentProfileRecord = Partial<StudentProfile> & {
  id: string;
  onboardingComplete?: boolean;
  role?: 'student' | 'teacher';
};

export interface UserDocRecord {
  uid: string;
  email: string;
  role: 'student' | 'teacher';
  createdAt: string;
  updatedAt: string;
}

export type StudentGoalsPayload = Partial<
  Pick<StudentProfile, 'currentGoals' | 'shortTermGoals' | 'longTermGoals' | 'interests' | 'careerAspirations' | 'dreamJob'>
>;

interface GoalsResponse {
  goals: StudentGoalsPayload | null;
}

interface HomeworkResponse {
  homework: Homework[];
}

interface HomeworkUpdateResponse {
  homework: Homework;
}

interface TestsResponse {
  tests: Test[];
}

interface PeerContactsResponse {
  peers: ChatContact[];
}

interface PeerMessagesResponse {
  messages: PeerMessage[];
}

export interface CreateAssignmentPayload {
  title: string;
  classId: string;
  subject?: string;
  type?: string;
  dueDate?: string;
  description?: string;
  instructions?: string;
  attachments?: string[];
  studentIds?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime?: number;
}

export interface AssignmentRecord extends CreateAssignmentPayload {
  id: string;
  teacherId: string;
  createdAt: string;
}

export interface AttendanceRecordPayload {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface AttendancePayload {
  classId: string;
  date: string;
  records: AttendanceRecordPayload[];
  notes?: string;
}

export interface AttendanceRecordResponse extends AttendancePayload {
  id: string;
  teacherId: string;
  createdAt: string;
}

export interface TimetableEntryPayload {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  location?: string;
}

export interface UpsertTimetablePayload {
  classId: string;
  weekOf: string;
  entries: TimetableEntryPayload[];
}

export interface TimetableRecord extends UpsertTimetablePayload {
  id: string;
  teacherId: string;
  updatedAt: string;
}

export interface AnalyticsSignal {
  category: string;
  description: string;
  source: Record<string, unknown>;
}

export interface AnalyticsAlert {
  studentId: string;
  studentName?: string;
  riskScore: number;
  signals: AnalyticsSignal[];
  aiSummary?: string;
}

interface AnalyticsAlertsResponse {
  alerts: AnalyticsAlert[];
}

export interface CreateCommunityPostPayload {
  content: string;
  subject?: string;
  tags?: string[];
  parentId?: string;
}

interface CommunityFeedResponse {
  posts: CommunityPost[];
}

export interface UploadResourcePayload {
  title: string;
  subject: string;
  topic?: string;
  chapter?: string;
  url: string;
  description?: string;
  tags?: string[];
  grade?: string;
}

interface ResourcesResponse {
  resources: ResourceItem[];
}

interface HabitsResponse {
  habits: Habit[];
}

export interface CreateHabitPayload {
  name: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

export interface HabitCheckinPayload {
  habitId: string;
  completed: boolean;
  date?: string;
}

const ensureResponseBody = (response: Response): ReadableStream<Uint8Array> => {
  if (!response.body) {
    throw new Error('Backend response is missing a readable body');
  }
  return response.body;
};

const normalizeSseLine = (line: string): string | null => {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed === DONE_MARKER) {
    return DONE_MARKER;
  }
  return trimmed.startsWith(SSE_PREFIX) ? trimmed.slice(SSE_PREFIX.length).trim() : trimmed;
};

const apiUrl = (path: string): string => `${DEFAULT_BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;

export async function getStudentProfile(token: string): Promise<Nullable<StudentProfileRecord>> {
  const response = await fetch(apiUrl('/profile'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load profile (${response.status}): ${errorText}`);
  }

  return (await response.json()) as StudentProfileRecord;
}

interface StreamOnboardingChatOptions {
  token: string;
  message: string;
  onData: (chunk: string) => void;
  onComplete?: () => void;
  signal?: AbortSignal;
}

export async function streamOnboardingChat({
  token,
  message,
  onData,
  onComplete,
  signal,
}: StreamOnboardingChatOptions): Promise<void> {
  const response = await fetch(apiUrl('/onboarding/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Onboarding chat failed (${response.status}): ${errorText}`);
  }

  const reader = ensureResponseBody(response).getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let streamComplete = false;

  const flushBuffer = (): void => {
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      const normalized = normalizeSseLine(line);
      if (normalized === DONE_MARKER) {
        streamComplete = true;
        onComplete?.();
        return;
      }
      if (normalized) {
        onData(normalized);
      }
      newlineIndex = buffer.indexOf('\n');
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      flushBuffer();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    flushBuffer();
    if (streamComplete) {
      break;
    }
  }

  if (!streamComplete) {
    onComplete?.();
  }
}

export async function updateProfile(token: string, data: Record<string, unknown>): Promise<StudentProfileRecord> {
  const response = await fetch(apiUrl('/profile/update'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update profile (${response.status}): ${errorText}`);
  }

  return (await response.json()) as StudentProfileRecord;
}

export async function postCheckIn(token: string, data: Record<string, unknown>): Promise<DailyCheckIn> {
  const response = await fetch(apiUrl('/checkin'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit check-in (${response.status}): ${errorText}`);
  }

  return (await response.json()) as DailyCheckIn;
}

export async function getTodayCheckIn(token: string): Promise<DailyCheckIn | null> {
  const response = await fetch(apiUrl('/checkin/today'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If endpoint doesn't exist yet or fails, return null to be safe
    return null;
  }

  const data = await response.json();
  // Check if object is empty (no check-in)
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return data as DailyCheckIn;
}

export async function getGoals(token: string): Promise<GoalsResponse> {
  const response = await fetch(apiUrl('/goals'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load goals (${response.status}): ${errorText}`);
  }

  return (await response.json()) as GoalsResponse;
}

export async function updateGoals(token: string, goals: StudentGoalsPayload): Promise<GoalsResponse> {
  const response = await fetch(apiUrl('/goal'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ goals }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save goals (${response.status}): ${errorText}`);
  }

  return (await response.json()) as GoalsResponse;
}

export async function getHomework(token: string): Promise<HomeworkResponse> {
  const response = await fetch(apiUrl('/homework'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load homework (${response.status}): ${errorText}`);
  }

  return (await response.json()) as HomeworkResponse;
}

export async function getTests(token: string): Promise<TestsResponse> {
  const response = await fetch(apiUrl('/tests'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load tests (${response.status}): ${errorText}`);
  }

  return (await response.json()) as TestsResponse;
}

export type HomeworkUpdatePayload = Partial<Pick<Homework, 'status' | 'notes'>>;

export async function updateHomework(
  token: string,
  homeworkId: string,
  payload: HomeworkUpdatePayload,
): Promise<Homework> {
  const response = await fetch(apiUrl(`/homework/${homeworkId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update homework (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as HomeworkUpdateResponse;
  return data.homework;
}

export async function getPeerContacts(token: string, search?: string): Promise<PeerContactsResponse> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await fetch(apiUrl(`/peers${query}`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load peers (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PeerContactsResponse;
}

export async function getPeerMessages(token: string, peerId: string): Promise<PeerMessagesResponse> {
  const response = await fetch(apiUrl(`/peer/messages/${peerId}`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load conversation (${response.status}): ${errorText}`);
  }

  return (await response.json()) as PeerMessagesResponse;
}

export interface SendPeerMessagePayload {
  recipientId: string;
  content: string;
}

export async function sendPeerMessage(token: string, payload: SendPeerMessagePayload): Promise<PeerMessage> {
  const response = await fetch(apiUrl('/peer/message'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send message (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { message: PeerMessage };
  return data.message;
}

export async function createAssignment(token: string, data: CreateAssignmentPayload): Promise<AssignmentRecord> {
  const response = await fetch(apiUrl('/assignment'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create assignment (${response.status}): ${errorText}`);
  }

  return (await response.json()) as AssignmentRecord;
}

export async function createStudentUserDoc(uid: string, email: string): Promise<UserDocRecord> {
  const response = await fetch(apiUrl('/auth/create-user-doc'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uid, email }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create user doc (${response.status}): ${errorText}`);
  }

  return (await response.json()) as UserDocRecord;
}

export async function postAttendance(token: string, data: AttendancePayload): Promise<AttendanceRecordResponse> {
  const response = await fetch(apiUrl('/attendance'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to record attendance (${response.status}): ${errorText}`);
  }

  return (await response.json()) as AttendanceRecordResponse;
}

export async function upsertTimetable(token: string, data: UpsertTimetablePayload): Promise<TimetableRecord> {
  const response = await fetch(apiUrl('/timetable'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update timetable (${response.status}): ${errorText}`);
  }

  return (await response.json()) as TimetableRecord;
}

export async function getAnalyticsAlerts(token: string): Promise<AnalyticsAlertsResponse> {
  const response = await fetch(apiUrl('/analytics/alerts'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load analytics alerts (${response.status}): ${errorText}`);
  }

  return (await response.json()) as AnalyticsAlertsResponse;
}

export async function getCommunityFeed(
  token: string,
  params?: { subject?: string; query?: string; limit?: number },
): Promise<CommunityFeedResponse> {
  const url = new URL(apiUrl('/community/feed'));
  if (params?.subject) {
    url.searchParams.set('subject', params.subject);
  }
  if (params?.query) {
    url.searchParams.set('q', params.query);
  }
  if (params?.limit) {
    url.searchParams.set('limit', String(params.limit));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load community feed (${response.status}): ${errorText}`);
  }

  return (await response.json()) as CommunityFeedResponse;
}

export async function createCommunityPost(
  token: string,
  payload: CreateCommunityPostPayload,
): Promise<CommunityPost> {
  const response = await fetch(apiUrl('/community/post'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to publish post (${response.status}): ${errorText}`);
  }

  return (await response.json()) as CommunityPost;
}

export async function toggleCommunityUpvote(token: string, postId: string): Promise<CommunityPost> {
  const response = await fetch(apiUrl(`/community/post/${postId}/upvote`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to update upvote (${response.status}): ${errorText}`);
  }

  return (await response.json()) as CommunityPost;
}

export async function getResources(
  token: string,
  params?: { subject?: string; topic?: string; chapter?: string; query?: string; limit?: number },
): Promise<ResourcesResponse> {
  const url = new URL(apiUrl('/resources'));
  if (params?.subject) {
    url.searchParams.set('subject', params.subject);
  }
  if (params?.topic) {
    url.searchParams.set('topic', params.topic);
  }
  if (params?.chapter) {
    url.searchParams.set('chapter', params.chapter);
  }
  if (params?.query) {
    url.searchParams.set('q', params.query);
  }
  if (params?.limit) {
    url.searchParams.set('limit', String(params.limit));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load resources (${response.status}): ${errorText}`);
  }

  return (await response.json()) as ResourcesResponse;
}

export async function uploadResource(token: string, payload: UploadResourcePayload): Promise<ResourceItem> {
  const response = await fetch(apiUrl('/resources'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload resource (${response.status}): ${errorText}`);
  }

  return (await response.json()) as ResourceItem;
}

export async function getHabits(token: string): Promise<HabitsResponse> {
  const response = await fetch(apiUrl('/habits'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load habits (${response.status}): ${errorText}`);
  }

  return (await response.json()) as HabitsResponse;
}

export async function createHabit(token: string, payload: CreateHabitPayload): Promise<Habit> {
  const response = await fetch(apiUrl('/habits'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create habit (${response.status}): ${errorText}`);
  }

  return (await response.json()) as Habit;
}

export async function checkinHabit(token: string, payload: HabitCheckinPayload): Promise<void> {
  const response = await fetch(apiUrl('/habits/checkin'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update habit (${response.status}): ${errorText}`);
  }
}

export async function deleteAssignment(token: string, assignmentId: string): Promise<void> {
  const response = await fetch(apiUrl(`/assignment/${assignmentId}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete assignment (${response.status}): ${errorText}`);
  }
}

