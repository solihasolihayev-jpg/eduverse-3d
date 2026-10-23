# EDUVERSE 3D — Multiplayer MVP

Bu — internet serverida ishga tushirilganda telefon brauzerlari orqali ishlaydigan boshlang‘ich multiplayer prototip.

## Hozir ishlaydigan qismlar
- Xona yaratish va 6 belgili xona kodi
- Kod orqali xonaga qo‘shilish
- Xonada 40 nafargacha ishtirokchi limiti
- Ism va avatar rangini tanlash
- Server orqali savollarni tekshirish va ball berish
- 5 savolli quiz, vaqt chegarasi, jonli reyting
- Xona egasining o‘yinni boshlashi
- Telefon ekraniga moslashadigan brauzer interfeysi
- `/health` server tekshiruvi

## Hali tayyor emas
Bu MVP yakuniy EDUVERSE 3D mahsuloti emas. Hozircha 20 o‘yin emas, bitta quiz rejimi bor; 3D lobby tasviri CSS orqali yaratilgan vizual prototip, haqiqiy 3D avatarli dunyo emas. Login, o‘qituvchi akkaunti/huquqlari, savollarni fayldan import qilish, doimiy ma’lumotlar bazasi, uzilgandan keyin sessiyani tiklash, xavfsizlik auditi va 40 qurilmali yuklama testi hali qo‘shilmagan.

## Lokal kompyuterda ishga tushirish
1. Node.js 18 yoki yangiroq versiyasini o‘rnating.
2. Ushbu papkada terminal oching.
3. `npm install`
4. `npm start`
5. Brauzerda `http://localhost:3000` manzilini oching.

Telefonni kompyuterdagi serverga Wi-Fi orqali ulash uchun kompyuter va telefon bir tarmoqda bo‘lsin, kompyuterning lokal IP manzilidan foydalaning, masalan `http://192.168.1.10:3000`. Firewall 3000-portga ruxsat berishi kerak.

## Internet orqali hammaga ochish
Serverni Node.js qo‘llab-quvvatlaydigan hostingga joylashtiring. Hosting `PORT` muhit o‘zgaruvchisini qo‘llashi kerak. Joylashtirgandan keyin hosting bergan HTTPS domenni iPhone va Android brauzerida ochish mumkin. Bepul hostinglarning uyqu rejimi yoki trafik cheklovlari real vaqtli o‘yinga ta’sir qilishi mumkin.

## Xavfsizlik eslatmasi
Bu o‘quv prototipi. Ommaviy foydalanishga chiqarishdan oldin foydalanuvchi nomlarini tekshirish, spam/tez-tez so‘rov yuborishni cheklash, host vakolatini qayta ko‘rib chiqish, savollarni o‘qituvchi boshqaradigan qilish, TLS/HTTPS, saqlash va maxfiylik siyosati hamda yuklama testlari zarur.
