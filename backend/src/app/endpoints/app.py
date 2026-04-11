from __future__ import annotations

import logging
import math
import uuid
import requests
import pytz


import pandas as pd

from fastapi import FastAPI, APIRouter, HTTPException, Header, Query, Response, status, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import uvicorn
from datetime import datetime


from ..config import YDB_DATABASE, ALL_TICKETS_KEY
from ..adapters.repository import Repository
from ..core import str_from_date
from ..domain import model
from ..utils.logger import YcLoggingFormatter
from ..utils.datetime_utils import get_datetime_now
import shutil

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(YcLoggingFormatter('%(message)s %(level)s %(logger)s'))
logger.addHandler(stream_handler)

app = FastAPI()
router = APIRouter()


ADD_EVENT_QUERY = """PRAGMA TablePathPrefix("{}");

DECLARE $eventData AS List<Struct<
    event_id: Uint64,
    description: Utf8,
    is_children: bool,
    location: Utf8,
    summary: str,
    title: str>>;

DECLARE $slotData AS List<Struct<
    slot_id: Uint64,
    event_id: Uint64,
    amount: Uint64,
    start_time: Utf8>>;
    
INSERT INTO events
SELECT
    event_id,
    description,
    is_children,
    location,
    summary,
    title
FROM AS_TABLE($eventData);

INSERT INTO slots
SELECT
    slot_id,
    event_id,
    amount,
    CAST(start_time AS Datetime) AS start_time
FROM AS_TABLE($slotData);
"""

ADD_USER_QUERY = """PRAGMA TablePathPrefix("{}");
DECLARE $userData AS List<Struct<
    user_id: Utf8,
    first_name: Utf8,
    last_name: Utf8,
    phone: Utf8,
    birthdate_str: Utf8,
    email: Utf8>>;

DECLARE $childData AS List<Struct<
    child_id: Utf8,
    user_id: Utf8,
    slot_id: Uint64,
    first_name: Utf8,
    age: Uint64>>;

DECLARE $ticketData AS List<Struct<
    ticket_id: Uint64,
    slot_id: Uint64,
    user_id: Utf8,
    amount: Int64,
    user_data: Utf8,
    created_at: Utf8>>;
    
UPSERT INTO users
SELECT
    user_id,
    first_name,
    last_name,
    phone,
    birthdate_str,
    email
FROM AS_TABLE($userData);

INSERT INTO childs
SELECT
    child_id,
    user_id,
    slot_id,
    first_name,
    age
FROM AS_TABLE($childData);

INSERT INTO tickets
SELECT
    ticket_id,
    user_id,
    slot_id,
    amount,
    user_data,
    CAST(created_at AS Datetime) AS created_at
FROM AS_TABLE($ticketData);
"""

GET_USER_EVENTS = """PRAGMA TablePathPrefix("{}");
SELECT
ticket_id,
SOME(ticket_x.amount) AS amount,
SOME(ticket_x.user_id) AS user_id,

SOME(slots.slot_id) AS slot_id,
SOME(start_time) AS start_time,

SOME(events.event_id) AS event_id,
SOME(title) AS title,
SOME(location) AS location,
SOME(events.age) AS age,
SOME(duration) AS duration,

COUNT(child_id) AS child


FROM tickets VIEW user_slot_index AS ticket_x
INNER JOIN slots ON slots.slot_id = ticket_x.slot_id
INNER JOIN events ON events.event_id = slots.event_id
LEFT JOIN childs VIEW user_slot_index AS child_x ON child_x.slot_id = ticket_x.slot_id AND child_x.user_id = ticket_x.user_id

WHERE ticket_x.user_id = "{}"

GROUP BY ticket_x.ticket_id AS ticket_id
ORDER BY start_time
"""


def timestamp_to_str(start_time):
    logger.info("Start time", start_time)
    return f"{start_time.year}-{start_time.month}-{start_time.day}T{start_time.hour}:{start_time.minute}:{start_time.second}Z"


