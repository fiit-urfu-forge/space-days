import { Container } from "react-bootstrap";
import { padTime, pluralize, formatTicketId, convertDate, convertTime } from "../core";
import Image from "react-bootstrap/Image";


const Ticket = ({ event, slot, ticket }) => {
  const { title, location } = event;
  const dateTime = convertTime(slot.start_time);
  const child = ticket.child;
  const adult = ticket.amount - ticket.child;
  return (
    <Container className="ticket">
      <h1 className="ticket__title">Ваш билет на мероприятие</h1>
      <div className="ticket-wrapper">
        <div>
          <p className="ticket__number">№ {formatTicketId(ticket.ticket_id)}</p>
          <p className="ticket__event">{title}</p>
          <p className="ticket__date">
            <span>Дата: </span>
            {convertDate(dateTime.getDate())}
          </p>
          <p className="ticket__time">
            <span>Время: </span>
            <span className="rounded-pill">
              {`${padTime(dateTime.getHours())}:${padTime(
                dateTime.getMinutes()
              )}`}
            </span>
          </p>
          <p className="ticket__location">
            <span>Адрес: </span>
            {location}
          </p>
          <p className="ticket__seats">
            {`${adult} ${pluralize(adult, 'взрослый', 'взрослых', 'взрослых')}`}, {`${child} ${pluralize(child, 'ребенок', 'детей', 'детей')}`}
          </p>
          <p class="ticket__location">НЕОБХОДИМА СМЕННАЯ ОБУВЬ</p>
          <p className="ticket__info">
            Для того, чтобы пройти на мероприятие — назовите номер билета
          </p>
        </div>
      </div>
      <div className="rounded-pill warning">
        <Image src={require("shared/image/warning.png")} alt="внимание" />
        <p>
          Вся необходимая информация о мероприятии будет выслана на вашу почту
        </p>
      </div>
      <div style={{ textAlign: "center", padding: 20, fontSize: 24 }}>
        <a href="/#/events">Записаться еще</a>
      </div>
    </Container>
  );
};

export default Ticket;
