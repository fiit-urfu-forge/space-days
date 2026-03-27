// @ts-nocheck
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import styles from "./styles.module.css";
import React, { useRef } from "react";
import { useEffect, useState } from "react";
import classnames from "classnames";
import { useLoaderData, useNavigation } from "react-router-dom";
import { EditButton } from "components/buttons/edit-button";
import { DeleteButton } from "components/buttons/delete-button";
import { getEvents, deleteEvent } from "apis/backend";
import { AdminLoader } from "components/loaders/admin-loader";
import { LoadEventsModal } from "./load-events";
import "commonStyles.css"
import { AddEventForm } from "./add-event";

export const eventsLoader = async () => {
    const res = await getEvents();
    return res;
}

export const AdminEventsPage = () => {
    const navigation = useNavigation();
    const inputRef = useRef(null);
    const [file, setFile] = useState();
    const [modalActive, setModalActive] = useState(false);
    const [loadModalActive, setLoadModalActive] = useState(false);
    const [eventsList, setEventsList] = useState(useLoaderData());
    useEffect(() => {
        const fetchData = async () => {
            const eventsList = await getEvents();
            setEventsList(eventsList);
        }

        fetchData();
    }, []);

    const handleDelete = async (element_id) => {
        if (!window.confirm('Удалить мероприятие?')) return;
        const result = await deleteEvent(element_id);
        if (result.ok) {
            const eventsList = await getEvents();
            setEventsList(eventsList);
        }
    };

    const eventsListComponent = <div className={styles.table}>
        <div className={classnames(styles.row, styles.titles)}>
            <h3>Партнёр</h3>
            <h3>Название</h3>
            <h3>Крт. описание</h3>
            <h3>Полное описание</h3>
            <h3>Возраст</h3>
            <h3>Продол-ть</h3>
            <h3>Слоты</h3>
        </div>
        {eventsList && eventsList.map(event => {
            let imgSrc;
            try {
                imgSrc = require(`shared/image/partners/${event.id_partner}.png`);
            }
            catch {
                imgSrc = require(`shared/image/partners/default.png`);
            }
            return (
                <div className={styles.row} id={event.event_id} key={event.event_id}>
                    <Image src={imgSrc} className={styles.logo} />
                    <span>{event.title}</span>
                    <span>{event.summary}</span>
                    <span className={styles.description}>{event.description}</span>
                    <span>{event.age}</span>
                    <span>{event.duration}</span>
                    <div className={styles.slots}>
                        {event.slots && event.slots.map(slot => {
                            const d = new Date(slot.start_time);
                            const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                            const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                            return <div key={slot.slot_id}>{date} {time} — {slot.available_users ?? '?'}/{slot.amount}</div>;
                        })}
                    </div>
                    <div className={styles.buttons}>
                        <DeleteButton element_id={event.event_id} updateList={setEventsList} list={eventsList} deleteHandle={handleDelete} />
                    </div>
                </div>)
        })}
    </div>

    return (
        <>
            <h1>Мероприятия</h1>
            <hr className={styles.hr} />
            {loadModalActive && <LoadEventsModal eventsFile={file} active={loadModalActive} setActive={setLoadModalActive} onSuccess={async () => {
                const eventsList = await getEvents();
                setEventsList(eventsList);
            }} />}
            <input type="file" accept="application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ref={inputRef} hidden
                onChange={e => {
                    setFile(e.target.files[0]);
                    setLoadModalActive(true);
                }}
                onClick={e => e.target.value = null} />
            {!modalActive && <Button
                className={classnames("outline-primary", styles.addButton)}
                variant="outline-primary"
                onClick={() => {
                    inputRef.current.click();
                }}
            >
                Загрузить файл импорта <svg width="14" height="14" viewBox="0 0 14 14" className={styles.icon} fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className={styles.loadIcon} d="M7.38916 0.928528C7.38916 0.591979 7.11633 0.319153 6.77979 0.319153C6.44324 0.319153 6.17041 0.591979 6.17041 0.928528L6.17041 7.92706L3.76969 5.38512C3.5386 5.14044 3.15293 5.12942 2.90825 5.3605C2.66358 5.59159 2.65256 5.97726 2.88364 6.22194L6.33676 9.87819C6.45188 10.0001 6.61213 10.0692 6.77979 10.0692C6.94744 10.0692 7.10769 10.0001 7.22281 9.87819L10.6759 6.22194C10.907 5.97726 10.896 5.59159 10.6513 5.3605C10.4066 5.12942 10.021 5.14044 9.78989 5.38512L7.38916 7.92706L7.38916 0.928528Z" fill="#5E7FD6" />
                    <path className={styles.loadIcon} d="M1.49854 9.05353C1.49854 8.71698 1.22571 8.44415 0.88916 8.44415C0.552612 8.44415 0.279785 8.71698 0.279785 9.05353L0.279785 11.0848C0.279785 12.3188 1.28015 13.3192 2.51416 13.3192L11.0454 13.3192C12.2794 13.3192 13.2798 12.3188 13.2798 11.0848V9.05353C13.2798 8.71698 13.007 8.44415 12.6704 8.44415C12.3339 8.44415 12.061 8.71698 12.061 9.05353V11.0848C12.061 11.6457 11.6063 12.1004 11.0454 12.1004L2.51416 12.1004C1.95325 12.1004 1.49854 11.6457 1.49854 11.0848L1.49854 9.05353Z" fill="#5E7FD6" />
                </svg>
            </Button>}
            {!modalActive && <Button
                className={classnames("outline-primary", styles.addButton)}
                variant="outline-primary"
                onClick={() => setModalActive(true)}
            >
                Добавить мероприятие
            </Button>}
            <div className={styles.pageButtons}>
                <span className={!modalActive ? classnames(styles.allEventsButton, styles.activeWindow) : styles.allEventsButton} onClick={() => { setModalActive(false) }}>Все мероприятия</span>
                <span className={modalActive ? classnames(styles.editEventButton, styles.activeWindow) : styles.editEventButton} >Редактор</span>
            </div>
            {navigation.state === "loading" ? <AdminLoader /> : modalActive ? <AddEventForm onSuccess={async () => {
                const eventsList = await getEvents();
                setEventsList(eventsList);
                setModalActive(false);
            }} /> : eventsListComponent}
        </>
    )
};
