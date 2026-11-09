# MotoFlow — Design System (Master)

Nguồn: `ui-ux-pro-max` searches (2026-11), hiệu chỉnh theo sản phẩm vận hành giao thông.
Mọi giá trị dưới đây là **source of truth**; prototype, slide và plugin Figma đều đọc từ file này.

## 1. Bối cảnh sản phẩm

| Mục | Giá trị |
| --- | --- |
| Sản phẩm | MotoFlow — AI dự báo ùn tắc ngắn hạn + tối ưu tín hiệu thích ứng |
| Thị trường | TP. Hồ Chí Minh, giao thông hỗn hợp (xe máy chiếm ưu thế) |
| Người dùng 1 | Người đi đường (xe máy): nhận dự báo 5–15 phút, gợi ý "làn sóng xanh" |
| Người dùng 2 | Kỹ sư điều khiển đèn (trung tâm điều hành): phê duyệt kế hoạch đèn đề xuất |
| Nguyên tắc | Hệ thống **hỗ trợ ra quyết định**, không điều khiển đèn thật |
| Ngữ cảnh dùng | Ngoài đường, nắng chói, một tay, mạng chập chờn → tương phản cao, chữ lớn, ít bước |

Kiểu UI đã chọn: **Data-Dense Dashboard** (khối KPI, biểu đồ, bảng) + **Dark Mode** cho phòng điều hành;
bản mobile dùng nền tối để đọc nhanh ngoài trời, có **light mode** đầy đủ cho ban ngày.

## 2. Token màu

Nguồn: `color → "Smart Home/IoT Dashboard"` (dark tech + status green), tách riêng hệ màu **trạng thái giao thông**
để màu thương hiệu không bao giờ trùng nghĩa với màu dữ liệu.

### Dark (mặc định)

| Token | Hex | Dùng cho |
| --- | --- | --- |
| `--bg` | `#070B14` | Nền ứng dụng |
| `--surface` | `#0F172A` | Card, header |
| `--surface-2` | `#161F33` | Card lồng, hàng bảng hover |
| `--border` | `#243049` | Viền 1px, divider |
| `--text` | `#E8EEF9` | Chữ chính (16,9:1 trên --bg) |
| `--muted` | `#94A3B8` | Chữ phụ (7,7:1 trên bg · 7,0:1 trên surface) |
| `--brand` | `#3B82F6` | Hành động chính, tab active |
| `--brand-soft` | `rgba(59,130,246,.14)` | Nền chip/nút phụ |
| `--ai` | `#8B5CF6` | Nhãn "AI đề xuất", dự báo của mô hình |
| `--ok` | `#22C55E` | Thông thoáng / đèn xanh |
| `--warn` | `#F59E0B` | Chậm / chuẩn bị ùn |
| `--bad` | `#F43F5E` | Ùn tắc / đèn đỏ |
| `--focus` | `#93C5FD` | Vòng focus 2px |

### Light

| Token | Hex |
| --- | --- |
| `--bg` | `#F4F7FC` |
| `--surface` | `#FFFFFF` |
| `--surface-2` | `#EEF3FA` |
| `--border` | `#DCE5F2` |
| `--text` | `#0B1220` |
| `--muted` | `#54637A` | 
| `--brand` | `#1D4ED8` |
| `--ok` / `--warn` / `--bad` | `#15803D` / `#B45309` / `#BE123C` |

Quy tắc: mọi cặp chữ/nền ≥ 4.5:1; trạng thái luôn kèm **nhãn chữ hoặc hình dạng**, không chỉ màu.

## 3. Chữ

Nguồn: `typography → "Dashboard Data"` (Fira Sans + Fira Code), font self-host trong `prototype/fonts`.

| Vai trò | Font | Size / line | Weight |
| --- | --- | --- | --- |
| Display | Fira Sans | 30/36 | 700, letter-spacing -0.02em |
| H1 màn hình | Fira Sans | 22/28 | 700 |
| H2 card | Fira Sans | 15/20 | 600 |
| Body | Fira Sans | 14/21 | 400 |
| Meta / nhãn | Fira Sans | 12/16 | 500 |
| Số liệu (KPI, đếm giây) | Fira Code | 12–34 | 600, `tabular-nums` |
| Nhãn ALL-CAPS nhỏ | Fira Sans | 10.5/14 | 600, tracking .08em |

Không dùng quá 2 họ font. Số luôn `font-variant-numeric: tabular-nums`.

