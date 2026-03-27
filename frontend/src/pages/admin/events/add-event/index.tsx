import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { addEvent } from "apis/backend";
import styles from "./styles.module.css";
import classnames from "classnames";
import { getPartners } from "apis/backend";
import { useForm, SubmitHandler } from "react-hook-form";
import { AddSlotForm } from "./add-slot";
import { BASE_URL } from "../../../../constants";

type TAddEventFormProps = {
  onSuccess?: () => void,
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
  start_time: string,
  amount: string,
}

export const AddEventForm = ({ onSuccess }: TAddEventFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
  } = useForm<Inputs>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slots, setSlots] = useState<TSlots[]>([]);

  const [partnersList, setpartnersList] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const partnersList = await getPartners();
      setpartnersList(partnersList);
    }

    fetchData();
  }, []);

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

    setErrorMessage("Произошла ошибка при добавлении");
  };

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    data.slots = slots;
    handleRegister(data);
  };

  const handleAddSlot = (slot: TSlots) => {
    setSlots(prev => [...prev, slot]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index));
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
              return <div className={styles.row} key={index}>
                <span>{slot.start_time}</span>
                <span>{slot.amount}</span>
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
        <AddSlotForm onAdd={handleAddSlot} />
      </div>
      <div className={styles.formBlock}><h3>Партнёр</h3>
        <div className={styles.partners}>{partnersList.map((partner: {
          partner_id: string,
          name: string,
          link: string,
        }) => {
          return <label key={partner.partner_id}>
            <input type="radio" value={partner.partner_id} hidden className={styles.radioImg} {...register("id_partner")} />
            <img src={`${BASE_URL}/image/partners/${partner.partner_id}.png`} alt={partner.name} />
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
      <Button
        variant="outline-primary"
        type="submit"
        className={styles.saveButton}
      >
        Добавить мероприятие
      </Button>
    </form >
  );
};
