// @ts-nocheck
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import styles from "./styles.module.css";
import React from "react";
import { useEffect, useState } from "react";
import classnames from "classnames";
import { useLoaderData, useNavigation } from "react-router-dom";
import { EditButton } from "components/buttons/edit-button";
import { getEvents } from "apis/backend";
import { AdminLoader } from "components/loaders/admin-loader";
import "commonStyles.css"
import { AddEventForm } from "./add-event";

export const eventsLoader = async () => {
    const res = await getEvents();
    return res;
}

export const AdminEventsPage = () => {
    const navigation = useNavigation();
    const [modalActive, setModalActive] = useState(false);
    const loaderData = useLoaderData();
    const [eventsList, setEventsList] = useState(loaderData);
    const [editingEvent, setEditingEvent] = useState(null);
    const [loading, setLoading] = useState(!loaderData);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const eventsList = await getEvents();
            setEventsList(eventsList);
            setLoading(false);
        }

        fetchData();
    }, []);

    const eventsListComponent = <div className={styles.table}>
        <div className={classnames(styles.row, styles.titles)}>
            <h3>Партнёр</h3>
            <h3>Название</h3>
            <h3>Крт. описание</h3>
            <h3 className={styles.collapsible}>Полное описание</h3>
            <h3>Возраст</h3>
            <h3>Продол-ть</h3>
            <h3>Слоты</h3>
            <h3></h3>
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
                    <span className={classnames(styles.description, styles.collapsible)}>{event.description}</span>
                    <span>{event.age}</span>
                    <span>{event.duration}</span>
                    <div className={styles.slots}>
                        {event.slots && event.slots.map(slot => {
                            const d = new Date(slot.start_time);
                            const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' });
                            const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                            return <div key={slot.slot_id}>{date} {time} — {slot.available_users ?? '?'}/{slot.amount}</div>;
                        })}
                    </div>
                    <div className={styles.buttons}>
                        <EditButton className="" onClickHandler={() => { setEditingEvent(event); setModalActive(true); }} />
                    </div>
                </div>)
        })}
    </div>

    return (
        <>
            <h1>Мероприятия</h1>
            <hr className={styles.hr} />
            <div className={styles.pageButtons}>
                <span className={!modalActive ? classnames(styles.allEventsButton, styles.activeWindow) : styles.allEventsButton} onClick={() => { setModalActive(false); setEditingEvent(null); }}>Все мероприятия</span>
                <span className={modalActive ? classnames(styles.editEventButton, styles.activeWindow) : styles.editEventButton} >{editingEvent ? `Редактирование: ${editingEvent.title}` : 'Новое мероприятие'}</span>
                {!modalActive && <div className={styles.actionButtons}>
                    <Button
                        className={classnames("outline-primary", styles.addButton)}
                        variant="outline-primary"
                        onClick={() => { setEditingEvent(null); setModalActive(true); }}
                    >
                        Добавить мероприятие
                    </Button>
                </div>}
            </div>
            {(navigation.state === "loading" || loading) ? <AdminLoader /> : modalActive ? <AddEventForm
                key={editingEvent?.event_id ?? 'new'}
                event={editingEvent}
                onCancel={editingEvent ? () => { setModalActive(false); setEditingEvent(null); } : undefined}
                onSuccess={async () => {
                    const eventsList = await getEvents();
                    setEventsList(eventsList);
                    setModalActive(false);
                    setEditingEvent(null);
                }}
            /> : eventsListComponent}
        </>
    )
};
