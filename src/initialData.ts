import { ClassSession, Topic, Question, GroupSubmission, TeacherFeedback } from './types.ts';

export const DEFAULT_TOPICS: Topic[] = [
  {
    id: 'topic-1',
    number: 1,
    title: 'PHẦN MỀM TRẢ PHÍ VÀ BẢN QUYỀN',
    scenario: 'Một học sinh tải phần mềm trả phí từ nguồn không chính thức và dùng bản đã bẻ khóa (crack).',
    iconType: 'shield',
    groupNumbers: [1, 2, 3],
    color: 'indigo',
  },
  {
    id: 'topic-2',
    number: 2,
    title: 'SỬ DỤNG HÌNH ẢNH TRÊN INTERNET',
    scenario: 'Lấy ảnh trên Internet đưa vào bài trình chiếu, không ghi nguồn và không kiểm tra điều kiện sử dụng.',
    iconType: 'image',
    groupNumbers: [4, 5, 6],
    color: 'sky',
  },
  {
    id: 'topic-3',
    number: 3,
    title: 'SỬ DỤNG BÀI HÁT LÀM NHẠC NỀN',
    scenario: 'Dùng một bài hát nổi tiếng làm nhạc nền cho video của lớp rồi đăng công khai lên mạng xã hội.',
    iconType: 'music',
    groupNumbers: [7, 8, 9],
    color: 'purple',
  },
  {
    id: 'topic-4',
    number: 4,
    title: 'SỬ DỤNG HÌNH ẢNH CÓ GIẤY PHÉP',
    scenario: 'Tải một hình ảnh có giấy phép sử dụng, nhưng chưa đọc điều kiện giấy phép trước khi chỉnh sửa và đăng lại.',
    iconType: 'file-badge',
    groupNumbers: [10, 11, 12],
    color: 'emerald',
  },
];

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    order: 1,
    prompt: 'Hành vi nào có vấn đề?',
    hint: 'Chỉ rõ hành vi chưa đúng, chưa xin phép hoặc vi phạm quy định pháp luật / bản quyền trong tình huống trên.',
  },
  {
    id: 'q2',
    order: 2,
    prompt: 'Quyền lợi của tác giả có thể bị ảnh hưởng như thế nào?',
    hint: 'Phân tích các tổn hại về kinh tế (doanh thu), uy tín, danh dự hoặc quyền toàn vẹn tác phẩm của tác giả.',
  },
  {
    id: 'q3',
    order: 3,
    prompt: 'Cần làm gì để sử dụng nội dung phù hợp?',
    hint: 'Đưa ra các giải pháp đúng đắn, hợp pháp (mua bản quyền, xin phép, trích dẫn nguồn, tìm tài nguyên miễn phí bản quyền hoặc giấy phép Creative Commons).',
  },
];

export function createInitialSubmissions(): Record<number, GroupSubmission> {
  const submissions: Record<number, GroupSubmission> = {};
  for (let i = 1; i <= 12; i++) {
    const topicId = i <= 3 ? 'topic-1' : i <= 6 ? 'topic-2' : i <= 9 ? 'topic-3' : 'topic-4';
    submissions[i] = {
      groupId: i,
      groupName: `Nhóm ${i}`,
      topicId,
      answer1: '',
      answer2: '',
      answer3: '',
      status: 'not_started',
      submittedAt: null,
      updatedAt: new Date().toISOString(),
      wordCount: 0,
    };
  }
  return submissions;
}

export function createInitialFeedbacks(): Record<number, TeacherFeedback> {
  const feedbacks: Record<number, TeacherFeedback> = {};
  for (let i = 1; i <= 12; i++) {
    feedbacks[i] = {
      groupId: i,
      generalComment: '',
      strengths: '',
      improvements: '',
      suggestions: '',
      reviewedAt: null,
      isPublished: false,
    };
  }
  return feedbacks;
}

export function createInitialSession(): ClassSession {
  return {
    id: 'session-' + Date.now(),
    className: '10A1',
    schoolName: 'THPT Đinh Tiên Hoàng',
    teacherName: 'Lê Thị Dung',
    subject: 'Tin học 10',
    sessionTitle: 'Bản quyền nội dung số, quyền lợi của tác giả và cách sử dụng nội dung số phù hợp',
    isLocked: false,
    pinCode: 'gv10dth',
    createdAt: new Date().toISOString(),
    topics: DEFAULT_TOPICS,
    questions: DEFAULT_QUESTIONS,
    submissions: createInitialSubmissions(),
    feedbacks: createInitialFeedbacks(),
  };
}
