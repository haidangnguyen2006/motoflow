/* ==========================================================================
   MotoFlow — data.js
   Toàn bộ nội dung mẫu nằm ở đây. Mọi con số là DỮ LIỆU MÔ PHỎNG,
   không phải kết quả đo thực tế tại TP.HCM.
   ========================================================================== */
window.MF = (function () {
  'use strict';

  const forecastLabels = ['07:00','07:05','07:10','07:15','07:20','07:25','07:30','07:35','07:40','07:45','07:50','07:55','08:00'];

  return {
    meta: {
      city: 'TP. Hồ Chí Minh',
      corridor: 'Võ Văn Kiệt',
      from: 'Kinh Dương Vương',
      to: 'Pasteur',
      updated: '07:41:20',
      simulated: true
    },

    user: {
      name: 'Minh',
      routeName: 'Nhà → Văn phòng Quận 1',
      routeVia: 'Võ Văn Kiệt · 8,4 km',
      eta: 22,
      etaBase: 16,
      distance: '8,4 km',
      arriveAt: '08:03'
    },

    /* 4 nút giao trên trục — toạ độ là sơ đồ lược đồ, không theo tỉ lệ địa lý */
    nodes: [
      { id:'n1', name:'Kinh Dương Vương', short:'KDV', x:60,  y:300, state:'ok',   delay:14, queue:52,  cycle:110, green:28, confidence:0.91, plans:'adaptive', offset:-18, vph:3180 },
      { id:'n2', name:'Phạm Hùng',        short:'PH',  x:144, y:246, state:'warn', delay:31, queue:96,  cycle:110, green:26, confidence:0.87, plans:'adaptive', offset:-6,  vph:3640 },
      { id:'n3', name:'Nguyễn Tri Phương',short:'NTP', x:232, y:188, state:'bad',  delay:52, queue:148, cycle:110, green:32, confidence:0.78, plans:'review',   offset:0,   vph:4120 },
      { id:'n4', name:'Pasteur',          short:'PS',  x:318, y:114, state:'warn', delay:27, queue:81,  cycle:110, green:24, confidence:0.84, plans:'adaptive', offset:+9,  vph:3390 }
    ],

    /* Chi tiết nút giao đang chọn (n3) */
    detail: {
      nodeId: 'n3',
      name: 'Võ Văn Kiệt – Nguyễn Tri Phương',
      district: 'Quận 5',
      phase: { label:'Xanh · Đông–Tây', remaining: 21, total: 32, next:'Vàng 3s → Toàn đỏ 2s', color:'ok' },
      cycle: 110,
      applied: { cycle:110, greens:[28,24,18,20], source:'AI thích ứng · 07:35' },
      proposed:{ cycle:104, greens:[22,34,20,14], source:'AI đề xuất · 07:41', gain:'-18% chờ TB', confidence:0.78 },
      approaches: [
        { id:'a1', dir:'Tây',  from:'từ Bình Chánh',     state:'bad',  queue:148, flow:1420, speed:11, green:22, wait:74, trend:+12 },
        { id:'a2', dir:'Đông', from:'từ Quận 1',         state:'warn', queue:96,  flow:1180, speed:19, green:34, wait:48, trend:+4  },
        { id:'a3', dir:'Bắc',  from:'Nguyễn Tri Phương', state:'ok',   queue:38,  flow:640,  speed:24, green:20, wait:31, trend:-6  },
        { id:'a4', dir:'Nam',  from:'Nguyễn Văn Cừ',     state:'warn', queue:64,  flow:780,  speed:17, green:14, wait:44, trend:+2  }
      ],
      forecast: {
        labels: forecastLabels,
        actual:   [38, 42, 47, 52, 58, 66, 74, 81, null, null, null, null, null],
        model:    [null,null,null,null,null,null,null,81, 88, 96, 104, 112, 118],
        low:      [null,null,null,null,null,null,null,81, 82, 87,  92,  97,  100],
        high:     [null,null,null,null,null,null,null,81, 94, 105, 116, 128, 136],
        unit: 'm'
      }
    },

    route: {
      labels: forecastLabels,
      actual: [14, 15, 16, 17, 18, 20, 22, 24, null, null, null, null, null],
      model:  [null,null,null,null,null,null,null,24, 25, 26, 28, 29, 31],
      low:    [null,null,null,null,null,null,null,24, 24, 24, 25, 26, 27],
      high:   [null,null,null,null,null,null,null,24, 27, 29, 32, 34, 37],
      unit: 'phút'
    },

    greenWave: {
      title: 'Làn sóng xanh thích ứng',
      summary: 'Đi ngay trong 2 phút → gặp xanh ở 3/4 nút giao',
      bestDeparture: '07:44',
      stops: 1,
      baselineStops: 3,
      saved: '4 phút',
      nodes: [
        { name:'Kinh Dương Vương', eta:'07:46', state:'ok',   inGreen:true  },
        { name:'Phạm Hùng',        eta:'07:49', state:'ok',   inGreen:true  },
        { name:'Nguyễn Tri Phương',eta:'07:53', state:'warn', inGreen:false },
        { name:'Pasteur',          eta:'07:57', state:'ok',   inGreen:true  }
      ]
    },

    alerts: [
      { id:'al1', kind:'rain',    severity:'warn', title:'Mưa lớn tại Quận 5', meta:'07:38 · radar mưa', body:'Dự báo hàng đợi tăng 18% trong 15 phút tới. Ưu tiên xanh cho hướng Tây.', action:'Xem tuyến tránh' },
      { id:'al2', kind:'jam',     severity:'bad',  title:'Ùn tắc tại Nguyễn Tri Phương', meta:'07:36 · dự báo 07:50', body:'Hàng đợi hướng Tây dự kiến 118 m. Đề xuất kéo dài xanh Tây +12 giây.', action:'Xem kế hoạch' },
      { id:'al3', kind:'camera',  severity:'bad',  title:'Camera nút giao Pasteur mất tín hiệu', meta:'07:39 · thiết bị biên 04', body:'Mất luồng video 2 phút. Nút giao đang chạy kế hoạch cố định 90 giây.', action:'Xem lớp an toàn' },
      { id:'al4', kind:'incident',severity:'warn', title:'Xe tải dừng trên Võ Văn Kiệt', meta:'07:31 · người dùng báo', body:'Chiếm 1/2 làn hướng Đông, cách Pasteur 400 m.', action:'Chi tiết' },
      { id:'al5', kind:'event',   severity:'ok',   title:'Cao điểm sáng bắt đầu', meta:'06:45 · mô hình lịch sử', body:'Lưu lượng tăng đúng dự báo theo chu kỳ ngày.', action:'Ẩn' }
    ],

    plans: [
      { id:'p1', node:'Nguyễn Tri Phương', time:'07:41', cycle:'110 → 104s', gain:'-18% chờ TB', confidence:0.78, risk:'warn', status:'review', note:'Kéo dài xanh hướng Tây +12s, giảm hướng Nam -6s' },
      { id:'p2', node:'Phạm Hùng',        time:'07:40', cycle:'110 → 108s', gain:'-9% chờ TB',  confidence:0.87, risk:'ok',   status:'auto',   note:'Dịch pha +4s để nối làn sóng xanh' },
      { id:'p3', node:'Kinh Dương Vương', time:'07:38', cycle:'110 → 110s', gain:'-4% chờ TB',  confidence:0.84, risk:'ok',   status:'applied',note:'Giữ chu kỳ, tăng xanh Đông +2s' }
    ],

    safety: {
      mode: 'degraded',
      limits: [
        { label:'Xanh tối thiểu', value:'12 giây', note:'Không nhỏ hơn cho bất kỳ pha nào' },
        { label:'Xanh tối đa',    value:'45 giây', note:'Chặn đói pha các nhánh phụ' },
        { label:'Vàng',           value:'3 giây',  note:'Cố định, không do AI điều chỉnh' },
        { label:'Toàn đỏ',        value:'2 giây',  note:'Cố định' },
        { label:'Người đi bộ',    value:'18 giây', note:'Tối thiểu để qua 4 làn' }
      ],
      cameras: [
        { name:'Thiết bị biên 01 · KDV', status:'ok',   fps:'24 fps', last:'0,4s' },
        { name:'Thiết bị biên 02 · PH',  status:'ok',   fps:'25 fps', last:'0,3s' },
        { name:'Thiết bị biên 03 · NTP', status:'ok',   fps:'25 fps', last:'0,3s' },
        { name:'Thiết bị biên 04 · PS',  status:'fail', fps:'—',      last:'2 phút' }
      ],
      fallback: 'Kế hoạch cố định 90 giây · tự kích hoạt khi mất tín hiệu > 30 giây'
    },

    ops: {
      kpis: [
        { label:'Thời gian chờ TB', value:'46', unit:'giây', delta:'-18%', dir:'down', note:'so với chu kỳ cố định' },
        { label:'Hàng đợi dài nhất', value:'148', unit:'m', delta:'+6%', dir:'up', note:'hướng Tây · NTP' },
        { label:'Số lần dừng', value:'2,1', unit:'lần/xe', delta:'-24%', dir:'down', note:'trên toàn trục' },
        { label:'Thông lượng', value:'14,3', unit:'nghìn xe/h', delta:'+3%', dir:'up', note:'4 nút giao' },
        { label:'Ước tính CO₂', value:'-11', unit:'%', delta:'-11%', dir:'down', note:'mô hình nhiên liệu' }
      ],
      chart: {
        labels: ['06:30','06:45','07:00','07:15','07:30','07:45','08:00','08:15','08:30'],
        fixed:  [41, 44, 49, 56, 63, 68, 71, 66, 58],
        adaptive:[41, 43, 45, 48, 51, 52, 50, 47, 44],
        unit:'giây'
      }
    },

    chat: [
      { q:'Vì sao đèn xanh hướng Tây vừa dài hơn?', a:'Hàng đợi hướng Tây đang 148 m và dự báo tăng lên 118 m trong 15 phút tới. Mô hình đề xuất tăng xanh Tây từ 22 → 34 giây, đồng thời giảm hướng Nam 6 giây. Tổng chu kỳ giảm còn 104 giây. Thay đổi vẫn nằm trong giới hạn an toàn: xanh tối thiểu 12 giây, tối đa 45 giây.' },
      { q:'Dự báo này chính xác đến đâu?', a:'Sai số MAPE 5 phút gần nhất là 8,4% trên tập kiểm chứng tách theo thời gian. Khoảng tin cậy 80% được vẽ bằng dải mờ trên biểu đồ. Khi trời mưa, sai số tăng khoảng 2–3 điểm phần trăm nên hệ thống tự hạ độ tin cậy và ưu tiên kế hoạch an toàn.' },
      { q:'Camera mất tín hiệu thì hệ thống làm gì?', a:'Nếu mất tín hiệu quá 30 giây, nút giao tự chuyển về kế hoạch cố định 90 giây, khoá mọi đề xuất AI và gửi cảnh báo cho kỹ sư trực. Không có hành động nào được tự động gửi xuống đèn thật — hệ thống chỉ đề xuất.' },
      { q:'Dữ liệu của tôi có bị lưu không?', a:'Không. Video được xử lý tại thiết bị biên, chỉ số đếm tổng hợp (lưu lượng, hàng đợi, tốc độ) được gửi lên. Không lưu video gốc, không nhận dạng biển số, dữ liệu tổng hợp giữ 30 ngày.' }
    ],

    scenarios: {
      normal: { label:'Bình thường', note:'Lưu lượng đúng dự báo, mọi camera hoạt động.' },
      rain:   { label:'Mưa lớn', note:'Hàng đợi +18%, độ tin cậy dự báo giảm còn 0,71.' },
      surge:  { label:'Lưu lượng +30%', note:'Kiểm tra độ bền vững khi vượt 30% lưu lượng.' },
      camera: { label:'Camera lỗi', note:'Nút giao NTP mất tín hiệu → chế độ an toàn.' }
    },

    /* Hệ số áp dụng cho từng kịch bản (nhân vào số liệu nền) */
    factors: {
      normal: { delay: 1,    queue: 1,    confidence: 1,    rain: false, degraded: false },
      rain:   { delay: 1.18, queue: 1.26, confidence: 0.86, rain: true,  degraded: false },
      surge:  { delay: 1.34, queue: 1.41, confidence: 0.93, rain: false, degraded: false },
      camera: { delay: 1.06, queue: 1.08, confidence: 0.72, rain: false, degraded: true }
    },

    modelTable: [
      { model:'Trung bình lịch sử', mape5:14.2, mape15:18.9, note:'Baseline đơn giản' },
      { model:'ARIMA',              mape5:11.8, mape15:16.4, note:'Chỉ một chuỗi' },
      { model:'LightGBM',           mape5:8.9,  mape15:13.1, note:'Có giờ, thứ, mưa' },
      { model:'LSTM / GRU',         mape5:8.2,  mape15:12.6, note:'Cần dữ liệu dài' },
      { model:'STGCN (4 nút)',      mape5:7.6,  mape15:11.4, note:'Khai thác quan hệ không gian' }
    ]
  };
})();
