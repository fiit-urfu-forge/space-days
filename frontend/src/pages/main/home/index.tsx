// @ts-nocheck
import Container from "react-bootstrap/Container";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Carousel from "components/Carousel";
import InfoList from "components/InfoInNumbers/InfoList";
import info from "components/InfoInNumbers/infoObj";
import PartnerCarousel from "components/PartnerCarousel";
import { LinkContainer } from "react-router-bootstrap";
import { COSMONAUTICS_DAY } from "core";
import styles from "./styles.module.css";
import React from "react";
import "commonStyles.css";

export const HomePage = () => {
  return <Container fluid>
      <Row className={styles.banner}>
        <Col
          className="d-flex flex-column justify-content-center"
          xl={6}
          lg={5}
        >
          <h1>Дни космоса {COSMONAUTICS_DAY.getFullYear()}</h1>
          <p>
            При поддержке Управления молодежной политики администрации города
            Екатеринбурга
          </p>
          <p>Фестиваль бесплатных космических событий в{"\u00A0"}гастромолле{"\u00A0"}<a href="https://glavniy.com/" target="_blank" rel="noopener noreferrer">Главный</a></p>
          <LinkContainer to="/events">
            <Button
              variant="outline-primary"
              className={`${styles.mainButton} rounded-pill align-self-start`}
            >
              Зарегистрироваться
            </Button>
          </LinkContainer>
        </Col>
        <Col
          className="d-flex justify-content-center align-items-center"
          xl={5}
          lg={5}
        >
          <Image fluid rounded src={require("shared/image/banner_pic.png")} />
        </Col>
        <Col>
          <LinkContainer to="/events">
            <Button
              variant="outline-primary"
              className="rounded-pill align-self-start hidden"
            >
              Зарегистрироваться
            </Button>
          </LinkContainer>
        </Col>
      </Row>
      {/* <Row className="about justify-content-center align-items-center" md={4}>
        <InfoList info={info} />
      </Row> */}
      {/* <Row className="present justify-content-center">
        <Col className="d-flex justify-content-center align-items-center">
          <Image fluid rounded src={require("shared/image/present.png")} />
        </Col>
        <Col className="d-flex flex-column justify-content-center">
          <h2>Вас ждут подарки!</h2>
          <ul>
            <li>
              Получи на открытии <b>12 апреля</b> или распечатай флаер
            </li>
            <li>
              Посещай мероприятия на неделе <b>с 13 по 17 апреля</b>
            </li>
            <li>
              Собери не менее <b>5 наклеек</b>
            </li>
            <li>
              Приходи на закрытие{" "}
              <b>
                18 апреля с 13:00 до 16:00 по адресу ул. Мамина-Сибиряка, 193
              </b>{" "}
              и обменяй флаер на призы от партнёров фестиваля
            </li>
          </ul>
        </Col>
      </Row> */}
      {/* <Row className="map justify-content-between">
        <h2>Этапы мероприятия</h2>
        <Col className="map__steps" md={12} lg={5}>
          <span>01</span>
          <Image fluid src={require("shared/image/planet_1.png")} />
          <h3>Расписание</h3>
          <p>
            Перейдите на страницу с расписанием мероприятий
          </p>
        </Col>
        <Col className="map__steps" md={12} lg={5}>
          <span>02</span>
          <Image fluid src={require("shared/image/planet_2.png")} />
          <h3>Регистрация</h3>
          <p>Запишитесь на нужный день и время</p>
        </Col>
        <Col className="map__steps" md={12} lg={3}>
          <span>03</span>
          <Image fluid src={require("shared/image/planet_4.png")} />
          <h3>Мероприятия и призы</h3>
          <p>
            Посетите мероприятия и получите фишки за участие.<br></br>Так у вас
            будет больше шансов выиграть призы
          </p>
        </Col>
      </Row> */}
      <Row className="archive justify-content-center">
        <h2>Предыдущие мероприятия</h2>
        <Carousel year="2023" />
      </Row>
      <Row className="partners d-flex justify-content-center align-items-center gap-1">
        <Col className="title">
          <h2>Партнёры</h2>
        </Col>
        <Col>
          <PartnerCarousel />
        </Col>
      </Row>
  </Container>;
};
