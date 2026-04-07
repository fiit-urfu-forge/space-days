// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import { LinkContainer } from "react-router-bootstrap";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import EventList from "components/EventList";
import { padTime, pluralize, convertDate, convertTime, COSMONAUTICS_DAY } from "core";
import { getEventsByDays, getEventsByHours } from "apis/backend";
import Image from "react-bootstrap/Image";
import Loader from "components/Loader";
import { NotFound } from "components/not-found";

const DEFAULT_EVENT_IMAGE = "./image/planet_3.png";

const STATUS_LOADING = 0;
const STATUS_ERROR = -1;
const STATUS_LOADED = 1;


const dayMap = {
  12: { header: "День Открытия Фестиваля", subheader: "12 апреля, воскресенье", hours: [11, 12, 13, 14, 15] }
};
Object.entries(dayMap).forEach(([k, v]) => { v.date = new Date(COSMONAUTICS_DAY.getFullYear(), COSMONAUTICS_DAY.getMonth(), Number(k)); });

export const EventsPage = () => {
  const { status, content } = useLoading();
  const navigate = useNavigate();
  const handleRegister = useCallback(
    (event, time) => {
      navigate(`/registration?eventId=${event.id}&slotId=${time.slotId}`);
    },
    [status, content]
  );

  const body = renderBody(status, content, handleRegister);

  return (
    <Container
      className="p-0"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {body}
    </Container>
  );
};

function renderBody(status, content, handleRegister) {
  switch (status) {
    case STATUS_LOADING:
      return renderLoading();
    case STATUS_LOADED:
      return renderLoaded(content, handleRegister);
    default:
      return renderError();
  }
}

function renderLoading() {
  return <Loader />;
}

function renderLoaded(content, handleRegister) {
  const { events, day, hour } = content;

  return (
    <>
      <Row className="event-top-info">
        <Col>
          <a href="./">
            <Image src={require("shared/image/arrow.png")} alt="назад" />
          </a>
        </Col>
        <Col>
          <div className="rounded-pill warning warning_event">
            <Image src={require("shared/image/warning.png")} alt="внимание" />
            <p>
              Регистрироваться нужно на <span>каждое</span> мероприятие{" "}
              <span>строго на то время</span>, в которое вы хотите посетить!
            </p>
          </div>
        </Col>
      </Row>
      <Row>
        <Col></Col>
      </Row>
      {renderDayMenu(day)}
      <Row>
        <Col>
          {renderDayTitle(day)}
          <div className="rounded-pill warning warning_event">
            <Image src={require("shared/image/warning.png")} alt="внимание" />
            <p>
              <b>Обратите внимание</b> на{" "}
              <span>время начала и окончания мастер класса.</span>
              <br />
              <b>Проверьте</b>, чтобы мероприятия, на которые вы
              зарегистрировались, <span>не пересекались по времени!</span>
            </p>
          </div>
          <div className="rounded-pill warning warning_event">
            <Image src={require("shared/image/warning.png")} alt="внимание" />
            <p>
              <b>Обратите внимание</b>, мероприятия имеют{" "}
              <span>возрастные ограничения</span>. Вход на мастер классы строго
              в соответствии с ними!
            </p>
          </div>
        </Col>
      </Row >
      {dayMap[day].hours && renderTimeMenu(day, hour, dayMap[day].hours)}
      <Row className="events-row justify-content-between">
        <EventList events={events} onRegister={handleRegister} />
        {dayMap[day].presents && renderPresentCard()}
      </Row>
    </>
  );
}

function renderDayTitle(day) {
  const { header, subheader } = dayMap[day];
  return (
    <>
      <h1 className="day-title">{header}</h1>
      {subheader && <h2 className="day-title_h2">{subheader}</h2>}
    </>
  );
}

function renderPresentCard() {
  return (
    <Col className="event-card present-card" as={"article"}>
      <div className="img-wrapper">
        <Image fluid rounded src={require("shared/image/present_logo.png")}></Image>
      </div>

      <div>
        <h3>Вручение призов</h3>
        <hr></hr>
        <div>
          <span className="event-card__title">Дата:</span>{" "}
          <span className="event-card__title-date">18.04.2026</span>
        </div>
        <div className="">
          <span className="event-card__title">Время:</span>{" "}
          <span>с 13:00 до 16:00</span>
        </div>

        <div className="event-card__location">
          <span className="event-card__title">Адрес:</span>{" "}
          <span>
            {" "}
            Библиотечный Центр «Екатеринбург», ул. Мамина-Сибиряка, 193
          </span>
        </div>
        <p className="event-card__description">
          За каждую 5 собранную наклейку — вручаем подарок. Соберите 15
          наклеек и получите БОЛЬШОЙ ПОДАРОК от Школы астрономии
          KantrSkrip и партнеров!
        </p>
      </div>
      <Button
        disabled={true}
        variant="outline-primary"
        className="rounded-pill event-card__button"
      >
        Вход свободный
      </Button>
    </Col>
  );
}

