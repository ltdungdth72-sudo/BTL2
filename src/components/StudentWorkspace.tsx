import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '../context/SessionContext.tsx';
import { TechBookLogo } from './TechBookLogo.tsx';
import {
  ShieldCheck,
  Image as ImageIcon,
  Music,
  FileBadge,
  Wifi,
  WifiOff,
  Save,
  Send,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Lock,
} from 'lucide-react';

interface StudentWorkspaceProps {
  groupId: number;
  onBackToRoles: () => void;
}

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({ groupId, onBackToRoles }) => {
  const { session, submitAnswers, isOnline } = useSession();

  const currentSub = session?.submissions[groupId];
  const currentFeedback = session?.feedbacks[groupId];
  const topic = session?.topics.find((t) => t.groupNumbers.includes(groupId));
  const questions = session?.questions || [];

  // Local state for answers
  const [answer1, setAnswer1] = useState<string>('');
  const [answer2, setAnswer2] = useState<string>('');
  const [answer3, setAnswer3] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline_draft' | 'error'>('synced');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [isEditingSubmitted, setIsEditingSubmitted] = useState<boolean>(false);

  const localDraftKey = `classroom_draft_group_${groupId}`;
  const debounceTimerRef = useRef<any>(null);
  const initialLoadRef = useRef<boolean>(false);

  // Initialize from server submission or local draft
  useEffect(() => {
    if (initialLoadRef.current) return;

    let initialA1 = currentSub?.answer1 || '';
    let initialA2 = currentSub?.answer2 || '';
    let initialA3 = currentSub?.answer3 || '';

    // If server has answers, prioritize them
    if (initialA1 || initialA2 || initialA3) {
      setAnswer1(initialA1);
      setAnswer2(initialA2);
      setAnswer3(initialA3);
    } else {
      // Check localStorage draft
      try {
        const cached = localStorage.getItem(localDraftKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            setAnswer1(parsed.answer1 || '');
            setAnswer2(parsed.answer2 || '');
            setAnswer3(parsed.answer3 || '');
            setSyncStatus('offline_draft');
          }
        }
      } catch {}
    }
    initialLoadRef.current = true;
  }, [groupId, currentSub, localDraftKey]);

  // When server data updates from other device in same group
  useEffect(() => {
    if (currentSub?.answer1 && currentSub.answer1 !== answer1 && currentSub.status === 'submitted') {
      setAnswer1(currentSub.answer1);
      setAnswer2(currentSub.answer2 || '');
      setAnswer3(currentSub.answer3 || '');
    }
  }, [currentSub?.updatedAt]);

  // Helper word & char counters
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const totalWords = getWordCount(answer1) + getWordCount(answer2) + getWordCount(answer3);

  // Auto-save draft locally and to server debounced
  const handleContentChange = (qIndex: 1 | 2 | 3, value: string) => {
    let nextA1 = answer1;
    let nextA2 = answer2;
    let nextA3 = answer3;

    if (qIndex === 1) {
      setAnswer1(value);
      nextA1 = value;
    } else if (qIndex === 2) {
      setAnswer2(value);
      nextA2 = value;
    } else {
      setAnswer3(value);
      nextA3 = value;
    }

    // Save to local device storage immediately
    try {
      localStorage.setItem(
        localDraftKey,
        JSON.stringify({
          answer1: nextA1,
          answer2: nextA2,
          answer3: nextA3,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {}

    // Debounce server draft sync if online and not locked
    if (!session?.isLocked && isOnline) {
      setSyncStatus('saving');
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(async () => {
        try {
          await submitAnswers(
            groupId,
            { answer1: nextA1, answer2: nextA2, answer3: nextA3 },
            true // isDraft
          );
          setSyncStatus('synced');
        } catch {
          setSyncStatus('offline_draft');
        }
      }, 1500);
    } else {
      setSyncStatus('offline_draft');
    }
  };

  // Explicit Manual Draft Save
  const handleManualSaveDraft = async () => {
    try {
      localStorage.setItem(
        localDraftKey,
        JSON.stringify({
          answer1,
          answer2,
          answer3,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {}

    if (isOnline) {
      setSyncStatus('saving');
      const res = await submitAnswers(groupId, { answer1, answer2, answer3 }, true);
      if (res.success) {
        setSyncStatus('synced');
        setSubmitMessage('Đã lưu bản nháp lên máy chủ thành công');
        setTimeout(() => setSubmitMessage(''), 3000);
      } else {
        setSyncStatus('offline_draft');
        setSubmitMessage('Đã lưu bản nháp trên thiết bị của bạn');
        setTimeout(() => setSubmitMessage(''), 3000);
      }
    } else {
      setSyncStatus('offline_draft');
      setSubmitMessage('Mất mạng. Đã lưu an toàn trong bộ nhớ máy!');
      setTimeout(() => setSubmitMessage(''), 3500);
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (!answer1.trim() || !answer2.trim() || !answer3.trim()) {
      alert('Vui lòng nhập đầy đủ câu trả lời cho cả 3 câu hỏi trước khi gửi bài!');
      return;
    }

    setShowConfirmModal(false);
    setIsSubmitting(true);

    const res = await submitAnswers(
      groupId,
      { answer1: answer1.trim(), answer2: answer2.trim(), answer3: answer3.trim() },
      false // final submission
    );

    setIsSubmitting(false);

    if (res.success) {
      setIsEditingSubmitted(false);
      setSyncStatus('synced');
      setSubmitMessage('Đã gửi bài thảo luận thành công!');
      setTimeout(() => setSubmitMessage(''), 4000);
    } else {
      alert(res.error || 'Có lỗi khi gửi bài. Vui lòng thử lại.');
    }
  };

  const isAlreadySubmitted = currentSub?.status === 'submitted' || currentSub?.status === 'reviewed';
  const isReadOnly = isAlreadySubmitted && !isEditingSubmitted;

  const getTopicIcon = () => {
    switch (topic?.iconType) {
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-sky-600" />;
      case 'music':
        return <Music className="w-5 h-5 text-purple-600" />;
      default:
        return <FileBadge className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-28 md:pb-16 text-slate-900">
      {/* Sticky Mobile Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToRoles}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Đổi nhóm / Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <TechBookLogo size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">
                  Nhóm {groupId}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  Chủ đề {topic?.number}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-xs">
                {session?.className || '10A1'} · {session?.schoolName || 'THPT Đinh Tiên Hoàng'}
              </p>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-1.5 text-xs">
            {!isOnline ? (
              <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 text-[11px] font-medium">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Ngoại tuyến (Lưu máy)</span>
              </span>
            ) : syncStatus === 'saving' ? (
              <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Đang lưu...</span>
              </span>
            ) : syncStatus === 'synced' ? (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 text-[11px] font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Đã đồng bộ</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-[11px] font-medium">
                <span>Bản nháp máy</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 pt-4 pb-8 space-y-4">
        {/* Session Closed Warning */}
        {session?.isLocked && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-semibold shadow-xs">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Cô Dung đã đóng thời gian thảo luận. Bạn hiện chỉ có thể xem lại bài làm.</span>
          </div>
        )}

        {/* Assigned Topic & Scenario Box */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            {getTopicIcon()}
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chủ đề {topic?.number}:
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {topic?.title}
            </h2>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-800 leading-relaxed">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tình huống thảo luận:
            </div>
            <p className="font-medium text-slate-900 italic">
              "{topic?.scenario}"
            </p>
          </div>
        </section>

        {/* Status notification toast */}
        {submitMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{submitMessage}</span>
          </div>
        )}

        {/* 3 Questions */}
        <div className="space-y-4">
          {/* Question 1 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                Câu hỏi 1
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {getWordCount(answer1)} từ · {answer1.length} ký tự
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
              {questions[0]?.prompt || 'Hành vi nào có vấn đề?'}
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              💡 {questions[0]?.hint}
            </p>

            <textarea
              rows={4}
              disabled={isReadOnly || session?.isLocked}
              value={answer1}
              onChange={(e) => handleContentChange(1, e.target.value)}
              placeholder="Nhóm hãy thảo luận và chỉ ra cụ thể các hành vi vi phạm hoặc chưa chuẩn mực..."
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed disabled:bg-slate-100 disabled:text-slate-700 transition-colors resize-y"
            />
          </div>

          {/* Question 2 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                Câu hỏi 2
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {getWordCount(answer2)} từ · {answer2.length} ký tự
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
              {questions[1]?.prompt || 'Quyền lợi của tác giả có thể bị ảnh hưởng như thế nào?'}
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              💡 {questions[1]?.hint}
            </p>

            <textarea
              rows={4}
              disabled={isReadOnly || session?.isLocked}
              value={answer2}
              onChange={(e) => handleContentChange(2, e.target.value)}
              placeholder="Phân tích tác giả bị thiệt hại về thu nhập, danh dự, quyền nhân thân hay kinh tế..."
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed disabled:bg-slate-100 disabled:text-slate-700 transition-colors resize-y"
            />
          </div>

          {/* Question 3 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Câu hỏi 3
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {getWordCount(answer3)} từ · {answer3.length} ký tự
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
              {questions[2]?.prompt || 'Cần làm gì để sử dụng nội dung phù hợp?'}
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              💡 {questions[2]?.hint}
            </p>

            <textarea
              rows={4}
              disabled={isReadOnly || session?.isLocked}
              value={answer3}
              onChange={(e) => handleContentChange(3, e.target.value)}
              placeholder="Đề xuất các bước hợp pháp và chuẩn mực (mua bản quyền, xin phép, trích dẫn, dùng giấy phép mở...)"
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed disabled:bg-slate-100 disabled:text-slate-700 transition-colors resize-y"
            />
          </div>
        </div>

        {/* Teacher Feedback Review Box (if published by teacher) */}
        {currentFeedback?.isPublished && currentFeedback?.generalComment && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Nhận Xét Của Cô Lê Thị Dung
              </h4>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                <span className="font-bold text-slate-700 block mb-0.5">Nhận xét chung:</span>
                <p className="text-slate-800 whitespace-pre-wrap">{currentFeedback.generalComment}</p>
              </div>

              {currentFeedback.strengths && (
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <span className="font-bold text-emerald-800 block mb-0.5">✓ Điểm mạnh của nhóm:</span>
                  <p className="text-slate-800 whitespace-pre-wrap">{currentFeedback.strengths}</p>
                </div>
              )}

              {currentFeedback.improvements && (
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <span className="font-bold text-amber-800 block mb-0.5">! Nội dung cần bổ sung:</span>
                  <p className="text-slate-800 whitespace-pre-wrap">{currentFeedback.improvements}</p>
                </div>
              )}

              {currentFeedback.suggestions && (
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-100">
                  <span className="font-bold text-blue-800 block mb-0.5">★ Đề xuất hướng hoàn thiện:</span>
                  <p className="text-slate-800 whitespace-pre-wrap">{currentFeedback.suggestions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submitted Meta details */}
        {isAlreadySubmitted && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-900">
            <div>
              <p className="font-bold">Trạng thái: Đã gửi bài thành công</p>
              <p className="text-[11px] text-blue-700">
                Thời gian nộp:{' '}
                {currentSub?.submittedAt
                  ? new Date(currentSub.submittedAt).toLocaleTimeString('vi-VN') +
                    ' ngày ' +
                    new Date(currentSub.submittedAt).toLocaleDateString('vi-VN')
                  : 'Vừa xong'}
              </p>
            </div>
            {!session?.isLocked && !isEditingSubmitted && (
              <button
                onClick={() => setIsEditingSubmitted(true)}
                className="flex items-center gap-1 px-3 py-2 bg-white text-blue-700 hover:bg-blue-100 font-bold rounded-xl border border-blue-200 transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa bài</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar for Mobile Touch */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            <span>Tổng: </span>
            <strong className="text-slate-900 font-bold">{totalWords}</strong> từ
          </div>

          <div className="flex items-center gap-2">
            {/* Manual Save Draft Button */}
            {(!isAlreadySubmitted || isEditingSubmitted) && !session?.isLocked && (
              <button
                type="button"
                onClick={handleManualSaveDraft}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors min-h-[44px]"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Lưu nháp</span>
              </button>
            )}

            {/* Submit or Update Button */}
            {(!isAlreadySubmitted || isEditingSubmitted) && !session?.isLocked && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md transition-all min-h-[44px]"
              >
                <Send className="w-4 h-4" />
                <span>{isEditingSubmitted ? 'Cập Nhật Bài Nộp' : 'GỬI BÀI THẢO LUẬN'}</span>
              </button>
            )}

            {isAlreadySubmitted && !isEditingSubmitted && !session?.isLocked && (
              <button
                type="button"
                onClick={() => setIsEditingSubmitted(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all min-h-[44px]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Chỉnh sửa bài</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Xác Nhận Nộp Bài Thảo Luận?
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Bạn đang nộp bài cho <strong className="text-slate-900">Nhóm {groupId}</strong> ({topic?.title}).
              Kết quả sẽ hiển thị ngay lập tức trên máy chiếu của cô Dung.
            </p>

            {(!answer1.trim() || !answer2.trim() || !answer3.trim()) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-semibold mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Còn câu hỏi đang để trống. Hãy kiểm tra lại!</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Xem lại bài
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                {isSubmitting ? 'Đang gửi...' : 'Xác Nhận Gửi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
