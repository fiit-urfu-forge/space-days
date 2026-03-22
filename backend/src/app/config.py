import os
from dotenv import load_dotenv

load_dotenv()
YDB_DATABASE = os.getenv('DB')
YDB_ENDPOINT = os.getenv('ENDPOINT')
API_TOKEN = os.getenv('API_TOKEN')
LAYER = os.getenv("LAYER")