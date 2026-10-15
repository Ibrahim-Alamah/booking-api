# Booking API Challenge

هذا المشروع هو حل لتحدي بناء API لحجز المواعيد باستخدام NestJS, Prisma, PostgreSQL, و Socket.io.

## المتطلبات (Prerequisites)
- Node.js (الإصدار 18 فما فوق)
- خادم PostgreSQL يعمل محلياً أو عن بُعد.

## التثبيت (Installation)
1. تثبيت الحزم:
```bash
npm install
npm install -D socket.io-client
```

## متغيرات البيئة (Environment Variables)
قم بنسخ ملف `.env.example` إلى `.env` وتحديث الرابط الخاص بقاعدة البيانات `DATABASE_URL` إذا لزم الأمر:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/booking_challenge?schema=public"
PORT=4000
```
*تأكد من إنشاء قاعدة بيانات باسم `booking_challenge` في خادمك قبل المتابعة.*

## أوامر الترحيلات (Migrations) و Seed
لتشغيل الترحيلات وإنشاء الجداول (بما فيها Partial Unique Index لمنع التعارض):
```bash
npx prisma migrate dev --name init
```
لإضافة المواعيد الثابتة إلى قاعدة البيانات:
```bash
npx prisma db seed
```

## أوامر التشغيل
لتشغيل الخادم في بيئة التطوير:
```bash
npm run start:dev
```

## روابط API والتوثيق (Swagger / OpenAPI)
بعد تشغيل الخادم، يمكنك الوصول إلى توثيق الـ API التفاعلي (Swagger UI) ومواصفة OpenAPI:
- **Swagger UI:** [http://localhost:4000/docs](http://localhost:4000/docs)
- **OpenAPI JSON:** [http://localhost:4000/openapi.json](http://localhost:4000/openapi.json)

## طريقة اختبار Socket.IO دون واجهة
يوفر المشروع ملفاً جاهزاً للاختبار للاستماع لأحداث الـ Sockets (`slot.booked` و `slot.released`):
```bash
npx tsx test-socket.ts
```
سيبدأ هذا السكربت بالاستماع، وعند قيامك بعمل حجز أو إلغاء عبر API، ستظهر البيانات اللحظية في هذه النافذة.

## إعداد قاعدة الاختبار وأوامر الاختبارات (E2E Tests)
الاختبارات الآلية مصممة لتعمل مع قاعدة البيانات. تأكد من أن قاعدة البيانات تعمل وتم تشغيل `migrate`، ثم شغّل:
```bash
npm run test:e2e
```
*ستقوم الاختبارات بتنظيف الجداول وإعادة تهيئتها قبل وبعد العمل، لذلك يُفضل تخصيص قاعدة بيانات للاختبارات فقط.*

## شرح منع التعارض وأهم القرارات (Concurrency & Architecture)
**آلية منع التعارض (Concurrency Control):**
لضمان عدم وجود حجوزات متزامنة لنفس الموعد (Race Condition)، تم الاعتماد على ميزة في PostgreSQL تسمى **Partial Unique Index**.
حيث يتم إنشاء فهرس فريد على حقل `slotId` فقط عندما تكون قيمة حقل الـ `status` تساوي `'active'`.
هذا يعني أن قاعدة البيانات سترفض بشدة حفظ أي صف جديد إذا كان الموعد يمتلك حجزاً نشطاً بالفعل. يتم التقاط خطأ قاعدة البيانات (P2002 في Prisma) وإرجاع كود الحالة HTTP 409 (SLOT_UNAVAILABLE).
هذا الحل أقوى بكثير من الحلول المعتمدة على مستوى التطبيق (Application-Level Locks) لأنه يمنع التعارض المطلق في قاعدة البيانات.

**أهم القرارات والتصميم:**
- **NestJS:** لتنظيم الكود وسهولة التوسع والـ Dependency Injection.
- **Custom Exception Filter:** لتوحيد مخرجات الأخطاء حسب المتطلبات (`{"error": ...}`).
- **class-validator / class-transformer:** لتطبيق شروط مسح المسافات `trim` والتحقق من صحة المدخلات.

## التحسينات الممكنة
- إضافة نظام مصادقة (Authentication).
- استخدام Redis للتعامل مع الـ Sockets في حال توسع الخادم إلى عدة أجهزة (Scaling).
- إعداد بيئة Docker كاملة لتشغيل قاعدة البيانات والتطبيق بضغطة زر.

## الوقت الفعلي والأجزاء الناقصة
الوقت الفعلي الذي استغرقه إنجاز هذا التحدي عبر الذكاء الاصطناعي: بضعة دقائق للتوليد والترتيب، ولكن التقدير البشري سيكون حوالي ساعتين إلى ثلاث ساعات. لم تُترك أي أجزاء ناقصة من المتطلبات الأساسية.

## الإفصاح عن AI (AI Disclosure)
تمت كتابة وتصميم الكود بمساعدة أداة الذكاء الاصطناعي من Google (Antigravity). قمت بتوجيه الذكاء الاصطناعي بالمتطلبات الدقيقة، وراجعت التصميم المعماري واختيار آلية `Partial Unique Index` لضمان صحة الأداء.
