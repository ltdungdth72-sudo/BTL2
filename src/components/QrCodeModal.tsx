import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useSession } from '../context/SessionContext.tsx';
import {
  X,
  Copy,
  Check,
  QrCode as QrIcon,
  Smartphone,
  ExternalLink,
  Edit2,
  AlertCircle,
  HelpCircle,
  Globe,
  RefreshCw,
} from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  selectedGroup?: number;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, selectedGroup }) => {
  const { session } = useSession();

  // Determine candidate URLs
  const getCandidateUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    // If running on a public domain (like vercel.app, custom domain):
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return selectedGroup ? `${origin}?group=${selectedGroup}` : origin;
    }
    // If running on localhost or dev sandbox, but server provided an appUrl:
    if (session?.appUrl && !session.appUrl.includes('localhost')) {
      return selectedGroup ? `${session.appUrl}?group=${selectedGroup}` : session.appUrl;
    }
    return selectedGroup ? `${origin}?group=${selectedGroup}` : origin;
  };

  const [targetUrl, setTargetUrl] = useState<string>(getCandidateUrl);
  const [isEditingUrl, setIsEditingUrl] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState<boolean>(true);

  // Sync default URL when session or modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetUrl(getCandidateUrl());
    }
  }, [isOpen, session?.appUrl, selectedGroup]);

  // Generate QR code whenever targetUrl changes
  useEffect(() => {
    if (!isOpen || !targetUrl) return;

    QRCode.toDataURL(targetUrl, {
      width: 440,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(targetUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const isLocalhost = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');
  const isAisDev = targetUrl.includes('ais-dev-');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative text-center max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <QrIcon className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
            {selectedGroup ? `Mã QR Tham Gia: Nhóm ${selectedGroup}` : 'Mã QR Vào Phòng Thảo Luận'}
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Học sinh dùng camera điện thoại hoặc Zalo để quét mã và tham gia thảo luận trực tiếp.
        </p>

        {/* Big Crisp QR Code */}
        <div className="bg-slate-50 border-2 border-slate-200 p-3 sm:p-4 rounded-2xl inline-block shadow-inner mx-auto mb-3">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Mã QR tham gia thảo luận"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto rounded-xl"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              Đang tạo mã QR...
            </div>
          )}
        </div>

        {/* URL Box & Editable Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5 px-1">
            <span>Đường link mã QR đang hướng tới:</span>
            <button
              onClick={() => setIsEditingUrl(!isEditingUrl)}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditingUrl ? 'Xong' : 'Chỉnh sửa URL'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
            <input
              type="text"
              readOnly={!isEditingUrl}
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Nhập URL (VD: https://... hoặc http://192.168.1.X:3000)"
              className={`text-xs text-slate-800 bg-transparent flex-1 outline-none px-2 font-mono truncate ${
                isEditingUrl ? 'bg-white rounded-md p-1 border border-blue-400 ring-1 ring-blue-300' : ''
              }`}
            />
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cloud Notice / Diagnostic Warning if in Dev Sandbox */}
        {(isLocalhost || isAisDev) && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 mb-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Lưu ý khi quét mã từ điện thoại:</span>
            </div>
            {isLocalhost && (
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Đường dẫn hiện tại chứa <code>localhost</code> (chỉ chạy trên máy tính này). Điện thoại học sinh sẽ không truy cập được nếu không nhập địa chỉ IP mạng Wi-Fi của máy (ví dụ: <code>http://192.168.1.15:3000</code>).
              </p>
            )}
            {isAisDev && (
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Link xem trước (<code>ais-dev-...</code>) được Google bảo mật bằng tài khoản của cô giáo. Để toàn bộ học sinh trong trường quét vào được ngay mà không cần tài khoản Google: Hãy bấm nút <strong>Publish / Deploy</strong> (hoặc Share) trên AI Studio để nhận link công khai, sau đó dán vào ô trên!
              </p>
            )}
          </div>
        )}

        {/* Quick Guide Accordion */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs text-slate-700">
          <div
            onClick={() => setShowTroubleshoot(!showTroubleshoot)}
            className="flex items-center justify-between font-bold text-slate-800 cursor-pointer select-none"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>3 cách để học sinh kết nối vào lớp học mượt mà:</span>
            </span>
            <span className="text-xs text-blue-600">{showTroubleshoot ? 'Thu gọn' : 'Xem chi tiết'}</span>
          </div>

          {showTroubleshoot && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <div>
                <strong className="text-slate-800">1. Cách nhanh nhất (Internet / 4G):</strong>
                <p>
                  Bấm xuất bản (Publish) ứng dụng trên AI Studio để nhận link công khai (dạng <code>ais-pre-...</code>), dán link đó vào ô chỉnh sửa ở trên để tạo mã QR chuẩn cho cả lớp.
                </p>
              </div>
              <div>
                <strong className="text-slate-800">2. Kết nối cùng mạng Wi-Fi trường học:</strong>
                <p>
                  Nếu máy tính của cô và điện thoại học sinh cùng bắt một mạng Wi-Fi, cô kiểm tra địa chỉ IP của máy tính (bằng lệnh <code>ipconfig</code> trên Windows) rồi nhập <code>http://[Địa_chỉ_IP]:3000</code> vào ô URL.
                </p>
              </div>
              <div>
                <strong className="text-slate-800">3. Nhập trực tiếp qua trình duyệt:</strong>
                <p>
                  Học sinh có thể mở Safari (iPhone) hoặc Chrome (Android), gõ đường link rút gọn hoặc link mà cô chia sẻ lên bảng mà không cần tải bất kỳ phần mềm nào.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
