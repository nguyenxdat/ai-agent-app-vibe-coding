# Hiến Chương Ứng Dụng AI Chat

## Nguyên Tắc Cốt Lõi

### I. Kiến Trúc Đa Nền Tảng

Ứng dụng phải hỗ trợ cả nền tảng Desktop (Electron) và Web (React Native Web + Vite) sử dụng chiến lược codebase dùng chung:

- Các component UI và business logic phải độc lập với nền tảng
- Các triển khai đặc thù cho từng nền tảng phải được tách biệt trong các module riêng
- Trải nghiệm người dùng nhất quán trên cả Desktop và Web
- TypeScript để đảm bảo type safety và dễ bảo trì trên toàn bộ frontend code

### II. Tiêu Chuẩn UI/UX Hiện Đại

Giao diện người dùng phải tuân theo các mẫu thiết kế hiện đại và tiêu chuẩn truy cập:

- Tailwind CSS cho styling theo phương pháp utility-first
- shadcn/ui cho các component có thể tùy chỉnh và accessible
- assistant-ui cho các mẫu giao diện AI chat
- Thiết kế responsive hỗ trợ nhiều kích thước màn hình
- Hỗ trợ chế độ sáng/tối
- Hỗ trợ điều hướng bằng bàn phím và screen reader

### III. Backend Ưu Tiên Agent (BẮT BUỘC)

Backend phải được xây dựng sử dụng agent frameworks theo giao thức A2A (Agent-to-Agent):

- Sử dụng ADK framework (hoặc LangChain là phương án thay thế) để phát triển agent
- Triển khai public A2A server để các agent giao tiếp với nhau
- Các Agent phải modular, có thể test độc lập, và deploy độc lập
- Tách biệt rõ ràng giữa agent logic và transport layer

### IV. Quản Lý Cấu Hình A2A

Hệ thống cấu hình phải hỗ trợ thiết lập A2A agent linh hoạt:

- Giao diện thân thiện để cấu hình các kết nối A2A
- Hỗ trợ nhiều cấu hình và profile cho agent
- Lưu trữ thông tin xác thực an toàn cho agent
- Validate cấu hình trước khi khởi tạo agent
- Chức năng import/export cấu hình agent

### V. Type Safety và Chất Lượng Code

Duy trì tiêu chuẩn chất lượng code cao trong toàn bộ ứng dụng:

- Bật TypeScript strict mode cho tất cả frontend code
- Định nghĩa type đầy đủ cho các interface của A2A protocol
- Cấu hình ESLint và Prettier để đảm bảo code style nhất quán
- Pre-commit hooks để kiểm tra linting và type checking
- Yêu cầu code review cho mọi thay đổi

## Yêu Cầu Công Nghệ

### Frontend Stack

- **Nền tảng Desktop**: Electron Framework (phiên bản LTS mới nhất)
- **Nền tảng Web**: React Native Web + Vite cho build nhanh và HMR
- **Ngôn ngữ**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Thư viện Component**: shadcn/ui, assistant-ui
- **Quản lý State**: React Context/Redux (sẽ quyết định dựa trên độ phức tạp)
- **Build Tool**: Vite để tối ưu bundling

### Backend Stack

- **Agent Framework**: ADK framework (ưu tiên) hoặc LangChain (phương án thay thế)
- **Protocol**: A2A (Agent-to-Agent) standard
- **Loại API**: RESTful và/hoặc WebSocket cho giao tiếp realtime
- **Ngôn ngữ**: TypeScript/Node.js hoặc Python (tùy thuộc vào agent framework được chọn)
- **Testing**: Jest/Vitest cho unit tests, integration test suite cho A2A communication

## Tiêu Chuẩn Phát Triển Tính Năng

### Tính Năng Cấu Hình A2A

- Phải hỗ trợ thêm, sửa, và xóa cấu hình agent
- Validate agent endpoints và credentials trước khi lưu
- Giao diện trực quan cho người dùng không chuyên về kỹ thuật
- Thông báo lỗi rõ ràng và hướng dẫn khắc phục
- Lưu trữ cấu hình giữa các phiên làm việc

### Tính Năng Chat với A2A Agent

- Streaming message realtime từ các agent
- Lưu trữ lịch sử tin nhắn
- Hỗ trợ các định dạng tin nhắn phong phú (text, markdown, code blocks)
- Hiển thị typing indicators và thông tin presence
- Xử lý lỗi và logic retry cho các lần giao tiếp agent thất bại
- Quản lý context của tin nhắn cho các cuộc hội thoại nhiều lượt

## Quản Trị

Hiến chương này hướng dẫn tất cả các quyết định về kiến trúc và triển khai cho ứng dụng AI Chat. Tất cả các tính năng phải:

- Tuân thủ nguyên tắc kiến trúc đa nền tảng
- Tuân theo các tiêu chuẩn giao thức A2A cho giao tiếp agent
- Duy trì type safety bằng TypeScript
- Cung cấp trải nghiệm người dùng tuyệt vời trên cả Desktop và Web

Thay đổi các nguyên tắc cốt lõi yêu cầu:

- Tài liệu hóa lý do và phân tích tác động
- Review bởi technical lead
- Cập nhật tài liệu hiến chương này với version increment

**Phiên bản**: 1.0.0 | **Phê duyệt**: 2025-11-04 | **Sửa đổi lần cuối**: 2025-11-04
