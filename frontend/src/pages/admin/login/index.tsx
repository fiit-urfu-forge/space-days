// @ts-nocheck
import "commonStyles.css"
import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../constants";

export const LogInPage = () => {
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        window.YaAuthSuggest.init({
            //client_id: '66680f0be8644a6c8e560993fc0caff7',
            //redirect_uri: 'https://d5d01gtvhjuka0q70t5r.apigw.yandexcloud.net/#/token/',
            client_id: '55e1507cd32e41febc85575068325032',
            redirect_uri: 'https://dnikosmosa-ekb.ru/#/token/',
            response_type: 'token'
        },
            //'https://d5d01gtvhjuka0q70t5r.apigw.yandexcloud.net/#/admin'
            'https://dnikosmosa-ekb.ru/#/admin'
        )
            .then((result) => result.handler())
            .then(async (data) => {
                const response = await fetch(`${API_BASE_URL}/authorize/?token=${data["access_token"]}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (!response.ok) {
                    throw new Error(response.status === 401
                        ? "Пользователь не авторизован"
                        : "Ошибка авторизации");
                }
                window.location.hash = "#/admin/events";
            })
            .catch((error) => {
                console.error('Ошибка авторизации: ', error);
                setError(error.message || "Что-то пошло не так");
            });
    }, []);

    return (
        <>
            {error && <p style={{ color: "red", textAlign: "center", marginTop: "2rem" }}>{error}</p>}
        </>
    );
};
