// @ts-nocheck
import "commonStyles.css"

export const LogInSuppPage = () => {
    const ffn = function () {
        window.YaSendSuggestToken(
            'https://d5d01gtvhjuka0q70t5r.apigw.yandexcloud.net/#/admin',
            {
                flag: true
            }
        )

    }


    return (
        <>
            {ffn()}
        </>
    )
};
