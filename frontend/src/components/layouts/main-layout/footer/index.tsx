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
                    <a href="https://vk.com/dnikosmosa2026" className={styles.imgLink}>
                        <Image src={vkIcon} alt="vkontakte" />
                    </a>
                </span>
            </p>
            <p>
                По всем вопросам можете писать в{" "}
                <a href="https://vk.com/dnikosmosa2026">группу</a>
            </p>
        </Col>
        <Col xs={12} className={styles.footerCol}>
            <hr />
            <p className={styles.copyright}>© 2023 – {new Date().getFullYear()} ФИИТ</p>
        </Col>
    </Row>
);
