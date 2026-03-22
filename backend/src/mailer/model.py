from pydantic import BaseModel


class SendingLog(BaseModel):
    mailing_id: str
    user_id: str
    response: str
    created_at: str


class MailingData(BaseModel):
    mailing_id: str
    first_name: str
    last_name: str
    ticket_id: int
    title: str
    start_time: str
    duration: str
    location: str
    adult_count: int
    child_count: int
    email: str
    user_id: str
