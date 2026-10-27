# Phòng Thảo Luận Số – Bản Quyền Nội Dung Số (Tin Học 10)

Ứng dụng web cộng tác lớp học thời gian thực hỗ trợ 12 nhóm học sinh thảo luận trên điện thoại cá nhân và bảng điều khiển máy chiếu của giáo viên (Cô Lê Thị Dung – THPT Đinh Tiên Hoàng) với khả năng đồng bộ tức thì, trình chiếu toàn màn hình và nhận xét tương tác.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Các quyết định kỹ thuật và trải nghiệm chủ đạo đã được định hình theo mục tiêu sư phạm:**
> - **Cơ chế đồng bộ thời gian thực**: Sử dụng kiến trúc Server-Sent Events (SSE) kèm REST API trên máy chủ Express tích hợp sẵn trong ứng dụng. Mọi điện thoại học sinh khi bấm gửi bài sẽ lập tức đẩy dữ liệu lên máy chủ và kích hoạt sự kiện phát sóng đến màn hình giáo viên trong vòng 100ms mà không cần cài đặt thêm tài khoản đám mây hay trả phí.
> - **Bảo vệ màn hình Giáo viên**: Trang Giáo viên được bảo vệ bằng mã PIN quản trị an toàn (`gv10dth` mặc định, có thể đổi trong giao diện), lưu phiên làm việc qua token xác thực an toàn, đảm bảo học sinh không thể can thiệp hay sửa nhận xét.
> - **Giao diện học sinh**: Bố cục cuộn dọc mượt mà, tối ưu hóa cho màn hình cảm ứng điện thoại (vùng bấm ngón cái $\ge 44\text{px}$), tự động lưu bản nháp vào bộ nhớ thiết bị nếu gián đoạn mạng, có bộ đếm ký tự/từ và hộp thoại xác nhận trước khi gửi.

---

### 1. Overview & Core Concept

- **Mục tiêu sản phẩm**: Cung cấp một môi trường thảo luận tương tác kỹ thuật số trực tiếp trong tiết học Tin học 10 chủ đề "Bản quyền nội dung số, quyền lợi của tác giả và cách sử dụng nội dung số phù hợp".
- **Đối tượng sử dụng**:
  - **Học sinh lớp 10**: Sử dụng điện thoại thông minh quét mã QR hoặc truy cập đường link để vào phòng nhóm được phân công (1 trong 12 nhóm thuộc 4 chủ đề), đọc tình huống, suy nghĩ và trả lời 3 câu hỏi cốt lõi.
  - **Giáo viên (Cô Lê Thị Dung)**: Sử dụng máy tính xách tay kết nối máy chiếu lớp học để theo dõi tiến độ nộp bài của 12 nhóm theo thời gian thực, mở bài làm từng nhóm để chiếu toàn màn hình trước lớp, phân tích điểm mạnh - điểm cần bổ sung, chấm điểm nhận xét và xuất báo cáo tổng kết cuối buổi.
- **Giá trị cốt lõi**:
  - Không cần cài đặt phần mềm hay đăng ký tài khoản rườm rà.
  - 100% đồng bộ thời gian thực giữa các thiết bị di động và máy chiếu.
  - Chống mất dữ liệu bằng cơ chế lưu nháp ngoại tuyến và chống trùng lặp dữ liệu nộp bài.
  - Tối ưu hiển thị cho máy chiếu tỉ lệ 16:9 với phông chữ lớn, tương phản cao, phân chia rõ ràng 3 câu hỏi.

---

### 2. User Experience & Visual Design

#### A. Trải nghiệm người dùng (Key User Flows)

1. **Màn hình chào mừng (Role Gateway)**:
   - Header nhận diện thương hiệu học đường trang nhã: "PHÒNG THẢO LUẬN SỐ - Tin học 10 - Trường THPT Đinh Tiên Hoàng - GV: Lê Thị Dung".
   - Hai lối vào trực quan:
     - **VÀO KHÔNG GIAN HỌC SINH**: Mở cổng chọn/nhập mã nhóm (1–12) hoặc tự động chọn nhóm từ đường link QR (`?group=1` .. `?group=12`).
     - **MÀN HÌNH GIÁO VIÊN**: Yêu cầu nhập mã PIN bảo mật quản trị viên trước khi vào bảng điều khiển.

2. **Không gian Học sinh trên điện thoại**:
   - Header cố định hiển thị: Logo sách công nghệ, Tên Nhóm & Chủ đề, Trạng thái kết nối (Đang trực tuyến / Mất kết nối / Đã lưu nháp).
   - Thẻ Tình huống thực tế nổi bật với biểu tượng đặc trưng của chủ đề.
   - 3 ô nhập câu trả lời tương ứng với 3 câu hỏi:
     - *Câu 1*: Hành vi nào có vấn đề?
     - *Câu 2*: Quyền lợi của tác giả có thể bị ảnh hưởng như thế nào?
     - *Câu 3*: Cần làm gì để sử dụng nội dung phù hợp?
   - Mỗi câu hỏi có hướng dẫn gợi ý chi tiết, bộ đếm từ/ký tự sống động.
   - Thanh công cụ hành động: Nút "Lưu bản nháp", Nút "GỬI BÀI THẢO LUẬN" (kèm popup xác nhận), và Nút "Chỉnh sửa bài đã gửi" nếu giáo viên cho phép nộp lại.

