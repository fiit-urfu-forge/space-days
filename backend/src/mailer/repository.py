from __future__ import annotations
import logging
import ydb
import ydb.iam

from .config import YDB_ENDPOINT, YDB_DATABASE
from .model import MailingData, SendingLog

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

py_formatter = logging.Formatter("%(name)s %(asctime)s %(levelname)s %(message)s")

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(py_formatter)
logger.addHandler(stream_handler)


def get_data_mailing(repository: Repository) -> list[MailingData]:
    mailing_data = repository.execute("""PRAGMA TablePathPrefix("{}");
    SELECT mailing_id, user.user_id AS user_id, first_name, last_name, ticket.ticket_id AS ticket_id, title, email, start_time, duration, location, adult_count, child_count
    FROM mailings VIEW is_send_index AS mailings
    INNER JOIN tickets
    ON ticket.ticket_id=mailings.ticket_id
    INNER JOIN slots
    ON ticket.slot_id = slots.slot_id
    INNER JOIN users
    ON user.user_id = tickets.user_id
    INNER JOIN events
    ON event.event_id = slots.event_id
    WHERE is_send = FALSE
    LIMIT 20;
    """.format(YDB_DATABASE), {})[0].rows
    mailings = []
    for mailing in mailing_data:
        mailings.append(MailingData(**mailing))
    return mailings


def save_mailing(repository: Repository, mailing: SendingLog, mailing_id: str):
    repository.execute("""PRAGMA TablePathPrefix("{}");
        DECLARE $logData AS List<Struct<
            mailing_id: Utf8,
            user_id: Utf8,
            response: Utf8,
            created_at: Utf8>>;

        UPSERT INTO sending_log
        SELECT 
            mailing_id,
            user_id,
            response,
            CAST(created_at AS Datetime) AS created_at
        FROM AS_TABLE($logData);

        UPDATE mailings
        SET is_send=true
        WHERE mailing_id="{}";
    """.format(YDB_DATABASE, mailing_id), {"$logData": [mailing]})


class Repository:
    def __init__(self):
        self.driver = ydb.Driver(endpoint=YDB_ENDPOINT, database=YDB_DATABASE,
                                 credentials=ydb.iam.MetadataUrlCredentials())
        self.pool = ydb.SessionPool(self.driver, size=10)

    def connect(self):
        self.driver.wait(fail_fast=True)
        return self

    def executeOld(self, query: str, data: dict):
        logger.info(query)

        session = self.pool.acquire()
        prepared_query = session.prepare(query)
        result_transaction = session.transaction(ydb.SerializableReadWrite()).execute(
            prepared_query,
            data,
            commit_tx=True,
        )
        self.pool.release(session)
        return result_transaction

    def execute(self, query: str, data: dict):
        def executeInSession(session):
            prepared_query = session.prepare(query)

            ## Пример с явной транзакцией из нескольких запросов
            ## Обязательное условие для выполнения транзакции: сначала все чтения, затем все записи
            ## Пример отсюда: https://github.com/ydb-platform/ydb-python-sdk/blob/main/examples/basic_example_v1/basic_example.py
            # tx = session.transaction(ydb.SerializableReadWrite()).begin()
            # tx.execute(prepared_query, data)
            # tx.commit()

            return session.transaction().execute(
                prepared_query,
                data,
                commit_tx=True)

        logger.info(query)
        result = self.pool.retry_operation_sync(executeInSession)
        return result
