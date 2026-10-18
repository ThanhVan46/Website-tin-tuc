/**
 * data.js — Dữ liệu nền + tiện ích LocalStorage cho ứng dụng tin tức (mô phỏng Dân trí)
 * LocalStorage key: "dantri_data"  →  { menu: [...], posts: [...] }
 * Dùng chung cho mọi trang: <script src="data.js"></script>
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "dantri_data";
  const SOURCE = "dantri.com.vn";

  /* ---------- 1. MENU PHÂN CẤP (giống cấu trúc báo Dân trí) ---------- */
  const MENU = [
    { id: "thoi-su", title: "Thời sự", url: "/xa-hoi.htm", type: "category", children: [
      { id: "chinh-tri", title: "Chính trị", url: "/chinh-tri.htm", type: "sub-category" },
      { id: "giao-thong", title: "Giao thông", url: "/giao-thong.htm", type: "sub-category" },
      { id: "moi-truong", title: "Môi trường", url: "/moi-truong.htm", type: "sub-category" }
    ]},
    { id: "phap-luat", title: "Pháp luật", url: "/phap-luat.htm", type: "category" },
    { id: "the-gioi", title: "Thế giới", url: "/the-gioi.htm", type: "category", children: [
      { id: "kieu-bao", title: "Kiều bào", url: "/kieu-bao.htm", type: "sub-category" },
      { id: "quan-su", title: "Quân sự", url: "/quan-su.htm", type: "sub-category" }
    ]},
    { id: "kinh-doanh", title: "Kinh doanh", url: "/kinh-doanh.htm", type: "category", children: [
      { id: "doanh-nghiep", title: "Doanh nghiệp", url: "/doanh-nghiep.htm", type: "sub-category" },
      { id: "tai-chinh", title: "Tài chính", url: "/tai-chinh.htm", type: "sub-category" }
    ]},
    { id: "giao-duc", title: "Giáo dục", url: "/giao-duc.htm", type: "category", children: [
      { id: "tuyen-sinh", title: "Tuyển sinh", url: "/tuyen-sinh.htm", type: "sub-category" }
    ]},
    { id: "the-thao", title: "Thể thao", url: "/the-thao.htm", type: "category" },
    { id: "cong-nghe", title: "Công nghệ", url: "/cong-nghe.htm", type: "category" },
    { id: "suc-khoe", title: "Sức khỏe", url: "/suc-khoe.htm", type: "category" }
  ];

  /* ---------- 2. TIỆN ÍCH ---------- */
  /** Tạo slug không dấu: "Giá vàng hôm nay!" → "gia-vang-hom-nay" */
  function slugify(text) {
    return String(text || "")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tổ hợp
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const pad = (n, len = 2) => String(n).padStart(len, "0");

  /* ---------- 3. SINH 10 BÀI GIẢ LẬP / CHUYÊN MỤC LỚN ---------- */
  const TOPICS = [
    "Hà Nội triển khai giải pháp mới trong quý IV",
    "Những điều cần biết về quy định có hiệu lực từ tháng sau",
    "Chuyên gia nói gì về xu hướng đang được quan tâm",
    "Người dân phấn khởi trước kết quả bất ngờ",
    "Bước chuyển mình đáng chú ý sau nhiều năm chờ đợi",
    "Cận cảnh dự án được kỳ vọng làm thay đổi diện mạo",
    "Nhìn lại một năm nhiều biến động và bài học rút ra",
    "Giải pháp nào để giải quyết bài toán tồn tại lâu nay?",
    "Câu chuyện phía sau con số gây chú ý trong tuần qua",
    "Dự báo mới nhất và khuyến nghị dành cho người dân"
  ];
  const AUTHORS = ["Minh Anh", "Thu Hà", "Quốc Việt", "Hải Long", "Lan Phương"];

  function buildSamplePost(cat, i) {
    const title = `${cat.title}: ${TOPICS[i]}`;
    const d = new Date(2026, 8, 28 - i, 6 + i, (i * 7) % 60, i * 3 % 60, (i * 111) % 1000);
    const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
                  `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}${pad(d.getMilliseconds(), 3)}`;
    const slug = slugify(title);
    return {
      id: `dtri-${stamp}`,
      title,
      slug,
      excerpt: `Tóm tắt: ${title.toLowerCase()} — thông tin được cập nhật trong chuyên mục ${cat.title}.`,
      content: [
        `Đây là đoạn mở đầu của bài viết "${title}".`,
        `Theo ghi nhận của phóng viên, sự việc thu hút sự quan tâm của đông đảo bạn đọc thuộc chuyên mục ${cat.title}.`,
        "Các chuyên gia cho rằng cần có cái nhìn toàn diện và những giải pháp dài hạn.",
        "Bài viết sẽ tiếp tục được cập nhật khi có thêm thông tin mới."
      ].join("\n"),
      author: AUTHORS[i % AUTHORS.length],
      category: [cat.title],
      publishedAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      source: SOURCE,
      url: `https://${SOURCE}/${slug}-${stamp}.htm`
    };
  }

  function buildSamplePosts() {
    const posts = [];
    MENU.forEach(cat => { for (let i = 0; i < 10; i++) posts.push(buildSamplePost(cat, i)); });
    return posts;
  }

  /* ---------- 4. API LOCALSTORAGE ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
    catch (e) { return null; }
  }
  function save(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  /** Khởi tạo dữ liệu mẫu nếu LocalStorage chưa có (hoặc bị hỏng). */
  function init() {
    const data = load();
    if (data && Array.isArray(data.menu) && Array.isArray(data.posts)) return data;
    const fresh = { menu: MENU, posts: buildSamplePosts() };
    save(fresh);
    return fresh;
  }

  function getPosts() { return init().posts; }

  /**
   * Thêm bài viết. Trùng id → KHÔNG ghi đè.
   * @returns {{added:boolean, reason?:string}}
   */
  function addPost(post) {
    const data = init();
    if (data.posts.some(p => p.id === post.id)) return { added: false, reason: "duplicate" };
    data.posts.unshift(post);
    save(data);
    return { added: true };
  }

  /** Link ảnh gốc của bài (nếu bài có trường image); không có → "" để giao diện dùng ảnh chuyên mục. */
  function getImage(id) {
    const p = init().posts.find(x => x.id === id);
    return (p && p.image) || "";
  }

  function resetData() { localStorage.removeItem(STORAGE_KEY); return init(); }

  init(); // tự chạy khi file được nạp

  global.DataStore = { STORAGE_KEY, SOURCE, slugify, init, getPosts, addPost, getImage, resetData };
})(window);
