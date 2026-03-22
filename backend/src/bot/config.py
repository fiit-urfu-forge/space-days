import os
from dotenv import load_dotenv

load_dotenv()
YDB_DATABASE = os.getenv('DB')
YDB_ENDPOINT = os.getenv('ENDPOINT')
BOT_TOKEN = os.getenv('BOT_TOKEN')
