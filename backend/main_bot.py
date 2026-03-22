from aiogram.utils.executor import start_webhook

from src.app.bot.bot import dp, on_startup, on_shutdown, WEBAPP_HOST, WEBAPP_PORT

if __name__ == "__main__":
    start_webhook(
        dispatcher=dp,
        webhook_path="",
        on_startup=on_startup,
        on_shutdown=on_shutdown,
        skip_updates=True,
        host=WEBAPP_HOST,
        port=WEBAPP_PORT
    )

