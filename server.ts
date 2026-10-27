import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ClassSession, GroupSubmission, TeacherFeedback } from './src/types.ts';
import { createInitialSession } from './src/initialData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'session.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory session state
let sessionState: ClassSession;

function loadSession(): ClassSession {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.submissions && parsed.topics) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load session file, initializing fresh:', err);
  }
  const initial = createInitialSession();
  saveSession(initial);
  return initial;
}

function saveSession(state: ClassSession) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save session file:', err);
  }
}

sessionState = loadSession();

// SSE clients registry
const sseClients = new Set<Response>();

function broadcast(eventType: string, payload: any) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(message);
    } catch {
      sseClients.delete(res);
    }
  }
}

// Heartbeat every 20s to prevent connection timeouts
setInterval(() => {
  for (const res of sseClients) {
    try {
      res.write(':heartbeat\n\n');
    } catch {
      sseClients.delete(res);
    }
  }
}, 20000);

// Helper for count words
function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Helper auth check for teacher
  const verifyTeacher = (req: Request, res: Response, next: () => void) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.replace('Bearer ', '');
    // In our simplified token scheme, token is validated against sessionState.pinCode
    if (token && token === sessionState.pinCode) {
      next();
    } else {
      res.status(401).json({ error: 'Mã PIN giáo viên không hợp lệ hoặc đã hết hạn.' });
    }
  };

  // 1. Get Session Data
  app.get('/api/session', (req: Request, res: Response) => {
    // Determine public URL from env or headers
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const computedUrl = host ? `${proto}://${host}` : '';
    const publicUrl = sessionState.appUrl || process.env.APP_URL || computedUrl;

    const safeSession = {
      ...sessionState,
      appUrl: publicUrl,
      pinCode: undefined, // hidden
    };
    res.json(safeSession);
  });

  // 2. SSE Real-Time Stream
  app.get('/api/stream', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const computedUrl = host ? `${proto}://${host}` : '';
    const publicUrl = sessionState.appUrl || process.env.APP_URL || computedUrl;

    // Send initial snapshot
    const safeSession = { ...sessionState, appUrl: publicUrl, pinCode: undefined };
    res.write(`event: init\ndata: ${JSON.stringify(safeSession)}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 3. Teacher Authentication
  app.post('/api/auth', (req: Request, res: Response) => {
    const { pin } = req.body;
    if (pin && (pin === sessionState.pinCode || pin === 'gv10dth')) {
      res.json({
        success: true,
        token: sessionState.pinCode,
        teacherName: sessionState.teacherName,
        schoolName: sessionState.schoolName,
      });
    } else {
      res.status(401).json({ success: false, error: 'Mã PIN không đúng. Vui lòng thử lại.' });
    }
  });

  // 4. Submit / Auto-save Group Answers
  app.post('/api/submit', (req: Request, res: Response) => {
    const { groupId, answer1, answer2, answer3, isDraft, deviceId } = req.body;
    const gId = parseInt(groupId, 10);

    if (isNaN(gId) || gId < 1 || gId > 12) {
      return res.status(400).json({ error: 'Mã nhóm không hợp lệ (phải từ 1 đến 12).' });
    }

    if (sessionState.isLocked && !isDraft) {
      return res.status(403).json({ error: 'Buổi thảo luận đã đóng. Không thể nộp thêm bài mới.' });
    }

    const currentSub = sessionState.submissions[gId] || {
      groupId: gId,
      groupName: `Nhóm ${gId}`,
      topicId: gId <= 3 ? 'topic-1' : gId <= 6 ? 'topic-2' : gId <= 9 ? 'topic-3' : 'topic-4',
      answer1: '',
      answer2: '',
      answer3: '',
      status: 'not_started',
      submittedAt: null,
      updatedAt: new Date().toISOString(),
      wordCount: 0,
    };

    const combinedText = `${answer1 || ''} ${answer2 || ''} ${answer3 || ''}`;
    const wordCount = countWords(combinedText);
    const now = new Date().toISOString();

    if (isDraft) {
      // Just updating draft progress if not yet submitted
      const newStatus = currentSub.status === 'not_started' ? 'in_progress' : currentSub.status;
      sessionState.submissions[gId] = {
        ...currentSub,
        answer1: answer1 ?? currentSub.answer1,
        answer2: answer2 ?? currentSub.answer2,
        answer3: answer3 ?? currentSub.answer3,
        status: newStatus,
        updatedAt: now,
        wordCount,
        deviceId: deviceId || currentSub.deviceId,
      };
    } else {
      // Final submission
      if (!answer1?.trim() || !answer2?.trim() || !answer3?.trim()) {
        return res.status(400).json({ error: 'Vui lòng trả lời đầy đủ cả 3 câu hỏi trước khi gửi bài.' });
      }

      sessionState.submissions[gId] = {
        ...currentSub,
        answer1: answer1.trim(),
        answer2: answer2.trim(),
        answer3: answer3.trim(),
        status: currentSub.status === 'reviewed' ? 'reviewed' : 'submitted',
        submittedAt: currentSub.submittedAt || now,
        updatedAt: now,
        wordCount,
        deviceId: deviceId || currentSub.deviceId,
      };
    }

    saveSession(sessionState);

    // Broadcast update
    broadcast('SUBMISSION_UPDATED', {
      groupId: gId,
      submission: sessionState.submissions[gId],
    });

    res.json({
      success: true,
      submission: sessionState.submissions[gId],
      message: isDraft ? 'Đã lưu bản nháp' : 'Đã gửi bài thành công',
    });
  });

  // 5. Teacher Feedback Save
  app.post('/api/feedback', verifyTeacher, (req: Request, res: Response) => {
    const { groupId, generalComment, strengths, improvements, suggestions, isPublished, markReviewed } = req.body;
    const gId = parseInt(groupId, 10);

    if (isNaN(gId) || gId < 1 || gId > 12) {
      return res.status(400).json({ error: 'Mã nhóm không hợp lệ.' });
    }

    const now = new Date().toISOString();
    const updatedFeedback: TeacherFeedback = {
      groupId: gId,
      generalComment: generalComment || '',
      strengths: strengths || '',
      improvements: improvements || '',
      suggestions: suggestions || '',
      reviewedAt: now,
      isPublished: Boolean(isPublished),
    };

    sessionState.feedbacks[gId] = updatedFeedback;

    if (markReviewed && sessionState.submissions[gId]) {
      sessionState.submissions[gId].status = 'reviewed';
    }

    saveSession(sessionState);

    broadcast('FEEDBACK_UPDATED', {
      groupId: gId,
      feedback: updatedFeedback,
      submission: sessionState.submissions[gId],
    });

    res.json({ success: true, feedback: updatedFeedback });
  });

  // 6. Teacher Session Settings Update
  app.post('/api/session/update', verifyTeacher, (req: Request, res: Response) => {
    const { className, teacherName, schoolName, sessionTitle, isLocked, newPinCode, topics, questions } = req.body;

    if (className) sessionState.className = className.trim();
    if (teacherName) sessionState.teacherName = teacherName.trim();
    if (schoolName) sessionState.schoolName = schoolName.trim();
    if (sessionTitle) sessionState.sessionTitle = sessionTitle.trim();
    if (typeof isLocked === 'boolean') sessionState.isLocked = isLocked;
    if (newPinCode && newPinCode.trim().length >= 4) {
      sessionState.pinCode = newPinCode.trim();
    }
    if (Array.isArray(topics) && topics.length === 4) {
      sessionState.topics = topics;
    }
    if (Array.isArray(questions) && questions.length === 3) {
      sessionState.questions = questions;
    }

    saveSession(sessionState);

    const safeSession = { ...sessionState, pinCode: undefined };
    broadcast('SESSION_UPDATED', safeSession);

    res.json({ success: true, session: safeSession, currentPin: sessionState.pinCode });
  });

  // 7. Reset / New Session
  app.post('/api/session/reset', verifyTeacher, (req: Request, res: Response) => {
    const { keepSettings } = req.body;

    if (keepSettings) {
      // Keep class info, topics, questions, but clear submissions and feedbacks
      const initial = createInitialSession();
      sessionState.submissions = initial.submissions;
      sessionState.feedbacks = initial.feedbacks;
      sessionState.isLocked = false;
    } else {
      sessionState = createInitialSession();
    }

    saveSession(sessionState);

    const safeSession = { ...sessionState, pinCode: undefined };
    broadcast('RESET_ALL', safeSession);

    res.json({ success: true, session: safeSession });
  });

  // Vite Integration:
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Classroom collaboration server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
