import { useForm, SubmitHandler } from "react-hook-form";
import Button from "react-bootstrap/Button";
import classnames from "classnames";
import styles from "./styles.module.css";

type Inputs = {
    start_time: string,
    amount: string,
    slot_id?: string,
}

type TAddSlotForm = {
    partner_id?: string,
    slot?: Inputs,
}

export const AddSlotForm = ({ partner_id, slot }: TAddSlotForm) => {
    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        watch,
        reset,
    } = useForm<Inputs>();

    return <form className={styles.form}>
        <h3>Добавить слот</h3>
        <div className={styles.inputs}>
            <label className={styles.input}>
                Время начала*
                <input className={styles.inputArea} {...register("start_time", { required: true })} />
            </label>
            <label className={styles.input}>
                Кол-во мест*
                <input className={styles.inputArea} {...register("amount", { required: true })} />
            </label>
        </div>
        <div className={styles.buttons}>
            <Button
                type="button"
                className={classnames(styles.button)}
                variant="outline-secondary"
                onClick={() => {
                    reset({
                        amount: "",
                        start_time: "",
                    })
                }}
            >
                Отмена
            </Button>
            <Button
                type="submit"
                className={classnames(styles.button)}
                variant="primary"
            >
                Добавить
            </Button>
        </div>
    </form>

}