# 🎨 05. Injeksi Menu ke WagonBox UI

Salah satu keunggulan terbesar arsitektur WagonBox adalah: **Modul kamu bisa menginjeksi menu langsung ke Sidebar Web Panel WagonBox secara dinamis**, tanpa harus mengubah satu baris kode pun di repository `wagonbox-ui` dan tanpa perlu rebuild frontend!

---

## 🧭 Bagaimana Menu Bekerja?

Saat pengguna membuka Web Panel WagonBox:
1. Frontend memanggil `GET /api/v1/modules/ui/navigation` ke backend Core.
2. Backend Core mengumpulkan deklarasi menu dari semua modul yang berstatus **Active**.
3. Frontend secara otomatis merender bagian **MODULES** di sidebar dan menampilkan menu modul kamu.

---

## 🛠️ Konfigurasi Menu di `manifest.json`

Kamu cukup mendefinisikan array `ui.nav` di dalam `manifest.json`:

```json
{
  "name": "wagonbox-docker-manager",
  "version": "1.0.0",
  "sdkApi": "wagonbox.plugin.v1",
  "minCoreVersion": "1.0.0",
  "entryPoint": "dist/bundle.js",
  "requestedCapabilities": [
    "shell.execute",
    "api.register"
  ],
  "apiNamespace": "docker",
  "ui": {
    "nav": [
      {
        "label": "Docker Containers",
        "path": "/modules/docker",
        "icon": "cilApplications",
        "order": 1
      },
      {
        "label": "Images & Volumes",
        "path": "/modules/docker/images",
        "parent": "Docker Containers",
        "order": 2
      }
    ],
    "settings": [
      {
        "key": "socket_path",
        "label": "Docker Socket Path",
        "type": "string",
        "default": "/var/run/docker.sock"
      }
    ]
  }
}
```

---

## 📋 Properti Navigasi Menu (`ui.nav[]`)

| Properti | Tipe | Wajib? | Deskripsi |
| :--- | :--- | :---: | :--- |
| **`label`** | `string` | Ya | Teks judul menu yang muncul di sidebar (misal: `"Docker Containers"`). |
| **`path`** | `string` | Ya | URL route di web browser (misal: `"/modules/docker"`). |
| **`icon`** | `string` | Tidak | Nama ikon CoreUI (misal: `"cilApplications"`, `"cilSettings"`, `"cilStorage"`). |
| **`order`** | `number` | Tidak | Urutan tampilan menu di sidebar (semakin kecil, semakin di atas). |
| **`parent`** | `string` | Tidak | Jika menu ini adalah sub-menu (anak), isi dengan `label` menu induknya. |

---

## 📂 Contoh Menu Bertingkat (Parent & Sub-Menu)

Jika kamu ingin membuat menu dropdown yang punya anak menu:

```json
"ui": {
  "nav": [
    {
      "label": "Database Manager",
      "path": "/modules/db",
      "icon": "cilStorage",
      "order": 1
    },
    {
      "label": "MySQL Instances",
      "path": "/modules/db/mysql",
      "parent": "Database Manager",
      "order": 2
    },
    {
      "label": "PostgreSQL Instances",
      "path": "/modules/db/postgres",
      "parent": "Database Manager",
      "order": 3
    }
  ]
}
```

Hasilnya di Sidebar WagonBox UI:
- 📁 **Database Manager** (Bisa di-klik untuk membuka dropdown)
  - ↳ 📄 **MySQL Instances**
  - ↳ 📄 **PostgreSQL Instances**

---

## ⚙️ Injeksi Halaman Pengaturan (`ui.settings[]`)

Selain menu sidebar, kamu juga bisa membuat formulir pengaturan otomatis di halaman **Settings** WagonBox:

```json
"ui": {
  "settings": [
    {
      "key": "backup_interval_hours",
      "label": "Interval Backup (Jam)",
      "type": "number",
      "default": 24
    },
    {
      "key": "alert_email",
      "label": "Email Notifikasi Error",
      "type": "string",
      "default": "admin@example.com"
    },
    {
      "key": "enable_compression",
      "label": "Aktifkan Kompresi Gzip",
      "type": "boolean",
      "default": true
    }
  ]
}
```

Ketika pengguna mengubah nilai di UI, backend WagonBox akan menyimpannya ke `this.config`, dan modulmu akan otomatis menerima sinyal `onReload()`.

---

## 🎯 Selanjutnya

Pelajari cara menguji modul kamu secara otomatis tanpa perlu menyalakan server Core pada [**06. Unit Testing dengan MockCoreBridge**](./06-testing-with-mock.md).
