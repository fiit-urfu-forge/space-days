import React, { useState } from "react";
import Image from "react-bootstrap/Image";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import partnersLinks from "../partnersLinks";
import { pluralize } from "../core";
import { BASE_URL } from "constants";

const EventCard = ({ event, onRegister }) => {
  const [slot, setSlot] = useState(null);
  const handleRegister = () => {
    slot && onRegister && onRegister(event, slot);
  };

  return (
    <Col className="event-card" as={"article"}>
      <a href={partnersLinks[event.id_partner]}>
        <div className="img-wrapper">
          <Image fluid rounded src={`${BASE_URL}/image/partners/${event.id_partner}.png`}></Image>
        </div>
      </a>
      <div>
        <h3>{event.title}</h3>
        <hr></hr>
        <div>
          <span className="event-card__title">Дата:</span>{" "}
          <span className="event-card__title-date">{event.date}</span>
        </div>
        <div className="slots">
          <span className="event-card__title">Время:</span>{" "}
          <div
            className="btn-group slot-times"
            role="group"
            aria-label="Basic radio toggle button group"
          >
            {renderSlots(event.times, slot, setSlot)}
          </div>
        </div>
        <div className="event-card__age">
          <span className="event-card__title">Возраст:</span>{" "}
          <span>{event.age}</span>
        </div>
        <div className="event-card__duration">
          <span className="event-card__title">Продолжительность:</span>{" "}
          <span>{event.duration}</span>
        </div>
        <div className="event-card__location">
          <span className="event-card__title">Место мероприятия:</span>{" "}
          <span>{event.location}</span>
        </div>
        <p
          className="event-card__description"
          dangerouslySetInnerHTML={{ __html: event.description }}
        ></p>
      </div>
      <Button
        disabled={!slot}
        variant="outline-primary"
        className="rounded-pill event-card__button"
        onClick={handleRegister}
      >
        {slot ? "Зарегистрироваться" : "Выберите время"}
      </Button>
    </Col>
  );
};

function renderSlots(times, slot, setSlot) {
  const result = times.sort().map((it, index) => {
    if (!it.hasSeats) {
      return (
        <span
          key={index}
          className="event-card__time time-button rounded-pill time-button_disabled"
        >
          {it.time}
        </span>
      );
    }

    const className = `event-card__time time-button rounded-pill ${it.slotId === (slot && slot.slotId) ? " time-button_checked" : ""
      }`;
    return (
      <span
        key={index}
        className={className}
        data-seats={`осталось ${it.seats} ${pluralize(
          it.seats,
          "место",
          "места",
          "мест"
        )}`}
        onClick={() => setSlot(it)}
      >
        {it.time}
      </span>
    );
  });

  return result;
}

export default EventCard;
