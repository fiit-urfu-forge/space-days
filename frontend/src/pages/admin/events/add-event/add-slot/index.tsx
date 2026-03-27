import { useForm, SubmitHandler } from "react-hook-form";
import Button from "react-bootstrap/Button";
import styles from "./styles.module.css";

type Inputs = {
    start_time: string,
    amount: string,
}

type TAddSlotForm = {
    onAdd: (slot: Inputs) => void,
}

export const AddSlotForm = ({ onAdd }: TAddSlotForm) => {
    const {
        register,
        handleSubmit,
        reset,
    } = useForm<Inputs>();

    const onSubmit: SubmitHandler<Inputs> = (data) => {
        onAdd(data);
        reset({ start_time: "", amount: "" });
    };

    return <div className={styles.form}>
        <div className={styles.inputs}>
            <label className={styles.input}>
                Время начала*
                <input type="time" className={styles.inputArea} {...register("start_time", { required: true })} />
            </label>
            <label className={styles.input}>
                Кол-во мест*
                <input type="number" className={styles.inputArea} {...register("amount", { required: true })} />
            </label>
            <Button
                type="button"
                className={styles.addButton}
                variant="outline-primary"
                size="sm"
                onClick={handleSubmit(onSubmit)}
            >
                Добавить слот
            </Button>
        </div>
    </div>

}