3. **Bảng điều khiển Giáo viên (Teacher Command Center)**:
   - Thanh thông số tổng quan thời gian thực (KPI strip): Tổng số nhóm (12) | Đã gửi bài | Đang thảo luận | Đã nhận xét.
   - Lưới 12 thẻ nhóm chia thành 4 cụm chủ đề rõ ràng (3 nhóm/chủ đề).
   - Mỗi thẻ hiển thị: Số nhóm, icon chủ đề, trạng thái thực (Chưa nộp - Xám, Đang làm - Vàng, Đã gửi - Xanh dương, Đã nhận xét - Xanh lá), thời gian nộp bài, các nút thao tác nhanh (Xem bài, Trình chiếu, Nhận xét).
   - Âm thanh thông báo nhẹ nhàng (tùy chọn bật/tắt) khi có nhóm vừa gửi bài.
   - Nút chia sẻ mã QR & link tham gia để chiếu lên màn hình đầu giờ cho học sinh quét.

4. **Chế độ Trình Chiếu Toàn Màn Hình (Projector Presentation Mode)**:
   - Thiết kế tối ưu cho máy chiếu 16:9 với chữ to, độ tương phản sắc nét, loại bỏ mọi menu gây xao nhãng.
   - Hiển thị song song hoặc phân vùng 3 câu trả lời lớn, tự động xuống dòng, không bao giờ bị cắt chữ.
   - Điều hướng nhanh: Phím mũi tên Trái/Phải hoặc nút cảm ứng để chuyển mượt mà giữa các nhóm.
   - Tùy chọn Ẩn/Hiện phần nhận xét của cô giáo khi phân tích bài.
   - Chế độ **Trình chiếu tổng hợp (Grid Matrix)** hiển thị ma trận 12 nhóm để cô giáo tổng kết nhanh.

5. **Khu vực Đánh giá & Nhận xét của Giáo viên**:
   - Biểu mẫu nhận xét sư phạm gồm: Nhận xét chung, Điểm mạnh, Nội dung cần bổ sung, Đề xuất hoàn thiện.
   - Đánh dấu trạng thái "Đã nhận xét", đồng bộ tức thì vào cơ sở dữ liệu.
   - Tùy chọn công bố nhận xét để học sinh xem lại sau khi kết thúc thảo luận.
   - Xuất toàn bộ kết quả 12 nhóm ra tệp CSV/Excel chuẩn tiếng Việt (UTF-8 with BOM).

#### B. Định hướng hình ảnh & phong cách (Visual Identity)
- **Bảng màu chủ đạo**:
  - *Nền chủ đạo (60%)*: Màu trắng ngà / xám sáng cao cấp (`#F8FAFC` & `#FFFFFF`).
  - *Cấu trúc & Phân vùng (30%)*: Màu xanh navy tri thức (`#0F172A`), xanh biển (`#0284C7`), tím phấn (`#7C3AED`), xanh ngọc (`#0D9488`).
  - *Điểm nhấn tương tác (10%)*: Xanh dương hoàng gia (`#2563EB`) cho nút hành động chính, xanh ngọc (`#10B981`) cho trạng thái hoàn thành.
- **Bộ 4 chủ đề phân định màu sắc**:
  - *Chủ đề 1 (Phần mềm trả phí)*: Tông màu Chàm & Khiên bảo vệ (`#4338CA`).
  - *Chủ đề 2 (Ảnh trên Internet)*: Tông màu Xanh ngọc & Bản quyền ảnh (`#0284C7`).
  - *Chủ đề 3 (Âm nhạc mạng xã hội)*: Tông màu Tím hoàng hôn & Nốt nhạc video (`#7C3AED`).
  - *Chủ đề 4 (Giấy phép bản quyền)*: Tông màu Xanh lá thông & Tài liệu giấy phép (`#059669`).
- **Kiểu chữ**:
  - Phông hiển thị và tiêu đề: `Plus Jakarta Sans` thanh thoát, hiện đại, hỗ trợ dấu tiếng Việt chuẩn xác.
  - Phông nội dung: `Plus Jakarta Sans` với độ cao dòng 1.6 đảm bảo học sinh đọc thoải mái trên màn hình nhỏ và người xem từ xa máy chiếu vẫn nhìn rõ.
  - Phông số liệu bảng: Tabular numbers `tabular-nums` cho thời gian và bộ đếm.

---

### 3. Key Product Decisions & Trade-Offs

