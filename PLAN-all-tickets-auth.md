# План: защита страницы all-tickets ключевым словом

## Общая идея

Страница `/all-tickets` защищается секретным ключевым словом (passphrase). Пользователь вводит его в форму, ключ отправляется на бэкенд через HTTP-заголовок. Бэкенд проверяет ключ и возвращает данные или 403. Валидный ключ сохраняется в `localStorage` для повторных визитов.

---

## 1. Бэкенд

### 1.1. Переменная окружения

**Файл:** `backend/src/app/config.py`

Добавить:
```python
ALL_TICKETS_KEY = os.getenv('ALL_TICKETS_KEY')
```

Значение задаётся в `.env`, `.env.staging`, `.env.production` и в переменных окружения Serverless Container.

### 1.2. Проверка ключа в эндпоинте `GET /api/tickets/all`

**Файл:** `backend/src/app/endpoints/app.py`, функция `get_all_tickets` (~строка 480)

Добавить в начало функции проверку заголовка `X-Access-Key`:

```python
from fastapi import Header, HTTPException

@router.get('/api/tickets/all', response_model=list[model.AllEventWithTickets])
def get_all_tickets(request: Request, x_access_key: str = Header(None)):
    if not ALL_TICKETS_KEY or x_access_key != ALL_TICKETS_KEY:
        raise HTTPException(status_code=403, detail="Invalid access key")
    # ... остальная логика без изменений
```

- Ключ передаётся через заголовок `X-Access-Key`
- Если `ALL_TICKETS_KEY` не задан в env — эндпоинт всегда возвращает 403 (fail-closed)
- Возвращает HTTP 403 при неверном ключе

### 1.3. Защита эндпоинта `PUT /api/tickets/check`

**Файл:** `backend/src/app/endpoints/app.py`, функция `check_ticket` (~строка 540)

Аналогичная проверка `X-Access-Key` — без валидного ключа нельзя менять статус билета.

---

## 2. Фронтенд

### 2.1. API-клиент — передача ключа

**Файл:** `frontend/src/apis/backend.js`

Функции `getAllTickets()` и `checkTicket()` — добавить параметр `accessKey` и заголовок:

```js
export async function getAllTickets(accessKey) {
    // ...
    headers: {
        "Content-Type": "application/json",
        "X-Access-Key": accessKey,
    },
    // ...
}

export async function checkTicket(ticketId, isCome, accessKey) {
    // ...
    headers: {
        "Content-Type": "application/json",
        "X-Access-Key": accessKey,
    },
    // ...
}
```

### 2.2. Страница AllTicketsPage — логика ключа

**Файл:** `frontend/src/pages/all-tickets/index.tsx`

Добавить состояния и логику:

```
localStorage key: "all_tickets_access_key"
```

**Новые состояния:**
- `accessKey: string` — текущее значение ключа (из input или localStorage)
- `authorized: boolean` — прошла ли проверка ключа

**Логика:**
1. При монтировании: читаем ключ из `localStorage`
2. Если ключ есть — вызываем `getAllTickets(key)`
   - Ответ 200 → `authorized = true`, показываем данные
   - Ответ 403 → удаляем ключ из `localStorage`, показываем форму
3. Если ключа нет — показываем форму ввода
4. При отправке формы — вызываем `getAllTickets(inputValue)`
   - Ответ 200 → сохраняем ключ в `localStorage`, `authorized = true`
   - Ответ 403 → показываем ошибку "Неверный ключ"
5. При вызове `checkTicket` — передаём сохранённый `accessKey`

### 2.3. Форма ввода ключа

**Файл:** `frontend/src/pages/all-tickets/index.tsx`

Простая форма (не отдельный компонент):
- Один текстовый input + кнопка "Войти"
- Сообщение об ошибке при неверном ключе
- Центрируется на странице

**Стили** добавить в `frontend/src/pages/all-tickets/styles.module.css`.

---

## 3. Конфигурация окружения

Добавить `ALL_TICKETS_KEY` в:

| Файл / место | Действие |
|---|---|
| `backend/.env.example` | Добавить `ALL_TICKETS_KEY=` |
| `backend/.env` (локальный) | Задать значение для разработки |
| Yandex Cloud Serverless Container (staging) | Задать через переменные контейнера |
| Yandex Cloud Serverless Container (production) | Задать через переменные контейнера |

---

## 4. Порядок реализации

1. **Бэкенд:** config.py — добавить `ALL_TICKETS_KEY`
2. **Бэкенд:** app.py — добавить проверку в `get_all_tickets` и `check_ticket`
3. **Фронтенд:** backend.js — добавить `accessKey` в `getAllTickets` и `checkTicket`
4. **Фронтенд:** index.tsx — добавить форму ввода ключа и логику localStorage
5. **Фронтенд:** styles.module.css — стили для формы
6. **Конфигурация:** .env.example, локальный .env

---

## 5. Что НЕ входит в план

- Ограничение числа попыток (rate limiting) — при необходимости добавляется отдельно
- Шифрование ключа в localStorage — ключ хранится как plaintext (аналогично сессионным токенам)
- Отдельный эндпоинт для проверки ключа — проверка встроена в существующий метод
