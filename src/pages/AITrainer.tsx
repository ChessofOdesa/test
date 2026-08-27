import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles, BarChart3, BookOpen, Target, Lightbulb, Loader2, Brain, Swords, Crown, BookMarked, FileText, TrendingUp, ListChecks, Shield, Zap, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import { buildGrowthSummary, readGrowthState } from "@/lib/growth-system";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STAGES = [
  {
    id: 1,
    title: "Етап 1: Головна сторінка",
    content: `Ти — senior frontend + backend developer, UI/UX designer і product architect.

Твоя задача: створити ГОЛОВНУ СТОРІНКУ шахового сайту рівня Chess.com / Lichess.

Це найважливіша сторінка, яка:
- продає продукт
- затягує користувача
- дає миттєвий старт гри
- показує можливості платформи

---

# 🎯 ГОЛОВНА ЦІЛЬ

Користувач повинен:
1. Зайти на сайт
2. За 3 секунди зрозуміти що це
3. Натиснути "Play Now"
4. Почати гру

---

# 🧱 СТРУКТУРА СТОРІНКИ

Сторінка складається з блоків:

1. Header (верхнє меню)
2. Hero section (головний блок)
3. Quick Play (швидкий старт)
4. Game modes (режими гри)
5. Features (переваги)
6. Live stats (онлайн дані)
7. Top players (лідери)
8. Recent games (останні партії)
9. Call to action (CTA)
10. Footer

---

# 🔝 1. HEADER

Функції:
- логотип (зліва)
- меню (центр або справа)
- кнопки: Login / Register або Profile

Меню:
- Play
- Puzzles
- Learn
- Tournaments
- Profile

UI:
- прозорий header
- при скролі стає темним
- hover ефекти
- sticky зверху

---

# 🔥 2. HERO SECTION (НАЙВАЖЛИВІШИЙ БЛОК)

Ліво:
- великий заголовок:
  "Play Chess Online Instantly"
- підзаголовок:
  "Challenge players worldwide or play against AI"

Кнопки:
- 🟢 Play Now (основна)
- ⚪ Play vs Computer

Право:
- шахівниця (жива або анімована)
- показ руху фігур
- або демо партія

Додатково:
- online count (наприклад: 12,431 players online)

Анімації:
- плавне появлення
- hover glow кнопок
- рух фігур

---

# ⚡ 3. QUICK PLAY (МГНОВЕННА ГРА)

Карточки:

- Bullet (1+0)
- Blitz (3+0)
- Rapid (10+0)

При кліку:
→ миттєвий matchmaking

UI:
- кнопки-карточки
- hover glow
- активний стан

---

# 🎮 4. GAME MODES (РЕЖИМИ ГРИ)

Карточки режимів:

- Online Play
- Play vs Computer
- Puzzles
- Learn
- Tournaments

Кожен з:
- іконка
- назва
- опис
- кількість користувачів

UI:
- grid layout
- hover ефекти
- анімації

---

# 🧠 5. FEATURES (ПЕРЕВАГИ)

Перелік переваг:

- Instant matchmaking
- AI analysis
- Adaptive puzzles
- Tournaments
- Anti-cheat system
- Progress tracking

UI:
- іконки
- короткі описи
- grid

---

# 📊 6. LIVE STATS (ОНЛАЙН ДАНІ)

Показати:
- Players online
- Games played
- Puzzles solved

UI:
- великі числа
- анімація лічильників

---

# 🏆 7. TOP PLAYERS (ЛІДЕРИ)

Топ 5 гравців:
- аватар
- ім'я
- рейтинг

UI:
- список
- медалі

---

# 🔥 8. RECENT GAMES (ОСТАННІ ПАРТІЇ)

Останні партії:
- результат
- гравці
- час

UI:
- список з індикаторами

---

# 📢 9. CALL TO ACTION (CTA)

"Готові грати?"
"Зареєструватися"

UI:
- великий блок
- кнопка

---

# 🦶 10. FOOTER

Лінки:
- About
- Contact
- Terms
- Privacy

UI:
- темний фон
- лінки`
  },
  {
    id: 2,
    title: "Етап 2: Play Online",
    content: `Ти — senior backend + frontend developer, realtime engineer і system architect.

Твоя задача: створити вкладку "Play Online", яка дозволяє користувачу миттєво знайти суперника і почати шахову гру через WebSocket.

---

# 🎯 ГОЛОВНА ЦІЛЬ

Користувач:
1. заходить у вкладку Play Online
2. обирає режим (bullet/blitz/rapid)
3. натискає "Find Game"
4. за 1–3 секунди знаходить суперника
5. миттєво переходить у гру

---

# 🧱 СТРУКТУРА СТОРІНКИ

1. Header
2. Game Mode Selection
3. Matchmaking Panel
4. Searching State (анімація)
5. Found Game State
6. Queue Info
7. Cancel Search
8. Recent Opponents

---

# 🎮 1. GAME MODE SELECTION

Показати режими:

- Bullet (1+0)
- Blitz (3+0, 5+0)
- Rapid (10+0, 15+10)
- Custom

Кожен режим:
- назва
- опис (швидка/середня/довга гра)
- час партії

UI:
- кнопки-карточки
- hover glow
- активний стан

---

# 🔍 2. MATCHMAKING PANEL

Центральна частина:

"Find Game" button

Після кліку:
- показати "Searching..."
- анімація
- таймер

---

# ⏳ 3. SEARCHING STATE

Показати:
- Searching for opponent...
- Estimated wait time
- Cancel button

Анімація:
- спінер
- пульсуючий текст

---

# ✅ 4. FOUND GAME STATE

Коли знайдено:
- "Game found!"
- "Starting in 3...2...1..."
- автоматичний редірект у гру

---

# 📊 5. QUEUE INFO

Показати:
- Players in queue
- Average wait time
- Your position

---

# ❌ 6. CANCEL SEARCH

Кнопка "Cancel"
→ повернення до вибору режиму

---

# 👥 7. RECENT OPPONENTS

Список останніх суперників:
- ім'я
- результат
- дата

UI:
- список
- аватари`
  },
  {
    id: 3,
    title: "Етап 3: Game Page",
    content: `Ти — senior realtime engineer, frontend architect, chess engine integrator.

Твоя задача: створити сторінку гри (Game Page), де два гравці грають у шахи в реальному часі.

Це ядро всієї платформи. Тут має бути:
- ідеальна синхронізація
- миттєві ходи
- красивий UI
- стабільний socket

---

# 🎯 ГОЛОВНА ЦІЛЬ

Гравці повинні:
1. бачити шахівницю
2. робити ходи
3. бачити ходи суперника миттєво
4. мати таймер
5. завершити партію

---

# 🧱 СТРУКТУРА СТОРІНКИ

Layout:

[ЛІВО]
- інформація про гравця (superior)
- таймер

[ЦЕНТР]
- шахівниця

[ПРАВО]
- список ходів
- чат
- кнопки

[НИЗ]
- інформація про поточний статус

---

# ♟️ 1. ШАХІВНИЦЯ

Використати:
- react-chessboard

Функції:
- drag & drop
- highlight moves
- promotion window
- board flip
- captured pieces

---

# ⏰ 2. ТАЙМЕР

Показати час кожного гравця.

Функції:
- відлік часу
- increment
- flag when time up

UI:
- великий дисплей
- червоний коли мало часу

---

# 📝 3. СПИСОК ХОДІВ

Показати всі ходи партії.

Функції:
- scroll to current
- click to go to move
- notation (SAN)

UI:
- список
- highlight current

---

# 💬 4. ЧАТ

Під час гри гравці можуть писати.

Функції:
- send message
- emoji
- moderation

UI:
- chat window
- input field

---

# 🎮 5. КНОПКИ

Кнопки:
- Resign
- Offer draw
- Abort
- Takeback

UI:
- іконки
- hover

---

# 📊 6. СТАТУС

Показати:
- Whose turn
- Game result
- Check/mate/stalemate

UI:
- banner at bottom`
  },
  {
    id: 4,
    title: "Етап 4: Play vs Computer",
    content: `Ти — senior chess software engineer, AI integrator та frontend architect.

Твоя задача: створити повністю функціональний режим гри проти комп'ютера, подібний до того, як це реалізовано на Chess.com та Lichess.

Гравець повинен мати можливість:

грати проти AI
вибирати рівень складності
отримувати швидкі відповіді комп'ютера
аналізувати гру після партії

---

# 🎯 ГОЛОВНА ЦІЛЬ

Створити сторінку Play vs Computer, де:

✔ шахівниця працює локально
✔ комп'ютер робить ходи через Stockfish engine
✔ гравець може вибирати рівень складності
✔ гра працює без сервера (local AI)

---

# 🧱 СТРУКТУРА СТОРІНКИ

Desktop layout:

-----------------------------------------
| Computer player | Difficulty          |
| Engine level    |                     |
-----------------------------------------
|                                         
|              CHESSBOARD                 
|                                         
-----------------------------------------
| Player | Timer | Buttons                |
-----------------------------------------
| Moves list | Analysis | Evaluation bar |
-----------------------------------------

---

# ♟️ 1. ШАХІВНИЦЯ

Використати:

react-chessboard

Функції:

drag & drop
highlight moves
show last move
promotion window
captured pieces

---

# 🤖 2. AI ПРОТИВНИК

Використати:

Stockfish engine

Рівні складності:

1. Beginner
2. Intermediate
3. Advanced
4. Expert
5. Master

Час на хід:
- швидкий для низьких рівнів
- повільний для високих

---

# ⏰ 3. ТАЙМЕР

Таймер для гравця.

AI має необмежений час або фіксований.

---

# 📊 4. АНАЛІЗ

Після гри:

- оцінка ходів
- помилки
- найкращі варіанти

UI:
- evaluation bar
- best moves

---

# 🎮 5. КНОПКИ

- New Game
- Flip Board
- Undo Move
- Hint

UI:
- іконки`
  },
  {
    id: 5,
    title: "Етап 5: Puzzles",
    content: `Ти — chess platform engineer, database architect та frontend developer.

Твоя задача: створити повноцінну систему шахових задач, подібну до тієї, що є на Chess.com та Lichess.

Система повинна:

показувати позицію
перевіряти правильність ходу
автоматично відповідати ходом суперника
вести рейтинг задач
показувати статистику

---

# 🎯 ГОЛОВНА ЦІЛЬ

Створити режим Puzzle Trainer, де користувач:

✔ розв’язує шахові задачі
✔ отримує рейтинг задач
✔ тренує тактику
✔ бачить прогрес

---

# 🧱 СТРУКТУРА СТОРІНКИ

Desktop layout:

---------------------------------------
| Puzzle rating | Puzzle info         |
---------------------------------------
|                                     |
|            CHESSBOARD               |
|                                     |
---------------------------------------
| Moves list | Hint | Skip | Next     |
---------------------------------------
| Puzzle explanation                  |
---------------------------------------

---

# ♟️ 1. ШАХІВНИЦЯ

Використати:

react-chessboard

Функції:

drag & drop
highlight moves
show last move
promotion window
arrows for hints

---

# 🧩 2. ЗАДАЧІ

Типи задач:

- Mate in 1,2,3
- Tactical puzzles
- Endgame studies
- Opening traps

Джерела:
- Lichess database
- Local puzzles
- Generated

---

# 📊 3. РЕЙТИНГ

Кожен користувач має puzzle rating.

Алгоритм:
- Glicko system
- rating change based on difficulty

---

# 💡 4. ПІДКАЗКИ

Функції:
- Hint (show first move)
- Solution (show all moves)
- Explanation

UI:
- кнопки

---

# 📈 5. СТАТИСТИКА

Показати:
- Solved today
- Streak
- Accuracy
- Best rating

UI:
- progress bars`
  },
  {
    id: 6,
    title: "Етап 6: Lessons",
    content: `Ти — chess education architect, product designer та frontend developer.

Твоя задача: створити інтерактивну систему шахових уроків, подібну до курсів на Chess.com та навчальних розділів на Lichess.

Користувач повинен мати можливість:

проходити уроки по порядку
взаємодіяти з шахівницею
виконувати завдання
отримувати прогрес

---

# 🎯 ГОЛОВНА ЦІЛЬ

Створити Chess Academy на сайті.

Користувач:

✔ вивчає шахи з нуля
✔ проходить уроки
✔ виконує вправи
✔ бачить прогрес навчання

---

# 🧱 СТРУКТУРА СТОРІНКИ

Desktop layout:

--------------------------------------
| Lesson title | Progress | Next     |
--------------------------------------
|                                     
|           CHESSBOARD                
|                                     
--------------------------------------
| Lesson text / explanation          |
--------------------------------------
| Tasks / Next / Previous            |
--------------------------------------

---

# 📚 1. СТРУКТУРА КУРСУ

Курс складається з 100 уроків, поділених на рівні.

РІВЕНЬ 1 — ОСНОВИ (1–20)
Що таке шахи
Шахівниця
Як ходить пішак
Як ходить тура
Як ходить слон
Як ходить кінь
Як ходить ферзь
Як ходить король
Шах і мат
Рокіровка
Правила гри

РІВЕНЬ 2 — ТАКТИКА (21–40)
Що таке тактика
Вилка
Зв'язка
Відкритий напад
Відволікання
Перевантаження

РІВЕНЬ 3 — СТРАТЕГІЯ (41–60)
Позиційна гра
Пішакова структура
Простір
Ініціатива
Атака на короля

РІВЕНЬ 4 — ЕНДШПІЛЬ (61–80)
Основні ендшпілі
Король + пішак vs король
Лусена
Філідор
Опозиція

РІВЕНЬ 5 — МАЙСТЕР (81–100)
Розвинені теми
Турнірна практика
Психологія

---

# 📖 2. УРОК

Кожен урок має:

- Текст пояснення
- Інтерактивна шахівниця
- Завдання
- Тест

UI:
- кроковий процес

---

# ✅ 3. ЗАВДАННЯ

Типи:
- Зроби хід
- Знайдіть найкращий хід
- Розв'яжіть задачу

Після відповіді:
- правильна/неправильна
- пояснення

---

# 📊 4. ПРОГРЕС

Показати:
- Пройдені уроки
- Загальний прогрес
- Серія днів

UI:
- progress bar`
  },
  {
    id: 7,
    title: "Етап 7: Analysis Board",
    content: `Ти — chess engine integrator, frontend architect та chess software engineer.

Твоя задача: створити повноцінну дошку аналізу партій, подібну до аналізу на Chess.com та Lichess.

Це одна з найважливіших функцій шахового сайту.

---

# 🎯 ГОЛОВНА ЦІЛЬ

Створити сторінку Analysis Board, де користувач може:

✔ аналізувати позиції
✔ запускати двигун
✔ переглядати варіанти
✔ імпортувати партії
✔ дивитися оцінку позиції

---

# 🧱 СТРУКТУРА СТОРІНКИ

Desktop layout:

-------------------------------------------
| Engine depth | Evaluation | Best line   |
-------------------------------------------
|                                             |
|                CHESSBOARD                   |
|                                             |
-------------------------------------------
| Moves list | Evaluation graph | Engine     |
-------------------------------------------
| Import PGN | Export | Reset board          |
-------------------------------------------

---

# ♟️ 1. ШАХІВНИЦЯ

Використати:

react-chessboard

Функції:

✔ drag & drop
✔ set position
✔ arrows
✔ highlight moves
✔ flip board

---

# 🧠 2. ЛОГІКА ШАХІВ

Використати:

chess.js

Функції:

✔ validate moves
✔ generate legal moves
✔ check game state

---

# 🤖 3. ШАХОВИЙ ДВИГУН

Використати:

Stockfish

Функції:

✔ analyze position
✔ show best moves
✔ evaluation
✔ depth control

UI:
- depth slider
- evaluation bar
- best line

---

# 📈 4. ГРАФІК ОЦІНКИ

Показати оцінку по ходам.

UI:
- line chart
- hover for details

---

# 📝 5. СПИСОК ХОДІВ

Показати ходи партії.

Функції:

✔ click to go to position
✔ annotations
✔ variations

---

# 📥 6. ІМПОРТ/ЕКСПОРТ

Функції:

✔ import PGN
✔ export PGN
✔ load from game

UI:
- buttons
- file upload`
  },
  {
    id: 8,
    title: "Етап 8: User Profile + Rating System",
    content: `Ти — backend architect, database engineer та chess platform developer.

Твоя задача: створити систему профілю користувача та рейтингів, подібну до тієї, що використовують Chess.com та Lichess.

Це соціальна частина шахового сайту, яка зберігає статистику, рейтинг та історію партій.

---

# 🎯 ГОЛОВНА ЦІЛЬ

Кожен користувач повинен мати власний профіль, де видно:

✔ рейтинг
✔ статистику
✔ історію партій
✔ досягнення

---

# 🧱 СТРУКТУРА ПРОФІЛЮ

Desktop layout:

-----------------------------------------
| Avatar | Username | Country | Rating |
-----------------------------------------
| Rapid | Blitz | Bullet | Puzzle     |
-----------------------------------------
| Stats | Games history | Achievements |
-----------------------------------------
| Friends | Followers | Following     |
-----------------------------------------

---

# 👤 1. ІНФОРМАЦІЯ КОРИСТУВАЧА

Показати:

Avatar
Username
Country
Join date
Online status

Додатково:

Bio
Location
Title

---

# 🧠 2. РЕЙТИНГИ

Користувач має різні рейтинги.

Mode	Rating
Bullet	1200
Blitz	1350
Rapid	1400
Classical	1500
Puzzle	1100

Алгоритм:

Glicko-2 system

---

# 📊 3. СТАТИСТИКА

Показати:

Games played
Games won
Games drawn
Games lost
Win rate
Best rating
Current streak

UI:
- cards
- charts

---

# 🏆 4. ІСТОРІЯ ПАРТІЙ

Список останніх партій:

Date | Opponent | Result | Rating change

UI:
- таблиця
- фільтри

---

# 🏅 5. ДОсягнення

Список досягнень:

- First win
- 100 games
- Rating 1500
- etc.

UI:
- badges
- progress

---

# 👥 6. СОЦІАЛЬНЕ

Friends
Followers
Following

UI:
- lists
- buttons`
  },
  {
    id: 9,
    title: "Етап 9: Tournaments",
    content: `Ти — chess platform architect, backend engineer та realtime system designer.

Твоя задача: створити систему онлайн-турнірів, подібну до тієї, що є на Chess.com та Lichess.

Це функція, яка дозволяє гравцям змагатися у турнірах у реальному часі.

---

# 🎯 ГОЛОВНА ЦІЛЬ

Користувач повинен мати можливість:

✔ створити турнір
✔ приєднатися до турніру
✔ грати кілька партій
✔ бачити турнірну таблицю

---

# 🧱 СТРУКТУРА СТОРІНКИ ТУРНІРУ

Desktop layout:

---------------------------------------------
| Tournament title | Time control | Join    |
---------------------------------------------
| Players | Standings | Chat               |
---------------------------------------------
| Round | Pairings | Games                 |
---------------------------------------------

---

# 🏆 1. ТИПИ ТУРНІРІВ

Система повинна підтримувати:

Arena Tournament

гравці грають максимум партій за час.

Приклад:

Duration: 30 minutes

Swiss Tournament

гравці грають раунди.

Наприклад:

7 rounds

Knockout Tournament

система на вибування.

---

# 📅 2. СТВОРЕННЯ ТУРНІРУ

Форма:

Name
Type
Time control
Max players
Start time

UI:
- form
- validation

---

# 👥 3. ПРИЄДНАННЯ

Кнопка "Join"

Після приєднання:
- очікування початку
- чат

---

# 📊 4. ТУРНІРНА ТАБЛИЦЯ

Показати:

Rank | Player | Score | Games

UI:
- таблиця
- сортування

---

# 🎯 5. ПАРНІ ПАРТІЇ

Для кожного раунду:

White | Black | Result | Game link

UI:
- список

---

# 💬 6. ЧАТ

Турнірний чат для всіх учасників.

UI:
- chat window`
  },
  {
    id: 10,
    title: "Етап 10: Social Features",
    content: `Ти — social platform architect, backend engineer та realtime system developer.

Твоя задача: створити соціальну систему шахового сайту, подібну до тієї, що використовують Chess.com та Lichess.

Ці функції перетворюють шаховий сайт із простої гри у повноцінну шахову спільноту.

---

# 🎯 ГОЛОВНА ЦІЛЬ

Користувачі повинні мати можливість:

✔ спілкуватися
✔ створювати клуби
✔ підписуватися на гравців
✔ бачити активність друзів

---

# 🧱 СТРУКТУРА SOCIAL СИСТЕМИ

Основні розділи:

Chat
Friends
Followers
Clubs
Activity feed
Messages

---

# 💬 1. PRIVATE CHAT

Користувач може написати іншому користувачу.

UI:

User list | Chat window

Повідомлення:

Hello!
Good game!
Want a rematch?

Технологія:

WebSocket
Socket.io

---

# 🧠 2. FRIEND SYSTEM

Функції:

send friend request
accept/decline
remove friend
friend list

UI:
- buttons on profile
- friend list page

---

# 👥 3. FOLLOW SYSTEM

Функції:

follow/unfollow
followers list
following list
activity feed

UI:
- follow button
- lists

---

# 🏛️ 4. CLUBS

Клуби — групи гравців.

Функції:

create club
join club
club chat
club tournaments

UI:
- club page
- member list

---

# 📡 5. ACTIVITY FEED

Показати активність друзів:

- won a game
- solved puzzle
- joined tournament

UI:
- timeline
- filters

---

# ✉️ 6. MESSAGES

Система повідомлень.

Типи:

- friend requests
- tournament invites
- game challenges

UI:
- inbox
- notifications`
  },
  {
    id: 11,
    title: "Етап 11: Anti-Cheat System",
    content: `Ти — security engineer, chess data analyst та backend architect.

Твоя задача: створити систему виявлення шахрайства, подібну до тієї, що використовують Chess.com та Lichess.

Без анти-чіт системи будь-яка шахова платформа швидко заповнюється гравцями, які використовують шахові двигуни.

---

# 🎯 ГОЛОВНА ЦІЛЬ

Система повинна:

✔ знаходити підозрілих гравців
✔ аналізувати точність ходів
✔ порівнювати ходи з engine
✔ автоматично позначати підозрілі акаунти

---

# 🧠 1. АНАЛІЗ ТОЧНОСТІ

Після кожної партії система запускає engine analysis.

Використати:

Stockfish

Алгоритм:

for each move:
compare player move with engine best move
calculate accuracy

---

# 📊 2. ACCURACY SCORE

Розрахунок точності.

Приклад:

Accuracy	Meaning
90–100%	дуже висока точність
80–90%	сильна гра
70–80%	нормальна
<70%	слабка

Якщо новачок грає 95%+, це підозріло.

---

# 🔍 3. ENGINE MATCH %

Порівнюємо:

player move == engine move

Якщо >90% матчів з engine — підозріло.

---

# 🚩 4. FLAGS

Система ставить flags:

- High accuracy
- Engine match
- Fast moves
- Suspicious patterns

---

# 👮 5. MODERATION

Модератори перевіряють flagged акаунти.

Функції:

- ban account
- mark as cheater
- review games

UI:
- admin panel
- reports

---

# 📈 6. STATISTICS

Показати статистику:

- Flagged accounts
- Banned accounts
- Accuracy distribution

UI:
- charts
- dashboards`
  },
  {
    id: 12,
    title: "Етап 12: Spectator Mode & Streaming",
    content: `Ти — realtime systems engineer та frontend architect.

Мета: додати режим спостерігача (spectator mode) і live-трансляції партій — як на Chess.com та Lichess.

---

# 🎯 ГОЛОВНА ЦІЛЬ

Користувачі повинні мати можливість:

👀 дивитися партії у реальному часі
💬 коментувати
📊 бачити live evaluation
🏆 дивитися турнірні трансляції

---

# 👁️ 1. SPECTATOR MODE

Будь-який користувач може відкрити сторінку гри:

/game/{gameId}

Якщо гра вже почалась → відкривається режим спостерігача.

---

# ⚡ 2. REALTIME MOVE UPDATES

Використати:

WebSocket
Socket.io

Події:

game_move
game_end
game_chat
spectator_join
spectator_leave

Коли гравець робить хід:

server → broadcast move to spectators

---

# 👥 3. SPECTATORS COUNTER

На сторінці гри показати:

👁️ 128 spectators watching

Це додає ефект популярності.

---

# 💬 4. LIVE CHAT

Під час перегляду партії глядачі можуть писати:

"Great move!"
"Nice tactic!"

UI:
- chat window
- emoji support

---

# 📊 5. LIVE EVALUATION

Показати live оцінку позиції.

Використати:

Stockfish

UI:
- evaluation bar
- best moves

---

# 🏆 6. TOURNAMENT STREAMING

Для турнірів:

- live standings
- current games
- featured game

UI:
- tournament page
- stream section

---

# 🎥 7. RECORDINGS

Після гри:

- зберегти recording
- replay with analysis

UI:
- replay controls`
  },
  {
    id: 13,
    title: "Етап 13: AI Trainer",
    content: `Ти — AI engineer, chess coach та product architect.

Мета: додати штучного інтелектуального тренера, який аналізує партії користувача, пропонує вправи, та допомагає покращувати гру. Це функція на зразок того, що використовують Chess.com та Lichess.

---

# 🎯 ГОЛОВНА ЦІЛЬ

AI Trainer повинен:

Аналізувати партії користувача в реальному часі та після закінчення гри
Виявляти слабкі сторони та типові помилки
Генерувати індивідуальні вправи (тактичні, стратегічні)
Підтримувати рівень прогресу та статистику
Працювати як персональний тренер 24/7

---

# 🧠 1. GAME ANALYSIS

Після кожної гри:

AI оцінює помилки, неточності, блінд-паси
Розбиває партію на сегменти: дебют, середина, ендшпіль
Генерує рейтинг ефективності по кожному сегменту

Приклад оцінки:

Debut: 70%
Middlegame: 55%
Endgame: 80%
Tactics: 60%

---

# 🔍 2. ERROR DETECTION

AI шукає:

Ходи з низьким рейтингом (blunders)
Неточності (inaccuracies)
Пропущені тактичні можливості

Move 17: Bg5 was a blunder (-1.8)
Move 21: Qd2 missed winning tactic (+2.4)

---

# 📈 3. PERSONALIZED EXERCISES

AI генерує завдання:

Тренування тактики
Endgame puzzles
Positional exercises

Наприклад:

Task 1: Mate in 2 (King on g8, Queen on f6)
Task 2: Win a pawn with tactical sequence
Task 3: Improve pawn structure

---

# 🏆 4. TRAINING PLAN

AI створює план навчання:

Тиждень 1: Основи тактики
Тиждень 2: Ендшпіль
Тиждень 3: Стратегія

---

# 📊 5. PROGRESS TRACKING

AI відстежує прогрес:

- Rating improvement
- Error reduction
- Puzzle solving speed
- Streak maintenance

UI:
- progress charts
- achievements

---

# 💬 6. INTERACTIVE COACHING

AI може:

Відповідати на питання
Давати поради
Мотивувати
Пояснювати концепції

Приклад:

User: "Що таке вилка?"
AI: "Вилка — це хід, коли одна фігура атакує дві ворожі фігури одночасно..."

---

# 🎯 7. RECOMMENDATIONS

AI рекомендує:

- Книги для читання
- Відео для перегляду
- Вправи для практики
- Турніри для участі

---

# 📱 8. INTEGRATION

AI інтегрується з:

- Game analysis
- Puzzle trainer
- Lesson system
- Tournament results`
  }
];

