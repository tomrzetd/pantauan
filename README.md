# PANTAUAN — Pusat Analitik Nilai & Tracking Asesmen

**Satu kode sekolah, satu tampilan yang mudah dipakai.** Dashboard PSAS/ASAS untuk guru dan panitia, terpisah dari engine pemindai Buleud Teu.

## Untuk pengguna

Buka https://tomrzetd.github.io/pantauan/ dan masukkan **kode aktivasi** yang diberikan operator. Perangkat mengingat sesi selama **14 hari**; tidak perlu mengetik URL Apps Script atau password panjang. Mode **Easy** aktif secara bawaan (huruf dan tombol besar, fitur utama saja); tekan **Expert** untuk heatmap dan analitik lengkap.

## Untuk operator — sekali per sekolah

1. Buat project Google Apps Script **standalone** untuk PANTAUAN. Gunakan `Dashboard.gs` **v3** dari paket operator privat. Jangan tempel ke Apps Script Buleud Teu.
2. Script Properties: `SHEET_ID` adalah ID Spreadsheet operasional LJK (tab `Siswa`, `Ujian`, `HasilScan`). Siapkan deployment Web App `/exec` dari akun Google berizin.
3. Jalankan generator privat `python tools/buat_kode_sekolah.py --kode-sekolah JLK2 --nama "Nama Sekolah" --url "https://script.google.com/macros/s/DEPLOYMENT_ID/exec"`.
4. Generator mengeluarkan **kode aktivasi**, **hash `ADMIN_KEY_SHA256`**, dan entri publik registry. Simpan kode & hash hanya secara privat, lalu masukkan hash ke Script Properties.
5. Edit **`schools.json`** di repo ini: tambahkan objek publik `{"code":"JLK2","name":"Nama Sekolah","endpoint":"https://script.google.com/macros/s/DEPLOYMENT_ID/exec"}` ke array `schools`. File publik ini **tidak boleh** berisi kode aktivasi penuh, hash, ID Spreadsheet, NISN, jawaban, atau rahasia.
6. Bagikan kode secara privat kepada guru/panitia berwenang. Selesai.

**Status:** registry `schools.json` sengaja kosong sampai operator mengaktifkan sekolah. Ini bukan galat: tanpa URL backend dan properti lisensi yang benar dashboard tetap menyediakan simulasi, bukan memalsukan data nyata.

## Privasi & keamanan

- GitHub Pages hanya memuat HTML/CSS/JS/aset dan daftar endpoint publik. Semua data sekolah dilayani Apps Script terpisah dan hanya dengan sesi bertanda tangan.
- Kode aktivasi terdiri dari 12 karakter acak + prefix sekolah, tidak dimasukkan ke URL ataupun disimpan mentah di localStorage. Sesi browser berlaku 14 hari; rotasi hash/kunci server membatalkan sesi lama.
- Rekap individual dapat menampilkan nama, nomor peserta, nilai dan peringkat, **hanya untuk pengguna yang diberi kode**. Untuk keamanan, gunakan perangkat sekolah tepercaya; jangan bagikan kode di grup terbuka. Belum ada pembatasan akses per guru, jadi seluruh pengguna berkode sekolah memiliki cakupan panitia.
- Hasil scan dihitung per peserta unik × ujian; scan ulang tidak menambah progres.
- Cache PWA berisi **aset tampilan saja**; respons API dan registry sekolah tetap melalui jaringan.
- Tanpa VPS, tanpa server tambahan berbayar.

## Verifikasi

```sh
node --check app.js
node --check sw.js
node tests/public-registry.test.mjs
```
