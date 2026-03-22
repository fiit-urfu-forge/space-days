from datetime import date, timedelta


def date_from_ydb_date(ydb_date) -> date:
    return date(1970, 1, 1) + timedelta(days=ydb_date)


def str_from_date(d: date) -> str:
    return d.isoformat()


def date_from_str(s: str) -> date:
    return date.fromisoformat(s)
