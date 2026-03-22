import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import classnames from "classnames";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import hochuIcon from 'shared/image/partners/hochuvnauku-simple.png'
import molodezhIcon from "shared/image/partners/molodeznayapolicy-simple.png"
import styles from "./styles.module.css"
import "commonStyles.css"

export const Header = () => (
  <Row className={classnames(styles.header, "align-items-center justify-content-between")}>
    <Col className={classnames(styles.school, styles.headerCol)}>
      <a href="http://kantrskrip.ru/?utm_source=website&amp;utm_medium=header&amp;utm_campaign=logo">
        <Image width={54} src="/kantrskrip.png"></Image>
      </a>
      <a href="http://kantrskrip.ru/?utm_source=website&amp;utm_medium=header&amp;utm_campaign=logo">
        школа&nbsp;астрономии
      </a>
    </Col>
    <div className={classnames(styles.verticalHr, styles.first)}></div>
    <Col className={classnames(styles.hochuVNauku, styles.headerCol)}>
      <a href="http://kantrskrip.ru/?utm_source=website&amp;utm_medium=header&amp;utm_campaign=logo">
        <Image src={hochuIcon}></Image>
      </a>
      <a href="https://vnauku.ru/">хочу&nbsp;в&nbsp;науку</a>
    </Col>
    <div className={classnames(styles.verticalHr, styles.second)}></div>
    <Col className={classnames(styles.molodeznaya, styles.headerCol)}>
      <a href="http://kantrskrip.ru/?utm_source=website&amp;utm_medium=header&amp;utm_campaign=logo">
        <Image src={molodezhIcon}></Image>
      </a>
      <a href="http://молодежь.екатеринбург.рф">
        Управление&nbsp;молодёжной&nbsp;политики
        администрации&nbsp;города&nbsp;Екатеринбурга
      </a>
    </Col>
    <Col className={classnames(styles.buttonToTickets, styles.headerCol)}>
      <Link to="/tickets">
        <Button variant="outline-primary" className="rounded-pill">
          Найти свой билет*
        </Button>
      </Link>
      <p>*если вы уже зарегистрировались на мероприятие</p>
    </Col>
  </Row>
);
