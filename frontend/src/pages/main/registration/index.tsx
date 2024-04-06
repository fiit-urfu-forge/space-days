// @ts-nocheck
import React, { useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import ParentForm from "components/ParentForm";
import { getEvent, subscribeEvent } from "apis/backend";
import { padTime, pluralize, convertDate, convertTime } from "core";
import Ticket from "components/Ticket";
import Loader from "components/Loader";
import { NotFound } from "components/not-found";

const STATUS_PAGE_LOADING = 0;
const STATUS_PAGE_ERROR = -1;
const STATUS_PAGE_LOADED = 1;
const STATUS_REGISTRATION_LOADING = 2;
const STATUS_REGISTRATION_LOADED = 3;

export const RegistrationPage = () => {
  const { status, event, slot, setStatus } = useEventLoading();
  const [ticket, setTicket] = useState();
  const [form, handleFormChange] = useForm();
  const [errorMessage, setErrorMessage] = useState(null);

  const handleRegister = async () => {
    setStatus(STATUS_REGISTRATION_LOADING);
    const result = await subscribeEvent(slot.slot_id, form);
    if (result.ok) {
      const tt = result.body;
      saveTicket(tt);
      setErrorMessage(null);
      setStatus(STATUS_REGISTRATION_LOADED);
      setTicket(tt);
      saveRegistrationForm(form);
      return;
    }

    if (result.status === 409) {
      const reason =
        result.body && result.body.headers && result.body.headers.reason;
      const amount =
        result.body && result.body.headers && result.body.headers.amount;
      if (reason === "already_registered") {
        setErrorMessage("Вы уже регистрировались на это мероприятие");
      } else if (reason === "no_tickets") {
        const msg = `${pluralize(
          amount,
          "Остался",
          "Осталось",
          "Осталось"
        )} только ${amount} ${pluralize(amount, "билет", "билета", "билетов")}`;
        setErrorMessage(msg);
      } else {
        setErrorMessage("Конфликт при регистрации");
      }
      return;
    }

    if (result.status === 422) {
      setErrorMessage("Ошибка в заполнении формы");
      return;
    }

    if (result.status === 400) {
      const reason =
        result.body && result.body.headers && result.body.headers.reason;
      if (reason === "too more child") {
        setErrorMessage("Добавлено более 3-х детей");
      } else if (reason === "slot not available") {
        setErrorMessage("Время недоступно");
      } else {
        setErrorMessage("Некорретные данные");
      }
      return;
    }

    setErrorMessage(null);
    setStatus(STATUS_PAGE_ERROR);
    setTicket(null);
  };

  switch (status) {
    case STATUS_PAGE_LOADING:
      return renderLoading();
    case STATUS_PAGE_LOADED:
    case STATUS_REGISTRATION_LOADING:
      return renderRegistrationForm(
        status,
        form,
        event,
        slot,
        errorMessage,
        handleFormChange,
        handleRegister
      );
    case STATUS_REGISTRATION_LOADED:
      const ticketString = window.localStorage.getItem("ticket");
      const ticket = ticketString ? JSON.parse(ticketString) : null;
      return renderTicket(event, slot, ticket);
    default:
      return renderError();
  }
};

function renderLoading() {
  return (
    <Container
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <Loader />
    </Container>
  );
}

function renderRegistrationForm(
  status,
  form,
  event,
  slot,
  errorMessage,
  handleFormChange,
  handleRegister
) {
  const { title, location, description, duration, age } = event;
  const dateTime = convertTime(slot.start_time);
  const registrationDisabled =
    !checkFormFilled(form) || status === STATUS_REGISTRATION_LOADING;
  const slotFromEvent = event.slots.filter(
    (s) => s.slot_id === slot.slot_id
  )[0];
  const available = (slotFromEvent && slotFromEvent.available_users) || "0";

  return (
    <Container>
      <Row>
        <Col className="rules">
          <a href="./#/events">
            <Image src={require("shared/image/arrow.png")} alt="назад" />
          </a>
          <div className="rounded-pill warning">
            <Image src={require("shared/image/warning.png")} alt="внимание" />
            <p>
              Регистрировать нужно <span>каждого участника</span>, включая
              детей!
            </p>
          </div>
        </Col>
      </Row>
      <Row className="registration-info">
        <Col className="registration-form">
          <ParentForm form={form} onChange={handleFormChange} />
        </Col>
        <Col className="registration-info__event">
          <h1>{title}</h1>
          <p>
            <span>Дата: </span>
            {convertDate(dateTime.getDate())}
          </p>
          <p>
            <span>Время: </span>
            {`${padTime(dateTime.getHours())}:${padTime(
              dateTime.getMinutes()
            )}`}
          </p>
          <p>
            <span className="event-card__title">Возраст:</span> {age}
          </p>
          <p>
            <span className="event-card__title">Продолжительность:</span>{" "}
            {`${duration} ${pluralize(duration, "минута", "минуты", "минут")}`}
          </p>
          <p>
            <span>Адрес: </span>
            {location}
          </p>
          <p>
            <span>Осталось мест: </span>
            {available}
          </p>
          <p dangerouslySetInnerHTML={{ __html: description }}></p>
        </Col>
      </Row>
      <Row className="registration-info__button">
        <Col>
          <Button
            disabled={registrationDisabled}
            variant="outline-primary"
            type="submit"
            className="rounded-pill d-flex flex-column justify-content-center align-items-center w-100 registration-page__button"
            onClick={handleRegister}
          >
            Зарегистрироваться
          </Button>
        </Col>
      </Row>
      <Row className="mx-4">
        <Col className="d-flex flex-column policy justify-content-center align-items-center w-100">
          <p>
            Нажимая кнопку, вы соглашаетесь с{" "}
            <a href="https://kantrskrip.ru/privacy_policy">
              Политикой конфиденциальности
            </a>{" "}
            и{" "}
            <a href="https://kantrskrip.ru/agreement">
              Пользовательским соглашением
            </a>
            .
          </p>
          <h3
            className={"text-danger"}
            style={{ textAlign: "center", padding: 10 }}
          >
            {errorMessage}
          </h3>
        </Col>
      </Row>
    </Container>
  );
}

function renderTicket(event, slot, ticket) {
  return <Ticket event={event} slot={slot} ticket={ticket} />;
}

function renderError() {
  return <NotFound />;
}

function checkFormFilled(form) {
  const { surname, name, birthdate, phone, email } = form;

  if (
    surname &&
    surname.length > 0 &&
    name &&
    name.length > 0 &&
    birthdate &&
    birthdate.length > 0 &&
    phone &&
    phone.length > 0 &&
    email &&
    email.length > 0
  ) {
    return true;
  }

  return false;
}

function useForm() {
  const savedForm = tryLoadRegistrationForm();
  const defaultForm = {
    surname: "",
    name: "",
    birthdate: "",
    phone: "",
    email: "",
    hasChildren: false,
    children: [
      {
        name: "",
        age: "",
      },
    ],
  };
  const [form, setForm] = useState(savedForm ? savedForm : defaultForm);

  const handleFormChange = useCallback((f) => {
    setForm(f);
  }, []);

  return [form, handleFormChange];
}

function saveTicket(ticket) {
  window.localStorage.setItem("ticket", JSON.stringify(ticket));
}

function saveRegistrationForm(form) {
  window.localStorage.setItem("form", JSON.stringify(form));
  window.localStorage.setItem("searchForm", null);
}

function tryLoadRegistrationForm() {
  try {
    const formString = window.localStorage.getItem("form");
    const form = formString ? JSON.parse(formString) : null;
    return form;
  } catch {
    return null;
  }
}

function useEventLoading() {
  const { search } = useLocation();
  const query = React.useMemo(() => new URLSearchParams(search), [search]);
  const [status, setStatus] = useState(STATUS_PAGE_LOADING);
  const [eventAndSlot, setEventAndSlot] = useState({ event: null, slot: null });

  useEffect(() => {
    async function run() {
      const eventId = parseInt(query.get("eventId"), 10);
      const slotId = parseInt(query.get("slotId"), 10);

      const events = (await getEvent(eventId)) || [];
      const event = events[0];
      if (!event) {
        setStatus(STATUS_PAGE_ERROR);
        return;
      }

      const slot = event.slots.filter((s) => s.slot_id === slotId)[0];
      if (!slot) {
        setStatus(STATUS_PAGE_ERROR);
        return;
      }

      setEventAndSlot({ event, slot });
      setStatus(STATUS_PAGE_LOADED);
    }

    run();
  }, [query]);

  return {
    status,
    event: eventAndSlot.event,
    slot: eventAndSlot.slot,
    setStatus,
  };
}
