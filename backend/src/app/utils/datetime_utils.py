from datetime import datetime, timedelta


def get_datetime_now() -> str:
    return (datetime.now() + timedelta(hours=5)).strftime("%Y-%m-%dT%H:%M:%SZ")
