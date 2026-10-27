import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ClassSession, GroupSubmission, TeacherFeedback } from '../types.ts';
import { createInitialSession } from '../initialData.ts';
import { isSoundEnabled, setSoundEnabled, playNewSubmissionAlert, playSubmitSuccessSound, playReviewSavedSound } from '../utils/sound.ts';

interface SessionContextType {
  session: ClassSession | null;
  isLoading: boolean;
  isOnline: boolean;
  teacherToken: string | null;
  soundOn: boolean;
  lastUpdatedGroupId: number | null;
  isCloudSyncActive: boolean;
  loginTeacher: (pin: string) => Promise<{ success: boolean; error?: string }>;
  logoutTeacher: () => void;
  submitAnswers: (
    groupId: number,
    answers: { answer1: string; answer2: string; answer3: string },
    isDraft?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  saveFeedback: (
    groupId: number,
    feedback: {
      generalComment: string;
      strengths: string;
      improvements: string;
      suggestions: string;
      isPublished: boolean;
    },
    markReviewed?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (data: any) => Promise<{ success: boolean; error?: string }>;
  resetSession: (keepSettings?: boolean) => Promise<{ success: boolean; error?: string }>;
  toggleSound: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

const STORAGE_CACHE_KEY = 'classroom_session_cache_v2';

function getCachedOrInitialSession(): ClassSession {
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.submissions && parsed.topics) {
        return parsed;
      }
    }
  } catch {}
  return createInitialSession();
}

