# BarBerTok — Премиальный Барбершоп с ИИ-стилистом

Современное веб-приложение для барбершопа с виртуальной примеркой причесок и панелью управления.

## Как подключить ваш проект к Firebase

1. **Создайте проект** в [Firebase Console](https://console.firebase.google.com/).
2. **Включите Authentication**:
   - Перейдите в раздел Authentication -> Sign-in method.
   - Нажмите "Add new provider" и выберите **Email/Password**. Включите его.
3. **Включите Firestore**:
   - Перейдите в Firestore Database -> Create database.
   - Выберите местоположение и режим (Test mode подойдет для начала).
4. **Добавьте Администратора**:
   - В Authentication -> Users нажмите **Add user**.
   - Создайте Email и Пароль — это будут данные для входа в `/admin/login`.
5. **Настройте переменные окружения**:
   - Создайте файл `.env.local` в корне проекта.
   - Скопируйте данные из "Project Settings" вашего Firebase и впишите их так (используйте ваш актуальный ID проекта):
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=ваш_ключ
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-7836855314-29aec
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=studio-7836855314-29aec.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=studio-7836855314-29aec.firebasestorage.app
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     NEXT_PUBLIC_FIREBASE_APP_ID=...
     AILAB_API_KEY=ваш_ключ_от_ailabtools
     ```

## Запуск
1. `npm install`
2. `npm run dev`

---
Разработано с использованием Firebase Studio.