def get_data(filename: str) -> tuple[list[model.Event], list[model.Slot]]:
    data = pd.read_excel(filename)
    events = []
    slot_counter = 0
    slots = []
    for index, row in data.iterrows():
        logger.info(row)
        print(row['Продолжительность'], type(row['Продолжительность']))
        event = model.Event(
            event_id=row['id'],
            description=row['Полное описание'],
            summary=row['Краткое описание'],
            title=row['Название мероприятия'],
            location=row['Место мероприятия'],
            age=row['Возраст участников'],
            duration=str(row['Продолжительность']),
            id_partner=row['ID партнера'],
            is_children=row['Только для детей'] == 'да'
        )

        slots_1 = [model.Slot(event_id=row['id'], slot_id=slot_counter,
                        start_time=timestamp_to_str(row['Время начала']), amount=row['количество людей в определенный слот'])]
        slot_counter += 1
        for i in range(1, 12):
            amount = row[f'количество людей в определенный слот.{i}']

            start_time = row[f'Время начала.{i}']
            if not math.isnan(amount) and not pd.isnull(start_time):
                slots_1.append(
                    model.Slot(event_id=row['id'], slot_id=slot_counter,
                         start_time=timestamp_to_str(start_time), amount=amount))
                slot_counter += 1
            else:
                break
        slots.extend(slots_1)
        logger.info(slots)
        nan = "nan"
        if event.event_id == nan or event.description == nan or event.summary == nan or event.title == nan or event.location == nan or event.age == nan or event.duration == nan or event.is_children == nan or event.is_children == nan:
            logger.info(event)
        events.append(event)
    return events, slots


@router.get("/api/test")
def test():
    return "Hello, senya"


@router.post("/api/emails/subscribe", status_code=status.HTTP_201_CREATED)
def add_email(request: Request, email: model.EmailRequest, response: Response):
    repository: Repository = request.app.repository
    email_id = repository.get_count_table("emails")
    emails = (repository.execute("""PRAGMA TablePathPrefix("{}");
        SELECT * FROM emails
        WHERE email = '{}';
    """.format(YDB_DATABASE, email.email), {}))[0].rows
    if emails:
        response.status_code = status.HTTP_200_OK
        return
    repository.execute(
        """PRAGMA TablePathPrefix("{}");
        DECLARE $emailData AS List<Struct<
            id: Uint64,
            email: Utf8>>;
        
        INSERT INTO emails
        SELECT
            id,
            email
        FROM AS_TABLE($emailData);
        """.format(YDB_DATABASE),
        {
            "$emailData": [model.Email(id=email_id, email=email.email)]
        }
    )


