from __future__ import annotations
import ydb
import ydb.iam
from ..config import YDB_DATABASE, YDB_ENDPOINT
from random import randint
from ..domain import model
import logging
from ..core import date_from_ydb_date, date_from_str

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

py_formatter = logging.Formatter("%(name)s %(asctime)s %(levelname)s %(message)s")

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(py_formatter)
logger.addHandler(stream_handler)


class Repository:
    def __init__(self):
        self.driver = ydb.Driver(endpoint=YDB_ENDPOINT, database=YDB_DATABASE,
                                 credentials=ydb.iam.ServiceAccountCredentials.from_file(
                                     'service-key.json'))
        self.pool = ydb.SessionPool(self.driver, size=10)

    def connect(self):
        self.driver.wait(fail_fast=True)
        return self

    def execute(self, query: str, data: dict):
        def execute_in_session(session):
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
        result = self.pool.retry_operation_sync(execute_in_session)
        return result

    def get_count_table(self: Repository, name_table: str) -> int:
        logger.info(name_table)
        return (self.execute("""PRAGMA TablePathPrefix("{}");
        SELECT COUNT(*) as count FROM {}; 
        """.format(YDB_DATABASE, name_table), {}))[0].rows[0].count

    def get_count_available_ticket_by_slot(self: Repository, slot_id: int) -> int:
        result_query = (self.execute("""PRAGMA TablePathPrefix("{}");
        SELECT
            slots.slot_id AS slot_id,
            CAST(SOME(slots.amount) AS Int64) - COALESCE(SUM(tickets.amount), 0) AS available_ticket
        FROM slots LEFT JOIN tickets VIEW slot_id_index AS tickets ON slots.slot_id = tickets.slot_id
        WHERE slots.slot_id={}
        GROUP BY slots.slot_id;
        """.format(YDB_DATABASE, slot_id), {}))[0].rows
        logger.info(result_query)
        for row in result_query:
            return row.available_ticket
        return 0

    def generate_ticket_id(self: Repository) -> int:
        for _ in range(20):
            ticket_number = randint(int(1e8), int(1e9) - 1)
            ticket = self.execute("""PRAGMA TablePathPrefix("{}");
                SELECT * FROM tickets
                WHERE ticket_id = {};
             """.format(YDB_DATABASE, ticket_number), {})[0].rows
            if not ticket:
                return ticket_number
        raise RecursionError("Can`t generate ticket id")

    def is_available_slot(self: Repository, slot_id: int) -> bool:
        return (self.execute("""PRAGMA TablePathPrefix("{}");
            SELECT slot_id FROM slots WHERE slot_id = {};
       """.format(YDB_DATABASE, slot_id), {}))[0].rows

    def is_user_already_registration(self: Repository, slot_id: int, user_id: str) -> bool:
        logger.info(user_id)
        return (self.execute("""PRAGMA TablePathPrefix("{}");
            SELECT * FROM tickets VIEW slot_id_index
            WHERE user_id = "{}" AND slot_id = {};
        """.format(YDB_DATABASE, user_id, slot_id), {}))[0].rows

    def is_children_event(self: Repository, slot_id: int) -> bool:
        event = (self.execute("""PRAGMA TablePathPrefix("{}");
            SELECT is_children
            FROM slots
            INNER JOIN events ON events.event_id = slots.event_id
            WHERE slot_id = {};""".format(YDB_DATABASE, slot_id), {}))[0].rows
        if event:
            return event[0].is_children
        return False

    def save_new_mailing(self: Repository, mailing: model.Mailing) -> None:
        self.execute("""PRAGMA TablePathPrefix("{}");
            DECLARE $mailingData AS List<Struct<
                mailing_id: Utf8,
                adult_count: Int64,
                child_count: Int64,
                ticket_id: Uint64,
                is_send: bool,
                created_at: Utf8>>;

            INSERT INTO mailings
            SELECT 
                mailing_id,
                adult_count,
                child_count,
                ticket_id,
                is_send,
                CAST(created_at AS Datetime) AS created_at
            FROM AS_TABLE($mailingData);
        """.format(YDB_DATABASE), {"$mailingData": [mailing]})

    def save_events(self: Repository, events: list[model.Event], slots: list[model.Slot]) -> None:
        logger.info(events)
        logger.info(slots)
        self.execute("""PRAGMA TablePathPrefix("{}");

        DECLARE $eventData AS List<Struct<
            event_id: Uint64,
            age: Utf8,
            description: Utf8,
            duration: Utf8,
            is_children: bool,
            location: Utf8,
            summary: Utf8,
            title: Utf8,
            id_partner: Utf8>>;

        DECLARE $slotData AS List<Struct<
            slot_id: Uint64,
            event_id: Uint64,
            amount: Uint64,
            start_time: Utf8>>;

        UPSERT INTO events
        SELECT
            event_id,
            age,
            description,
            duration,
            is_children,
            location,
            summary,
            title,
            id_partner
        FROM AS_TABLE($eventData);

        UPSERT INTO slots
        SELECT
            slot_id,
            event_id,
            amount,
            CAST(start_time AS Datetime) AS start_time
        FROM AS_TABLE($slotData);
        """.format(YDB_DATABASE), {"$eventData": events, "$slotData": slots})

    def get_user(self: Repository, phone: str) -> model.User | None:
        user = (self.execute("""PRAGMA TablePathPrefix("{}");
        SELECT * FROM users VIEW phone_index
        WHERE phone = "{}";
        """.format(YDB_DATABASE, phone), {}))[0].rows
        if user:
            logger.info(user[0])
            birthdate = date_from_str(user[0].birthdate_str) if user[0].birthdate_str \
                else date_from_ydb_date(user[0].birthdate)
            return model.User(
                user_id=user[0].user_id,
                first_name=user[0].first_name,
                last_name=user[0].last_name,
                phone=user[0].phone,
                email=user[0].email,
                birthdate=birthdate
            )

    def create_partner(self: Repository, partner: model.Partner) -> None:
        self.execute("""PRAGMA TablePathPrefix("{}");
            DECLARE $partnerData AS List<Struct<
                partner_id: Utf8,
                link: Utf8,
                name: Utf8>>;

            INSERT INTO partners
            SELECT 
                partner_id,
                link,
                name
            FROM AS_TABLE($partnerData);
        """.format(YDB_DATABASE), {"$partnerData": [partner]})

    def update_partner(self: Repository, partner_id: str, partner: model.PartnerRequest) -> None:
        partner_sql = 'PRAGMA TablePathPrefix("{}");\nUPDATE partners\nSET '.format(YDB_DATABASE)
        if partner.name is not None:
            partner_sql += f'name="{partner.name}"'
            if partner.link is not None:
                partner_sql += ", "
        if partner.link is not None:
            partner_sql += f'link="{partner.link}"'
        partner_sql += f'\nWHERE partner_id = "{partner_id}";'
        self.execute(partner_sql, {})

    def delete_partner(self: Repository, partner_id: str) -> None:
        self.execute("""PRAGMA TablePathPrefix("{}");
            DELETE FROM partners
            WHERE partner_id == "{}";ш
        """.format(YDB_DATABASE, partner_id), {})

    def get_partners(self: Repository, partners: list[str] | None) -> list[model.Partner]:
        partner_sql = """PRAGMA TablePathPrefix("{}");
        SELECT * FROM partners
        """.format(YDB_DATABASE)
        if partners:
            partner_sql += f"""WHERE partner_id IN ({', '.join([f'"{partner}"' for partner in partners])})"""
        partner_sql += ';'
        partners_raws = (self.execute(partner_sql, {}))[0].rows
        result_raws = []
        for partner in partners_raws:
            result_raws.append(model.Partner(partner_id=partner.partner_id, link=partner.link, name=partner.name))
        return result_raws

    def get_admin_by_email(self: Repository, email: str) -> list[str]:
        return (self.execute("""PRAGMA TablePathPrefix("{}");
            SELECT DISTINCT email, is_owner FROM admins
            WHERE email = "{}";
        """.format(YDB_DATABASE, email), {}))[0].rows

    def create_admin(self: Repository, admin: model.Admin) -> None:
        self.execute("""PRAGMA TablePathPrefix("{}");
            DECLARE $adminData AS List<Struct<
                email: Utf8,
                is_owner: Bool>>;

            UPSERT INTO admins
            SELECT
                email,
                is_owner
            FROM AS_TABLE($adminData);
        """.format(YDB_DATABASE), {"$adminData": [admin]})

    def list_admin(self: Repository) -> list[model.Admin]:
        admins_rows = (self.execute("""PRAGMA TablePathPrefix("{}");
        SELECT email, is_owner FROM admins
        """.format(YDB_DATABASE), {}))[0].rows
        result_raws = []
        for admin in admins_rows:
            result_raws.append(model.Admin(email=admin.email, is_owner=admin.is_owner))
        return result_raws

    def delete_admin(self: Repository, email: str) -> None:
        self.execute("""PRAGMA TablePathPrefix("{}");
        DELETE FROM admins
        WHERE email = "{}" AND is_owner = false;""".format(YDB_DATABASE, email), {})

    def transfer_owner(self: Repository, admins: list[model.Admin]) -> None:
        self.execute("""PRAGMA TablePathPrefix("{}");
            DECLARE $adminData AS List<Struct<
                email: Utf8,
                is_owner: Bool>>;

            UPSERT INTO admins
            SELECT
                email,
                is_owner
            FROM AS_TABLE($adminData);""".format(YDB_DATABASE), {"$adminData": admins})

    def save_slot(self, body: model.Slot):
        self.execute("""PRAGMA TablePathPrefix("{}");
            DECLARE $slotData AS List<Struct<
                slot_id: Uint64,
                event_id: Uint64,
                amount: Uint64,
                start_time: Utf8>>;
            
            INSERT INTO slots
            SELECT
                slot_id,
                event_id,
                amount,
                CAST(start_time AS Datetime) AS start_time
            FROM AS_TABLE($slotData);""".format(YDB_DATABASE), {"$slotData": [body]})

    def get_max_slot_id(self) -> int:
        return (self.execute("""PRAGMA TablePathPrefix("{}");
        SELECT max(slot_id) as max_slot from slots""".format(YDB_DATABASE), {}))[0].rows[0].max_slot

    def upsert_slot(self, body):
        self.execute("""PRAGMA TablePathPrefix("{}");
            DECLARE $slotData AS List<Struct<
                slot_id: Uint64,
                event_id: Uint64,
                amount: Uint64,
                start_time: Utf8>>;

            UPSERT INTO slots
            SELECT
                slot_id,
                event_id,
                amount,
                CAST(start_time AS Datetime) AS start_time
            FROM AS_TABLE($slotData)""".format(YDB_DATABASE), {"$slotData": [body]})

    def delete_slot(self, slot_id):
        self.execute("""PRAGMA TablePathPrefix("{}");
        DELETE FROM slots
        WHERE slot_id = {};""".format(YDB_DATABASE, slot_id), {})

    def delete_events(self, event_id):
        self.execute("""PRAGMA TablePathPrefix("{}");
        DELETE FROM events
        WHERE event_id = {};
        DELETE FROM slots
        WHERE event_id = {};
        """.format(YDB_DATABASE, event_id, event_id), {})

    def update_events(self, body):
        self.execute("""PRAGMA TablePathPrefix("{}");
        DECLARE $eventData AS List<Struct<
            event_id: Uint64,
            age: Utf8,
            description: Utf8,
            duration: Utf8,
            is_children: bool,
            location: Utf8,
            summary: Utf8,
            title: Utf8,
            id_partner: Utf8>>;
        
        UPSERT INTO events
        SELECT
            event_id,
            age,
            description,
            duration,
            is_children,
            location,
            summary,
            title,
            id_partner
        FROM AS_TABLE($eventData);""".format(YDB_DATABASE), {"$eventData": [body]})

    def delete_database(self):
        self.execute("""PRAGMA TablePathPrefix("{}");
        DELETE FROM events;
        DELETE FROM slots;""".format(YDB_DATABASE), {})

    def get_data(self) -> list[model.InfoEvent]:
        events = self.execute("""PRAGMA TablePathPrefix("{}");
        SELECT DISTINCT email, users.first_name as f_name, last_name as l_name, phone, childs.first_name as name, childs.age as age, slots.start_time as start_time, events.title as title, is_come FROM users
        LEFT JOIN childs ON childs.user_id = users.user_id 
        INNER JOIN tickets ON users.user_id = tickets.user_id
        INNER JOIN slots ON slots.slot_id = tickets.slot_id
        INNER JOIN events ON slots.event_id = events.event_id
        ORDER BY f_name;""".format(YDB_DATABASE), {})[0].rows
        data = list()
        for event in events:
            data.append(model.InfoEvent(
                email=event.email,
                f_name=event.f_name,
                l_name=event.l_name,
                phone=event.phone,
                name=event.name,
                age=event.age,
                start_time=event.start_time,
                title=event.title,
                is_come=event.is_come
            ))
        return data
