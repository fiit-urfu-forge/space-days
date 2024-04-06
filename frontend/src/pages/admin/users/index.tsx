import Button from "react-bootstrap/Button";
import styles from "./styles.module.css";
import React from "react";
import { useEffect, useState } from "react";
import classnames from "classnames";
import { useForm, SubmitHandler } from "react-hook-form";
import { getUsers, deleteAdmin, addAdmin, transferAdmin } from "apis/backend";
import "commonStyles.css"
import { DeleteButton } from "components/buttons/delete-button";
import Cookies from 'js-cookie';

type usersListType = {
    email: string,
    is_owner: boolean,
}

type Inputs = {
    addEmail: string,
    transferEmail: string,
}


export const AdminUsersPage = () => {
    const [usersList, setUsersList] = useState<usersListType[]>([]);
    const { register,
        handleSubmit, } = useForm<Inputs>();
    useEffect(() => {
        const fetchData = async () => {
            const usersList = await getUsers();
            setUsersList(usersList);
        }

        fetchData();
    }, []);

    const handleDelete = async (element_id: string, list: Array<any>, updateList: any) => {
        const result = await deleteAdmin(element_id);
        if (result.ok) {

            const fetchData = async () => {
                const usersList = await getUsers();
                setUsersList(usersList);
            }

            fetchData();
            ;
        };
    };

    const onSubmitAdd: SubmitHandler<Inputs> = async (data) => {
        addAdmin({ email: data.addEmail, is_owner: false });
        const fetchData = async () => {
            const usersList = await getUsers();
            setUsersList(usersList);
        }

        fetchData();
    };

    const onSubmitTransfer: SubmitHandler<Inputs> = async (data) => {
        const currentUser = Cookies.get("email");
        transferAdmin({ email_from: currentUser, email_to: data.transferEmail, });
        const fetchData = async () => {
            const usersList = await getUsers();
            setUsersList(usersList);
        }

        fetchData();
    };

    return (
        <>
            <h1>Администраторы</h1>
            <hr className={styles.hr} />
            <div className={styles.forms}>
                <form onSubmit={handleSubmit(onSubmitAdd)}>
                    <h2 className={styles.h2}>Добавить администратора</h2>
                    <div className={styles.formWrapper}>
                        <label className={styles.input}>
                            Введите почту
                            <input className={styles.inputArea} placeholder="example@yandex.ru" {...register("addEmail")} />
                        </label>
                        <Button
                            type="submit"
                            className={classnames(styles.button)}
                            variant="outline-primary"
                        >
                            Добавить
                        </Button>
                    </div>
                </form>
                <form onSubmit={handleSubmit(onSubmitTransfer)}>
                    <h2 className={styles.h2}>Передать права администратора</h2>
                    <div className={styles.formWrapper}>
                        <label className={styles.input}>
                            Введите почту
                            <input className={styles.inputArea} placeholder="example@yandex.ru" {...register("transferEmail",)} />
                        </label>
                        <Button
                            type="submit"
                            className={classnames(styles.button)}
                            variant="outline-primary"
                        >
                            Передать
                        </Button>
                    </div>
                </form>
            </div>
            <h2 className={styles.h2}>Текущие администраторы</h2>
            <ul className={styles.usersList}>
                {
                    usersList.map(user =>
                        <li className={styles.listItem} key={user.email}><span>{user.email}</span><DeleteButton list={usersList} updateList={setUsersList} deleteHandle={handleDelete} element_id={user.email} /></li>
                    )
                }
            </ul>
        </>
    )
};
