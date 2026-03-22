import styles from "./styles.module.css"
import Button from "react-bootstrap/Button";
import classnames from "classnames";
import "commonStyles.css"
import React, { useState, useRef, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "react-bootstrap/Image";
import plusIcon from "shared/image/plusIcon.svg"
import { EditButton } from "components/buttons/edit-button";
import { addPartner } from "apis/backend";
import { addPartnerLogo } from "apis/backend";
import { getPartners } from "apis/backend";
import { BASE_URL } from "../../../../constants";

type PatnerFormTProps = {
    title: string,
    buttonTitle: string,
    active: boolean,
    setActive: any,
    updateList: any,
    elem?: any,
}

type Inputs = {
    name: string,
    link: string,
    file: any,
}

export const PartnerForm = ({ title, buttonTitle, active, setActive, updateList, elem }: PatnerFormTProps) => {
    const {
        register,
        handleSubmit,
        getValues,
        setValue,
        watch,
        reset,
    } = useForm<Inputs>({
        defaultValues: {
            name: elem ? elem.name : "",
            link: elem ? elem.link : "",
            file: elem ? `${BASE_URL}/image/partners/${elem.partner_id}.png` : null,
        },
    });
    const handleAdd = async (form: Inputs, id?: string) => {
        const result = await addPartnerLogo(form, id);
        addPartner(form, id);
        setActive(false);
        const fetchData = async () => {
            const partnersList = await getPartners();
            updateList(partnersList);
        }

        fetchData();
    };
    const onSubmit: SubmitHandler<Inputs> = (data) => {
        handleAdd(data, elem?.partner_id);
    };
    const [image, setImage] = useState(plusIcon);
    watch("file");

    useEffect(() => {
        reset({
            name: elem ? elem.name : "",
            link: elem ? elem.link : "",
            file: elem ? `${BASE_URL}/image/partners/${elem.partner_id}.png` : null,
        })
    }, [elem]);

    useEffect(() => {
        if (typeof getValues("file") === "string") {
            setImage(getValues("file"))
        }
        else if (getValues("file")?.length) {
            setImage(URL.createObjectURL(getValues("file")[0]))
        }
        else if (elem) {
            setImage(`${BASE_URL}/image/partners/${elem.partner_id}.png`);
        }
        else {
            setImage(plusIcon);
            setValue("file", null);
        }
    }, [getValues("file")])

    const inputFileFields = register("file");

    const { ref } = inputFileFields;

    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleClick = () => {
        inputRef.current?.click();
    };

    return (<div className={active ? classnames(styles.formWrapper, styles.active) : styles.formWrapper}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <h2 className={styles.title}>{title}</h2>
            <hr className={styles.hr} />
            <div className={styles.inputs}>
                <label className={styles.input}>
                    Название*
                    <input className={styles.inputArea} {...register("name", { required: true })} />
                </label>
                <label className={styles.input}>
                    Ссылка*
                    <input className={styles.inputArea} {...register("link", { required: true })} />
                </label>
                <label className={classnames(styles.upload, { [styles.uploaded]: elem || getValues("file") })}>
                    <input type="file" {...register("file", { required: true })} ref={e => {
                        ref(e);
                        inputRef.current = e;
                    }} accept="image/*" hidden />
                    <Image src={image} className={elem || getValues("file") ? styles.logo : styles.plusIcon} />
                    {(elem || getValues("file")) && <EditButton className={styles.editButton} onClickHandler={handleClick} />}
                </label>
            </div>
            <div className={styles.buttons}>
                <Button
                    type="button"
                    className={classnames(styles.button)}
                    variant="outline-secondary"
                    onClick={() => {
                        reset({
                            name: elem ? elem.name : "",
                            link: elem ? elem.link : "",
                            file: elem ? `${BASE_URL}/image/partners/${elem.partner_id}.png` : null,
                        })
                        setActive(false)
                    }}
                >
                    Отмена
                </Button>
                <Button
                    type="submit"
                    className={classnames(styles.button)}
                    variant="primary"
                >
                    {buttonTitle}
                </Button>
            </div>
        </form>
    </div>)
}