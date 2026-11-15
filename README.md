# PANTAUAN 🛰️

**Pusat Analitik Nilai & Tracking Asesmen** — dashboard PSAS/ASAS untuk pemantauan hasil scan LJK yang disimpan ke Spreadsheet sekolah.

**Arsitektur:** Buleud Teu (scanner privat) → Apps Script scanner → Spreadsheet sekolah → Apps Script Dashboard (proyek standalone) → PANTAUAN GitHub Pages.

Repository publik ini berisi **frontend PWA saja**, tanpa engine OCR, kunci lisensi, backend scanner, NISN, atau data nilai siswa. Data aktual hanya ditampilkan setelah otorisasi panitia pada backend Apps Script yang dipasang terpisah.

## Instalasi GitHub Pages

Aktifkan **Settings → Pages → Source: GitHub Actions**, lalu lihat workflow **PANTAUAN — Deploy GitHub Pages**.

Dashboard saat belum terhubung menampilkan **DATA SIMULASI**, bukan nilai sekolah.

© 2026 — Hak cipta dilindungi. Tidak ada lisensi open-source otomatis untuk penggunaan ulang komersial.