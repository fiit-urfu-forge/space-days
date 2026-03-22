import React, { useState, useCallback, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { loadEvents } from "apis/backend";
import styles from "./styles.module.css";
import classnames from "classnames";

type TLoadEventsModalProps = {
  eventsFile: any,
  active: boolean,
  setActive: any,
}

export const LoadEventsModal = ({ eventsFile, active, setActive }: TLoadEventsModalProps) => {
  const handleLoad = async (eventsFile: any) => {
    const result = await loadEvents(eventsFile);
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
          onClick={() => {
            setActive(false)
          }}
        >
          Отмена
        </Button>
        <Button
          onClick={() => {
            handleLoad(eventsFile);
            setActive(false);
          }}
          className={classnames(styles.button)}
          variant="primary"
        >
          Загрузить
        </Button>
      </div>
    </div>
  </div>);
};
