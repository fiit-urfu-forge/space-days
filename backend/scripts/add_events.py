import math

import pandas as pd
import ydb
import ydb.iam
import asyncio
from backend.src.app.config import YDB_DATABASE, YDB_ENDPOINT
from pydantic import BaseModel

ADD_EVENT_QUERY = """PRAGMA TablePathPrefix("{}");

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

INSERT INTO events
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

INSERT INTO slots
SELECT
    slot_id,
    event_id,
    amount,
    CAST(start_time AS Datetime) AS start_time
FROM AS_TABLE($slotData);
"""


class Event(BaseModel):
    event_id: int
    description: str
    summary: str
    title: str
    location: str
    age: str
    duration: int
    is_children: bool
    id_partner: str


class Slot(BaseModel):
    slot_id: int
    event_id: int
    start_time: str
    amount: int


def timestamp_to_str(start_time):
    print("Start time", start_time)
    return f"{start_time.year}-{start_time.month}-{start_time.day}T{start_time.hour}:{start_time.minute}:{start_time.second}Z"


def get_data() -> tuple[list[Event], list[Slot]]:
    data = pd.read_excel("space_days.xlsx")
    print(data)
    events = []
    slot_counter = 0
    slots = []
    for index, row in data.iterrows():
        event = Event(
            event_id=row['id'],
            description=row['Полное описание'],
            summary=row['Краткое описание'],
            title=row['Название мероприятия'],
            location=row['Место мероприятия'],
            age=row['Возраст участников'],
            duration=row['Продолжительность'],
            id_partner=row['ID партнера'],
            is_children=row['Только для детей'] == 'да'
        )
        slots_1 = [Slot(event_id=row['id'], slot_id=slot_counter,
                        start_time=timestamp_to_str(row['Время начала']), amount=row['количество людей в определенный слот'])]
        slot_counter += 1
        for i in range(1, 12):
            amount = row[f'количество людей в определенный слот.{i}']

            start_time = row[f'Время начала.{i}']
            if not math.isnan(amount) and not pd.isnull(start_time):
                slots_1.append(
                    Slot(event_id=row['id'], slot_id=slot_counter,
                         start_time=timestamp_to_str(start_time), amount=amount))
                slot_counter += 1
            else:
                break
        slots.extend(slots_1)
        print(slots)
        nan = "nan"
        if event.event_id == nan or event.description == nan or event.summary == nan or event.title == nan or event.location == nan or event.age == nan or event.duration == nan or event.is_children == nan or event.is_children == nan:
            print(event)
        events.append(event)
    return events, slots


async def main():
    events, slots = get_data()
    async with ydb.aio.Driver(endpoint=YDB_ENDPOINT, database=YDB_DATABASE,
                              credentials=ydb.iam.ServiceAccountCredentials.from_file('../service-key.json')) as driver:
        await driver.wait(fail_fast=True)
        async with ydb.aio.SessionPool(driver=driver, size=10) as pool:
            session = await pool.acquire()
            print(ADD_EVENT_QUERY)

            prepared_query = await session.prepare(ADD_EVENT_QUERY.format(YDB_DATABASE))
            await session.transaction(ydb.SerializableReadWrite()).execute(
                prepared_query,
                {
                    "$eventData": events,
                    "$slotData": slots,
                },
                commit_tx=True,
            )
            await pool.release(session)


if __name__ == "__main__":
    asyncio.run(main())
