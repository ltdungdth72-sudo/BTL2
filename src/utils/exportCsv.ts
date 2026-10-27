import { ClassSession } from '../types.ts';

export function exportSessionToCsv(session: ClassSession) {
  const headers = [
    'Số Nhóm',
    'Tên Nhóm',
    'Chủ Đề',
    'Tình Huống',
    'Câu Hỏi 1: Hành vi nào có vấn đề?',
    'Câu Trả Lời 1',
    'Câu Hỏi 2: Quyền lợi tác giả bị ảnh hưởng thế nào?',
    'Câu Trả Lời 2',
    'Câu Hỏi 3: Cần làm gì để sử dụng phù hợp?',
    'Câu Trả Lời 3',
    'Trạng Thái',
    'Số Từ',
    'Thời Gian Nộp',
    'Nhận Xét Chung (GV)',
    'Điểm Mạnh',
    'Cần Bổ Sung',
    'Đề Xuất Hoàn Thiện',
    'Đã Đánh Giá',
  ];

  const escapeCsv = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const statusLabel = (st: string) => {
    switch (st) {
      case 'reviewed': return 'Đã nhận xét';
      case 'submitted': return 'Đã gửi bài';
      case 'in_progress': return 'Đang làm bài';
      default: return 'Chưa bắt đầu';
    }
  };

  const q1Text = session.questions[0]?.prompt || 'Hành vi có vấn đề';
  const q2Text = session.questions[1]?.prompt || 'Quyền lợi tác giả';
  const q3Text = session.questions[2]?.prompt || 'Cách sử dụng phù hợp';

  const rows = [];
  rows.push(headers.join(','));

  for (let g = 1; g <= 12; g++) {
    const sub = session.submissions[g];
    const fb = session.feedbacks[g];
    const topic = session.topics.find((t) => t.groupNumbers.includes(g));

    const submittedDateStr = sub?.submittedAt
      ? new Date(sub.submittedAt).toLocaleString('vi-VN')
      : 'Chưa nộp';

    const row = [
      escapeCsv(g),
      escapeCsv(sub?.groupName || `Nhóm ${g}`),
      escapeCsv(topic ? `Chủ đề ${topic.number}: ${topic.title}` : ''),
      escapeCsv(topic?.scenario || ''),
      escapeCsv(q1Text),
      escapeCsv(sub?.answer1 || ''),
      escapeCsv(q2Text),
      escapeCsv(sub?.answer2 || ''),
      escapeCsv(q3Text),
      escapeCsv(sub?.answer3 || ''),
      escapeCsv(statusLabel(sub?.status || 'not_started')),
      escapeCsv(sub?.wordCount || 0),
      escapeCsv(submittedDateStr),
      escapeCsv(fb?.generalComment || ''),
      escapeCsv(fb?.strengths || ''),
      escapeCsv(fb?.improvements || ''),
      escapeCsv(fb?.suggestions || ''),
      escapeCsv(fb?.reviewedAt ? 'Có' : 'Chưa'),
    ];

    rows.push(row.join(','));
  }

  // Prepend UTF-8 BOM so MS Excel renders Vietnamese correctly
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const safeClassName = (session.className || '10A').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `KetQua_ThaoLuan_BanQuyen_${safeClassName}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