@router.get("/api/events/", response_model=list[model.EventRequest])
def get_events(request: Request, id: int | None = None, days: list[int] | None = Query(None),
               hours: list[int] | None = Query(None)):
    logger.info(f"Get events, id: {id}, days: {days}, hours: {hours}")
    repository: Repository = request.app.repository

    slots_view = "slots"
    ticket_view = "tickets"
    if days or hours:
        slots_view = "slots VIEW start_time_index AS slots"
        ticket_view = "tickets VIEW slot_id_index AS tickets"
    if id is not None:
        slots_view = "slots VIEW event_id_index AS slots"
        ticket_view = "tickets VIEW slot_id_index AS tickets"

    query = """PRAGMA TablePathPrefix("{}");
    SELECT
        slots.slot_id AS slot_id,
        SOME(slots.start_time) AS start_time,
        SOME(slots.amount) AS amount,
        CAST(SOME(slots.amount) AS Int64) - COALESCE(SUM(tickets.amount), 0) AS available_ticket,
        SOME(events.event_id) AS event_id,
        SOME(events.age) AS age,
        SOME(events.description) AS description, 
        SOME(events.duration) AS duration,
        SOME(events.id_partner) AS id_partner,
        SOME(events.is_children) AS is_children,
        SOME(events.location) AS location,
        SOME(events.summary) AS summary,
        SOME(events.title) AS title
    FROM {} LEFT JOIN {} ON slots.slot_id = tickets.slot_id
    INNER JOIN events ON events.event_id = slots.event_id\n""".format(YDB_DATABASE, slots_view, ticket_view)

    if id is not None or days or hours:
        query += " WHERE "
    if id is not None:
        query += "\tevents.event_id = {}\n".format(id)
    if days:
        if id is not None:
            query += " AND "
        query += "DateTime::GetDayOfMonth(slots.start_time) IN {}\n".format(days)
    if hours:
        if id is not None or days:
            query += " AND "
        query += "DateTime::GetHour(slots.start_time) IN {}\n".format(hours)
    query += "\tGROUP BY slots.slot_id ORDER BY event_id, start_time;"

    result_sets = repository.execute(query, {})

    event_id = 0
    result = []
    event = model.EventRequest(
        event_id=0,
        description='',
        location='',
        summary='',
        title='',
        id_partner='',
        slots=[model.SlotRequest(slot_id=0, start_time=datetime.now(), amount=0, available_users=None)])
    for row in result_sets[0].rows:
        if event_id != row.event_id:
            event_id = row.event_id
            result.append(event)
            event = model.EventRequest(slots=[], **row)
        event.slots.append(model.SlotRequest(
            slot_id=row.slot_id,
            amount=row.amount,
            start_time=datetime.utcfromtimestamp(row.start_time).replace(tzinfo=pytz.utc),
            available_users=row.available_ticket))

    result.append(event)
    result.pop(0)
    result.sort(key=lambda x: x.slots[0].start_time)
    logger.info(f"Get events success\nresult: {result}")
    return result  # TODO: return is_available_child


def refactor_phone(phone: str) -> str:
    correct_phone = ''
    for char in phone:
        if char.isdigit():
            correct_phone += char
    if len(correct_phone) == 10:
        return correct_phone
    if len(correct_phone) == 11 and correct_phone[0] in '78':
        return correct_phone[1:]
    raise TypeError


