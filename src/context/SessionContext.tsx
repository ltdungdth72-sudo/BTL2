import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { ClassSession, GroupSubmission, TeacherFeedback } from '../types.ts';
import { isSoundEnabled, setSoundEnabled, playNewSubmissionAlert, playSubmitSuccessSound, playReviewSavedSound } from '../utils/sound.ts';

interface SessionContextType {
  session: ClassSession | null;
  isLoading: boolean;
  isOnline: boolean;
  teacherToken: string | null;
  soundOn: boolean;
  lastUpdatedGroupId: number | null;
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

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ClassSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
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
  const teacherTokenRef = useRef(teacherToken);
  teacherTokenRef.current = teacherToken;

  // Track online status
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

  // Fetch initial session & connect to SSE
  useEffect(() => {
    let active = true;

    async function fetchSession() {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setSession(data);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Initial fetch failed:', err);
        if (active) setIsLoading(false);
      }
    }

    fetchSession();

    function setupSSE() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const sse = new EventSource('/api/stream');
      eventSourceRef.current = sse;

      sse.addEventListener('init', (e: MessageEvent) => {
        try {
          const initial = JSON.parse(e.data);
          if (active) setSession(initial);
        } catch {}
      });

      sse.addEventListener('SUBMISSION_UPDATED', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (!active) return;
          const { groupId, submission } = payload;
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              submissions: {
                ...prev.submissions,
                [groupId]: submission,
              },
            };
          });

          // Visual cue & sound if someone submitted
          setLastUpdatedGroupId(groupId);
          setTimeout(() => setLastUpdatedGroupId(null), 4000);

          if (submission.status === 'submitted' && teacherTokenRef.current) {
            playNewSubmissionAlert();
          }
        } catch {}
      });

      sse.addEventListener('FEEDBACK_UPDATED', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (!active) return;
          const { groupId, feedback, submission } = payload;
          setSession((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              feedbacks: {
                ...prev.feedbacks,
                [groupId]: feedback,
              },
              submissions: submission ? {
                ...prev.submissions,
                [groupId]: submission,
              } : prev.submissions,
            };
          });
        } catch {}
      });

      sse.addEventListener('SESSION_UPDATED', (e: MessageEvent) => {
        try {
          const updated = JSON.parse(e.data);
          if (active) setSession(updated);
        } catch {}
      });

      sse.addEventListener('RESET_ALL', (e: MessageEvent) => {
        try {
          const reset = JSON.parse(e.data);
          if (active) setSession(reset);
        } catch {}
      });

      sse.onerror = () => {
        // SSE reconnects automatically, but keep online state informed
        console.warn('SSE stream disconnected, waiting for reconnection...');
      };
    }

    setupSSE();

    return () => {
      active = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Teacher Login
  const loginTeacher = useCallback(async (pin: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeacherToken(data.token);
        try {
          sessionStorage.setItem('teacher_token', data.token);
        } catch {}
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Mã PIN không hợp lệ' };
      }
    } catch {
      return { success: false, error: 'Không thể kết nối đến máy chủ.' };
    }
  }, []);

  const logoutTeacher = useCallback(() => {
    setTeacherToken(null);
    try {
      sessionStorage.removeItem('teacher_token');
    } catch {}
  }, []);

  // Submit Answers
  const submitAnswers = useCallback(
    async (
      groupId: number,
      answers: { answer1: string; answer2: string; answer3: string },
      isDraft = false
    ) => {
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            ...answers,
            isDraft,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (!isDraft) {
            playSubmitSuccessSound();
          }
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Có lỗi khi gửi bài' };
        }
      } catch (err) {
        return { success: false, error: 'Không có kết nối mạng. Bản nháp đã được lưu trên máy của bạn.' };
      }
    },
    []
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
      if (!teacherToken) {
        return { success: false, error: 'Chưa đăng nhập quyền giáo viên.' };
      }
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${teacherToken}`,
          },
          body: JSON.stringify({
            groupId,
            ...feedback,
            markReviewed,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          playReviewSavedSound();
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Không thể lưu nhận xét' };
        }
      } catch {
        return { success: false, error: 'Lỗi kết nối khi lưu nhận xét' };
      }
    },
    [teacherToken]
  );

  // Update Settings
  const updateSettings = useCallback(
    async (payload: any) => {
      if (!teacherToken) {
        return { success: false, error: 'Chưa xác thực quyền giáo viên.' };
      }
      try {
        const res = await fetch('/api/session/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${teacherToken}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (payload.newPinCode) {
            setTeacherToken(payload.newPinCode);
            try {
              sessionStorage.setItem('teacher_token', payload.newPinCode);
            } catch {}
          }
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Không thể cập nhật cấu hình' };
        }
      } catch {
        return { success: false, error: 'Lỗi mạng khi lưu cài đặt' };
      }
    },
    [teacherToken]
  );

  // Reset Session
  const resetSession = useCallback(
    async (keepSettings = true) => {
      if (!teacherToken) {
        return { success: false, error: 'Chưa xác thực quyền giáo viên.' };
      }
      try {
        const res = await fetch('/api/session/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${teacherToken}`,
          },
          body: JSON.stringify({ keepSettings }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          return { success: true };
        } else {
          return { success: false, error: data.error || 'Không thể đặt lại dữ liệu' };
        }
      } catch {
        return { success: false, error: 'Lỗi mạng khi đặt lại dữ liệu' };
      }
    },
    [teacherToken]
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
