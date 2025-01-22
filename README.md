# Expense Bot

Expense Bot adalah bot Telegram yang membantu Anda mencatat pengeluaran ke Google Sheets.

## Instalasi

Untuk menginstal dependensi, jalankan perintah berikut:

```sh
npm install
```

## Penggunaan

Untuk menjalankan bot dalam mode pengembangan, gunakan perintah berikut:

```sh
npm run dev
```

Untuk melakukan deploy bot, gunakan perintah berikut:

```sh
npm run deploy
```

## Konfigurasi

Pastikan Anda memiliki file `.env` yang berisi kredensial Google dan token bot Telegram Anda. Berikut adalah contoh isi file `.env`:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REFRESH_TOKEN=your-google-refresh-token
GOOGLE_SPREADSHEET_ID=your-google-spreadsheet-id
```

## Endpoints

Bot ini memiliki endpoint berikut:

- `POST /webhook`: Endpoint untuk menerima webhook dari Telegram.

## Perintah Bot

Berikut adalah daftar perintah yang tersedia:

- `/start`: Memulai interaksi dengan bot.
- `/help`: Menampilkan daftar perintah yang tersedia.
- `/pay deskripsi:jumlah`: Mencatat pengeluaran dengan deskripsi dan jumlah yang diberikan.

## Lisensi

Proyek ini dilisensikan di bawah MIT License.