import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Image from "react-bootstrap/Image";
import classnames from "classnames";
import styles from "./styles.module.css"
import tgIcon from "shared/image/tg.png"
import vkIcon from "shared/image/vk.png"
import "commonStyles.css"

export const Footer = () => (
    <Row className={classnames(styles.footer, "justify-content-center")}>
        <Col className={styles.footerCol}>
            <p className={classnames(styles.bold, styles.gray)}>
                Мы в социальных сетях:{" "}
                <span>
                    <a href="https://t.me/+BGVoanm9OLxjNzRi" className={styles.imgLink}>
                        <Image src={tgIcon} alt="telegram" />
                    </a>
                    <a href="https://vk.com/dnikosmosa2023" className={styles.imgLink}>
                        <Image src={vkIcon} alt="vkontakte" />
                    </a>
                </span>
            </p>
            <p className={styles.bot}>
                <a href="#" className={styles.bold}>
                    Телеграм-бот для проверки билетов
                </a>
            </p>
            <p>
                По всем вопросам можете писать в{" "}
                <a href="https://t.me/dni_kosmosa">телеграм-поддержку</a>
            </p>
        </Col>
        <Col xs={12} className={styles.footerCol}>
            <hr />
            <p className={styles.copyright}>© 2023 – {new Date().getFullYear()} ФИИТ</p>
        </Col>
    </Row>
);
