/**
 * sw.js - Service Worker
 * ------------------------------------------------------------
 * แคชเฉพาะ "เปลือกแอป" (HTML/CSS/JS/ไอคอน) ให้เปิดแอปได้ทันทีแม้เน็ตช้า/ขาดหาย
 * ไม่แคชข้อมูลจาก Apps Script API เพราะข้อมูลห้องสมุด (หนังสือ, สถิติ ฯลฯ)
 * ต้องเป็นข้อมูลสดเสมอ ไม่ใช่ข้อมูลเก่าที่ค้างอยู่ในเครื่อง
 * ------------------------------------------------------------
 */

const CACHE_NAME = 'library-padaet-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ติดตั้ง: ดาวน์โหลดเปลือกแอปเก็บไว้ในแคชล่วงหน้า
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// เปิดใช้งาน: ลบแคชเวอร์ชันเก่าทิ้ง (กรณีอัปเดตแอปเวอร์ชันใหม่)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ดักจับ request:
//  - ถ้าเป็นไฟล์เปลือกแอป (same-origin) -> ลองแคชก่อน ไม่มีค่อยไปเน็ต (โหลดเร็ว/เปิดได้แม้ออฟไลน์)
//  - ถ้าเป็น API ของ Apps Script (คนละโดเมน) -> ปล่อยผ่านไปเน็ตตามปกติเสมอ ไม่แตะต้อง
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) return; // ไม่ยุ่งกับ request ไป Apps Script / โดเมนอื่น

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
