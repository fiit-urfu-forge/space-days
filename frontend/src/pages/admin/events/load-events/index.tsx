import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import { loadEvents } from "apis/backend";
import styles from "./styles.module.css";
import classnames from "classnames";

type TLoadEventsModalProps = {
  eventsFile: any,
  active: boolean,
  setActive: any,
  onSuccess?: () => void,
}

export const LoadEventsModal = ({ eventsFile, active, setActive, onSuccess }: TLoadEventsModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const result = await loadEvents(eventsFile);
      if (result.ok) {
        alert("Файл успешно загружен");
        setActive(false);
        onSuccess?.();
      } else {
        alert("Ошибка при загрузке файла");
      }
    } catch {
      alert("Ошибка при загрузке файла");
    } finally {
      setLoading(false);
    }
  };

  return (<div className={active ? classnames(styles.formWrapper, styles.active) : styles.formWrapper}>
    <div className={styles.form}>
      <h2 className={styles.title}>Подтверждение</h2>
      <hr className={styles.hr} />
      <p>Вы действительно хотите загрузить {eventsFile.name}?</p>
      <div className={styles.buttons}>
        <Button
          type="button"
          className={classnames(styles.button)}
          variant="outline-secondary"
          disabled={loading}
          onClick={() => {
            setActive(false)
          }}
        >
          Отмена
        </Button>
        <Button
          onClick={handleLoad}
          className={classnames(styles.button)}
          variant="primary"
          disabled={loading}
        >
          {loading ? "Загрузка..." : "Загрузить"}
        </Button>
      </div>
    </div>
  </div>);
};
