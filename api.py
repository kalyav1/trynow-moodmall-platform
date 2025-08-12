from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request, Response, HTTPException
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
import time
import os
import certifi
os.environ["SSL_CERT_FILE"] = certifi.where()
from pydantic import BaseModel
from dotenv import load_dotenv
import openai
import traceback

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://black-ground-08908641e.1.azurestaticapps.net"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'"
    return response

# Simple in-memory rate limiter (for demo/dev only)
RATE_LIMIT = 100  # requests
RATE_PERIOD = 60  # seconds
rate_limit_cache = {}

@app.middleware("http")
async def rate_limiter(request: Request, call_next):
    ip = request.client.host
    now = time.time()
    window = int(now // RATE_PERIOD)
    key = f"{ip}:{window}"
    count = rate_limit_cache.get(key, 0)
    if count >= RATE_LIMIT:
        raise HTTPException(status_code=HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests")
    rate_limit_cache[key] = count + 1
    return await call_next(request)

# Request/Response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    try:
        cl = request.headers.get("content-length", "-")
        logger.info(
            f"REQ method={request.method} path={request.url.path} ip={request.client.host} cl={cl} ua={request.headers.get('user-agent','-')}"
        )
    except Exception:
        pass
    response: Response = await call_next(request)
    try:
        dur_ms = (time.time() - start) * 1000.0
        logger.info(
            f"RES method={request.method} path={request.url.path} status={getattr(response, 'status_code', '-')} dur_ms={dur_ms:.1f}"
        )
    except Exception:
        pass
    return response

logger = logging.getLogger("moodmall")
# Console handler (so logs appear in Azure Log Stream)
if not any(isinstance(h, logging.StreamHandler) for h in logger.handlers):
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    logger.addHandler(ch)

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

class ProductSelection(BaseModel):
    products: list[str]

def build_prompt(products):
    # --- Old logic (commented out for reference) ---
    # if not products:
    #     return "A modern, stylish virtual room"
    # if len(products) == 1:
    #     return f"A 3D render of a virtual room featuring {products[0]}"
    # if "sunglasses" in [p.lower() for p in products] and "laptop" in [p.lower() for p in products]:
    #     return "A person at the beach wearing sunglasses and using a laptop"
    # if "kitchen" in [p.lower() for p in products]:
    #     return "A 3D kitchen scene with " + ", ".join(products)
    # return "A 3D render of a virtual room with " + ", ".join(products)

    # --- New generic, category-aware logic ---
    if not products:
        return "A photorealistic, modern, stylish virtual room with natural lighting, high detail, and inviting atmosphere"

    # Lowercase for matching
    products_lower = [p.lower() for p in products]

    # Exhaustive Amazon-like categories and context phrases
    categories = {
        "apparel": ["shirt", "dress", "jacket", "shoes", "sneakers", "t-shirt", "jeans", "skirt", "suit", "blazer", "coat", "scarf", "hat", "sunglasses", "watch", "bag", "handbag", "backpack", "wallet", "gloves", "belt", "tie", "socks", "boots"],
        "beauty": ["lipstick", "makeup", "foundation", "blush", "mascara", "eyeliner", "perfume", "nail polish", "skincare", "hair care", "fragrance", "cosmetic"],
        "electronics": ["laptop", "tv", "television", "smartphone", "tablet", "speaker", "headphones", "camera", "monitor", "mouse", "keyboard", "printer", "charger", "earbuds", "console"],
        "home_kitchen": ["sofa", "couch", "table", "chair", "bed", "desk", "bookshelf", "cabinet", "dresser", "lamp", "rug", "bedding", "pillow", "blanket", "cookware", "utensil", "mug", "plate", "bowl", "pan", "pot", "appliance"],
        "grocery": ["snack", "beverage", "coffee", "tea", "cereal", "chocolate", "candy", "juice", "soda", "biscuit", "cracker", "spice", "sauce"],
        "health": ["vitamin", "supplement", "medicine", "bandage", "sanitizer", "mask", "thermometer", "first aid", "personal care"],
        "toys": ["toy", "action figure", "board game", "doll", "puzzle", "lego", "game", "plush", "stuffed animal"],
        "sports": ["bicycle", "tent", "grill", "barbecue", "garden", "patio", "umbrella", "ball", "bat", "racket", "glove", "helmet", "skateboard", "yoga mat", "dumbbell"],
        "automotive": ["car", "tire", "engine", "seat cover", "steering wheel", "wiper", "battery", "tool"],
        "books": ["book", "novel", "magazine", "comic", "manual", "guide", "textbook"],
        "office": ["pen", "notebook", "paper", "stapler", "folder", "envelope", "printer", "desk organizer", "office chair"],
        "pet": ["dog", "cat", "fish", "bird", "pet food", "leash", "collar", "aquarium", "cage", "litter"],
        "baby": ["stroller", "car seat", "crib", "bottle", "diaper", "pacifier", "baby monitor", "high chair"],
        "garden": ["plant", "flower", "shovel", "hose", "fertilizer", "pot", "planter", "lawn mower", "sprinkler"],
        "musical": ["guitar", "keyboard", "piano", "drum", "violin", "flute", "microphone", "amplifier", "music stand"],
        "luggage": ["suitcase", "backpack", "duffel", "travel bag", "carry-on", "luggage", "trolley"],
        "arts": ["paint", "brush", "canvas", "easel", "marker", "crayon", "scissors", "glue", "craft", "sewing", "yarn", "needle"],
        "collectibles": ["coin", "stamp", "artwork", "poster", "autograph", "memorabilia"],
    }
    context_phrases = {
        "apparel": "A photorealistic, modern dressing room with a stylish mannequin wearing {products}",
        "beauty": "A photorealistic, modern vanity table with {products} arranged beautifully",
        "electronics": "A photorealistic, modern living room with {products} displayed attractively",
        "home_kitchen": "A photorealistic, modern home or kitchen featuring {products}",
        "grocery": "A photorealistic, modern kitchen or dining table with {products} arranged invitingly",
        "health": "A photorealistic, modern bathroom or health station with {products}",
        "toys": "A photorealistic, modern playroom with {products} scattered playfully",
        "sports": "A photorealistic, modern sports area or outdoor scene with {products}",
        "automotive": "A photorealistic, modern garage or car interior with {products}",
        "books": "A photorealistic, modern reading nook or library with {products}",
        "office": "A photorealistic, modern office or study with {products} neatly arranged",
        "pet": "A photorealistic, modern home with {products} for pets",
        "baby": "A photorealistic, modern nursery with {products}",
        "garden": "A photorealistic, modern garden or patio with {products}",
        "musical": "A photorealistic, modern music room with {products}",
        "luggage": "A photorealistic, modern travel scene with {products}",
        "arts": "A photorealistic, modern art studio with {products}",
        "collectibles": "A photorealistic, modern display case with {products}",
    }

    # Find matching category (first match wins)
    matched = None
    for cat, keywords in categories.items():
        if any(any(word in p for word in keywords) for p in products_lower):
            matched = cat
            break

    # Compose product list naturally
    if len(products) == 1:
        product_str = products[0]
    elif len(products) == 2:
        product_str = f"{products[0]} and {products[1]}"
    else:
        product_str = ", ".join(products[:-1]) + f", and {products[-1]}"

    # Build prompt
    if matched and matched in context_phrases:
        prompt = context_phrases[matched].format(products=product_str)
    else:
        prompt = (
            f"A photorealistic, modern virtual room, featuring {product_str}. "
            "The setting is visually appealing, with natural lighting, high detail, and an inviting atmosphere. "
            "All products are attractively arranged to showcase their best features."
        )
    return prompt

# client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # Original code commented out

# --- BEGIN: SSL fix using certifi for OpenAI client ---
import httpx
import certifi
client = openai.OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    http_client=httpx.Client(verify=certifi.where())
)
# --- END: SSL fix using certifi for OpenAI client ---

@app.post("/generate-virtual-room-image")
async def generate_virtual_room_image(selection: ProductSelection):
    logger.info(f"/generate-virtual-room-image products={selection.products}")
    prompt = build_prompt(selection.products)
    logger.info(f"prompt={prompt[:300]}")
    try:
        response = client.images.generate(
            model="dall-e-2",
            prompt=prompt,
            n=1,
            size="512x512"
        )
        image_url = response.data[0].url
        logger.info(f"image_url={image_url}")
        return {"image_url": image_url, "prompt": prompt}
    except Exception as e:
        logger.error(f"Error in DALL·E endpoint: {type(e).__name__}: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error. See server logs for details.")
