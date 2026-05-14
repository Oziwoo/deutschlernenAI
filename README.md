# DeutschLernen AI 🇩🇪

Интерактивный тренажёр 1000 самых важных немецких слов с AI-объяснениями в контексте.

## Стек

- **React 18 + Vite** — фронтенд
- **Tailwind CSS** — стили
- **Supabase** — анонимные сессии + прогресс + кэш объяснений
- **Vercel** — деплой + serverless функция (API ключ server-side)
- **Anthropic Claude** — объяснения слов через контекст

---

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone https://github.com/YOUR_USERNAME/deutschlernenAI.git
cd deutschlernenAI
npm install
```

### 2. Настроить Supabase

1. Создай проект на [supabase.com](https://supabase.com)
2. Открой **SQL Editor** → **New Query**
3. Вставь и выполни содержимое файла `supabase/schema.sql`
4. Скопируй **Project URL** и **anon key** из `Settings → API`

### 3. Создать файл `.env`

```bash
cp .env.example .env
```

Заполни `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Только для локальной разработки (для Vercel — см. шаг 5)
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # service_role key из Settings → API
```

### 4. Запустить локально

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

> **Локальный API:** Vercel serverless функции (`/api/explain.js`) в dev-режиме не запускаются автоматически через `vite`.  
> Для полного тестирования локально:
> ```bash
> npm install -g vercel
> vercel dev
> ```

### 5. Деплой на Vercel

1. Запушь репозиторий на GitHub
2. Открой [vercel.com](https://vercel.com) → **New Project** → выбери репозиторий
3. В разделе **Environment Variables** добавь:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
4. Нажми **Deploy** 🚀

---

## Как работают объяснения

1. Пользователь открывает карточку слова
2. Запрос идёт на `/api/explain` (Vercel Edge Function)
3. Функция проверяет таблицу `word_explanations` в Supabase
4. Если объяснение уже есть — возвращает мгновенно (кэш)
5. Если нет — вызывает Anthropic API, сохраняет результат, возвращает
6. Следующий пользователь, открывший то же слово, получит кэшированный ответ

**Результат:** каждое слово генерируется ровно один раз, затем раздаётся мгновенно.

---

## Алгоритм обучения (SM-2)

| Оценка    | Интервал                    |
|-----------|-----------------------------|
| Не знаю   | 1 день (начать заново)      |
| Сложно    | × 1.2 (замедленный рост)    |
| Знаю      | × ease factor (~2.5)        |
| Легко     | × ease factor × 1.3 (бонус) |

Статусы: `new` → `learning` → `review` → `mastered`

---

## Структура проекта

```
deutschlernenAI/
├── api/
│   └── explain.js          # Vercel serverless (Anthropic API)
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx   # Главная страница
│   │   ├── LearnMode.jsx   # Карточки с flip-анимацией
│   │   ├── QuizMode.jsx    # Тест с 4 вариантами
│   │   ├── BrowseMode.jsx  # Словарь с поиском
│   │   └── Navigation.jsx  # Шапка
│   ├── data/
│   │   └── words.js        # 1000 слов с артиклями
│   ├── hooks/
│   │   ├── useSession.js   # Анонимная сессия
│   │   └── useProgress.js  # Прогресс в Supabase
│   ├── lib/
│   │   ├── supabase.js     # Клиент Supabase
│   │   └── srs.js          # Алгоритм SM-2
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── schema.sql          # Схема БД + политики
├── .env.example
├── vercel.json
└── README.md
```

---

## GitHub синхронизация

```bash
# Первый раз
git init
git add .
git commit -m "feat: initial project setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/deutschlernenAI.git
git push -u origin main

# Обновления
git add .
git commit -m "feat: your change"
git push
```

Vercel автоматически деплоит каждый `push` в `main`.

---

## Категории слов

| Категория | Кол-во | Описание |
|-----------|--------|----------|
| art | 50 | Артикли, местоимения |
| con | 100 | Союзы, предлоги, частицы |
| vb1 | 150 | Основные глаголы |
| vb2 | 87 | Дополнительные глаголы |
| ppl | 50 | Люди, семья |
| plc | 50 | Места, здания |
| tim | 30 | Время |
| obj | 70 | Предметы |
| abs | 70 | Абстрактные понятия |
| bod | 40 | Тело, здоровье |
| fod | 40 | Еда, напитки |
| nat | 50 | Природа |
| tec | 50 | Технологии, медиа |
| adj | 110 | Прилагательные |
| adj | 53 | Наречия, числа |
