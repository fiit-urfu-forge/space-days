// @ts-nocheck
import "commonStyles.css"
import { API_BASE_URL } from "../../../constants";

export const LogInPage = () => {
    const widget = () => {
        const fetchData = async () => {
            window.YaAuthSuggest.init({
                client_id: '66680f0be8644a6c8e560993fc0caff7',
                response_type: 'token',
                redirect_uri: 'https://d5d01gtvhjuka0q70t5r.apigw.yandexcloud.net/#/token/'
            },
                'https://d5d01gtvhjuka0q70t5r.apigw.yandexcloud.net/#/admin'
            )
                .then(function (result) {
                    return result.handler()
                })
                .then(function (data) {
                    console.log('Сообщение с токеном: ', data);
                    fetch(`${API_BASE_URL}/authorize/?token=${data["access_token"]}`, {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    })
                    document.body.innerHTML += `Сообщение с токеном: ${JSON.stringify(data)}`;
                })
                .catch(function (error) {
                    console.log('Что-то пошло не так: ', error);
                    document.body.innerHTML += `Что-то пошло не так: ${JSON.stringify(error)}`;
                });
        };

        fetchData();
    };


    return (
        <>
            {widget()}
        </>
    )
};