## 4. Khoảng cách, bán kính, đổ bóng

- Thang 4/8: `4 8 12 16 20 24 32 40 56`.
- Padding card mobile: 16. Gap giữa card: 12. Padding màn hình: 20.
- Radius: card 18, control 12, chip 999, sheet 24 (top).
- Shadow: `0 1px 0 rgba(255,255,255,.04) inset, 0 12px 32px -12px rgba(0,0,0,.6)`.
- Vùng chạm ≥ 44×44; icon-only button 40×40 với hit area 44.

## 5. Component

| Component | Quy cách |
| --- | --- |
| `card` | surface + border 1px + radius 18 + padding 16 |
| `kpi` | nhãn ALL-CAPS 10.5 + số Fira Code 24–34 + delta 12 |
| `state-chip` | chấm 8px + nhãn; nền tint 12% theo trạng thái |
| `btn-primary` | brand, chữ trắng, cao 44, radius 12, active scale .985 |
| `btn-ghost` | viền border, nền trong, chữ `--text` |
| `tabbar` | 5 tab, icon 22 + nhãn 10.5, active = brand + thanh 2px trên |
| `sheet` | kéo từ đáy, radius 24, scrim 55%, đóng bằng nút + Esc |
| `signal-ring` | vòng 3px, đếm giây Fira Code, màu theo pha |
| `forecast-chart` | line thực tế liền + dự báo nét đứt + dải tin cậy 15%; nhãn trực tiếp |
| `alert-row` | icon 36 + tiêu đề 14/600 + meta 12 + hành động |
| `banner` | 1 dòng, icon + chữ + link; dùng cho chế độ suy giảm |

## 6. Chuyển động

- Token: `120ms` (press), `200ms` (hover/state), `280ms` (sheet/screen), easing `cubic-bezier(.2,.7,.3,1)`.
- Không animate layout-bound khi press (chỉ opacity/scale .985).
- `prefers-reduced-motion: reduce` → tắt mọi transition/animation, giữ trạng thái cuối.
- Số đếm giây cập nhật mỗi 1s nhưng không nhấp nháy màu.

## 7. Trạng thái dữ liệu (bắt buộc hiển thị)

1. `Đang áp dụng` — kế hoạch đèn đang chạy.
2. `AI đề xuất` — có badge `--ai` + nút Phê duyệt / Từ chối.
3. `Chế độ an toàn` — khi camera lỗi: banner đỏ, kế hoạch cố định, khoá nút phê duyệt.
4. `Dữ liệu mô phỏng` — nhãn nhỏ ở chân màn hình, không bao giờ ẩn.

## 8. Anti-pattern (không làm)

- Không dùng emoji làm icon; chỉ SVG stroke 1.5 (bộ icon tự dựng, phong cách Lucide/Phosphor).
- Không đổi màu theo màu duy nhất để báo trạng thái.
- Không dùng đỏ cho hành động thường (chỉ cho "Từ chối/Dừng khẩn").
- Không hiển thị dự báo mà thiếu khoảng tin cậy hoặc thiếu mốc thời gian.
- Không giả vờ hệ thống điều khiển đèn thật; luôn ghi "đề xuất cần phê duyệt".
- Không dùng parallax/auto-play animation; không che nội dung bằng thanh cố định.
- Không đặt chữ < 12px cho nội dung, < 10.5px cho nhãn.

## 9. Bố cục

- Mobile: 390×844 (@2x export 780×1688), safe-area top 44 / bottom 34, content 20px, tabbar 64.
- Tablet/Desktop Ops: 12 cột, gutter 16, sidebar 232, header 60, mật độ cao (bảng 36px/hàng).
- Breakpoint: 480 / 768 / 1024 / 1440. Kiểm tra 375px và landscape.
- Nội dung dài (giải thích AI) giới hạn 68ch.

## 10. Checklist trước khi giao

- [ ] Tương phản 4.5:1 ở cả light và dark (đo, không đoán).
- [ ] Focus hiển thị rõ, thứ tự tab khớp thứ tự thị giác.
- [ ] Mọi biểu đồ có nhãn trực tiếp + bảng số thay thế.
- [ ] Target chạm ≥ 44px, không phần tử nào nằm dưới thanh cố định.
- [ ] Chế độ an toàn và dữ liệu mô phỏng luôn nhìn thấy.
- [ ] Giảm chuyển động và tăng cỡ chữ không vỡ layout.
