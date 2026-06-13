# RescueSOS Frontend

RescueSOS Frontend là giao diện web cho hệ thống cứu hộ phương tiện RescueSOS. Ứng dụng hỗ trợ người dùng gửi yêu cầu cứu hộ theo vị trí, công ty cứu hộ quản lý dịch vụ và tiếp nhận yêu cầu, quản trị viên theo dõi hệ thống, cùng các chức năng cộng đồng và thông báo.

## Tính năng chính

- **Trang chủ:** giới thiệu dịch vụ, hiển thị công ty/dịch vụ cứu hộ nổi bật.
- **Tìm dịch vụ:** tìm công ty cứu hộ theo vị trí, khoảng cách và loại dịch vụ.
- **Người dùng:** đăng ký, đăng nhập, quản lý hồ sơ, tạo yêu cầu cứu hộ, theo dõi tiến trình, nhắn tin, gửi ảnh và đánh giá.
- **Công ty cứu hộ:** quản lý hồ sơ công ty, dịch vụ, phương tiện, yêu cầu đang xử lý và thống kê.
- **Quản trị viên:** quản lý người dùng, công ty, yêu cầu cứu hộ và nội dung cộng đồng.
- **Cộng đồng:** đăng bài, bình luận, thích bài viết/bình luận và báo cáo nội dung.
- **Bản đồ/GPS:** chọn vị trí, tìm đơn vị cứu hộ gần nhất bằng Leaflet và React Leaflet.
- **Upload ảnh:** upload qua Cloudinary bằng chữ ký lấy từ backend.

## Công nghệ sử dụng

- React 19.
- Vite 8.
- React Router DOM 7.
- Tailwind CSS 4.
- Radix UI, lucide-react.
- Leaflet, React Leaflet.
- Recharts.
- ESLint.

## Cấu trúc thư mục

```text
auto-sos-frontend/
  src/
    api/                  # Hàm gọi REST API backend
    components/           # Layout, bản đồ, UI components
    context/              # Trạng thái đăng nhập, role, thông báo
    data/                 # Mock data dùng khi cần fallback/demo
    hooks/                # Hook dùng chung, GPS/mobile
    pages/                # Các màn hình chính
    styles/               # CSS, theme, font
    utils/                # Hàm tiện ích
    App.jsx
    main.jsx
    routes.jsx
  vite.config.js
  package.json
```

## Yêu cầu cài đặt

- Node.js 18 trở lên.
- npm.
- Backend RescueSOS đang chạy nếu muốn dùng dữ liệu thật.
- Trình duyệt cho phép quyền vị trí nếu dùng chức năng GPS.

## Cài đặt và chạy frontend

### 1. Cài dependency

Từ thư mục gốc repository:

```bash
cd auto-sos-frontend
npm install
```

### 2. Chạy backend

Frontend gọi API qua đường dẫn `/api`. Trong môi trường phát triển, Vite proxy các request này tới backend tại `http://localhost:5001`.

Mở một terminal khác và chạy backend:

```bash
cd auto-sos-backend
npm install
npm run dev
```

Backend mặc định cần chạy tại:

```text
http://localhost:5001
```

Nếu backend chạy port khác, sửa `target` trong `vite.config.js` hoặc dùng biến môi trường `VITE_API_BASE_URL`.

### 3. Cấu hình biến môi trường

Frontend có thể chạy không cần file `.env` khi backend chạy local tại `http://localhost:5001` vì đã có proxy trong `vite.config.js`.

Nếu muốn trỏ frontend tới backend khác, tạo file `.env` trong thư mục `auto-sos-frontend`:

```env
VITE_API_BASE_URL=http://localhost:5001
```

Khi deploy, đặt `VITE_API_BASE_URL` bằng domain backend thật, ví dụ:

```env
VITE_API_BASE_URL=https://api.example.com
```

Lưu ý: biến môi trường của Vite phải bắt đầu bằng `VITE_` thì mới đọc được trong frontend.

### 4. Chạy ứng dụng

Chạy môi trường phát triển:

```bash
npm run dev
```

Vite sẽ in ra địa chỉ truy cập, thường là:

