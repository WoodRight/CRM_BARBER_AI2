
# BarBerTok — Инструкция по запуску

## 1. Настройка Firebase
1. Создайте проект на [console.firebase.google.com](https://console.firebase.google.com/).
2. Включите **Authentication** (Email/Password).
3. Создайте **Firestore Database** в тестовом режиме.
4. Скопируйте конфиг приложения и вставьте его в `src/firebase/config.ts`.

## 2. Искусственный интеллект
Для работы ИИ-примерки:
1. Зарегистрируйтесь на [AILabTools](https://www.ailabapi.com/).
2. Создайте файл `.env.local` в корне проекта.
3. Добавьте строку: `AILAB_API_KEY=ваш_ключ_здесь`.

## 3. Запуск
1. Установите зависимости: `npm install`.
2. Запустите проект: `npm run dev`.
3. Откройте `http://localhost:3000`.

## 4. Панель Администратора
- Страница входа: `/admin/login`.
- Сначала создайте пользователя в Firebase Auth, затем в Firestore в коллекции `roles_admin` создайте документ с ID этого пользователя, чтобы получить доступ.
