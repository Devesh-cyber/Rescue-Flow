import os
from dotenv import load_dotenv
from pymongo import MongoClient
# from database import tasks

load_dotenv()

client = MongoClient(os.getenv('MONGO_URI'))

db = client['deadline_rescue']

tasks = db['tasks']

print('MongoDB Connected')
