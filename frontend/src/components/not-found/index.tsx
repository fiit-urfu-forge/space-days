import { Container } from "react-bootstrap";
import Image from "react-bootstrap/Image";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import errorImage from "shared/image/error.png"
import styles from "./styles.module.css";

export const NotFound = () => {
  return (
    <Container className={styles.error}>
      <Image src={errorImage} alt="космонавт потерял страницу" />
      <h1>Ошибка</h1>
      <p>Ой, страница потерялась в космосе</p>
      <Link to="/">
        <Button
          variant="outline-primary"
          className="rounded-pill align-self-start"
        >
          Вернуться на главную
        </Button>
      </Link>
    </Container>
  );
};
