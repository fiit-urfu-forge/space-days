# План: страница «Все билеты» (`/#/all-tickets`)

## Цель
Отдельная публичная страница (без авторизации), mobile-friendly. Показывает все билеты на все слоты, сгруппированные по мероприятиям. Все данные грузятся **одним запросом** при открытии страницы, переключение между мероприятиями — на клиенте без запросов к API. Билет можно пометить/распометить как использованный (поле `is_come` в таблице `tickets`).

---

## Backend

### 1. Модели ответа

**Файл:** `backend/src/app/domain/model.py` — добавить в конец файла:

```python
class AllTicketInfo(BaseModel):
    ticket_id: int
    first_name: str
    last_name: str
    phone: str
    adults: int        # ticket_amount - children_count
    children: int      # COUNT(childs)
    is_come: bool      # в YDB может быть NULL (билет создаётся без is_come), трактуем NULL как False

class AllSlotWithTickets(BaseModel):
    slot_id: int
    start_time: datetime
    amount: int        # общее кол-во мест в слоте
    tickets: list[AllTicketInfo]

class AllEventWithTickets(BaseModel):
    event_id: int
    title: str
    location: str
    slots: list[AllSlotWithTickets]
```

Плюс модель запроса для check:
```python
class CheckTicketRequest(BaseModel):
    ticket_id: int
    is_come: bool
```

### 2. Эндпоинт `GET /api/tickets/all`

**Файл:** `backend/src/app/endpoints/app.py`

Один YDB-запрос, возвращает плоские строки. Python группирует по event → slot → ticket.

**YDB-запрос** — использует `SOME()` для агрегатов (как в существующем `get_events`).
Группировка по `slots.slot_id, tickets.ticket_id` — чтобы пустые слоты (без билетов) не схлопывались в одну строку:
```sql
PRAGMA TablePathPrefix("{db}");
SELECT
    slots.slot_id AS slot_id,
    tickets.ticket_id AS ticket_id,
    SOME(events.event_id) AS event_id,
    SOME(events.title) AS title,
    SOME(events.location) AS location,
    SOME(slots.start_time) AS start_time,
    SOME(slots.amount) AS amount,
    SOME(tickets.amount) AS ticket_amount,
    SOME(tickets.is_come) AS is_come,
    SOME(users.first_name) AS first_name,
    SOME(users.last_name) AS last_name,
    SOME(users.phone) AS phone,
    COUNT(childs.child_id) AS children_count
FROM slots
INNER JOIN events ON events.event_id = slots.event_id
LEFT JOIN tickets ON tickets.slot_id = slots.slot_id
LEFT JOIN users ON users.user_id = tickets.user_id
LEFT JOIN childs ON childs.user_id = tickets.user_id AND childs.slot_id = tickets.slot_id
GROUP BY slots.slot_id, tickets.ticket_id
ORDER BY event_id, start_time, ticket_id
```

Пустые слоты попадут как строки с `ticket_id = NULL`. При группировке в Python: если `ticket_id is None` → слот без билетов, добавляем с `tickets: []`.

**Группировка в Python** — итерируем строки, собираем dict `{event_id → {slot_id → [tickets]}}`, затем конвертируем в `AllEventWithTickets[]`. Слоты сортируем по `start_time`, мероприятия — по `event_id`.

### 3. Эндпоинт `PUT /api/tickets/check`

**Файл:** `backend/src/app/endpoints/app.py`

Аналог `user_came()` из Telegram-бота (`backend/src/bot/repository.py:33`), но двусторонний.

**Запрос:** `CheckTicketRequest { ticket_id: int, is_come: bool }`

**YDB-запрос** — string formatting как в остальном коде (`"...".format(...)`):
```sql
PRAGMA TablePathPrefix("{db}");
UPDATE tickets SET is_come = {is_come} WHERE ticket_id = {ticket_id}
```

> **Имя таблицы:** бот использует `ticket` (singular), основное приложение — `tickets` (plural). Это разные YDB-базы (бот подключается к своей). В основном приложении таблица называется `tickets` — использовать это имя.

---

## Frontend

### 4. API-функции

**Файл:** `frontend/src/apis/backend.js`

```js
export async function getAllTickets() {
    // GET /api/tickets/all → AllEventWithTickets[]
    // Без offline-режима. Если API_BASE_URL пуст — не вызывается.
}

export async function checkTicket(ticketId, isCome) {
    // PUT /api/tickets/check  body: { ticket_id: ticketId, is_come: isCome }
    // Возвращает { ok, status }
}
```

### 5. Страница `AllTicketsPage`

**Файлы:**
- `frontend/src/pages/all-tickets/index.tsx`
- `frontend/src/pages/all-tickets/styles.module.css`

#### State
```ts
events: AllEventWithTickets[]   // все данные, загружены один раз
selectedEventId: number | null  // null = список мероприятий, number = экран мероприятия
loading: boolean                // начальная загрузка
error: string | null            // ошибка загрузки
```

Переключение мероприятия — `setSelectedEventId()`, без запросов к API.

#### Mobile-first UI — два «экрана» в одном компоненте

**Экран 1 — Список мероприятий** (`selectedEventId === null`):
- Вертикальный список карточек
- Каждая карточка: **название**, место, сводка: «12 / 20 билетов» (сумма по всем слотам)
- Тап → `setSelectedEventId(id)`

**Экран 2 — Мероприятие** (`selectedEventId !== null`):
- Кнопка «← Назад» сверху → `setSelectedEventId(null)`
- Заголовок: название + место
- Слоты — вертикальный список:
  - **Заголовок слота:** время (HH:MM), занято/всего
  - **Список билетов (всегда раскрыт, без аккордеона):**
    - Строка билета: ФИО, телефон (ссылка `tel:`), взрослых/детей
    - Чекбокс «Использован» — тогл `is_come`
    - Если `is_come=true` — строка приглушена (opacity / зелёный бордер)
  - Если слот пустой — текст «Нет регистраций»

#### Поведение чекбокса `is_come`:
1. Пользователь кликает → `checkTicket(ticketId, !currentIsCome)`
2. Оптимистичное обновление: сразу меняем `is_come` в локальном state
3. Если запрос упал → откатываем state, показываем toast/alert с ошибкой
4. Во время запроса чекбокс не блокируется (оптимистичный подход)

#### Прочее:
- Loader (spinner) при начальной загрузке
- При ошибке загрузки — сообщение + кнопка «Повторить»
- Стили: CSS Modules, mobile-first (max-width для десктопа не нужен — страница для мобильного)

### 6. Роутинг

**Файл:** `frontend/src/pages/index.tsx`

```tsx
import { AllTicketsPage } from "./all-tickets";

// В routesConfig — отдельный route без layout (не MainLayout, не AdminLayout):
{
  path: "/all-tickets",
  element: <AllTicketsPage />,
}
```

---

## Порядок реализации

1. `model.py` — модели `AllTicketInfo`, `AllSlotWithTickets`, `AllEventWithTickets`, `CheckTicketRequest`
2. `app.py` — эндпоинт `GET /api/tickets/all` + YDB-запрос + группировка
3. `app.py` — эндпоинт `PUT /api/tickets/check`
4. `backend.js` — функции `getAllTickets()`, `checkTicket(ticketId, isCome)`
5. `all-tickets/index.tsx` + `styles.module.css` — компонент страницы
6. `pages/index.tsx` — маршрут `/all-tickets`

---

## Не входит в скоуп

- Авторизация (страница публичная)
- Фильтрация / поиск по билетам
- Пагинация
- Offline-режим (страница работает только с реальным API)