type MessageQuality = "great" | "good" | "info" | "inaccuracy" | "mistake" | "blunder";

function getMessageStyle(content: string): MessageQuality {
  const lower = content.toLowerCase();
  if (lower.includes("чудово") || lower.includes("відмінно") || lower.includes("браво") || lower.includes("точно")) return "great";
  if (lower.includes("стоп") || lower.includes("патерн") || lower.includes("помилк")) return "mistake";
  if (lower.includes("грубий") || lower.includes("зевок") || lower.includes("❌")) return "blunder";
  if (lower.includes("⚠️") || lower.includes("неточність")) return "inaccuracy";
  return "info";
}

const qualityColors: Record<MessageQuality, string> = {
  great: "border-l-yellow-400 bg-yellow-400/5",
  good: "border-l-primary bg-primary/5",
  info: "border-l-accent bg-accent/5",
  inaccuracy: "border-l-orange-400 bg-orange-400/5",
  mistake: "border-l-red-300 bg-red-300/5",
  blunder: "border-l-red-500 bg-red-500/5",
};

const QUICK_PROMPTS = [
  {
    icon: Target,
    label: "Find my weak spots",
    prompt: "Help me identify the weakest part of my chess game and suggest what to train first.",
  },
  {
    icon: Brain,
    label: "Explain a tactic",
    prompt: "Explain one important tactical motif in a simple way and give me a small training routine.",
  },
  {
    icon: BookOpen,
    label: "Opening help",
    prompt: "Recommend a practical opening repertoire for an improving club player and explain why.",
  },
  {
    icon: Swords,
    label: "Game review",
    prompt: "Tell me how to review my games effectively and what mistakes I should look for first.",
  },
];

function CoachMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.045] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7f8898]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function CoachCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-[#101923]/82 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7fa650]/12 text-[#bce88e]">{icon}</span>
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CoachEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.09] bg-white/[0.03] p-5 text-sm text-[#9aa4b3]">
      <p className="font-semibold text-white">{title}</p>
      <p className="mt-2 leading-6">{text}</p>
    </div>
  );
}

export default function AITrainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pgnInput, setPgnInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "analysis" | "plan">("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState<null | typeof STAGES[0]>(null);
  const { user } = useAuth();
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !publishableKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "AI Trainer is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable coach responses.",
        },
      ]);
      setIsLoading(false);
      return;
    }

    try {
      const resp = await fetch(
        `${supabaseUrl}/functions/v1/chess-trainer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publishableKey}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Забагато запитів. Спробуй через хвилину." }]);
        } else if (resp.status === 402) {
          setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Необхідно поповнити баланс AI кредитів." }]);
        } else {
          setMessages(prev => [...prev, { role: "assistant", content: "❌ Помилка з'єднання з AI. Спробуй пізніше." }]);
        }
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("AI Trainer error:", e);
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Помилка підключення. Перевір інтернет." }]);
    }

    setIsLoading(false);
  };

  const analyzePGN = () => {
    if (!pgnInput.trim()) return;
    const prompt = `Проаналізуй цю шахову партію в PGN форматі. Розбий аналіз на фази: дебют, міттельшпіль, ендшпіль. Для кожної фази вкажи точність гри, ключові помилки та кращі ходи. Використовуй формат:
Хід X: [нотація]
Оцінка: ⚠️ Неточність / ❌ Помилка / ✅ Найкращий хід
Краще було: [хід + пояснення]

Ось PGN:\n\n${pgnInput}`;
    setActiveTab("chat");
    sendMessage(prompt);
  };

  const generatePlan = () => {
    const prompt = "Склади мені детальний план тренувань на тиждень. Для кожного дня вкажи конкретні завдання з часом виконання. Формат: ТИЖДЕНЬ — [тема] з розбивкою по днях. Адаптуй під мій рівень.";
    setActiveTab("chat");
    sendMessage(prompt);
  };

  const growthState = readGrowthState();
  const growthSummary = buildGrowthSummary(growthState);
  const openMistakes = growthState.mistakeNotebook.filter((entry) => entry.status !== "fixed");
  const dailyPlan = growthState.trainingPlan.filter((item) => !item.completed).slice(0, 4);
  const weakSpots = Array.from(new Set(openMistakes.flatMap((entry) => entry.tags))).slice(0, 5);

  return (
    <div className="min-h-full bg-transparent px-4 py-7 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <main className="space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#101923]/82 p-6 shadow-[0_26px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#7fa650]">Personal AI Coach</p>
                <h1 className="mt-3 text-[38px] font-semibold tracking-[-0.05em] text-white">Daily chess plan</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#aeb7c6]">
                  Your coach turns reviews, mistakes, lessons, and openings into a focused plan for today. Short advice, clear weak spots, no wall of text.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[440px]">
                <CoachMetric label="Reviews" value={growthSummary.reviewCount.toString()} />
                <CoachMetric label="Open mistakes" value={growthSummary.openMistakeCount.toString()} />
                <CoachMetric label="Fixed" value={growthSummary.fixedMistakeCount.toString()} />
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <CoachCard title="Today's tasks" icon={<ListChecks className="h-5 w-5" />}>
              {dailyPlan.length > 0 ? (
                <div className="space-y-3">
                  {dailyPlan.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => sendMessage(`Help me train this task: ${item.title}. ${item.description}`)}
                      className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#7fa650]/35 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{item.title}</p>
                        <span className="rounded-full bg-[#7fa650]/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#c8ef9c]">{item.priority}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#9aa4b3]">{item.description}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <CoachEmpty title="No daily plan yet" text="Run Game Review in Analysis to create mistake-based training tasks." />
              )}
            </CoachCard>

            <CoachCard title="Weak spots" icon={<Target className="h-5 w-5" />}>
              {weakSpots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {weakSpots.map((spot) => (
                    <button
                      key={spot}
                      type="button"
                      onClick={() => sendMessage(`Give me a short drill for my weak spot: ${spot}`)}
                      className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/16"
                    >
                      {spot}
                    </button>
                  ))}
                </div>
              ) : (
                <CoachEmpty title="No weak spots detected" text="Analyze a game first, then the coach will extract themes from mistakes." />
              )}
            </CoachCard>
          </section>

          <CoachCard title="Short advice" icon={<Lightbulb className="h-5 w-5" />}>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                "Review one critical mistake before playing.",
                "Train the opening where you lost tempo.",
                "Keep today focused: one theme, one game, one lesson.",
              ].map((tip) => (
                <div key={tip} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 text-sm leading-6 text-[#c7d0dc]">
                  {tip}
                </div>
              ))}
            </div>
          </CoachCard>
        </main>

        <aside className="flex min-h-[calc(100vh-56px)] flex-col rounded-[32px] border border-white/[0.08] bg-[#0d141d]/88 shadow-[0_26px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
          <div className="border-b border-white/[0.07] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7fa650]/15 text-[#c8ef9c]">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-semibold text-white">Coach chat</h2>
                <p className="text-xs text-[#8792a2]">Ask for a plan, drill, or mistake explanation.</p>
              </div>
            </div>
          </div>

          <div ref={chatRef} className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="space-y-3">
                {[
                  "Create my training plan for today.",
                  "Explain my biggest weakness in one paragraph.",
                  "Give me a 10 minute tactics drill.",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 text-left text-sm text-[#cbd4df] transition hover:border-[#7fa650]/35 hover:bg-white/[0.07]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-8 bg-[#7fa650] text-white"
                      : "mr-8 border border-white/[0.08] bg-white/[0.05] text-[#d8e0eb]"
                  }`}
                >
                  {message.content}
                </div>
              ))
            )}
            {isLoading ? (
              <div className="mr-8 rounded-2xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-[#9aa4b3]">
                Coach is thinking...
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2 border-t border-white/[0.07] p-4"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask the coach..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-[#6f7887] focus:border-[#7fa650]/45"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="rounded-2xl bg-[#7fa650] px-4 text-white hover:bg-[#8fba5c]">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="container max-w-4xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
            <Crown className="text-accent" size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Гросмейстер Макс</h1>
            <p className="text-xs text-muted-foreground">Elo 2650 • Персональний тренер • Chess of Odesa</p>
          </div>
          {isLoading && (
            <div className="ml-auto flex items-center gap-2 text-accent text-xs">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span>Макс аналізує</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="container max-w-4xl pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="chat"><Bot size={14} className="mr-1" /> Чат</TabsTrigger>
            <TabsTrigger value="analysis"><FileText size={14} className="mr-1" /> Аналіз PGN</TabsTrigger>
            <TabsTrigger value="plan"><ListChecks size={14} className="mr-1" /> План тренувань</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText size={16} className="text-accent" /> Аналіз партії
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Встав PGN своєї партії — Гросмейстер Макс проаналізує кожну фазу з рекомендаціями.
              </p>
              <textarea
                value={pgnInput}
                onChange={e => setPgnInput(e.target.value)}
                placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
                className="w-full h-40 bg-secondary rounded-xl p-4 text-sm text-foreground border border-border focus:border-accent/50 focus:outline-none resize-none font-mono"
              />
              <Button onClick={analyzePGN} className="mt-3 bg-accent text-accent-foreground" disabled={!pgnInput.trim() || isLoading}>
                <BarChart3 size={14} className="mr-2" /> Аналізувати
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="plan" className="mt-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-accent" /> План тренувань
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Макс складе персональний план тренувань на основі твого рівня та слабких місць.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Тижневий план", desc: "Детальний план на 7 днів", action: generatePlan },
                  { label: "Аналіз слабкостей", desc: "Визначити проблемні зони", action: () => sendMessage("Проведи діагностику моїх слабких місць як шахіста. Задай мені питання щоб визначити проблемні зони.") },
                  { label: "Турнірна підготовка", desc: "Готуватись до турніру", action: () => sendMessage("Допоможи мені підготуватись до турніру. Розкажи алгоритм підготовки: аналіз суперників, дебюти, режим дня, психологія.") },
                  { label: "Виклик тижня", desc: "Отримати челендж", action: () => sendMessage("Запропонуй мені цікавий шаховий виклик на цей тиждень!") },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => { setActiveTab("chat"); item.action(); }}
                    className="text-left p-4 bg-secondary rounded-xl border border-border hover:border-accent/40 transition-all"
                  >
                    <h4 className="text-sm font-semibold text-foreground">{item.label}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-0" />
        </Tabs>
      </div>

      {/* Chat */}
      {activeTab === "chat" && (
        <>
          <div ref={chatRef} className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
            <div className="container max-w-4xl py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Crown size={32} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1">Привіт! Я Гросмейстер Макс ♟️</h3>
                  <p className="text-sm text-muted-foreground mb-2">Elo 2650 • 20 років тренерського досвіду</p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Разом ми покращимо твою гру. Але спочатку мені потрібно зрозуміти де ти зараз. Обери тему або просто напиши мені.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl mx-auto">
                    {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                      <button
                        key={label}
                        onClick={() => sendMessage(prompt)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border text-sm text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all"
                      >
                        <Icon size={18} className="text-accent" />
                        <span className="text-xs text-center leading-tight">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {messages.map((msg, i) => {
                  const quality = msg.role === "assistant" ? getMessageStyle(msg.content) : "info";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <Crown size={16} className="text-accent" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                        msg.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : `bg-card border border-border border-l-[3px] ${qualityColors[quality]}`
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_li]:mb-0.5 [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_strong]:text-foreground [&_code]:bg-secondary [&_code]:px-1 [&_code]:rounded">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                    <Crown size={16} className="text-accent" />
                  </div>
                  <div className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Гросмейстер Макс аналізує...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
              className="container max-w-4xl flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Запитай Гросмейстера Макса..."
                className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground border border-border focus:border-accent/50 focus:outline-none transition-colors"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-accent text-accent-foreground px-5 rounded-xl"
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
