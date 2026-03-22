import React, { useState, useCallback, useEffect } from "react";
import SlotsForm from "components/SlotsForm";
import Button from "react-bootstrap/Button";
import { addEvent } from "apis/backend";
import styles from "./styles.module.css";
import classnames from "classnames";
import { getPartners } from "apis/backend";
import { useForm, SubmitHandler } from "react-hook-form";
import { AddSlotForm } from "./add-slot";
import { BASE_URL } from "../../../../constants";

type TAddEventFormProps = {
  event?: any,
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

export const AddEventForm = ({ event }: TAddEventFormProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    reset,
  } = useForm<Inputs>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slots, setSlots] = useState<TSlots[] | null>([{
    start_time: "aaa",
    amount: "11",
  }, {
    start_time: "11111",
    amount: "asda"
  },
  {
    start_time: "11111",
    amount: "asda"
  },]);

  const [partnersList, setpartnersList] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const partnersList = await getPartners();
      setpartnersList(partnersList);
    }

    fetchData();
  }, []);

  const handleRegister = async (form: any) => {
    const result = await addEvent(form);
    if (result.ok) {
      alert("Событие добавлено");
      setErrorMessage("Событие успешно добавлено");
      return;
    }

    if (result.status === 422) {
      setErrorMessage("Ошибка в заполнении формы");
      return;
    }

    setErrorMessage(null);
  };

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    handleRegister(data);
  };
  console.log(watch("id_partner"))



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
            <input type="checkbox" className={classnames(styles.inputArea, styles.checkbox)} {...register("is_children", { required: true })} />
          </label>
        </div>
      </div>
      <div className={styles.formBlock}><h3>Партнёр</h3>
        <div className={styles.partners}>{partnersList.map((partner: {
          partner_id: string,
          name: string,
          link: string,
        }) => {
          return <label >
            <input type="radio" value={partner.partner_id} hidden className={styles.radioImg} {...register("id_partner")} />
            <img src={`${BASE_URL}/image/partners/${partner.partner_id}.png`} alt={partner.name} />
          </label>
        })}
        </div>
      </div>
      <div className={classnames(styles.formBlock, styles.slotsBlock)}>
        <h3>Слоты</h3>
        {slots && <div className={styles.tableWrapper}>
          <div className={classnames(styles.row, styles.titles)}>
            <h3>Дата</h3>
            <h3>Время начала</h3>
            <h3>Кол-во мест</h3>
          </div>
          <div className={styles.table}>
            {slots?.map(slot => {
              console.log(slot, "ddd")
              return <div className={styles.row} key={slot.amount}>
                <span>lfnf</span>
                <span>{slot.start_time}</span>
                <span>{slot.amount}</span>
                <div className={styles.buttons}>

                </div>
              </div>
            })}
          </div>

        </div>}
        <AddSlotForm />
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
        onClick={handleRegister}
      >
        Добавить
      </Button>
    </form >
  );
};
