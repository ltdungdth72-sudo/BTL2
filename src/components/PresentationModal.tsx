import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../context/SessionContext.tsx';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  LayoutGrid,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  Music,
  FileBadge,
} from 'lucide-react';

interface PresentationModalProps {
  initialGroupId: number;
  isOpen: boolean;
  onClose: () => void;
  defaultToMatrix?: boolean;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  initialGroupId,
  isOpen,
  onClose,
  defaultToMatrix = false,
}) => {
  const { session } = useSession();
  const [currentGroupId, setCurrentGroupId] = useState<number>(initialGroupId);
  const [viewMode, setViewMode] = useState<'single' | 'matrix'>(defaultToMatrix ? 'matrix' : 'single');
  const [showTeacherComment, setShowTeacherComment] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    setCurrentGroupId(initialGroupId);
    if (defaultToMatrix) {
      setViewMode('matrix');
    }
  }, [initialGroupId, defaultToMatrix]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleNext = useCallback(() => {
    setCurrentGroupId((prev) => (prev >= 12 ? 1 : prev + 1));
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentGroupId((prev) => (prev <= 1 ? 12 : prev - 1));
  }, []);

  // Keyboard navigation listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || !session) return null;

  const currentSub = session.submissions[currentGroupId];
  const currentFeedback = session.feedbacks[currentGroupId];
  const topic = session.topics.find((t) => t.groupNumbers.includes(currentGroupId));
  const questions = session.questions;

  const getTopicIcon = (type?: string) => {
    switch (type) {
      case 'shield':
        return <ShieldCheck className="w-6 h-6 text-indigo-400" />;
      case 'image':
        return <ImageIcon className="w-6 h-6 text-sky-400" />;
      case 'music':
        return <Music className="w-6 h-6 text-purple-400" />;
      default:
        return <FileBadge className="w-6 h-6 text-emerald-400" />;
    }
  };

  const getStatusBadge = (st?: string) => {
    switch (st) {
      case 'reviewed':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">✓ Đã Nhận Xét</span>;
      case 'submitted':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-bold">Đã Gửi Bài</span>;
      case 'in_progress':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">Đang Làm Bài</span>;
      default:
        return <span className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-xs font-medium">Chưa Bắt Đầu</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-text animate-in fade-in duration-200">
      {/* Top Projector Control Bar */}
      <header className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-extrabold text-blue-400 text-base tracking-wide uppercase">
            {session.schoolName} · Tin học 10
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-sm font-semibold text-slate-300 hidden sm:inline">
            Giáo viên: {session.teacherName} · Lớp {session.className}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Toggle Single vs Matrix */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 mr-2">
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Từng nhóm</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tổng hợp 12 nhóm</span>
            </button>
          </div>

          {/* Toggle Teacher Comment */}
          {viewMode === 'single' && (
            <button
              onClick={() => setShowTeacherComment(!showTeacherComment)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              title="Ẩn/Hiện nhận xét của giáo viên"
            >
              {showTeacherComment ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">
                {showTeacherComment ? 'Ẩn nhận xét GV' : 'Hiện nhận xét GV'}
              </span>
            </button>
          )}

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            title="Bung toàn màn hình máy chiếu"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close modal */}
          <button
            onClick={onClose}
            className="p-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-semibold border border-rose-800/50 transition-colors"
            title="Thoát trình chiếu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === 'single' ? (
        <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Header of the Group */}
          <div className="mb-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                {getTopicIcon(topic?.iconType)}
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  NHÓM {currentGroupId}
                </h2>
                <span className="text-slate-500 text-lg">·</span>
                <span className="text-sm sm:text-base font-bold text-blue-400">
                  Chủ đề {topic?.number}: {topic?.title}
                </span>
                {getStatusBadge(currentSub?.status)}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic max-w-4xl">
                Tình huống: "{topic?.scenario}"
              </p>
            </div>

            {/* Submission Time */}
            {currentSub?.submittedAt && (
              <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Nộp: {new Date(currentSub.submittedAt).toLocaleTimeString('vi-VN')}</span>
                <span>·</span>
                <span>{currentSub.wordCount} từ</span>
              </div>
            )}
          </div>

          {/* 3 Questions Columns / Stack */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0 overflow-y-auto pr-1 pb-2">
            {/* Answer 1 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Câu hỏi 1
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">
                  {questions[0]?.prompt || 'Hành vi nào có vấn đề?'}
                </h3>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[140px]">
                  {currentSub?.answer1 || (
                    <span className="text-slate-500 italic">Nhóm chưa gửi câu trả lời.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Answer 2 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Câu hỏi 2
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">
                  {questions[1]?.prompt || 'Quyền lợi tác giả bị ảnh hưởng thế nào?'}
                </h3>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[140px]">
                  {currentSub?.answer2 || (
                    <span className="text-slate-500 italic">Nhóm chưa gửi câu trả lời.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Answer 3 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Câu hỏi 3
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-3">
                  {questions[2]?.prompt || 'Cần làm gì để sử dụng phù hợp?'}
                </h3>
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[140px]">
                  {currentSub?.answer3 || (
                    <span className="text-slate-500 italic">Nhóm chưa gửi câu trả lời.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Comment Bar (if enabled & exists) */}
          {showTeacherComment && currentFeedback?.generalComment && (
            <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl shadow-lg shrink-0 text-xs sm:text-sm animate-in fade-in">
              <div className="flex items-center gap-2 mb-1.5 text-emerald-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Nhận xét của cô Lê Thị Dung:</span>
              </div>
              <p className="text-emerald-100 font-medium whitespace-pre-wrap">
                {currentFeedback.generalComment}
              </p>
              {currentFeedback.strengths && (
                <p className="text-emerald-300 mt-1">
                  <strong>Điểm mạnh:</strong> {currentFeedback.strengths}
                </p>
              )}
              {currentFeedback.improvements && (
                <p className="text-amber-300 mt-1">
                  <strong>Cần bổ sung:</strong> {currentFeedback.improvements}
                </p>
              )}
            </div>
          )}

          {/* Bottom Navigator Strip (12 Group Quick Jump) */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-4 shrink-0">
            <button
              onClick={handlePrev}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Nhóm trước (←)</span>
            </button>

            {/* Quick 12 Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-2 max-w-full">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((gNum) => {
                const sub = session.submissions[gNum];
                const isSelected = gNum === currentGroupId;
                const isDone = sub?.status === 'submitted' || sub?.status === 'reviewed';

                return (
                  <button
                    key={gNum}
                    onClick={() => setCurrentGroupId(gNum)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950 shadow-md scale-105'
                        : isDone
                        ? 'bg-slate-800 text-blue-300 border border-blue-500/40 hover:bg-slate-700'
                        : 'bg-slate-900 text-slate-500 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {gNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all"
            >
              <span className="hidden sm:inline">Nhóm tiếp (→)</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        /* Matrix Overview of All 12 Groups */
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-white">
                BẢNG TỔNG HỢP 12 NHÓM THẢO LUẬN
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Toàn cảnh tiến độ và kết quả thảo luận của các nhóm theo 4 chủ đề bản quyền số.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Chưa làm
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Đang làm
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Đã gửi
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Đã nhận xét
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {session.topics.map((top) => (
              <div key={top.id} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  {getTopicIcon(top.iconType)}
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Chủ đề {top.number}: {top.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 italic mb-4">"{top.scenario}"</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {top.groupNumbers.map((gNum) => {
                    const sub = session.submissions[gNum];
                    const fb = session.feedbacks[gNum];

                    return (
                      <div
                        key={gNum}
                        onClick={() => {
                          setCurrentGroupId(gNum);
                          setViewMode('single');
                        }}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-blue-500 cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-extrabold text-base text-white">
                            Nhóm {gNum}
                          </span>
                          {getStatusBadge(sub?.status)}
                        </div>
                        <div className="text-xs text-slate-400 space-y-1.5">
                          <p className="line-clamp-2">
                            <strong className="text-slate-300">C1: </strong>
                            {sub?.answer1 || 'Chưa có'}
                          </p>
                          <p className="line-clamp-2">
                            <strong className="text-slate-300">C2: </strong>
                            {sub?.answer2 || 'Chưa có'}
                          </p>
                          <p className="line-clamp-2">
                            <strong className="text-slate-300">C3: </strong>
                            {sub?.answer3 || 'Chưa có'}
                          </p>
                        </div>
                        {fb?.generalComment && (
                          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] text-emerald-400">
                            ★ {fb.generalComment.slice(0, 70)}...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