@router.post('/api/events/subscribe')
def add_user(request: Request, user_request: model.UserRequest, response: Response, force_registration: bool = False):
    logging.info(f"Add registration, user: {user_request}, force_registration: {force_registration}")
    repository: Repository = request.app.repository
    user_response = user_request.__repr__()
    childs = user_request.child or []
    try:
        phone = refactor_phone(user_request.phone)
    except TypeError:
        response.status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        logger.warning(f"Invalid phone: {user_request.phone}", exc_info=True)
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='invalid phone')
    if len(childs) > 3:
        response.status_code = status.HTTP_400_BAD_REQUEST
        logger.warning(f"Count child: {len(childs)} > 3")
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                             detail='too more child',
                             headers={'reason': 'too more child'})
    if not repository.is_available_slot(slot_id=user_request.slot_id):
        response.status_code = status.HTTP_400_BAD_REQUEST
        logger.warning(f"Slot not exists {user_request.slot_id}")
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                             detail='slot not available',
                             headers={'reason': 'slot not available'})
    old_user = repository.get_user(phone)
    logger.info(old_user)
    if old_user and repository.is_user_already_registration(user_request.slot_id, old_user.user_id):
        if not force_registration:
            response.status_code = status.HTTP_409_CONFLICT
            logger.warning(f"User {old_user.user_id} already registered on slot {user_request.slot_id}")
            return HTTPException(status_code=status.HTTP_409_CONFLICT, detail='user already registered',
                                 headers={'reason': 'already_registered'})
    is_child_event = repository.is_children_event(user_request.slot_id)
    booked_tickets = max(len(childs) + (not is_child_event), 1)
    slot_id = user_request.slot_id

    user_n = str(uuid.uuid4())
    if old_user:
        user_n = old_user.user_id
    children = []
    for child in childs:
        children.append(model.Child(
            child_id=str(uuid.uuid4()),
            user_id=user_n,
            slot_id=user_request.slot_id,
            first_name=child.first_name,
            age=child.age,
        ))
    ticket = model.Ticket(
        ticket_id=repository.generate_ticket_id(),
        user_id=user_n,
        slot_id=user_request.slot_id,
        amount=booked_tickets,
        user_data=user_response,
        created_at=get_datetime_now(),
    )
    user = model.UserToSave(
        user_id=user_n,
        first_name=user_request.first_name,
        last_name=user_request.last_name,
        phone=phone,
        birthdate_str=str_from_date(user_request.birthdate),
        email=user_request.email,
    )

    available_ticket = repository.get_count_available_ticket_by_slot(slot_id)
    if available_ticket < booked_tickets:
        logger.warning(f'available ticket {available_ticket} < booked ticket {booked_tickets}')
        response.status_code = status.HTTP_409_CONFLICT
        return HTTPException(status_code=status.HTTP_409_CONFLICT,
                             detail=f'available ticket {available_ticket} '
                                    f'< booked ticket {booked_tickets}',
                             headers={'reason': 'no_tickets', 'amount': available_ticket})

    logger.info(f"children: {children}, user: {user}, ticket: {ticket}")

    # TODO Дополнительная проверка доступности места должна быть частью транзакции по подписке
    repository.execute(ADD_USER_QUERY.format(YDB_DATABASE),
                       {
                           "$childData": children,
                           "$userData": [user],
                           "$ticketData": [ticket],
                       })
    logger.info("Success subscription")

    repository.save_new_mailing(model.Mailing(
        mailing_id=str(uuid.uuid4()),
        child_count=len(childs),
        adult_count=ticket.amount - len(childs),
        ticket_id=ticket.ticket_id,
        is_send=False,
        created_at=get_datetime_now(),
    ))
    logger.info("Success mailing")

    return model.TicketResponse(
        ticket_id=ticket.ticket_id,
        user_id=ticket.user_id,
        slot_id=ticket.slot_id,
        amount=ticket.amount,
        user_data=ticket.user_data,
        child=len(childs),
    )


@router.post('/api/event')
def save_event(request: Request, body: model.EventJson):
    logger.info("run")
    if not body.slots:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Event must have at least one slot")
    repository: Repository = request.app.repository
    count_event = repository.get_count_table("events") + 2
    count_slots = repository.get_count_table("slots")
    logger.info(count_event, count_slots)
    event = model.Event(event_id=count_event, **body.model_dump())
    slots = []
    for slot_id, slot in enumerate(body.slots):
        slots.append(model.Slot(slot_id=count_slots + slot_id, event_id=count_event, **slot.dict()))
    try:
        repository.save_events([event], slots)
    except Exception as e:
        logger.error(f"Failed to save event: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save event")
    return {"event_id": count_event}


GET_ALL_TICKETS_QUERY = """PRAGMA TablePathPrefix("{}");
SELECT
    slots.slot_id AS slot_id,
    tickets.ticket_id AS ticket_id,
    SOME(events.event_id) AS event_id,
    SOME(events.title) AS title,
    SOME(events.location) AS location,
    SOME(slots.start_time) AS start_time,
    SOME(slots.amount) AS amount,
    SOME(tickets.amount) AS ticket_amount,
    SOME(tickets.is_come) AS is_come,
    SOME(users.first_name) AS first_name,
    SOME(users.last_name) AS last_name,
    SOME(users.phone) AS phone,
    COUNT(childs.child_id) AS children_count
FROM slots
INNER JOIN events ON events.event_id = slots.event_id
LEFT JOIN tickets ON tickets.slot_id = slots.slot_id
LEFT JOIN users ON users.user_id = tickets.user_id
LEFT JOIN childs ON childs.user_id = tickets.user_id AND childs.slot_id = tickets.slot_id
GROUP BY slots.slot_id, tickets.ticket_id
ORDER BY event_id, start_time, ticket_id
"""


