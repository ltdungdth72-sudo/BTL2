import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext.tsx';
import { X, CheckCircle, Save, Sparkles, MessageSquare, Award, AlertCircle, Lightbulb } from 'lucide-react';

interface TeacherFeedbackDrawerProps {
  groupId: number | null;
  onClose: () => void;
}

export const TeacherFeedbackDrawer: React.FC<TeacherFeedbackDrawerProps> = ({ groupId, onClose }) => {
  const { session, saveFeedback } = useSession();

  const [generalComment, setGeneralComment] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [improvements, setImprovements] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [markReviewed, setMarkReviewed] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const sub = groupId ? session?.submissions[groupId] : null;
  const existingFeedback = groupId ? session?.feedbacks[groupId] : null;
  const topic = groupId ? session?.topics.find((t) => t.groupNumbers.includes(groupId)) : null;

  useEffect(() => {
    if (existingFeedback) {
      setGeneralComment(existingFeedback.generalComment || '');
      setStrengths(existingFeedback.strengths || '');
      setImprovements(existingFeedback.improvements || '');
      setSuggestions(existingFeedback.suggestions || '');
      setIsPublished(existingFeedback.isPublished || false);
    } else {
      setGeneralComment('');
      setStrengths('');
      setImprovements('');
      setSuggestions('');
      setIsPublished(false);
    }
  }, [groupId, existingFeedback]);

  if (!groupId) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const res = await saveFeedback(
      groupId,
      {
        generalComment,
        strengths,
        improvements,
        suggestions,
        isPublished,
      },
      markReviewed
    );

    setIsSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } else {
      alert(res.error || 'Có lỗi khi lưu nhận xét');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-lg">
                Nhận Xét &amp; Đánh Giá: Nhóm {groupId}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Chủ đề {topic?.number}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {topic?.title} · Học sinh: {session?.className || '10A1'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
          {/* Quick Summary of Student Answers */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
              Tóm tắt bài nộp của nhóm:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                <span className="font-bold text-slate-700 block mb-0.5">Câu 1: Hành vi có vấn đề</span>
                <p className="text-slate-600 line-clamp-3">
                  {sub?.answer1 || <span className="italic text-slate-400">Chưa trả lời</span>}
                </p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                <span className="font-bold text-slate-700 block mb-0.5">Câu 2: Quyền lợi tác giả</span>
                <p className="text-slate-600 line-clamp-3">
                  {sub?.answer2 || <span className="italic text-slate-400">Chưa trả lời</span>}
                </p>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                <span className="font-bold text-slate-700 block mb-0.5">Câu 3: Cách sử dụng đúng</span>
                <p className="text-slate-600 line-clamp-3">
                  {sub?.answer3 || <span className="italic text-slate-400">Chưa trả lời</span>}
                </p>
              </div>
            </div>
          </div>

          {/* 1. Nhận xét chung */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-slate-800 mb-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>1. Nhận xét chung của giáo viên</span>
            </label>
            <textarea
              rows={2}
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              placeholder="Đánh giá tổng quan về mức độ hiểu bài, tính logic và tinh thần làm việc của nhóm..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none leading-relaxed"
            />
          </div>

          {/* 2. Điểm mạnh */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1.5">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>2. Điểm mạnh / Lập luận xuất sắc</span>
            </label>
            <textarea
              rows={2}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Chỉ rõ những luận điểm chính xác, ví dụ thực tế hay hoặc giải pháp sáng tạo..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none leading-relaxed"
            />
          </div>

          {/* 3. Nội dung cần bổ sung */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-amber-800 mb-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>3. Nội dung cần bổ sung / Điều chỉnh</span>
            </label>
            <textarea
              rows={2}
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Các khía cạnh bản quyền chưa được đề cập đầy đủ hoặc còn nhầm lẫn..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 outline-none leading-relaxed"
            />
          </div>

          {/* 4. Đề xuất hướng hoàn thiện */}
          <div>
            <label className="flex items-center gap-1.5 font-bold text-purple-800 mb-1.5">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <span>4. Đề xuất hướng hoàn thiện</span>
            </label>
            <textarea
              rows={2}
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Lời khuyên để nhóm củng cố kiến thức và áp dụng vào thực tế khi sáng tạo nội dung..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 outline-none leading-relaxed"
            />
          </div>

          {/* Controls: Mark Reviewed & Publish to Students */}
          <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={markReviewed}
                onChange={(e) => setMarkReviewed(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800 text-xs">
                Đánh dấu trạng thái "Đã nhận xét"
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-800 text-xs">
                Công bố cho học sinh xem trên điện thoại
              </span>
            </label>
          </div>

          {/* Footer Save Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Đã lưu thành công!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang lưu...' : 'Lưu Nhận Xét'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
