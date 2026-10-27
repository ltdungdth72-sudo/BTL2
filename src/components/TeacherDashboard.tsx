import React, { useState } from 'react';
import { useSession } from '../context/SessionContext.tsx';
import { exportSessionToCsv } from '../utils/exportCsv.ts';
import { TechBookLogo } from './TechBookLogo.tsx';
import { PresentationModal } from './PresentationModal.tsx';
import { TeacherFeedbackDrawer } from './TeacherFeedbackDrawer.tsx';
import { ClassSettingsModal } from './ClassSettingsModal.tsx';
import { QrCodeModal } from './QrCodeModal.tsx';
import {
  ShieldCheck,
  Image as ImageIcon,
  Music,
  FileBadge,
  Eye,
  Tv,
  MessageSquare,
  Volume2,
  VolumeX,
  QrCode as QrIcon,
  Download,
  Settings,
  LogOut,
  Clock,
  Sparkles,
  CheckCircle2,
  Users,
  LayoutGrid,
} from 'lucide-react';

interface TeacherDashboardProps {
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
  const { session, soundOn, toggleSound, lastUpdatedGroupId } = useSession();

  const [presentationGroupId, setPresentationGroupId] = useState<number | null>(null);
  const [isMatrixPresentation, setIsMatrixPresentation] = useState<boolean>(false);
  const [feedbackGroupId, setFeedbackGroupId] = useState<number | null>(null);
  const [previewSubGroupId, setPreviewSubGroupId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  if (!session) return null;

  // Compute 4 KPI stats
  const totalGroups = 12;
  const submissionsList = Object.values(session.submissions);
  const submittedCount = submissionsList.filter(
    (s) => s.status === 'submitted' || s.status === 'reviewed'
  ).length;
  const inProgressOrPendingCount = totalGroups - submittedCount;
  const reviewedCount = submissionsList.filter((s) => s.status === 'reviewed').length;

  const percentComplete = Math.round((submittedCount / totalGroups) * 100);

  const getTopicIcon = (type: string) => {
    switch (type) {
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

  const getTopicThemeClass = (color: string) => {
    switch (color) {
      case 'indigo':
        return {
          headerBg: 'bg-indigo-50/70 border-indigo-200 text-indigo-900',
          accent: 'border-indigo-300',
        };
      case 'sky':
        return {
          headerBg: 'bg-sky-50/70 border-sky-200 text-sky-900',
          accent: 'border-sky-300',
        };
      case 'purple':
        return {
          headerBg: 'bg-purple-50/70 border-purple-200 text-purple-900',
          accent: 'border-purple-300',
        };
      default:
        return {
          headerBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
          accent: 'border-emerald-300',
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed':
        return {
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          cardBorder: 'border-emerald-300 bg-white hover:border-emerald-500',
          label: 'Đã nhận xét',
        };
      case 'submitted':
        return {
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          cardBorder: 'border-blue-300 bg-white hover:border-blue-500',
          label: 'Đã gửi bài',
        };
      case 'in_progress':
        return {
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          cardBorder: 'border-amber-200 bg-amber-50/20 hover:border-amber-400',
          label: 'Đang làm bài',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          cardBorder: 'border-slate-200 bg-slate-50/50 hover:border-slate-400',
          label: 'Chưa bắt đầu',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-900">
      {/* Top Main Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Teacher Title */}
          <div className="flex items-center gap-3">
            <TechBookLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  PHÒNG THẢO LUẬN SỐ
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  Lớp {session.className}
                </span>
                {session.isLocked && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                    Đã Khóa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Giáo viên: <strong className="text-slate-700">{session.teacherName}</strong> ·{' '}
                {session.schoolName} · Tin học 10
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Projector Fullscreen Buttons */}
            <button
              onClick={() => {
                setPresentationGroupId(1);
                setIsMatrixPresentation(false);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              title="Trình chiếu bài làm từng nhóm lên máy chiếu"
            >
              <Tv className="w-4 h-4" />
              <span>Trình Chiếu Máy Chiếu</span>
            </button>

            <button
              onClick={() => {
                setPresentationGroupId(1);
                setIsMatrixPresentation(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              title="Trình chiếu tổng hợp ma trận 12 nhóm"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Trình Chiếu Tổng Hợp</span>
            </button>

            {/* QR Code */}
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              title="Hiển thị mã QR cho học sinh quét"
            >
              <QrIcon className="w-4 h-4" />
              <span className="hidden md:inline">Mã QR</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={() => exportSessionToCsv(session)}
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              title="Xuất kết quả 12 nhóm ra Excel/CSV"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Xuất Excel</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                soundOn
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
              }`}
              title={soundOn ? 'Âm thanh: Bật (Click để tắt)' : 'Âm thanh: Tắt (Click để bật)'}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              title="Cài đặt buổi thảo luận"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-colors"
              title="Đăng xuất khỏi màn hình giáo viên"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* 4 Metric KPI Cards Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* KPI 1 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng Số Nhóm
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {totalGroups}
              </span>
              <span className="text-xs font-medium text-slate-500">4 chủ đề</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Mỗi chủ đề 3 nhóm</p>
          </div>

          {/* KPI 2 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Đã Gửi Bài
              </span>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                {percentComplete}%
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
                {submittedCount}
                <span className="text-base text-slate-400 font-normal"> / {totalGroups}</span>
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Đang Làm / Chưa Nộp
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
                {inProgressOrPendingCount}
              </span>
              <span className="text-xs font-medium text-amber-700">nhóm</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Đang thảo luận thảo luận</p>
          </div>

          {/* KPI 4 */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Đã Nhận Xét
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
                {reviewedCount}
                <span className="text-base text-slate-400 font-normal"> / {submittedCount || 1}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Nhận xét trực tiếp</p>
          </div>
        </section>

        {/* 12 Group Cards Grouped into 4 Big Topic Areas */}
        <div className="space-y-6">
          {session.topics.map((top) => {
            const theme = getTopicThemeClass(top.color);

            return (
              <section
                key={top.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden"
              >
                {/* Topic Zone Header */}
                <div
                  className={`px-5 sm:px-6 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${theme.headerBg}`}
                >
                  <div className="flex items-center gap-2.5">
                    {getTopicIcon(top.iconType)}
                    <div>
                      <h2 className="font-extrabold text-sm sm:text-base tracking-tight">
                        KHU VỰC {top.number} – CHỦ ĐỀ {top.number}: {top.title}
                      </h2>
                      <p className="text-xs opacity-90 italic">
                        Tình huống: "{top.scenario}"
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 shadow-2xs border border-slate-200/60 shrink-0 self-start sm:self-center">
                    Nhóm phụ trách: {top.groupNumbers.join(', ')}
                  </span>
                </div>

                {/* 3 Group Cards Grid */}
                <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {top.groupNumbers.map((gNum) => {
                    const sub = session.submissions[gNum];
                    const fb = session.feedbacks[gNum];
                    const statusInfo = getStatusColor(sub?.status || 'not_started');
                    const isRecentlyUpdated = lastUpdatedGroupId === gNum;

                    return (
                      <div
                        key={gNum}
                        className={`rounded-2xl p-4 sm:p-5 border-2 transition-all duration-300 flex flex-col justify-between shadow-2xs hover:shadow-md ${
                          statusInfo.cardBorder
                        } ${isRecentlyUpdated ? 'ring-4 ring-blue-400 ring-offset-2 animate-pulse' : ''}`}
                      >
                        {/* Top Group Meta */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-extrabold text-sm flex items-center justify-center">
                                {gNum}
                              </span>
                              <h3 className="font-bold text-slate-900 text-sm">
                                Nhóm {gNum}
                              </h3>
                            </div>

                            {/* Status badge */}
                            <span
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.badge}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                              <span>{statusInfo.label}</span>
                            </span>
                          </div>

                          {/* Submission Content Preview */}
                          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-3 space-y-1.5 border border-slate-200/60">
                            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                              <span>Số từ: <strong className="text-slate-700">{sub?.wordCount || 0}</strong></span>
                              {sub?.submittedAt && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(sub.submittedAt).toLocaleTimeString('vi-VN')}</span>
                                </span>
                              )}
                            </div>

                            {/* Preview text */}
                            <p className="line-clamp-2 text-slate-700 italic">
                              {sub?.answer1
                                ? `C1: ${sub.answer1}`
                                : <span className="text-slate-400">Chưa nhập câu trả lời 1...</span>}
                            </p>
                          </div>

                          {/* Teacher feedback snippet if reviewed */}
                          {fb?.generalComment && (
                            <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-xs text-emerald-900 mb-3">
                              <div className="flex items-center gap-1 font-bold text-[11px] text-emerald-800 mb-0.5">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>Đã nhận xét:</span>
                              </div>
                              <p className="line-clamp-2 text-slate-700">{fb.generalComment}</p>
                            </div>
                          )}
                        </div>

                        {/* Card Action Buttons (3 Buttons required by spec) */}
                        <div className="grid grid-cols-3 gap-1.5 pt-3 border-t border-slate-100">
                          {/* 1. XEM BÀI */}
                          <button
                            onClick={() => setPreviewSubGroupId(gNum)}
                            className="flex items-center justify-center gap-1 py-2 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                            title="Xem chi tiết câu trả lời"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem bài</span>
                          </button>

                          {/* 2. TRÌNH CHIẾU */}
                          <button
                            onClick={() => {
                              setPresentationGroupId(gNum);
                              setIsMatrixPresentation(false);
                            }}
                            className="flex items-center justify-center gap-1 py-2 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors border border-blue-200"
                            title="Chiếu nhóm này lên máy chiếu"
                          >
                            <Tv className="w-3.5 h-3.5" />
                            <span>Chiếu</span>
                          </button>

                          {/* 3. NHẬN XÉT */}
                          <button
                            onClick={() => setFeedbackGroupId(gNum)}
                            className="flex items-center justify-center gap-1 py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors border border-emerald-200"
                            title="Mở bảng nhận xét của giáo viên"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Nhận xét</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Modal: View Details for Single Group (XEM BÀI) */}
      {previewSubGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Chi Tiết Bài Làm: Nhóm {previewSubGroupId}
                </h3>
                <p className="text-xs text-slate-500">
                  {session.topics.find((t) => t.groupNumbers.includes(previewSubGroupId))?.title}
                </p>
              </div>
              <button
                onClick={() => setPreviewSubGroupId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Đóng
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 italic">
                "{session.topics.find((t) => t.groupNumbers.includes(previewSubGroupId))?.scenario}"
              </div>

              {/* 3 Questions & Answers */}
              <div className="space-y-3">
                <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl">
                  <span className="font-bold text-blue-900 block mb-1">
                    1. {session.questions[0]?.prompt}
                  </span>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {session.submissions[previewSubGroupId]?.answer1 || (
                      <span className="text-slate-400 italic">Chưa trả lời</span>
                    )}
                  </p>
                </div>

                <div className="p-3.5 bg-purple-50/50 border border-purple-200/80 rounded-xl">
                  <span className="font-bold text-purple-900 block mb-1">
                    2. {session.questions[1]?.prompt}
                  </span>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {session.submissions[previewSubGroupId]?.answer2 || (
                      <span className="text-slate-400 italic">Chưa trả lời</span>
                    )}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                  <span className="font-bold text-emerald-900 block mb-1">
                    3. {session.questions[2]?.prompt}
                  </span>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {session.submissions[previewSubGroupId]?.answer3 || (
                      <span className="text-slate-400 italic">Chưa trả lời</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setPresentationGroupId(previewSubGroupId);
                    setIsMatrixPresentation(false);
                    setPreviewSubGroupId(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  <Tv className="w-4 h-4" />
                  <span>Mở Trình Chiếu Nhóm Này</span>
                </button>
                <button
                  onClick={() => {
                    setFeedbackGroupId(previewSubGroupId);
                    setPreviewSubGroupId(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Viết Nhận Xét</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presentation Fullscreen Modal */}
      {presentationGroupId !== null && (
        <PresentationModal
          initialGroupId={presentationGroupId}
          isOpen={presentationGroupId !== null}
          defaultToMatrix={isMatrixPresentation}
          onClose={() => setPresentationGroupId(null)}
        />
      )}

      {/* Teacher Feedback Drawer */}
      {feedbackGroupId !== null && (
        <TeacherFeedbackDrawer
          groupId={feedbackGroupId}
          onClose={() => setFeedbackGroupId(null)}
        />
      )}

      {/* Class Settings Modal */}
      <ClassSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Class QR Code Modal */}
      <QrCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </div>
  );
};