@router.get('/api/tickets/all', response_model=list[model.AllEventWithTickets])
def get_all_tickets(request: Request, x_access_key: str = Header(None)):
    if not ALL_TICKETS_KEY or x_access_key != ALL_TICKETS_KEY:
        raise HTTPException(status_code=403, detail="Invalid access key")
    repository: Repository = request.app.repository
    rows = repository.execute(GET_ALL_TICKETS_QUERY.format(YDB_DATABASE), {})[0].rows

    events_dict = {}
    slots_dict = {}

    for row in rows:
        event_id = row.event_id
        slot_id = row.slot_id

        if event_id not in events_dict:
            events_dict[event_id] = {
                "event_id": event_id,
                "title": row.title,
                "location": row.location,
                "slot_ids": [],
            }

        if slot_id not in slots_dict:
            slots_dict[slot_id] = {
                "slot_id": slot_id,
                "event_id": event_id,
                "start_time": datetime.utcfromtimestamp(row.start_time).replace(tzinfo=pytz.utc),
                "amount": row.amount,
                "tickets": [],
            }
            events_dict[event_id]["slot_ids"].append(slot_id)

        if row.ticket_id is not None:
            children_count = row.children_count or 0
            ticket_amount = row.ticket_amount or 1
            slots_dict[slot_id]["tickets"].append(model.AllTicketInfo(
                ticket_id=row.ticket_id,
                first_name=row.first_name or "",
                last_name=row.last_name or "",
                phone=row.phone or "",
                adults=ticket_amount - children_count,
                children=children_count,
                is_come=bool(row.is_come),
            ))

    result = []
    for event_data in events_dict.values():
        slots = [
            model.AllSlotWithTickets(**{k: v for k, v in slots_dict[sid].items() if k != "event_id"})
            for sid in event_data["slot_ids"]
        ]
        slots.sort(key=lambda s: s.start_time)
        result.append(model.AllEventWithTickets(
            event_id=event_data["event_id"],
            title=event_data["title"],
            location=event_data["location"],
            slots=slots,
        ))
    result.sort(key=lambda e: e.event_id)
    return result


@router.put('/api/tickets/check')
def check_ticket(request: Request, body: model.CheckTicketRequest, x_access_key: str = Header(None)):
    if not ALL_TICKETS_KEY or x_access_key != ALL_TICKETS_KEY:
        raise HTTPException(status_code=403, detail="Invalid access key")
    repository: Repository = request.app.repository
    repository.execute("""PRAGMA TablePathPrefix("{}");
    UPDATE tickets SET is_come = {} WHERE ticket_id = {}
    """.format(YDB_DATABASE, str(body.is_come).lower(), body.ticket_id), {})


@router.post('/api/tickets/my')
def get_user_events(request: Request, response: Response, body: model.TicketRequest):
    repository: Repository = request.app.repository
    try:
        phone = refactor_phone(body.phone)
    except TypeError:
        response.status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        logger.warning(f"Invalid phone at my tickets: {body.phone}", exc_info=True)
        return HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='invalid phone')

    user = repository.get_user(phone)
    if not user:
        response.status_code = status.HTTP_404_NOT_FOUND
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    if user.birthdate != body.birthdate:
        response.status_code = status.HTTP_404_NOT_FOUND
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")

    result = []

    for row in (repository.execute(GET_USER_EVENTS.format(YDB_DATABASE, user.user_id), {}))[0].rows:
        logger.info(f"result: {row}")
        result.append(model.UserEventsResponse(**row))
    return result


