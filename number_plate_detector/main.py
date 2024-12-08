import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from paddleocr import PaddleOCR
from ultralytics import YOLO
from pymongo import MongoClient
from bson import ObjectId
import re
from datetime import datetime
import jwt
import logging
import httpx
from fastapi.middleware.cors import CORSMiddleware
import base64

# Initialize PaddleOCR with English + Hindi language support
ocr = PaddleOCR(use_angle_cls=True, lang='en')

# Initialize MongoDB connection to the existing database
client = MongoClient("mongodb://localhost:27017/")
db = client['Car_Parking_Chatbot_DB']  # Use your existing database
plates_collection = db['plates']  # Collection for plates

# Regex pattern for validating Indian number plates
plate_pattern = re.compile(r'^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$')

# Initialize YOLO model
model = YOLO('weights/best.pt')

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Secret Key (use the same as your Express backend)
JWT_SECRET = "your_secret_key"  # Replace with your JWT secret key

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def perform_ocr_on_image(img, coordinates):
    x1, y1, x2, y2 = map(int, coordinates)
    cropped_img = img[y1:y2, x1:x2]

    # Use PaddleOCR to recognize text
    results = ocr.ocr(cropped_img, cls=True)

    if not results:
        return ""  # Return empty string if no results

    # Extract text from the OCR result
    for line in results:
        if line:
            for word_info in line:
                text = word_info[1][0]  # Extract recognized text
                return text  # Stop after the first valid result

    return ""


def validate_plate(plate):
    return bool(re.match(plate_pattern, plate))


def save_plate_to_user(plate, user_id, image_info):
    # Convert user_id to ObjectId if it's a string
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)

    # Check if the plate already exists for the user
    user_document = db['users'].find_one({"_id": user_id}, {"numberPlates": 1})
    existing_plates = user_document.get("numberPlates", []) if user_document else []

    if plate in existing_plates:
        logging.info(f"License plate {plate} already exists for user {user_id}. Skipping save.")
        return False

    # Add the plate to the user's document
    result = db['users'].update_one(
        {"_id": user_id},
        {
            "$addToSet": {"numberPlates": plate},  # Ensures unique plates
            "$push": {
                "plateInfo": {  # Optional: if you want to track additional plate info
                    "plate": plate,
                    "timestamp": image_info.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
                }
            },
        }
    )
    if result.modified_count > 0:
        logging.info(f"License plate {plate} added to user {user_id}.")
        return True
    else:
        logging.info(f"Failed to add license plate {plate} for user {user_id}.")
        return False


async def send_plate_to_express_api(plate, token):
    url = "http://localhost:5000/api/parking/numberplate"
    headers = {"Authorization": f"Bearer {token}"}
    data = {"numberPlate": plate}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()  # Raise an error for non-2xx responses
            return response.status_code, response.json()
        except httpx.HTTPStatusError as e:
            logging.error(f"HTTP error while sending to Express API: {e}")
            return e.response.status_code, {"error": e.response.text}
        except Exception as e:
            logging.error(f"Unexpected error: {e}")
            return 500, {"error": str(e)}


@app.post("/detect")
async def detect_number_plate(
    image: UploadFile = File(...),
    authorization: str = Header(...),
):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid Authorization header format")

        token = authorization.split(" ")[1]  # Extract the token part
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = decoded_token.get("id")

        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")

        # Read the uploaded image
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        logging.error(f"Error processing image: {e}")
        return {"message": str(e)}

    results = model(img)
    detected_plates = []
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    for result in results:
        boxes = result.boxes  # Get bounding boxes
        for box in boxes:
            xyxy = box.xyxy[0].cpu().numpy()
            label = perform_ocr_on_image(img, xyxy)

            if label and validate_plate(label) and label not in detected_plates:
                detected_plates.append(label)

                # Save to user document if not already present
                if save_plate_to_user(label, user_id, {"timestamp": timestamp}):
                    status_code, response = await send_plate_to_express_api(label, token)
                    if status_code == 200:
                        logging.info(f"Successfully sent {label} to Express API.")
                    else:
                        logging.error(f"Failed to send {label} to Express API: {response}")

    if not detected_plates:
        return {"message": "No valid license plates detected."}

    _, img_encoded = cv2.imencode('.jpg', img)
    img_base64 = base64.b64encode(img_encoded).decode('utf-8')

    return {"detected_plates": detected_plates, "timestamp": timestamp, "image": img_base64}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
