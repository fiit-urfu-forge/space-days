import logging

import requests

from .model import SendingLog, MailingData
from .repository import Repository, get_data_mailing, save_mailing
from .config import API_TOKEN
from datetime import datetime, timedelta
import time

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

py_formatter = logging.Formatter("%(name)s %(asctime)s %(levelname)s %(message)s")

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(py_formatter)
logger.addHandler(stream_handler)


def make_beautiful_ticket(ticket: int):
    ticket = str(ticket)
    return f"{ticket[:3]} {ticket[3: 6]} {ticket[6:]}"


def get_noun(number: int, one: str, two: str, five: str) -> str:
    n = abs(number)
    n %= 100
    if 5 <= n <= 20:
        return five
    n %= 10
    if n == 1:
        return one
    if 2 <= n <= 4:
        return two
    return five


def get_datetime_now() -> str:
    return (datetime.now() + timedelta(hours=5)).strftime("%Y-%m-%dT%H:%M:%SZ")


def send_email(
    repository: Repository,
    mailing: MailingData,
):
    """
        Notisend api
        https://notisend.ru/dev/email/api/#TOC_d7a6319e563f08691be55897faac38c2
    """
    headers = {'Authorization': f'Bearer {API_TOKEN}', 'Content-Type': 'application/json'}
    start_time = datetime(1970, 1, 1) + timedelta(seconds=int(mailing.start_time))
    data = {
        "to": mailing.email,
        "payment": "credit_priority",
        "params[first_name]": mailing.first_name,
        "params[last_name]": mailing.last_name,
        "params[ticket]": make_beautiful_ticket(mailing.ticket_id),
        "params[event]": mailing.title,
        "params[date]": start_time.strftime("%d.%m.%Y"),
        "params[time]": start_time.strftime("%H:%M"),
        "params[duration]": f"{mailing.duration} {get_noun(int(mailing.duration), 'минута', 'минуты', 'минут')}",
        "params[address]": mailing.location,
        "params[adult_count]": mailing.adult_count,
        "params[child_count]": mailing.child_count,
    }
    logger.info(f"Send email to {mailing.email}, data {data}, headers {headers}")
    resp = requests.post('https://api.notisend.ru/v1/email/templates/782569/messages', headers=headers, json=data)
    logger.info(resp.json())
    if resp.status_code // 100 != 2:
        logger.critical(f"{resp.status_code} {resp.json()}")
        exit(0)
    save_mailing(repository,
                 SendingLog(mailing_id=mailing.mailing_id, user_id=mailing.user_id, response=str(resp.json()),
                            created_at=get_datetime_now()),
                 mailing.mailing_id)


def main():
    repository = Repository()
    repository.connect()
    mailings = get_data_mailing(repository)
    for mailing in mailings:
        send_email(repository, mailing)
        time.sleep(1)