function saveLocalSession(s: ClassSession) {
  try {
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(s));
  } catch {}
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with cached or default session immediately so UI never hangs!
  const [session, setSession] = useState<ClassSession>(getCachedOrInitialSession);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCloudSyncActive, setIsCloudSyncActive] = useState<boolean>(false);
  const [teacherToken, setTeacherToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('teacher_token') || null;
    } catch {
      return null;
    }
  });
  const [soundOn, setSoundOnState] = useState<boolean>(() => isSoundEnabled());
  const [lastUpdatedGroupId, setLastUpdatedGroupId] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const cloudEventSourceRef = useRef<EventSource | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const teacherTokenRef = useRef(teacherToken);
  teacherTokenRef.current = teacherToken;

  // Track online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Multi-tab sync via BroadcastChannel
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('ptls_tab_sync');
        broadcastChannelRef.current = bc;
        bc.onmessage = (event) => {
          const { type, data } = event.data || {};
          if (type === 'SESSION_UPDATE' && data) {
            setSession(data);
          } else if (type === 'SUBMISSION_UPDATE' && data) {
            const { groupId, submission } = data;
            setSession((prev) => {
              const next = {
                ...prev,
                submissions: { ...prev.submissions, [groupId]: submission },
              };
              saveLocalSession(next);
              return next;
            });
            setLastUpdatedGroupId(groupId);
            setTimeout(() => setLastUpdatedGroupId(null), 3000);
          }
        };
      }
    } catch {}

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, []);

  // Cloud Sync Topic Name (used for Vercel/Static hosting)
  const getCloudTopic = useCallback((s?: ClassSession) => {
    const current = s || session;
    const cName = current.className ? current.className.toLowerCase().replace(/[^a-z0-9]/g, '') : '10a1';
    return `ptls_dth_tin10_${cName}`;
  }, [session]);

  // Publish to Cloud Relay (for Vercel / cross-device serverless sync)
  const publishToCloudRelay = useCallback(async (payload: any) => {
    try {
      const topic = getCloudTopic();
      await fetch(`https://ntfy.sh/${topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Cloud relay publish failed:', err);
    }
  }, [getCloudTopic]);

  // Connect to Cloud Relay (SSE via ntfy.sh) for serverless deployments like Vercel
  const setupCloudSync = useCallback((topicName: string) => {
    if (cloudEventSourceRef.current) {
      cloudEventSourceRef.current.close();
    }

    // 1. Poll recent messages to reconstruct submissions & feedback
    fetch(`https://ntfy.sh/${topicName}/json?poll=1`)
      .then((res) => res.text())
      .then((text) => {
        const lines = text.trim().split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.message) {
              const msg = JSON.parse(parsed.message);
              applyIncomingEvent(msg);
            }
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Open real-time SSE stream
    try {
      const sse = new EventSource(`https://ntfy.sh/${topicName}/sse`);
      cloudEventSourceRef.current = sse;
      setIsCloudSyncActive(true);

      sse.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.message) {
            const msg = JSON.parse(parsed.message);
            applyIncomingEvent(msg);
          }
        } catch {}
      };

      sse.onerror = () => {
        // Keeps trying to reconnect automatically
      };
    } catch (err) {
      console.warn('Cloud SSE setup error:', err);
    }
  }, []);

  // Helper to handle incoming events from both local Express server and Cloud Relay
  const applyIncomingEvent = (payload: any) => {
    if (!payload || !payload.type) return;

    if (payload.type === 'SUBMISSION_UPDATED') {
      const { groupId, submission } = payload;
      setSession((prev) => {
        const next = {
          ...prev,
          submissions: { ...prev.submissions, [groupId]: submission },
        };
        saveLocalSession(next);
        return next;
      });

      setLastUpdatedGroupId(groupId);
      setTimeout(() => setLastUpdatedGroupId(null), 4000);

      if (submission?.status === 'submitted' && teacherTokenRef.current) {
        playNewSubmissionAlert();
      }
    } else if (payload.type === 'FEEDBACK_UPDATED') {
      const { groupId, feedback, submission } = payload;
      setSession((prev) => {
        const next = {
          ...prev,
          feedbacks: { ...prev.feedbacks, [groupId]: feedback },
          submissions: submission ? { ...prev.submissions, [groupId]: submission } : prev.submissions,
        };
        saveLocalSession(next);
        return next;
      });
    } else if (payload.type === 'SESSION_UPDATED' || payload.type === 'RESET_ALL') {
      if (payload.session) {
        setSession(payload.session);
        saveLocalSession(payload.session);
      }
    }
  };

  // Initial Boot: Check Express API, or fallback to Cloud Sync (Vercel)
  useEffect(() => {
    let active = true;

    async function checkServer() {
      try {
        const res = await fetch('/api/session', { cache: 'no-cache' });
        // Check if response is JSON (not Vercel index.html fallback)
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (active && data && data.topics) {
            setSession(data);
            saveLocalSession(data);
            setupLocalExpressSSE();
            return;
          }
        }
      } catch {
        // Express not available (e.g. running on static Vercel)
      }

      // If we are on static hosting (like Vercel):
      if (active) {
        // Make sure we have a valid session
        const current = getCachedOrInitialSession();
        setSession(current);
        // Connect to Cloud Sync Relay so 12 phones and teacher screen sync in real-time!
        const topic = getCloudTopic(current);
        setupCloudSync(topic);
      }
    }

    function setupLocalExpressSSE() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const sse = new EventSource('/api/stream');
        eventSourceRef.current = sse;

        sse.addEventListener('init', (e: MessageEvent) => {
          try {
            const initial = JSON.parse(e.data);
            if (active && initial) {
              setSession(initial);
              saveLocalSession(initial);
            }
          } catch {}
        });

        sse.addEventListener('SUBMISSION_UPDATED', (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            applyIncomingEvent({ type: 'SUBMISSION_UPDATED', ...payload });
          } catch {}
        });

        sse.addEventListener('FEEDBACK_UPDATED', (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            applyIncomingEvent({ type: 'FEEDBACK_UPDATED', ...payload });
          } catch {}
        });

        sse.addEventListener('SESSION_UPDATED', (e: MessageEvent) => {
          try {
            const updated = JSON.parse(e.data);
            applyIncomingEvent({ type: 'SESSION_UPDATED', session: updated });
          } catch {}
        });

        sse.addEventListener('RESET_ALL', (e: MessageEvent) => {
          try {
            const reset = JSON.parse(e.data);
            applyIncomingEvent({ type: 'RESET_ALL', session: reset });
          } catch {}
        });
      } catch (err) {
        console.warn('Express SSE failed, falling back to cloud sync:', err);
        const topic = getCloudTopic();
        setupCloudSync(topic);
      }
    }

    checkServer();

    return () => {
      active = false;
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (cloudEventSourceRef.current) cloudEventSourceRef.current.close();
    };
  }, [getCloudTopic, setupCloudSync]);

  // Teacher Login
  const loginTeacher = useCallback(async (pin: string) => {
    try {
      // 1. Try Express backend
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setTeacherToken(data.token);
          sessionStorage.setItem('teacher_token', data.token);
          return { success: true };
        }
      }
    } catch {}

    // 2. Fallback for Vercel/Static deployment
    const currentPin = session.pinCode || 'gv10dth';
    if (pin && (pin === currentPin || pin === 'gv10dth')) {
      setTeacherToken(pin);
      try {
        sessionStorage.setItem('teacher_token', pin);
      } catch {}
      return { success: true };
    }
    return { success: false, error: 'Mã PIN không đúng. Mặc định: gv10dth' };
  }, [session.pinCode]);

  const logoutTeacher = useCallback(() => {
    setTeacherToken(null);
    try {
      sessionStorage.removeItem('teacher_token');
    } catch {}
  }, []);

  // Submit Answers (Dual: Express API + Cloud Relay fallback)
  const submitAnswers = useCallback(
    async (
      groupId: number,
      answers: { answer1: string; answer2: string; answer3: string },
      isDraft = false
    ) => {
      const gId = Number(groupId);
      const now = new Date().toISOString();
      const combinedText = `${answers.answer1 || ''} ${answers.answer2 || ''} ${answers.answer3 || ''}`;
      const wordCount = combinedText.trim().split(/\s+/).filter(Boolean).length;

      // Construct optimistic submission
      const existingSub = session.submissions[gId] || {
        groupId: gId,
        groupName: `Nhóm ${gId}`,
        topicId: gId <= 3 ? 'topic-1' : gId <= 6 ? 'topic-2' : gId <= 9 ? 'topic-3' : 'topic-4',
        answer1: '',
        answer2: '',
        answer3: '',
        status: 'not_started',
        submittedAt: null,
        updatedAt: now,
        wordCount: 0,
      };

      const updatedSub: GroupSubmission = {
        ...existingSub,
        answer1: answers.answer1 ?? existingSub.answer1,
        answer2: answers.answer2 ?? existingSub.answer2,
        answer3: answers.answer3 ?? existingSub.answer3,
        status: isDraft ? (existingSub.status === 'not_started' ? 'in_progress' : existingSub.status) : 'submitted',
        submittedAt: isDraft ? existingSub.submittedAt : (existingSub.submittedAt || now),
        updatedAt: now,
        wordCount,
      };

      // 1. Update local React state & LocalStorage immediately
      setSession((prev) => {
        const next = {
          ...prev,
          submissions: { ...prev.submissions, [gId]: updatedSub },
        };
        saveLocalSession(next);
        return next;
      });

      // Broadcast on multi-tab channel
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'SUBMISSION_UPDATE',
          data: { groupId: gId, submission: updatedSub },
        });
      }

      if (!isDraft) {
        playSubmitSuccessSound();
      }

      // 2. Try sending to Express server
      let serverSaved = false;
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupId: gId, ...answers, isDraft }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          serverSaved = true;
        }
      } catch {}

      // 3. If Express server wasn't reached (e.g. on Vercel), publish to Cloud Relay!
      if (!serverSaved) {
        await publishToCloudRelay({
          type: 'SUBMISSION_UPDATED',
          groupId: gId,
          submission: updatedSub,
        });
      }

      return { success: true };
    },
    [session, publishToCloudRelay]
  );

  // Save Teacher Feedback
  const saveFeedback = useCallback(
    async (
      groupId: number,
      feedback: {
        generalComment: string;
        strengths: string;
        improvements: string;
        suggestions: string;
        isPublished: boolean;
      },
      markReviewed = true
    ) => {
      const gId = Number(groupId);
      const now = new Date().toISOString();

      const updatedFeedback: TeacherFeedback = {
        groupId: gId,
        generalComment: feedback.generalComment || '',
        strengths: feedback.strengths || '',
        improvements: feedback.improvements || '',
        suggestions: feedback.suggestions || '',
        reviewedAt: now,
        isPublished: Boolean(feedback.isPublished),
      };

      // Update local state
      setSession((prev) => {
        const curSub = prev.submissions[gId];
        const nextSub = markReviewed && curSub ? { ...curSub, status: 'reviewed' as const } : curSub;
        const next = {
          ...prev,
          feedbacks: { ...prev.feedbacks, [gId]: updatedFeedback },
          submissions: nextSub ? { ...prev.submissions, [gId]: nextSub } : prev.submissions,
        };
        saveLocalSession(next);
        return next;
      });

      playReviewSavedSound();

      // Try Express backend
      let serverSaved = false;
      if (teacherToken) {
        try {
          const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${teacherToken}`,
            },
            body: JSON.stringify({ groupId: gId, ...feedback, markReviewed }),
          });
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            serverSaved = true;
          }
        } catch {}
      }

      // If serverless / Vercel, publish to Cloud Relay
      if (!serverSaved) {
        const curSub = session.submissions[gId];
        const nextSub = markReviewed && curSub ? { ...curSub, status: 'reviewed' as const } : curSub;
        await publishToCloudRelay({
          type: 'FEEDBACK_UPDATED',
          groupId: gId,
          feedback: updatedFeedback,
          submission: nextSub,
        });
      }

      return { success: true };
    },
    [session, teacherToken, publishToCloudRelay]
  );

  // Update Settings
  const updateSettings = useCallback(
    async (payload: any) => {
      setSession((prev) => {
        const next = {
          ...prev,
          ...payload,
        };
        saveLocalSession(next);
        return next;
      });

      let serverSaved = false;
      if (teacherToken) {
        try {
          const res = await fetch('/api/session/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${teacherToken}`,
            },
            body: JSON.stringify(payload),
          });
          if (res.ok) serverSaved = true;
        } catch {}
      }

      if (!serverSaved) {
        await publishToCloudRelay({
          type: 'SESSION_UPDATED',
          session: { ...session, ...payload },
        });
      }

      return { success: true };
    },
    [session, teacherToken, publishToCloudRelay]
  );

  // Reset Session
  const resetSession = useCallback(
    async (keepSettings = true) => {
      const initial = createInitialSession();
      setSession((prev) => {
        const next = keepSettings
          ? {
              ...prev,
              submissions: initial.submissions,
              feedbacks: initial.feedbacks,
              isLocked: false,
            }
          : initial;
        saveLocalSession(next);
        return next;
      });

      let serverSaved = false;
      if (teacherToken) {
        try {
          const res = await fetch('/api/session/reset', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${teacherToken}`,
            },
            body: JSON.stringify({ keepSettings }),
          });
          if (res.ok) serverSaved = true;
        } catch {}
      }

      if (!serverSaved) {
        await publishToCloudRelay({
          type: 'RESET_ALL',
          session: {
            ...session,
            submissions: initial.submissions,
            feedbacks: initial.feedbacks,
            isLocked: false,
          },
        });
      }

      return { success: true };
    },
    [session, teacherToken, publishToCloudRelay]
  );

  const toggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
  }, [soundOn]);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading,
        isOnline,
        teacherToken,
        soundOn,
        lastUpdatedGroupId,
        isCloudSyncActive,
        loginTeacher,
        logoutTeacher,
        submitAnswers,
        saveFeedback,
        updateSettings,
        resetSession,
        toggleSound,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
