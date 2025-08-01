from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger = logging.getLogger("moodmall")

# Set up file logging
log_dir = 'log'
import os as _os
if not _os.path.exists(log_dir):
    _os.makedirs(log_dir)
file_handler = logging.FileHandler(_os.path.join(log_dir, 'app.log'))
file_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
file_handler.setFormatter(formatter)
if not any(isinstance(h, logging.FileHandler) for h in logger.handlers):
    logger.addHandler(file_handler)