function renderDayMenu(day) {
  if (Object.keys(dayMap).length < 2){
    return null
  }

  const days = Object.keys(dayMap).map(Number);
  const result = days.map((it, index) => {
    const className = `date-button rounded-pill ${it === day ? "date-button_checked" : ""
      }`;
    return (
      <LinkContainer
        key={index}
        to={{ pathname: "/events", search: `?day=${it}` }}
      >
        <Button className={className} variant="outline-dark">
          {`${it}\u00A0апреля`}
        </Button>
      </LinkContainer>
    );
  });
  return (
    <div
      className="btn-group dates-row row"
      role="group"
      aria-label="Basic radio toggle button group"
    >
      {result}
    </div>
  );
}

function renderTimeMenu(day, hour, hours) {
  return (
    <Row className="time-row">
      {hours.map((h) => {
        const className = `time-button rounded-pill ${h === hour ? "time-button_checked" : ""
          }`;
        return (
          <Col key={h}>
            <LinkContainer
              to={{ pathname: "/events", search: `?day=${day}&hour=${h}` }}
            >
              <Button variant="outline-dark" className={className}>
                {`${padTime(h)}:00`}
              </Button>
            </LinkContainer>
          </Col>
        );
      })}
    </Row>
  );
}

function renderError() {
  return <NotFound />;
}

function useLoading() {
  const { search } = useLocation();
  const query = React.useMemo(() => new URLSearchParams(search), [search]);
  const [status, setStatus] = useState(STATUS_LOADING);
  const [content, setContent] = useState({ events: [], day: null, hour: null });

  useEffect(() => {
    async function run() {
      const dayParameter = query.get("day");
      const hourParameter = query.get("hour");

      const days = Object.keys(dayMap).map(Number);
      const now = new Date(Date.now());
      const today = days.find((d) => dayMap[d].date.getTime() === now.getTime());
      const defaultDay = today ?? days[0];

      const dayParam = dayParameter ? parseInt(dayParameter, 10) : null;
      const day = dayParam && days.includes(dayParam) ? dayParam : defaultDay;

      const hourParam = hourParameter ? parseInt(hourParameter, 10) : null;
      const dayHours = dayMap[day].hours;
      const hour = hourParam && dayHours?.includes(hourParam) ? hourParam : null;

      const backendEvents = hour
        ? await getEventsByHours(day, [hour])
        : await getEventsByDays([day]);
      if (!backendEvents) {
        setStatus(STATUS_ERROR);
        return;
      }

      const events = backendEvents.map((event) => convertEvent(event, day));

      setContent({ events, day, hour });
      setStatus(STATUS_LOADED);
    }

    run();
  }, [query]);

  return { status, content };
}

function convertEvent(backendEvent, dayOfMonthNumber) {
  const date = convertDate(dayOfMonthNumber);
  const backendSlots = backendEvent.slots.filter((s) => {
    return convertTime(s.start_time).getDate() === dayOfMonthNumber;
  });
  const times = backendSlots.map((s) => {
    const d = convertTime(s.start_time);
    const t = {
      time: `${padTime(d.getHours())}:${padTime(d.getMinutes())}`,
      hasSeats: s.available_users > 0,
      seats: s.available_users,
      slotId: s.slot_id,
    };
    return t;
  });
  const hasSeats = times.some((t) => t.hasSeats);
  const image = backendEvent.id_partner
    ? `./image/partners/${backendEvent.id_partner}.png`
    : DEFAULT_EVENT_IMAGE;

  const result = {
    id_partner: backendEvent.id_partner,
    id: backendEvent.event_id,
    title: backendEvent.title,
    image: image,
    hasSeats: hasSeats,
    date: date,
    times: times.sort((a, b) => (a.time > b.time) - (a.time < b.time)),
    age: backendEvent.age,
    duration: `${backendEvent.duration} ${pluralize(
      backendEvent.duration,
      "минута",
      "минуты",
      "минут"
    )}`,
    summary: backendEvent.summary,
    description: backendEvent.description,
    location: backendEvent.location,
  };

  return result;
}
