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

## 3. Как сменить репозиторий в настройках

### Если нужно сменить URL в Git (терминал):
Если вы ошиблись с адресом или создали новый репозиторий, введите команду:
```bash
git remote set-url origin https://github.com/WoodRight/CRM_BARBER_AI2.git
git push -u origin main
```

### Если нужно сменить репозиторий в Firebase App Hosting:
1.  Перейдите в [Firebase Console](https://console.firebase.google.com/).
2.  Выберите ваш проект.
3.  В левом меню выберите **App Hosting**.
4.  Нажмите на кнопку **"Создать бэкенд"** (или выберите существующий).
5.  В процессе настройки выберите ваш новый репозиторий `WoodRight/CRM_BARBER_AI2` из списка подключенных аккаунтов GitHub.

## 4. Деплой в Firebase App Hosting
1.  **Firebase Console**: Подключите ваш GitHub репозиторий `WoodRight/CRM_BARBER_AI2`.
2.  **Переменные окружения**: В настройках бэкенда App Hosting добавьте переменную `AILAB_API_KEY`.
3.  **Безопасность**:
    *   Включите **Authentication** (Email/Password).
    *   Создайте **Firestore** в тестовом режиме.

## 5. Как стать администратором
1.  Зарегистрируйтесь на странице `/admin/login`.
2.  Скопируйте ваш **UID** из красного блока.
3.  В Firestore создайте коллекцию `roles_admin`.
4.  Создайте документ с ID = вашему UID и полем `{ "role": "admin" }`.
