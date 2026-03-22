// @ts-nocheck
import React, { useState, useCallback } from "react";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import {
  padTime,
  pluralize,
  formatTicketId,
  convertDate,
  convertTime,
} from "core";
import { getMyTickets } from "apis/backend";
import Loader from "components/Loader";
import { NotFound } from "components/not-found";

const STATUS_PAGE_ERROR = -1;
const STATUS_TICKETS_LOADING = 2;
const STATUS_TICKETS_LOADED = 3;

export const TicketsPage = () => {
  const savedSearchForm = tryLoadSearchForm();

  const [form, setForm] = useState({
    phone: (savedSearchForm && savedSearchForm.phone) || "",
    birthdate: (savedSearchForm && savedSearchForm.birthdate) || "",
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const [status, setStatus] = useState(STATUS_TICKETS_LOADED);
  const [tickets, setTickets] = useState([]);

  const handleFormChange = useCallback((f) => {
    setForm(f);
  }, []);

  const handleSubmit = async () => {
    setStatus(STATUS_TICKETS_LOADING);
    const result = await getMyTickets(form.phone, form.birthdate);
    if (result.ok) {
      setErrorMessage(null);
      setStatus(STATUS_TICKETS_LOADED);
      setTickets(result.body || []);
      saveSearchForm(form);
      return;
    }

    if (result.status === 422) {
      setErrorMessage("Ошибка в заполнении формы");
      setStatus(STATUS_TICKETS_LOADED);
      setTickets([]);
      return;
    }

    if (result.status === 404) {
      setErrorMessage("Пользователь не найден");
      setStatus(STATUS_TICKETS_LOADED);
      setTickets([]);
      return;
    }

    setErrorMessage(null);
    setStatus(STATUS_PAGE_ERROR);
    setTickets([]);
  };

  // const autoSubmitRef = useRef(false);
  // if (!autoSubmitRef.current) {
  //   if (checkFormFilled(form)) {
  //     setTimeout(handleSubmit, 0);
  //   }
  //   autoSubmitRef.current = true;
  // }

  if (status === STATUS_PAGE_ERROR) {
    return renderError();
  }
  return (
    <Container
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Row>
        <Col className="rules">
          <a href="./#/events">
            <Image src={require("shared/image/arrow.png")} alt="назад" />
          </a>
          <div className="rounded-pill warning">
            <Image src={require("shared/image/warning.png")} alt="внимание" />
            <p>
              Используйте номер телефона и дату рождения, которые вы указали при
              регистрации!
            </p>
          </div>
        </Col>
      </Row>
      <Container className="tickets-page tickets-page_with-tickets">
        {renderForm(form, status, handleFormChange, handleSubmit)}
        {errorMessage ? (
          <h3
            className={"text-danger"}
            style={{ textAlign: "center", padding: 10 }}
          >
            {errorMessage}
          </h3>
        ) : (
          <></>
        )}
        {status === STATUS_TICKETS_LOADING ? (
          <Loader />
        ) : (
          renderTickets(tickets)
        )}
      </Container>
    </Container>
  );
};

function renderError() {
  return <NotFound />;
}

function renderForm(form, status, handleFormChange, handleShowTickets) {
  const submitDisabled =
    !checkFormFilled(form) || status === STATUS_TICKETS_LOADING;
  return (
    <Form className="tickets-page__form">
      <Form.Group controlId="formPhone">
        <Form.Label>Телефон</Form.Label>
        <Form.Control
          type="tel"
          className="rounded"
          value={form.phone}
          onChange={(event) =>
            handleFormChange({ ...form, phone: event.target.value })
          }
        />
      </Form.Group>
      <Form.Group controlId="formBirthday">
        <Form.Label>Дата рождения</Form.Label>
        <Form.Control
          type="date"
          className="rounded"
          value={form.birthdate}
          onChange={(event) =>
            handleFormChange({ ...form, birthdate: event.target.value })
          }
        />
      </Form.Group>
      <Button
        disabled={submitDisabled}
        variant="outline-primary"
        type="submit"
        className="rounded d-flex flex-column justify-content-center align-items-center"
        onClick={handleShowTickets}
      >
        Показать билеты
      </Button>
    </Form>
  );
}

function renderTickets(tickets) {
  return tickets.map((ticket) => {
    const dateTime = convertTime(ticket.start_time);

    const child = ticket.child;
    const adult = ticket.amount - ticket.child;
    return (
      <div className="ticket-wrapper" key={ticket.ticket_id}>
        <div>
          <p className="ticket__number">№ {formatTicketId(ticket.ticket_id)}</p>
          <p className="ticket__event">{ticket.title}</p>
          <p className="ticket__date">
            <span>Дата: </span>
            {convertDate(dateTime.getDate())}
          </p>
          <p className="ticket__time">
            <span>Время: </span>
            <span className="rounded-pill">{`${padTime(
              dateTime.getHours()
            )}:${padTime(dateTime.getMinutes())}`}</span>
          </p>
          <p className="ticket__location">
            <span>Адрес: </span>
            {ticket.location}
          </p>
          <p className="ticket__seats">
            {`${adult} ${pluralize(adult, "взрослый", "взрослых", "взрослых")}`}
            , {`${child} ${pluralize(child, "ребенок", "детей", "детей")}`}
          </p>
          <p className="ticket__info">
            Для того, чтобы пройти на мероприятие — назовите номер билета
          </p>
        </div>
      </div>
    );
  });
}

function checkFormFilled(form) {
  const { birthdate, phone } = form;

  if (birthdate && birthdate.length > 0 && phone && phone.length > 0) {
    return true;
  }

  return false;
}

function saveSearchForm(searchForm) {
  window.localStorage.setItem("searchForm", JSON.stringify(searchForm));
}

function tryLoadSearchForm() {
  try {
    const registrationFormString = window.localStorage.getItem("form");
    const registrationForm = registrationFormString
      ? JSON.parse(registrationFormString)
      : null;

    const searchFormString = window.localStorage.getItem("searchForm");
    const searchForm = searchFormString ? JSON.parse(searchFormString) : null;

    return searchForm || registrationForm;
  } catch {
    return null;
  }
}
