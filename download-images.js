#!/usr/bin/env node
/**
 * download-images.js — Tải ảnh đại diện bài viết Dân trí về thư mục images/ (chạy bằng Terminal, Node 18+)
 *
 * Cách dùng:
 *   node download-images.js                          đọc danh sách URL bài trong urls.txt
 *   node download-images.js --category https://dantri.com.vn/xa-hoi.htm --limit 12
 *   node download-images.js --urls my-urls.txt --delay 800
 *   node download-images.js --topics all --perCategory 10   tải ảnh theo từng chuyên mục menu (khuyên dùng)
 *
 * Kết quả: images/<tên-file> và images/manifest.json  { "dtri-<số cuối URL>": "images/dtri-....jpg" }
 * id khớp với id mà crawler.html sinh ra từ cùng URL, nên index.html / detail.html tự nhận ảnh.
 */
"use strict";
const fs = require("fs");
const path = require("path");

/* ---------- Tham số ---------- */
const opts = { urls: "urls.txt", out: "images", delay: 500, limit: 20, perCategory: 10 };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 2) {
  const key = argv[i].replace(/^--/, "");
  if (!(key in opts) && !["category", "topics"].includes(key)) { console.error(`Tham số không hợp lệ: ${argv[i]}`); process.exit(1); }
  opts[key] = ["delay", "limit", "perCategory"].includes(key) ? Number(argv[i + 1]) : argv[i + 1];
}

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
  "Accept-Language": "vi,en;q=0.8",
  "Referer": "https://dantri.com.vn/"
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS, redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt === 2) throw err;
      await sleep(1000);
    }
  }
}

/* ---------- Bóc tách ---------- */
const articleId = url => { const m = url.match(/(\d{14,17})\.htm/); return m ? `dtri-${m[1]}` : null; };

function extractImage(html, pageUrl) {
  let m = html.match(/<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
       || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (!m) {                                     // dự phòng: ảnh đầu tiên trong khối nội dung
    const start = Math.max(html.indexOf("singular-content"), 0);
    m = html.slice(start).match(/<img[^>]+(?:data-src|data-original|src)=["'](https?:[^"']+|\/\/[^"']+)["']/i);
  }
  return m ? new URL(m[1].replace(/&amp;/g, "&"), pageUrl).href : "";
}

function extFrom(contentType, url) {
  const map = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
  const ct = (contentType || "").split(";")[0].trim().toLowerCase();
  if (map[ct]) return map[ct];
  const m = url.split("?")[0].match(/\.(jpe?g|png|webp|gif|avif)$/i);
  return m ? m[1].toLowerCase().replace("jpeg", "jpg") : "jpg";
}

/* ---------- Lấy danh sách URL bài ---------- */
async function collectUrls() {
  if (opts.category) {
    console.log(`Đang đọc chuyên mục: ${opts.category}`);
    const html = await (await get(opts.category)).text();
    const found = [...html.matchAll(/href=["']([^"']*?-\d{14,17}\.htm)["']/g)].map(m => new URL(m[1], opts.category).href);
    const list = [...new Set(found)].slice(0, opts.limit);
    console.log(`Tìm thấy ${list.length} bài (giới hạn ${opts.limit}).`);
    return list;
  }
  if (!fs.existsSync(opts.urls)) {
    console.error(`Không thấy file ${opts.urls}. Tạo file này, mỗi dòng một URL bài viết, hoặc dùng --category <url>.`);
    process.exit(1);
  }
  return fs.readFileSync(opts.urls, "utf8").split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith("#"));
}


/* ---------- Chế độ --topics: ảnh theo chuyên mục (id menu → danh sách ảnh) ---------- */
const TOPICS = {
  "thoi-su": "/xa-hoi.htm", "phap-luat": "/phap-luat.htm", "the-gioi": "/the-gioi.htm",
  "kinh-doanh": "/kinh-doanh.htm", "giao-duc": "/giao-duc.htm", "the-thao": "/the-thao.htm",
  "cong-nghe": "/suc-manh-so.htm", "suc-khoe": "/suc-khoe.htm"
};

async function runTopics() {
  fs.mkdirSync(opts.out, { recursive: true });
  const manifestPath = path.join(opts.out, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
  const seen = new Set();
  for (const [topic, p] of Object.entries(TOPICS)) {
    const pageUrl = "https://dantri.com.vn" + p;
    console.log(`\n== ${topic}  (${pageUrl})`);
    const files = [];
    try {
      const html = await (await get(pageUrl)).text();
      const links = [...new Set([...html.matchAll(/href=["']([^"']*?-\d{14,17}\.htm)["']/g)].map(m => new URL(m[1], pageUrl).href))];
      for (const link of links) {
        if (files.length >= opts.perCategory) break;
        try {
          const imgUrl = extractImage(await (await get(link)).text(), link);
          if (!imgUrl || seen.has(imgUrl)) continue;
          const res = await get(imgUrl);
          const file = path.join(opts.out, `${topic}-${files.length + 1}.${extFrom(res.headers.get("content-type"), imgUrl)}`);
          fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
          seen.add(imgUrl); files.push(file.split(path.sep).join("/"));
          console.log(`  OK ${file}`);
        } catch (err) { console.log(`  LỖI ${link} → ${err.message}`); }
        await sleep(opts.delay);
      }
    } catch (err) { console.log(`  LỖI chuyên mục → ${err.message}`); }
    if (files.length) { manifest["cat:" + topic] = files; fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2)); }
  }
  console.log(`\nXong. Manifest: ${manifestPath}`);
}

/* ---------- Chạy chính ---------- */
(async () => {
  if (opts.topics) return runTopics();
  const urls = await collectUrls();
  fs.mkdirSync(opts.out, { recursive: true });
  const manifestPath = path.join(opts.out, "manifest.json");
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
  let ok = 0, skipped = 0, failed = 0;

  for (const [i, url] of urls.entries()) {
    const tag = `[${i + 1}/${urls.length}]`;
    const id = articleId(url);
    if (!id) { console.log(`${tag} Bỏ qua (URL không có dãy số cuối .htm): ${url}`); failed++; continue; }
    if (manifest[id] && fs.existsSync(manifest[id])) { console.log(`${tag} Đã có: ${id}`); skipped++; continue; }

    try {
      const page = await (await get(url)).text();
      const imgUrl = extractImage(page, url);
      if (!imgUrl) throw new Error("không tìm thấy ảnh trong trang");
      const res = await get(imgUrl);
      const file = path.join(opts.out, `${id}.${extFrom(res.headers.get("content-type"), imgUrl)}`);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      manifest[id] = file.split(path.sep).join("/");
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));   // ghi dần, lỗi giữa chừng không mất
      console.log(`${tag} OK ${file}`);
      ok++;
    } catch (err) {
      console.log(`${tag} LỖI ${url} → ${err.message}`);
      failed++;
    }
    await sleep(opts.delay);   // giãn cách để không bị chặn
  }
  console.log(`\nXong: ${ok} tải mới, ${skipped} đã có, ${failed} lỗi. Manifest: ${manifestPath}`);
})();
