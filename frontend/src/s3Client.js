import { S3Client } from "@aws-sdk/client-s3";
import { ACCESS_KEY_ID, SECRET_ACCESS_KEY } from "constants";
// Установка региона Object Storage
const REGION = "ru-central1";
// Установка эндпоинта Object Storage
const ENDPOINT = "https://storage.yandexcloud.net";
// Создание клиента для Object Storage
const s3Client = new S3Client({
    region: REGION, endpoint: ENDPOINT, credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY
    }
});
export { s3Client };