- **Kiến trúc Server-Sent Events (SSE) + In-Memory / File-Backed Persistence**:
  - *Lựa chọn*: Tích hợp backend Node.js / Express phục vụ đồng thời giao diện Vite và các endpoint API `/api/*` với cơ chế SSE streaming `/api/events`.
  - *Lý do*: Đảm bảo hoạt động ngay lập tức 100% mà không bị phụ thuộc vào việc cấu hình khóa Firebase bên thứ ba vốn có thể gặp lỗi hạn ngạch hoặc chính sách mạng trường học. Máy chủ lưu trữ phiên làm việc, tự động sao lưu dữ liệu và phát tín hiệu cho màn hình giáo viên ngay khi học sinh nộp bài.
- **Hệ thống lưu nháp kép (Dual-Layer Offline Resilience)**:
  - Học sinh gõ chữ đến đâu được lưu tức thì vào `localStorage` của thiết bị đó. Khi mất sóng wifi, ứng dụng hiển thị cờ cảnh báo màu vàng "Chưa đồng bộ lên máy chủ". Khi có sóng trở lại, học sinh có thể gửi an toàn mà không bị mất bất kỳ từ nào.
- **Bảo mật phân quyền theo nhóm**:
  - Học sinh chỉ có thể gửi bài cho nhóm mình chọn. Mã định danh nhóm được kiểm tra hợp lệ, chống ghi đè bài của nhóm khác. Màn hình giáo viên được khóa bằng mật mã PIN với cơ chế xác thực phiên an toàn.
- **Tùy biến bài học cho các buổi sau**:
  - Giáo viên có bảng cài đặt cấu hình buổi học: Có thể đổi tên lớp (10A1, 10A2...), chỉnh sửa nội dung 4 tình huống hoặc thay đổi 3 câu hỏi cho các tiết học tiếp theo, cũng như thiết lập lại dữ liệu khi bắt đầu lớp mới.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KIẾN TRÚC HỆ THỐNG                              │
└────────────────────────────────────────────────────────────────────────┘

  [ 12 Điện thoại Học sinh ]              [ Màn hình Máy chiếu GV ]
       (Mobile Web Browser)                   (Laptop / Projector)
                │                                      │
                │ HTTP POST /api/submit                │ SSE Stream
                │ HTTP GET  /api/draft                 │ /api/events
                ▼                                      ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                   EXPRESS APPLET SERVER (Port 3000)                  │
  │                                                                      │
  │  • /api/session       - Quản lý thông tin lớp & chủ đề 12 nhóm       │
  │  • /api/submit        - Tiếp nhận bài nộp, cập nhật trạng thái       │
  │  • /api/feedback      - Lưu nhận xét, chấm điểm của giáo viên        │
  │  • /api/auth          - Xác thực mã PIN giáo viên                    │
  │  • /api/events (SSE)  - Phát sóng cập nhật thời gian thực tức thì    │
  │                                                                      │
  │  ┌────────────────────────────────────────────────────────────────┐  │
  │  │               BỘ LƯU TRỮ DỮ LIỆU BỀN VỮNG                      │  │
  │  │   (Dữ liệu buổi học, bài nộp 12 nhóm, nhận xét & lịch sử)     │  │
  │  └────────────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────────────┘
```

#### Mô hình dữ liệu (Data Schema):
- **Session / Class**: `id`, `className`, `teacherName`, `schoolName`, `isLocked`, `pinCode`, `topics`, `questions`.
- **Submission (Bài nộp từng nhóm 1-12)**: `groupId`, `groupNumber`, `topicId`, `answer1`, `answer2`, `answer3`, `status` (`not_started` | `in_progress` | `submitted` | `reviewed`), `submittedAt`, `updatedAt`, `wordCount`.
- **Feedback (Nhận xét của cô Dung)**: `groupId`, `generalComment`, `strengths`, `improvements`, `suggestions`, `isPublished`, `reviewedAt`.

#### Thành phần giao diện (UI Components):
- `RoleGateway`: Chọn vai trò Học sinh / Giáo viên, quét mã QR.
- `StudentWorkspace`: Giao diện di động, hiển thị tình huống, 3 ô nhập câu hỏi, thanh đếm từ, lưu nháp và nộp bài.
- `TeacherDashboard`: Bảng điều khiển máy chiếu, 4 thẻ KPI, lưới 12 nhóm với 4 màu chủ đề, bộ điều khiển buổi học.
- `PresentationModal`: Trình chiếu toàn màn hình 16:9, điều hướng tiến lùi nhóm, chế độ xem ma trận 12 nhóm.
- `TeacherFeedbackDrawer`: Biểu mẫu nhận xét sư phạm chi tiết 4 mục cho từng nhóm.
- `ClassSettingsModal`: Chỉnh sửa tên lớp, đổi câu hỏi, đổi chủ đề, tạo buổi mới hoặc xuất file Excel/CSV.
- `AudioNotificationManager`: Hiệu ứng âm thanh tinh tế khi nộp bài và nhận bài mới với nút bật/tắt tiện lợi.
