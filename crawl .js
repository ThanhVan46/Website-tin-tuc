/**
 * crawl.js — Logic trích xuất bài viết từ HTML thô của dantri.com.vn
 * Phụ thuộc: data.js (DataStore) phải được nạp TRƯỚC file này.
 *   <script src="data.js"></script>
 *   <script src="crawl.js"></script>
 * API: Crawler.crawlDanTri(url, html) · Crawler.crawlAndSave(url, html)
 */
(function (global) {
  "use strict";

  if (!global.DataStore) throw new Error("crawl.js cần data.js được nạp trước.");

  /** Text sạch của phần tử đầu tiên khớp một trong các selector (theo thứ tự ưu tiên). */
  function pickText(doc, selectors) {
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      const text = el && el.textContent.replace(/\s+/g, " ").trim();
      if (text) return text;
    }
    return "";
  }

  function pickMeta(doc, name) {
    const el = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el ? (el.getAttribute("content") || "").trim() : "";
  }

  /** Chuẩn hóa mọi dạng ngày giờ về "YYYY-MM-DD HH:mm". Trả "" nếu không đọc được. */
  function normalizeDate(raw) {
    if (!raw) return "";
    const p2 = n => String(n).padStart(2, "0");
    let m = raw.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);          // ISO
    if (m) return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
    m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\D+(\d{1,2}):(\d{2})/);         // dd/mm/yyyy - HH:mm
    if (m) return `${m[3]}-${p2(m[2])}-${p2(m[1])} ${p2(m[4])}:${m[5]}`;
    return "";
  }

  /** Tạo id: ưu tiên dãy số cuối URL Dân trí (…-20260928122246655.htm). */
  function buildId(url, publishedAt) {
    const m = url.match(/(\d{14,17})(?=\.htm)/);
    if (m) return `dtri-${m[1]}`;
    return `dtri-${publishedAt.replace(/\D/g, "")}${String(Date.now()).slice(-5)}`;
  }

  /**
   * Trích xuất bài viết từ HTML thô.
   * @param {string} url  URL bài viết gốc
   * @param {string} htmlString  Mã nguồn HTML (View Source)
   * @returns {object} post đúng cấu trúc đặc tả
   * @throws {Error} nếu thiếu tiêu đề, nội dung hoặc ngày đăng
   */
  function crawlDanTri(url, htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, "text/html"); // không thực thi script

    // 1. Tiêu đề
    const title = pickText(doc, ["h1.title-page.detail", "h1.title-page", "h1.e-magazine__title", "article h1", "h1"])
                  || pickMeta(doc, "og:title");
    if (!title) throw new Error("Không tìm thấy tiêu đề (h1.title-page). Kiểm tra lại mã HTML đã dán.");

    // 2. Sapo / tóm tắt
    const excerpt = pickText(doc, ["h2.singular-sapo", ".singular-sapo", ".sapo", "h2.sapo"])
                    || pickMeta(doc, "og:description") || pickMeta(doc, "description");

    // 3. Nội dung: các thẻ <p> trong khối nội dung, bỏ chú thích ảnh và đoạn rỗng
    const body = doc.querySelector(".singular-content, .detail-content, .e-magazine__body, article");
    const paragraphs = body
      ? [...body.querySelectorAll("p")]
          .filter(p => !p.closest("figure, figcaption, .author-wrap, .related-news"))
          .map(p => p.textContent.replace(/\s+/g, " ").trim())
          .filter(Boolean)
      : [];
    if (!paragraphs.length) throw new Error("Không tìm thấy nội dung bài viết (.singular-content p).");

    // 4. Tác giả
    const author = pickText(doc, [".author-name b", ".author-name", ".author-wrap .name", ".author"])
                   || pickMeta(doc, "author") || "Dân trí";

    // 5. Chuyên mục từ breadcrumb (bỏ "Trang chủ")
    let category = [...doc.querySelectorAll("ul.breadcrumb a, .dt-breadcrumb a, .breadcrumbs a, .breadcrumb a")]
      .map(a => a.textContent.replace(/\s+/g, " ").trim())
      .filter(t => t && !/^trang chủ$/i.test(t));
    category = [...new Set(category)];
    if (!category.length) category = [pickMeta(doc, "article:section") || "Chưa phân loại"];

    // 6. Ngày giờ đăng
    const timeEl = doc.querySelector("time.author-time, time[datetime], .author-time");
    const publishedAt = normalizeDate(timeEl && (timeEl.getAttribute("datetime") || timeEl.textContent))
                        || normalizeDate(pickMeta(doc, "article:published_time"));
    if (!publishedAt) throw new Error("Không đọc được thời gian đăng (time.author-time).");

    return {
      id: buildId(url, publishedAt),
      title,
      slug: DataStore.slugify(title),
      excerpt,
      content: paragraphs.join("\n"),
      author,
      category,
      publishedAt,
      source: DataStore.SOURCE,
      url
    };
  }

  /**
   * Crawl rồi lưu vào LocalStorage (trùng id thì không ghi đè).
   * @returns {{post: object, added: boolean}}
   */
  function crawlAndSave(url, htmlString) {
    const post = crawlDanTri(url, htmlString);
    return { post, added: DataStore.addPost(post).added };
  }

  global.Crawler = { crawlDanTri, crawlAndSave, normalizeDate, buildId };
})(window);
