import React, { useState } from 'react';
import { TechBookLogo } from './TechBookLogo.tsx';
import { useSession } from '../context/SessionContext.tsx';
import { ShieldCheck, Image, Music, FileBadge, Lock, ArrowRight, QrCode as QrIcon, Users, Sparkles, KeyRound } from 'lucide-react';
import { QrCodeModal } from './QrCodeModal.tsx';

interface RoleGatewayProps {
  onSelectStudent: (groupId: number) => void;
  onEnterTeacher: () => void;
}

export const RoleGateway: React.FC<RoleGatewayProps> = ({ onSelectStudent, onEnterTeacher }) => {
  const { session, loginTeacher, teacherToken } = useSession();
  const [showStudentPicker, setShowStudentPicker] = useState<boolean>(false);
  const [showTeacherPinModal, setShowTeacherPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setIsVerifying(true);
    const res = await loginTeacher(pinInput);
    setIsVerifying(false);
    if (res.success) {
      setShowTeacherPinModal(false);
      onEnterTeacher();
    } else {
      setPinError(res.error || 'Mã PIN không đúng.');
    }
  };

  const getTopicIcon = (type: string) => {
    switch (type) {
      case 'shield':
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      case 'image':
        return <Image className="w-5 h-5 text-sky-600" />;
      case 'music':
        return <Music className="w-5 h-5 text-purple-600" />;
      default:
        return <FileBadge className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getTopicBorderClass = (color: string) => {
    switch (color) {
      case 'indigo':
        return 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-400';
      case 'sky':
        return 'border-sky-200 bg-sky-50/50 hover:border-sky-400';
      case 'purple':
        return 'border-purple-200 bg-purple-50/50 hover:border-purple-400';
      default:
        return 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <TechBookLogo size={38} />
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
              PHÒNG THẢO LUẬN SỐ
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {session?.schoolName || 'Trường THPT Đinh Tiên Hoàng'} · Tin học 10
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowQrModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
        >
          <QrIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Mã QR lớp học</span>
        </button>
      </header>

      {/* Main Hero Card */}
      <main className="max-w-4xl w-full mx-auto my-auto py-8 text-center">
        {/* Welcome Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full mb-4 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Tiết học tương tác kỹ thuật số – 12 Nhóm thảo luận trực tiếp</span>
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight mb-4">
          Bản Quyền Nội Dung Số &amp; Đạo Đức Kỹ Thuật Số
        </h2>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
          Giáo viên phụ trách: <strong className="text-slate-800 font-semibold">{session?.teacherName || 'Lê Thị Dung'}</strong> · Lớp{' '}
          <strong className="text-slate-800 font-semibold">{session?.className || '10A1'}</strong>
          <br className="hidden sm:block" />
          Học sinh tham gia thảo luận trên điện thoại cá nhân. Dữ liệu câu trả lời sẽ được cập nhật trực tiếp lên máy chiếu của giáo viên.
        </p>

        {/* 2 Primary Choice Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto mb-8 text-left">
          {/* Option 1: Student Workspace */}
          <div
            onClick={() => setShowStudentPicker(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setShowStudentPicker(true);
            }}
            className="group relative p-6 bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-600 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                Dành cho học sinh
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Vào Không Gian Học Sinh
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Chọn số nhóm (1–12) theo phân công của cô Dung, đọc tình huống thực tế và cùng nhóm gửi 3 câu trả lời.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Bắt đầu làm bài</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Option 2: Teacher Screen */}
          <div
            onClick={() => {
              if (teacherToken) {
                onEnterTeacher();
              } else {
                setShowTeacherPinModal(true);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (teacherToken) onEnterTeacher();
                else setShowTeacherPinModal(true);
              }
            }}
            className="group relative p-6 bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Dành cho giáo viên
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Màn Hình Giáo Viên
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Bảng điều khiển máy chiếu lớp học, theo dõi 12 nhóm thời gian thực, trình chiếu toàn màn hình và nhận xét.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform">
              <span>Mở bảng điều khiển</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Student Group Selection Modal / Bottom Sheet */}
        {showStudentPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-left max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Chọn Nhóm Của Bạn
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mỗi nhóm được phân công theo 4 chủ đề bài học khác nhau.
                  </p>
                </div>
                <button
                  onClick={() => setShowStudentPicker(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1.5 rounded-lg hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>

              {/* 4 Topic Clusters */}
              <div className="space-y-4">
                {session?.topics.map((topic) => (
                  <div
                    key={topic.id}
                    className={`p-4 rounded-xl border ${getTopicBorderClass(topic.color)} transition-all`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {getTopicIcon(topic.iconType)}
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Chủ đề {topic.number}: {topic.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 italic">
                      "{topic.scenario}"
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {topic.groupNumbers.map((gNum) => {
                        const sub = session.submissions[gNum];
                        const isDone = sub?.status === 'submitted' || sub?.status === 'reviewed';
                        return (
                          <button
                            key={gNum}
                            onClick={() => {
                              setShowStudentPicker(false);
                              onSelectStudent(gNum);
                            }}
                            className="flex items-center justify-between p-2.5 bg-white hover:bg-blue-600 hover:text-white rounded-lg border border-slate-200 shadow-2xs font-semibold text-xs sm:text-sm text-slate-800 transition-all active:scale-95 group"
                          >
                            <span>Nhóm {gNum}</span>
                            {isDone && (
                              <span className="text-[10px] text-blue-600 group-hover:text-white font-normal">
                                ✓ Đã gửi
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Teacher PIN Modal */}
        {showTeacherPinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-left">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center mb-3">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Xác Thực Giáo Viên
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Nhập mã PIN bảo vệ để mở bảng điều khiển và trình chiếu bài học.
              </p>

              <form onSubmit={handleTeacherSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mã PIN Quản Trị
                  </label>
                  <input
                    type="password"
                    autoFocus
                    placeholder="Nhập mã PIN..."
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm font-mono tracking-widest"
                  />
                  {pinError && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{pinError}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Gợi ý mã mặc định cho cô Dung: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">gv10dth</code>
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTeacherPinModal(false);
                      setPinError('');
                    }}
                    className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || !pinInput.trim()}
                    className="flex-1 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
                  >
                    {isVerifying ? 'Đang kiểm tra...' : 'Vào Màn Hình'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 text-xs text-slate-500 border-t border-slate-200/80">
        © {new Date().getFullYear()} THPT Đinh Tiên Hoàng · Tiết Tin Học 10 · Giáo viên: Lê Thị Dung · Bản quyền nội dung số
      </footer>

      {/* QR Modal */}
      <QrCodeModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} />
    </div>
  );
};
