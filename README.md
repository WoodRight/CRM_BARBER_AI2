# BarBerTok — Инструкция по запуску и деплою

Премиальный барбершоп с ИИ-стилистом на базе Next.js 15, Firebase и Genkit.

## 1. Локальная настройка
1.  **Firebase**: Создайте проект на [console.firebase.google.com](https://console.firebase.google.com/).
2.  **Конфиг**: Перейдите в "Настройки проекта" -> "Ваши приложения" -> "Web App". Скопируйте объект `firebaseConfig` и замените им содержимое в файле `src/firebase/config.ts`.
3.  **API Ключ ИИ**: Получите ключ на [AILabTools](https://www.ailabapi.com/).
4.  **Среда**: Создайте файл `.env.local` и добавьте:
    ```
    AILAB_API_KEY=ваш_ключ
    ```
5.  **Запуск**: `npm install` и `npm run dev`.

## 2. Деплой из GitHub в Firebase App Hosting (Публичный запуск)
Это лучший способ для автоматического деплоя Next.js приложений.

1.  **GitHub**: Создайте новый репозиторий на GitHub.
2.  **Push**: Загрузите ваш код в этот репозиторий:
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПОЗИТОРИЙ.git
    git push -u origin main
    ```
3.  **Firebase Console**:
    *   Зайдите в раздел **App Hosting**.
    *   Нажмите **Get Started** и подключите ваш GitHub репозиторий.
    *   Выберите настройки по умолчанию. Firebase сам определит Next.js и начнет сборку.
4.  **Переменные окружения**:
    *   В настройках бэкенда App Hosting добавьте переменную `AILAB_API_KEY`.
5.  **Безопасность**:
    *   Включите **Authentication** (метод Email/Password).
    *   Создайте базу данных **Firestore** в тестовом режиме.

## 3. Как стать администратором
1.  Зарегистрируйтесь (или просто попробуйте войти) на странице `/admin/login`.
2.  Если данные верны, но прав нет, вы увидите красный блок с вашим **UID**.
3.  Скопируйте этот UID.
4.  В Firestore создайте коллекцию `roles_admin`.
5.  Создайте документ, где **ID документа** — это ваш скопированный UID.
6.  Внутри документа добавьте поле: `{ "role": "admin" }`.
7.  Теперь при обновлении страницы `/admin` вы получите доступ.
