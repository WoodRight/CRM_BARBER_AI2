# BarBerTok — Инструкция по запуску и деплою

Премиальный барбершоп с ИИ-стилистом на базе Next.js 15, Firebase и Genkit.

## 1. Локальная настройка
1.  **Firebase**: Создайте проект на [console.firebase.google.com](https://console.firebase.google.com/).
2.  **Конфиг**: Скопируйте данные из "Project Settings" и вставьте их в `src/firebase/config.ts`.
3.  **API Ключ ИИ**: Получите ключ на [AILabTools](https://www.ailabapi.com/).
4.  **Среда**: Создайте файл `.env.local` и добавьте:
    ```
    AILAB_API_KEY=ваш_ключ
    ```
5.  **Запуск**: `npm install` и `npm run dev`.

## 2. Деплой в Firebase App Hosting (Публичный запуск)
Это рекомендуемый способ для Next.js приложений.

1.  **GitHub**: Создайте репозиторий и сделайте `git push` вашего кода.
2.  **Firebase Console**:
    *   Зайдите в раздел **App Hosting**.
    *   Нажмите **Get Started** и подключите ваш GitHub репозиторий.
    *   Выберите настройки по умолчанию.
3.  **Переменные окружения**:
    *   После создания бэкенда в консоли Firebase перейдите в его настройки.
    *   Добавьте переменную `AILAB_API_KEY` в разделе Environment Variables.
4.  **Домен**: Вкладка "Custom Domains" в App Hosting позволит вам привязать ваше купленное доменное имя.

## 3. Настройка прав администратора
1.  Зарегистрируйтесь в приложении через форму входа (если вы добавили её) или используйте Google Auth.
2.  Найдите ваш `uid` в разделе Firebase Authentication.
3.  В Firestore создайте коллекцию `roles_admin`.
4.  Создайте документ, где **ID документа** — это ваш `uid`, а содержимое: `{ "role": "admin" }`.
5.  Теперь страница `/admin` будет доступна для вас.
