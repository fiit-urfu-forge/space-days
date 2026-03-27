import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import { addEvent, updateEvent, addSlot, deleteSlot } from "apis/backend";
import styles from "./styles.module.css";
import classnames from "classnames";
import { useForm, SubmitHandler } from "react-hook-form";
import { AddSlotForm } from "./add-slot";
import partnerIds from "generated/partners.json";

type TAddEventFormProps = {
  onSuccess?: () => void,
  onCancel?: () => void,
  event?: any | null,
}

type Inputs = {
  description: string,
  location: string,
  summary: string,
  title: string,
  age: string,
  duration: string,
  date: string,
  id_partner: string,
  is_children: boolean,
  slots: TSlots[],
}

type TSlots = {
  slot_id?: number,
  start_time: string,
  amount: string,
  available_users?: number | null,
}

function parseEventDefaults(event: any): { defaults: Partial<Inputs>, slots: TSlots[] } {
  const firstSlot = event.slots?.[0];
  let date = "";
  if (firstSlot?.start_time) {
    const d = new Date(firstSlot.start_time);
    date = d.toISOString().slice(0, 10);
  }

  const slots: TSlots[] = (event.slots || []).map((s: any) => {
    const d = new Date(s.start_time);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return {
      slot_id: s.slot_id,
      start_time: `${hh}:${mm}`,
      amount: String(s.amount),
      available_users: s.available_users,
    };
  });

  return {
    defaults: {
      title: event.title || "",
      summary: event.summary || "",
      description: event.description || "",
      location: event.location || "",
      age: event.age || "",
      duration: event.duration || "",
      date,
      id_partner: event.id_partner || "",
      is_children: event.is_children || false,
    },
    slots,
  };
}