```text
http://localhost:5173
```

Mở địa chỉ này trên trình duyệt để sử dụng ứng dụng.

## Hướng dẫn sử dụng

### Điều hướng chính

| Đường dẫn | Chức năng |
| --- | --- |
| `/` | Trang chủ |
| `/find-services` | Tìm kiếm dịch vụ/công ty cứu hộ |
| `/login` | Đăng nhập, đăng ký người dùng hoặc công ty |
| `/dashboard` | Dashboard người dùng |
| `/profile` | Hồ sơ người dùng |
| `/company` | Dashboard công ty cứu hộ |
| `/admin` | Dashboard quản trị viên |
| `/community` | Cộng đồng |

### Đăng nhập và đăng ký

Truy cập `/login`, chọn đúng loại tài khoản:

- **Người dùng:** dùng để gửi yêu cầu cứu hộ, quản lý hồ sơ, nhắn tin, đánh giá.
- **Công ty:** dùng để quản lý dịch vụ, phương tiện, tiếp nhận và xử lý yêu cầu.
- **Admin:** dùng tài khoản có quyền quản trị đã tồn tại trong database.

Ứng dụng lưu phiên đăng nhập trong `localStorage` với key:

```text
rescuesos.auth
```

Khi cần đăng xuất hoặc đổi tài khoản, dùng chức năng đăng xuất trong giao diện. Nếu dữ liệu đăng nhập local bị lỗi, có thể xóa key này trong DevTools của trình duyệt.

### Tìm cứu hộ gần vị trí

Vào `/find-services` hoặc luồng tạo yêu cầu cứu hộ trong dashboard người dùng. Trình duyệt có thể hỏi quyền truy cập vị trí:

- Chọn cho phép để app tự lấy tọa độ hiện tại.
- Nếu không cho phép, có thể chọn vị trí trên bản đồ nếu màn hình hiện tại hỗ trợ.

Chức năng tìm kiếm cần backend có dữ liệu công ty với tọa độ hợp lệ trong database.

### Upload ảnh

Các màn hình hồ sơ, yêu cầu cứu hộ hoặc cộng đồng có thể upload ảnh lên Cloudinary. Frontend sẽ:

1. Gọi backend để lấy chữ ký upload tại `/api/requests/cloudinary/signature`.
2. Upload file trực tiếp lên Cloudinary.
3. Lưu URL ảnh vào dữ liệu tương ứng.

Vì vậy backend cần cấu hình đủ các biến Cloudinary.

## Các lệnh npm

Chạy dev server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Preview bản build:

```bash
npm run preview
```

Kiểm tra lint:

```bash
npm run lint
```

## Build và deploy

Tạo bản build:

```bash
npm run build
```

Thư mục kết quả:

```text
dist/
```

Khi deploy frontend tĩnh, cần cấu hình server hosting để mọi route của React Router trả về `index.html`. Ví dụ các route `/dashboard`, `/company`, `/admin` đều là route phía client.

Nếu backend và frontend khác domain, đặt:

```env
VITE_API_BASE_URL=https://backend-domain.example.com
```

Sau khi đổi `.env`, cần build lại frontend.

## Lỗi thường gặp

### Không gọi được API backend

Kiểm tra backend đã chạy chưa:

```text
http://localhost:5001
```

Nếu frontend chạy local và backend dùng port khác, cập nhật proxy trong `vite.config.js` hoặc đặt `VITE_API_BASE_URL`.

### Trang map không hiển thị đúng

Kiểm tra kết nối mạng để tải tile map từ OpenStreetMap/Leaflet. Nếu dùng GPS, đảm bảo trình duyệt đã cấp quyền vị trí.

### Upload ảnh báo lỗi

Kiểm tra backend có đủ biến:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Refresh route bị 404 khi deploy

Hosting chưa cấu hình fallback về `index.html`. Cần bật rewrite cho SPA để các route của React Router hoạt động.

## Liên kết backend

Tài liệu cài đặt backend nằm tại:

```text
../auto-sos-backend/README.md
```

Nên chạy backend trước khi mở frontend để các màn hình lấy dữ liệu thật hoạt động đầy đủ.
