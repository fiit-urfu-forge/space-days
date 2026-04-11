// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { getAllTickets, checkTicket } from "apis/backend";
import { padTime, formatTicketId } from "core";
import Loader from "components/Loader";
import styles from "./styles.module.css";

const LS_KEY = "all_tickets_access_key";

export const AllTicketsPage = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessKey, setAccessKey] = useState(() => localStorage.getItem(LS_KEY) || "");
  const [authorized, setAuthorized] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keyError, setKeyError] = useState(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const loadData = useCallback(async (key) => {
    setLoading(true);
    setError(null);
    const result = await getAllTickets(key);
    if (result.ok) {
      setEvents(result.body);
      setAuthorized(true);
      setAccessKey(key);
      localStorage.setItem(LS_KEY, key);
    } else if (result.status === 403) {
      localStorage.removeItem(LS_KEY);
      setAccessKey("");
      setAuthorized(false);
    } else {
      setError("Не удалось загрузить данные");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (accessKey) {
      loadData(accessKey);
    } else {
      setLoading(false);
    }
  }, []);

  const handleToggleIsCome = useCallback(
    async (ticketId, currentIsCome) => {
      const newIsCome = !currentIsCome;

      // Optimistic update
      setEvents((prev) =>
        prev.map((event) => ({
          ...event,
          slots: event.slots.map((slot) => ({
            ...slot,
            tickets: slot.tickets.map((ticket) =>
              ticket.ticket_id === ticketId
                ? { ...ticket, is_come: newIsCome }
                : ticket
            ),
          })),
        }))
      );

      const result = await checkTicket(ticketId, newIsCome, accessKey);
      if (!result.ok) {
        // Rollback
        setEvents((prev) =>
          prev.map((event) => ({
            ...event,
            slots: event.slots.map((slot) => ({
              ...slot,
              tickets: slot.tickets.map((ticket) =>
                ticket.ticket_id === ticketId
                  ? { ...ticket, is_come: currentIsCome }
                  : ticket
              ),
            })),
          }))
        );
        alert("Не удалось обновить статус билета");
      }
    },
    [accessKey]
  );

  const handleKeySubmit = useCallback(async (e) => {
    e.preventDefault();
    setKeyError(null);
    setLoading(true);
    const result = await getAllTickets(keyInput);
    if (result.ok) {
      setEvents(result.body);
      setAuthorized(true);
      setAccessKey(keyInput);
      localStorage.setItem(LS_KEY, keyInput);
    } else if (result.status === 403) {
      setKeyError("Неверный ключ");
    } else {
      setKeyError("Ошибка соединения");
    }
    setLoading(false);
  }, [keyInput]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loaderWrap}>
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorWrap}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryButton} onClick={loadData}>
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className={styles.page}>
        <div className={styles.keyFormWrap}>
          <form className={styles.keyForm} onSubmit={handleKeySubmit}>
            <p className={styles.keyFormTitle}>Введите ключ доступа</p>
            <input
              className={styles.keyInput}
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Ключевое слово"
              autoFocus
            />
            {keyError && <p className={styles.keyError}>{keyError}</p>}
            <button className={styles.keyButton} type="submit" disabled={!keyInput.trim()}>
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  const selectedEvent = selectedEventId !== null
    ? events.find((e) => e.event_id === selectedEventId)
    : null;

  if (selectedEvent) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => setSelectedEventId(null)}
          >
            &#8592;
          </button>
          <div>
            <p className={styles.headerTitle}>{selectedEvent.title}</p>
            <p className={styles.headerSubtitle}>{selectedEvent.location}</p>
          </div>
        </div>
        <div className={styles.content}>
          {selectedEvent.slots.map((slot) => (
            <SlotCard
              key={slot.slot_id}
              slot={slot}
              onToggleIsCome={handleToggleIsCome}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <p className={styles.headerTitle}>Все билеты</p>
        </div>
      </div>
      <div className={styles.content}>
        {[...events].sort((a, b) => a.title.localeCompare(b.title)).map((event) => {
          const totalTickets = event.slots.reduce(
            (sum, s) => sum + s.tickets.length,
            0
          );
          const totalAmount = event.slots.reduce(
            (sum, s) => sum + s.amount,
            0
          );
          return (
            <div
              key={event.event_id}
              className={styles.eventCard}
              onClick={() => setSelectedEventId(event.event_id)}
            >
              <p className={styles.eventTitle}>{event.title}</p>
              <p className={styles.eventLocation}>{event.location}</p>
              <p className={styles.eventStats}>
                <span className={styles.eventStatsHighlight}>
                  {totalTickets}
                </span>{" "}
                / {totalAmount} мест
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function SlotCard({ slot, onToggleIsCome }) {
  const startTime = new Date(slot.start_time);
  const timeStr = `${padTime(startTime.getUTCHours())}:${padTime(startTime.getUTCMinutes())}`;
  const bookedCount = slot.tickets.reduce((sum, t) => sum + t.adults + t.children, 0);

  return (
    <div className={styles.slotCard}>
      <div className={styles.slotHeader}>
        <p className={styles.slotTime}>{timeStr}</p>
        <p className={styles.slotCount}>
          {bookedCount} / {slot.amount}
        </p>
      </div>
      {slot.tickets.length === 0 ? (
        <div className={styles.emptySlot}>Нет регистраций</div>
      ) : (
        [...slot.tickets].sort((a, b) => a.ticket_id - b.ticket_id).map((ticket) => (
          <TicketRow
            key={ticket.ticket_id}
            ticket={ticket}
            onToggle={onToggleIsCome}
          />
        ))
      )}
    </div>
  );
}

function TicketRow({ ticket, onToggle }) {
  const phone = formatPhone(ticket.phone);

  return (
    <div
      className={`${styles.ticketRow} ${
        ticket.is_come ? styles.ticketChecked : ""
      }`}
    >
      <div className={styles.ticketInfo}>
        <p className={styles.ticketName}>
          {formatTicketId(ticket.ticket_id)}
        </p>
        <p className={styles.ticketDetails}>
          {ticket.last_name} {ticket.first_name}
          {" \u00b7 "}
          <a href={`tel:+7${ticket.phone}`} className={styles.ticketPhone}>
            {phone}
          </a>
          {" \u00b7 "}
          {ticket.adults} взр.
          {ticket.children > 0 && `, ${ticket.children} дет.`}
        </p>
      </div>
      <button
        className={`${styles.checkbox} ${
          ticket.is_come ? styles.checkboxChecked : ""
        }`}
        onClick={() => onToggle(ticket.ticket_id, ticket.is_come)}
      >
        {ticket.is_come && "\u2713"}
      </button>
    </div>
  );
}

function formatPhone(phone) {
  if (phone.length === 10) {
    return `+7 (${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 8)}-${phone.slice(8)}`;
  }
  return phone;
}