export const AddEventForm = ({ onSuccess, onCancel, event }: TAddEventFormProps) => {
  const isEditMode = !!event;
  const parsed = isEditMode ? parseEventDefaults(event) : null;

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<Inputs>({
    defaultValues: parsed?.defaults || {},
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slots, setSlots] = useState<TSlots[]>(parsed?.slots || []);
  const [removedSlots, setRemovedSlots] = useState<TSlots[]>([]);
  const [saving, setSaving] = useState(false);

  const handleRegister = async (form: any) => {
    if (!form.slots || form.slots.length === 0) {
      setErrorMessage("Необходимо добавить хотя бы один слот");
      return;
    }
    const result = await addEvent(form);
    if (result.ok) {
      alert("Событие добавлено");
      setErrorMessage(null);
      reset();
      setSlots([]);
      onSuccess?.();
      return;
    }

    handleError(result);
  };

  const handleUpdate = async (form: any) => {
    setSaving(true);
    setErrorMessage(null);

    try {
      const eventResult = await updateEvent({
        event_id: event.event_id,
        description: form.description,
        summary: form.summary,
        title: form.title,
        location: form.location,
        age: form.age,
        duration: form.duration,
        id_partner: form.id_partner,
        is_children: form.is_children,
      });

      if (!eventResult.ok) {
        handleError(eventResult);
        return;
      }

      const slotsToDelete = removedSlots.filter(s => s.slot_id);
      const slotsToAdd = slots.filter(s => !s.slot_id);

      const promises = [
        ...slotsToDelete.map(s => deleteSlot(s.slot_id)),
        ...slotsToAdd.map(s => addSlot({
          event_id: event.event_id,
          start_time: `${form.date}T${s.start_time}:00Z`,
          amount: parseInt(s.amount),
        })),
      ];

      await Promise.all(promises);
      alert("Мероприятие обновлено");
      onSuccess?.();
    } catch (e) {
      setErrorMessage("Произошла ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  };

  const handleError = (result: any) => {
    if (result.status === 422) {
      const detail = result.body?.detail;
      const errorMessages: Record<string, string> = {
        "Event must have at least one slot": "Необходимо добавить хотя бы один слот",
      };
      if (typeof detail === "string") {
        setErrorMessage(errorMessages[detail] || detail);
        return;
      }
      if (Array.isArray(detail)) {
        const fieldNames: Record<string, string> = {
          title: "Название",
          summary: "Краткое описание",
          description: "Полное описание",
          location: "Место проведения",
          age: "Возраст",
          duration: "Продолжительность",
          id_partner: "Партнёр",
          is_children: "Можно взрослым",
          slots: "Слоты",
          start_time: "Время начала",
          amount: "Кол-во мест",
        };
        const fields = detail.map((err: any) => {
          const loc = err.loc?.filter((l: any) => l !== "body") ?? [];
          return loc.map((l: string) => fieldNames[l] || l).join(" → ");
        });
        setErrorMessage(`Ошибка в полях: ${fields.join(", ")}`);
      } else {
        setErrorMessage("Ошибка в заполнении формы");
      }
      return;
    }

    setErrorMessage("Произошла ошибка при сохранении");
  };

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    data.slots = slots;
    if (isEditMode) {
      handleUpdate(data);
    } else {
      handleRegister(data);
    }
  };

  const handleAddSlot = (slot: TSlots) => {
    setSlots(prev => [...prev, slot]);
  };

  const handleRemoveSlot = (index: number) => {
    const slot = slots[index];
    if (isEditMode && slot.slot_id) {
      setRemovedSlots(prev => [...prev, slot]);
    }
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleRestoreSlot = (index: number) => {
    const slot = removedSlots[index];
    setRemovedSlots(prev => prev.filter((_, i) => i !== index));
    setSlots(prev => [...prev, slot]);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.addEventForm}>
      <div className={classnames(styles.formBlock, styles.information)}>
        <h3>Информация</h3>
        <label className={styles.input}>
          Название*
          <input className={styles.inputArea} {...register("title", { required: true })} />
        </label>
        <label className={styles.input}>
          Краткое описание*
          <input className={styles.inputArea} {...register("summary", { required: true })} />
        </label>
        <label className={styles.input}>
          Полное описание*
          <textarea className={classnames(styles.inputArea, styles.textArea)} {...register("description", { required: true })} />
        </label>
        <label className={styles.input}>
          Место проведения*
          <input className={styles.inputArea} {...register("location", { required: true })} />
        </label>
        <div className={styles.inputRaw}>
          <label className={styles.input}>
            Возраст*
            <input className={styles.inputArea} {...register("age", { required: true })} />
          </label>
          <label className={styles.input}>
            Продолжительность*
            <input className={styles.inputArea} {...register("duration", { required: true })} />
          </label>
          <label className={styles.input}>
            Дата проведения*
            <input type="date" className={styles.inputArea} {...register("date", { required: true })} />
          </label>
          <label className={styles.input}>
            Можно взрослым
            <input type="checkbox" className={classnames(styles.inputArea, styles.checkbox)} {...register("is_children")} />
          </label>
        </div>
      </div>
      <div className={classnames(styles.formBlock, styles.slotsBlock)}>
        <h3>Слоты</h3>
        {slots.length > 0 && <div className={styles.tableWrapper}>
          <div className={classnames(styles.row, styles.titles)}>
            <h3>Время начала</h3>
            <h3>Кол-во мест</h3>
          </div>
          <div className={styles.table}>
            {slots.map((slot, index) => {
              return <div className={styles.row} key={slot.slot_id ?? `new-${index}`}>
                <span>{slot.start_time}</span>
                <span>
                  {slot.available_users != null
                    ? `${slot.available_users}/${slot.amount}`
                    : slot.amount}
                </span>
                <button
                  type="button"
                  className={styles.deleteSlotButton}
                  onClick={() => handleRemoveSlot(index)}
                  title="Удалить слот"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            })}
          </div>
        </div>}
        {removedSlots.length > 0 && <div className={styles.tableWrapper}>
          <div className={classnames(styles.row, styles.titles, styles.removedTitle)}>
            <h3>Удалённые слоты</h3>
          </div>
          <div className={styles.table}>
            {removedSlots.map((slot, index) => {
              return <div className={classnames(styles.row, styles.removedRow)} key={slot.slot_id}>
                <span className={styles.removedText}>{slot.start_time}</span>
                <span className={styles.removedText}>
                  {slot.available_users != null
                    ? `${slot.available_users}/${slot.amount}`
                    : slot.amount}
                </span>
                <button
                  type="button"
                  className={styles.restoreSlotButton}
                  onClick={() => handleRestoreSlot(index)}
                  title="Вернуть слот"
                >
                  ↩
                </button>
              </div>
            })}
          </div>
        </div>}
        <AddSlotForm onAdd={handleAddSlot} />
      </div>
      <div className={styles.formBlock}><h3>Партнёр</h3>
        <div className={styles.partners}>{partnerIds.map((id: string) => {
          let imgSrc;
          try {
            imgSrc = require(`shared/image/partners/${id}.png`);
          } catch {
            imgSrc = require(`shared/image/partners/default.png`);
          }
          return <label key={id} className={styles.partnerLabel}>
            <input type="radio" value={id} hidden className={styles.radioImg} {...register("id_partner")} />
            <img src={imgSrc} alt={id} />
            <span className={styles.partnerId}>{id}</span>
          </label>
        })}
        </div>
      </div>

      {
        errorMessage ? (
          <h6
            className={"text-danger"}
            style={{ textAlign: "center", padding: 10 }}
          >
            {errorMessage}
          </h6>
        ) : (
          <></>
        )
      }
      <div className={styles.formButtons}>
        {isEditMode && onCancel && (
          <Button
            variant="outline-secondary"
            type="button"
            className={styles.saveButton}
            onClick={onCancel}
          >
            Отмена
          </Button>
        )}
        <Button
          variant="outline-primary"
          type="submit"
          className={styles.saveButton}
          disabled={saving}
        >
          {isEditMode ? "Сохранить изменения" : "Добавить мероприятие"}
        </Button>
      </div>
    </form >
  );
};
