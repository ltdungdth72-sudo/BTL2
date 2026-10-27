import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext.tsx';
import { exportSessionToCsv } from '../utils/exportCsv.ts';
import {
  X,
  Save,
  Download,
  RotateCcw,
  Lock,
  Unlock,
  KeyRound,
  BookOpen,
  School,
  User,
  AlertTriangle,
} from 'lucide-react';

interface ClassSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClassSettingsModal: React.FC<ClassSettingsModalProps> = ({ isOpen, onClose }) => {
  const { session, updateSettings, resetSession } = useSession();

  const [activeTab, setActiveTab] = useState<'general' | 'topics' | 'questions' | 'security'>('general');
  const [className, setClassName] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');
  const [topics, setTopics] = useState(session?.topics || []);
  const [questions, setQuestions] = useState(session?.questions || []);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (session) {
      setClassName(session.className);
      setTeacherName(session.teacherName);
      setSchoolName(session.schoolName);
      setSessionTitle(session.sessionTitle);
      setIsLocked(session.isLocked);
      setTopics(session.topics);
      setQuestions(session.questions);
    }
  }, [session, isOpen]);

  if (!isOpen || !session) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const payload: any = {
      className,
      teacherName,
      schoolName,
      sessionTitle,
      isLocked,
      topics,
      questions,
    };
    if (newPin.trim().length >= 4) {
      payload.newPinCode = newPin.trim();
    }

    const res = await updateSettings(payload);
    setIsSaving(false);

    if (res.success) {
      alert('Đã cập nhật cài đặt buổi học thành công!');
      onClose();
    } else {
      alert(res.error || 'Có lỗi khi lưu cài đặt');
    }
  };

  const handleResetSession = async () => {
    setShowResetConfirm(false);
    const res = await resetSession(true); // keep topics & questions, reset submissions
    if (res.success) {
      alert('Đã làm mới dữ liệu nộp bài của 12 nhóm cho tiết học mới!');
      onClose();
    } else {
      alert(res.error || 'Không thể làm mới dữ liệu');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">
              Quản Lý &amp; Cài Đặt Buổi Thảo Luận
            </h3>
            <p className="text-xs text-slate-500">
              Tùy biến tên lớp, chủ đề, câu hỏi và bảo mật cho tiết học của cô Dung.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 px-6 gap-2 bg-white text-xs font-bold pt-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Thông Tin Chung
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              activeTab === 'topics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            4 Chủ Đề &amp; Tình Huống
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            3 Câu Hỏi Thảo Luận
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Bảo Mật &amp; Buổi Học Mới
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 text-xs sm:text-sm">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <School className="w-4 h-4 text-slate-500" />
                    <span>Tên trường</span>
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Giáo viên phụ trách</span>
                  </label>
                  <input
                    type="text"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span>Lớp học (Ví dụ: 10A1, 10A2, 10A3...)</span>
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 outline-none font-semibold text-blue-600"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                    <span>Môn học</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={session.subject}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tiêu đề bài học / Nội dung thảo luận
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Trạng thái nhận bài</h4>
                  <p className="text-xs text-slate-500">
                    {isLocked
                      ? 'Buổi thảo luận đang ĐÓNG. Học sinh không thể nộp bài mới.'
                      : 'Buổi thảo luận đang MỞ. 12 nhóm có thể nộp và cập nhật bài.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocked(!isLocked)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isLocked
                      ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  <span>{isLocked ? 'Đang Khóa' : 'Đang Mở'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Chỉnh sửa tiêu đề và tình huống thực tế cho 4 chủ đề. Mỗi chủ đề được giao cho 3 nhóm.
              </p>
              {topics.map((t, index) => (
                <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Chủ đề {t.number} (Phân công: Nhóm {t.groupNumbers.join(', ')})</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => {
                        const next = [...topics];
                        next[index].title = e.target.value;
                        setTopics(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 mb-2"
                    />
                    <textarea
                      rows={2}
                      value={t.scenario}
                      onChange={(e) => {
                        const next = [...topics];
                        next[index].scenario = e.target.value;
                        setTopics(next);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Chỉnh sửa 3 câu hỏi chung và gợi ý hướng dẫn học sinh trả lời.
              </p>
              {questions.map((q, index) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="font-bold text-slate-800 text-xs">
                    Câu hỏi {q.order}
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Nội dung câu hỏi:</label>
                    <input
                      type="text"
                      value={q.prompt}
                      onChange={(e) => {
                        const next = [...questions];
                        next[index].prompt = e.target.value;
                        setQuestions(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 mb-2"
                    />
                    <label className="text-[11px] text-slate-500 block mb-1">Gợi ý trả lời:</label>
                    <input
                      type="text"
                      value={q.hint}
                      onChange={(e) => {
                        const next = [...questions];
                        next[index].hint = e.target.value;
                        setQuestions(next);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change PIN */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900">Đổi Mã PIN Giáo Viên</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Mã PIN bảo vệ màn hình quản trị và trình chiếu của giáo viên. Tối thiểu 4 ký tự.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Nhập mã PIN mới (VD: gv10tin26)..."
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-600 outline-none font-mono text-xs"
                  />
                </div>
              </div>

              {/* Export Data */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900">Xuất Báo Cáo Kết Quả Lớp Học</h4>
                  <p className="text-xs text-slate-500">
                    Tải về tệp Excel / CSV chứa đầy đủ câu trả lời 12 nhóm và nhận xét của giáo viên.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => exportSessionToCsv(session)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất File Excel</span>
                </button>
              </div>

              {/* Reset Session for Next Class */}
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h4 className="font-bold">Bắt Đầu Tiết Học Mới (Đặt Lại Bài Nộp)</h4>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Chức năng này sẽ làm trống bài làm của 12 nhóm để sẵn sàng cho tiết học của lớp tiếp theo (ví dụ đổi từ 10A1 sang 10A2), nhưng vẫn giữ nguyên 4 chủ đề và 3 câu hỏi.
                </p>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm Trống Dữ Liệu Cho Tiết Mới</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation for Reset */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-left">
            <h4 className="text-base font-bold text-slate-900 mb-2">
              Xác nhận bắt đầu tiết học mới?
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Dữ liệu bài nộp và nhận xét hiện tại sẽ được làm mới. Hãy chắc chắn rằng cô đã xuất file Excel lưu hồ sơ trước khi thực hiện.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetSession}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
              >
                Đồng ý làm mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
