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

## 2. Как отправить код на GitHub (Новый репозиторий)
Если вы создали новый пустой репозиторий на GitHub, выполните эти команды в корне проекта:

```bash
# 1. Инициализация (если еще не сделано)
git init

# 2. Добавление всех файлов проекта
git add .

# 3. Сохранение изменений
git commit -m "Initial commit: BarBerTok Premium with AI Stylist"

# 4. Создание главной ветки
git branch -M main

# 5. Привязка к вашему репозиторию
git remote add origin https://github.com/WoodRight/CRM_BARBER_AI2.git

# 6. Отправка файлов на сервер
git push -u origin main
```

*Примечание: Если `git remote add` выдает ошибку, что origin уже существует, введите: `git remote set-url origin https://github.com/WoodRight/CRM_BARBER_AI2.git`*

## 3. Деплой в Firebase App Hosting
Это лучший способ для автоматического деплоя Next.js приложений.

1.  **Firebase Console**:
    *   Зайдите в раздел **App Hosting**.
    *   Нажмите **Get Started** и подключите ваш GitHub репозиторий `WoodRight/CRM_BARBER_AI2`.
    *   Выберите настройки по умолчанию. Firebase сам определит Next.js и начнет сборку.
2.  **Переменные окружения**:
    *   В настройках бэкенда App Hosting добавьте переменную `AILAB_API_KEY`.
3.  **Безопасность**:
    *   Включите **Authentication** (метод Email/Password).
    *   Создайте базу данных **Firestore** в тестовом режиме.

## 4. Как стать администратором
1.  Зарегистрируйтесь на странице `/admin/login`.
2.  Вы увидите красный блок с вашим **UID**. Скопируйте его.
3.  В Firestore создайте коллекцию `roles_admin`.
4.  Создайте документ, где **ID документа** — это ваш UID.
5.  Внутри документа добавьте поле: `{ "role": "admin" }`.
6.  Обновите страницу `/admin`.