@router.post("/api/events/xlsx")
def create_events(request: Request, file: UploadFile = File(...)):
    repository: Repository = request.app.repository
    with open(file.filename, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    events, slots = get_data(file.filename)
    repository.delete_database()
    repository.save_events(events, slots)


@router.get("/api/export/all")
def get_all_events(request: Request):
    repository: Repository = request.app.repository
    data = repository.get_data()
    df = pd.DataFrame([info.model_dump() for info in data])
    dic = {"email": "Email", "f_name": "Имя", "l_name": "Фамилия", "phone": "Телефон",
           "name": "Имя ребенка", "age": "Возраст ребенка", "start_time": "Время начала мероприятия",
           "title": "Название мероприятия", "is_come": "Билет проверен"}
    df['start_time'] = df['start_time'].dt.tz_localize(None)
    df.rename(columns=dic, inplace=True)

    with pd.ExcelWriter('tbl.xlsx', engine='xlsxwriter') as wb:
        df.to_excel(wb, sheet_name='Sheet1', index=False)
        worksheet = wb.sheets["Sheet1"]
        worksheet.set_column("A:I", 20)
        worksheet.set_column("E:E", 15)
        worksheet.set_column("F:F", 17)
        worksheet.set_column("H:H", 30)
        worksheet.set_column("I:I", 16)
        worksheet.set_column("G:G", 28)

    return FileResponse(path='tbl.xlsx', filename='Выгрузка.xlsx', media_type='multipart/form-data')


@router.post("/api/slots/", response_model=model.Slot)
def create_slot(request: Request, body: model.RequestSlot):
    repository: Repository = request.app.repository
    slot_id = repository.get_max_slot_id() + 1
    slot = model.Slot(
        slot_id=slot_id,
        event_id=body.event_id,
        start_time=body.start_time,
        amount=body.amount,
    )
    repository.save_slot(slot)
    return slot


@router.put("/api/slots/")
def update_slot(request: Request, body: model.Slot):
    repository: Repository = request.app.repository
    repository.upsert_slot(body)


@router.delete("/api/slots/")
def delete_slot(request: Request, slot_id: int):
    repository: Repository = request.app.repository
    repository.delete_slot(slot_id)


@router.put("/api/events/", response_model=model.Event)
def update_events(request: Request, body: model.Event):
    repository: Repository = request.app.repository
    repository.update_events(body)
    return body


@router.delete("/api/events/")
def delete_events(request: Request, event_id: int):
    repository: Repository = request.app.repository
    repository.delete_events(event_id)



@router.post("/api/admin/")
def create_admin(request: Request, body: model.Admin) -> None:
    repository: Repository = request.app.repository
    repository.create_admin(body)


@router.get("/api/admin/")
def get_admin(request: Request) -> list[model.Admin]:
    repository: Repository = request.app.repository
    return repository.list_admin()


@router.delete("/api/admin/")
def delete_admin(request: Request, email: str):
    repository: Repository = request.app.repository
    repository.delete_admin(email)


@router.post("/api/admin/owner")
def transfer_owner(request: Request, body: model.TransferOwnerRequest):
    repository: Repository = request.app.repository
    repository.transfer_owner([model.Admin(email=body.email_from, is_owner=False),
                               model.Admin(email=body.email_to, is_owner=True)])


@router.get("/api/authorize/")
def authorize(request: Request, resp: Response, token: str):
    repository: Repository = request.app.repository
    headers = {"Authorization": f"OAuth {token}"}
    response = requests.get("https://login.yandex.ru/info", headers=headers)
    if 200 > response.status_code or response.status_code >= 300:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="fail to connect yandex")
    email = response.json()["default_email"]
    admins = repository.get_admin_by_email(email)
    if len(admins) == 0:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user unauthorized")
    if admins[0][1] is True:
        resp.set_cookie("is_owner", "1")
    resp.set_cookie("email", admins[0][0])


def main():
    load_dotenv()

    logger.info('Starting app...')
    origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    repository = Repository()
    repository.connect()
    app.repository = repository

    app.include_router(router)

    config = uvicorn.Config(app, host='0.0.0.0', port=8080)
    server = uvicorn.Server(config)
    server.run()
