# PANTAUAN 🛰️

**Pusat Analitik Nilai & Tracking Asesmen** — dashboard PSAS/ASAS terpisah dari repository privat **Buleud Teu**.

## Apa yang ada di repo ini?

- Dashboard Web/PWA ringan, *Bright Academic Elegant*: grafik mapel, rombel, heatmap, filter asesmen, dark mode dan presentasi IFP.
- Rekap nama, nomor peserta, nilai per mapel, rata-rata, dan ranking siswa yang hanya dapat diminta setelah otorisasi panitia di Apps Script.
- Refresh otomatis setiap ±25 detik saat online; mode **SIMULASI** memiliki label jelas.
- Hanya **frontend publik**. Tidak ada engine OCR, APK, lisensi BTL1, kunci panitia, data siswa, NISN atau backend scanner.

## Arsitektur

```
Android / Desktop / Scanner Buleud Teu
             ↓
     Apps Script Scanner (privat)
             ↓
      Spreadsheet sekolah
       (Siswa, Ujian, HasilScan)
             ↑ baca saja
    Apps Script PANTAUAN (standalone)
             ↑ HTTPS POST + autentikasi
   PANTAUAN Web/PWA (GitHub Pages)
```

Spreadsheet sekolah tetap satu, tidak perlu membuat spreadsheet baru. Endpoint PANTAUAN **bukan** endpoint scanner. Jangan tempel code PANTAUAN ke Apps Script scanner karena masing-masing memiliki `doGet`/`doPost` sendiri.

## Jalankan GitHub Pages

1. Repo ini sudah memiliki `.github/workflows/pages.yml` untuk publikasi aset frontend dengan whitelist.
2. Aktifkan **Settings → Pages → Source: GitHub Actions** di repository `tomrzetd/pantauan`.
3. Setelah Actions berhasil, buka `https://tomrzetd.github.io/pantauan/` (periksa URL pada deployment GitHub).
4. Klik ⚙ untuk menghubungkan endpoint Apps Script **dashboard** yang telah dipasang oleh operator. Sampai itu dilakukan, halaman menampilkan **DATA SIMULASI**, bukan nilai asli.

## Siapkan API dashboard (di luar repo publik)

Dapatkan paket `Dashboard.gs` dan generator kode akses dari distribusi operator yang terpisah/privat. **File backend tidak diterbitkan di sini.**

1. Di `script.google.com`, buat proyek standalone **PANTAUAN API** (akun yang berhak membaca Spreadsheet sekolah).
2. Tempel adapter **Dashboard.gs** ke proyek baru, bukan ke Apps Script scanner.
3. Pada **Script Properties** atur `SHEET_ID` (Spreadsheet yang dipakai scanner produksi) dan `ADMIN_KEY_SHA256` (hash kode akses acak kuat yang dibuat operator secara lokal). **Jangan commit nilai konfigurasi apa pun ke GitHub.**
4. Deploy Web App dengan pengaturan akses sesuai kebijakan sekolah, lalu masukkan URL `/exec` dan kode akses panitia di halaman dashboard.
5. Uji `summary`, `roster`, perubahan progres setelah scan baru berhasil terkirim, dan tampilan rekap siswa.

Kode akses panitia tidak disimpan di localStorage; URL endpoint saja yang diingat browser. Rekap siswa dalam memori sesi browser, tidak di-cache sebagai data offline. Jika endpoint disetel `Anyone`, orang lain tetap dapat menghubunginya di tingkat jaringan; validasi kode akses backend menjadi syarat mutlak untuk setiap respons data. **Jangan sebarkan kode akses sekolah ke semua pengguna**: rilis pertama menggunakan kode akses panitia sekolah, belum peran guru per mapel.

## Perhitungan

Progres = **jumlah siswa unik dengan hasil resmi tersimpan ÷ target peserta × ujian × 100%**. Scan ulang tidak menambah progres. Jika belum ada ujian yang dibuat, mapel belum bisa memiliki target; jumlah mapel PSAS/ASAS lengkap harus dikonfigurasi dalam tab `Ujian`.

## Lisensi

© 2026. Tidak ada izin open-source eksplisit untuk menggunakan ulang source di luar ketentuan GitHub. Lihat [LICENSE-NOTICE.md](LICENSE-NOTICE.md). PANTAUAN tidak memberi izin menyalin atau mendistribusikan engine privat Buleud Teu.
