from __future__ import annotations
import logging

import ydb
import ydb.iam

from .config import YDB_ENDPOINT, YDB_DATABASE


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

py_formatter = logging.Formatter("%(name)s %(asctime)s %(levelname)s %(message)s")

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(py_formatter)
logger.addHandler(stream_handler)


def get_event_from_ticket_id(repository: Repository, ticket_id: int):
    return repository.execute("""PRAGMA TablePathPrefix("{}");
    SELECT first_name, title, start_time, ticket.amount AS amount FROM ticket
    INNER JOIN slots
    ON ticket.slot_id = slots.slot_id
    INNER JOIN user
    ON user.user_id = ticket.user_id
    INNER JOIN event
    ON event.event_id = slots.event_id
    WHERE ticket.ticket_id = {}; 
    """.format(YDB_DATABASE, ticket_id), {})[0].rows


def user_came(repository: Repository, ticket_id: int):
    repository.execute("""PRAGMA TablePathPrefix("{}");
    UPDATE ticket
    SET is_come=true
    WHERE ticket_id={}
    """.format(YDB_DATABASE, ticket_id), {})


def get_events_from_phone(repository: Repository, phone: str):
    return repository.execute("""PRAGMA TablePathPrefix("{}");
    SELECT first_name, title, ticket_x.ticket_id AS ticket_id, start_time, ticket_x.amount AS amount
    FROM user VIEW phone_index AS user_x
    INNER JOIN ticket VIEW user_slot_index AS ticket_x ON user_x.user_id = ticket_x.user_id
    INNER JOIN slots ON slots.slot_id = ticket_x.slot_id
    INNER JOIN event ON event.event_id = slots.event_id
    WHERE user_x.phone="{}"
    ORDER BY start_time
    """.format(YDB_DATABASE, phone), {})[0].rows


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
