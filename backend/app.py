import os
from datetime import datetime, timedelta, date
from typing import Optional, List
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

import re

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr, ConfigDict
from sqlalchemy import create_engine, select, func, Index
from sqlalchemy.orm import Session, sessionmaker, declarative_base, Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, Numeric

load_dotenv()

# -----------------------------
# Config
# -----------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

# Fix URL for psycopg (v3) driver *before* engine is created
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALG = os.getenv("JWT_ALG", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM")

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

# -----------------------------
# App & CORS
# -----------------------------

app = FastAPI(title="Pantry Pal API", version="0.1.0")

# CORS middleware configuration so the frontend (Vercel) can call the backend (Render) from a different origin (domain/port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

# -----------------------------
# DB setup (SQLAlchemy 2.0 style)
# -----------------------------

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# ORM Models
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationship to items
    items: Mapped[List["Item"]] = relationship("Item", back_populates="user", cascade="all, delete-orphan")

class Item(Base):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    barcode: Mapped[str] = mapped_column(String, nullable=False, index=True)
    name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    quantity: Mapped[Optional[float]] = mapped_column(Numeric(scale=2), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    expires_on: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationship to user
    user: Mapped[User] = relationship("User", back_populates="items")

    # Speeds up the per-user expiry queries (expiring soon list + stats)
    __table_args__ = (Index("ix_items_user_expires", "user_id", "expires_on"),)

# Schema is managed by Alembic (see alembic/), not create_all

# -----------------------------
# Auth helpers
# -----------------------------

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# /auth/login returns this
class TokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"

# request body for user creation
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# response model for user data
class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr

# request body for item creation and update
class ItemCreate(BaseModel):
    barcode: str
    name: Optional[str] = None
    brand: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expires_on: Optional[date] = None
    category: Optional[str] = None
    location: Optional[str] = None
    image_url: Optional[str] = None

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expires_on: Optional[date] = None
    category: Optional[str] = None
    location: Optional[str] = None

# response model for item data
class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    barcode: str
    name: Optional[str] = None
    brand: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expires_on: Optional[date] = None
    created_at: datetime
    image_url: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None

# response model for barcode lookup data
class BarcodeLookupOut(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None

# response model for stats data
class StatsOut(BaseModel):
    total_items: int
    recently_added: int
    expiring_soon: int

class EmailRequest(BaseModel):
    email: EmailStr

class PasswordResetRequest(BaseModel):
    token: str
    new_password: str

# Dependency to get DB session (one per request, shared by all dependencies)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# password hashing and verification
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT (JSON Web Token)
# create JWT access token
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy() # make a copy to avoid modifying the original 
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)) # default expiry
    to_encode.update({"exp": expire}) # add expiry to payload
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG) # create the JWT

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
        ) # raise this if token is invalid
    try: # try to decode the JWT
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG]) # decode the JWT
        user_id: int = payload.get("sub") # get user ID from "sub" claim
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from DB
    user = db.get(User, int(user_id))
    if not user:
        raise credentials_exception
    return user

def get_owned_item(db: Session, item_id: int, user: User) -> Item:
    """Returns the item if it exists and belongs to user, otherwise 404."""
    item = db.scalar(select(Item).where(Item.id == item_id, Item.user_id == user.id))
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


def verify_password_reset_token(token: str) -> Optional[str]:
    """Decodes a password reset token, returns user ID if valid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
        return str(user_id) # Return the user ID
    except JWTError:
        return None # Token is invalid or expired

def send_password_reset_email(to_email: str, token: str):
    """Sends a password reset email using Brevo (Sendinblue)."""

    # configure Brevo API
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = BREVO_API_KEY
    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))

    #build the email
    frontend_url = os.getenv("CORS_ORIGINS", "").split(",")[0]
    if not frontend_url:
        frontend_url = "http://pantry-pal-neon.vercel.app"

    reset_link = f"{frontend_url}/reset-password?token={token}"

    message_body = f"""
    <p>Hello,</p>
    <p>You requested a password reset for your Pantry Pal account.</p>
    <p>Please click the link below to set a new password. This link will expire in 15 minutes.</p>
    <p><a href="{reset_link}">Reset Your Password</a></p>
    <p>If you did not request this, please ignore this email.</p>
    """

    sender = {"name": "Pantry Pal Support", "email": EMAIL_FROM}
    to = [{"email": to_email}]

    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
        to=to,
        sender=sender,
        subject="Pantry Pal Password Reset",
        html_content=message_body
    )

    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        print(f"Password reset email sent to {to_email}. Brevo response: {api_response}")
    except ApiException as e:
        print(f"Exception when sending {to_email} via Brevo: {e}")

# -----------------------------
# Routes: Auth
# -----------------------------

# create new user
@app.post("/auth/register", response_model=TokenData)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # check if user already exists
    existing_user = db.scalar(select(User).where(User.email == user_in.email))
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # create new user and save to DB
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id)})
    return TokenData(access_token=token)

# login user and return JWT token
@app.post("/auth/login", response_model=TokenData)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # get user by email
    user = db.scalar(select(User).where(User.email == form_data.username))
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    # create and return JWT token
    token = create_access_token(data={"sub": str(user.id)})
    return TokenData(access_token=token)

# -----------------------------
# Routes: Items
# -----------------------------

# list items for current user, most recently added first
@app.get("/items/", response_model=List[ItemOut])
def list_items(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Item)
        .where(Item.user_id == current_user.id)
        .order_by(Item.created_at.desc(), Item.id.desc())
    ).all()


@app.get("/items/barcode-lookup/{barcode}", response_model=BarcodeLookupOut)
async def barcode_lookup(barcode: str):
    """
    Looks up barcode information from Open Food Facts.
    """
    if not barcode or not barcode.strip():
        raise HTTPException(status_code=400, detail="Barcode is required")
    
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    name, brand, quantity_str, unit, image_url = None, None, None, None, None
    parsed_quantity = None

    # Fetch from external API OpenFoodFacts
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                product = data.get("product", {}) if isinstance(data, dict) else {}

                # extract fields if available
                if product:
                    name = product.get("product_name") or None
                    brand = product.get("brands") or None
                    quantity_str = product.get("quantity") 
                    unit = product.get("product_quantity_unit") or None 
                    image_url = product.get("image_url") or None 

                    if quantity_str:
                        # Try "NUMBER UNIT" format first
                        match = re.match(r"([\d.]+)\s*([a-zA-Zμ]+)", quantity_str)
                        if match:
                            try:
                                parsed_quantity = float(match.group(1))
                                # Use parsed unit ONLY if separate unit field is missing
                                if not unit:
                                    unit = match.group(2).lower()
                            except ValueError:
                                pass # Couldn't parse float
                        else:
                             # Try parsing if it's just a number
                             try:
                                 num_only = float(quantity_str)
                                 if not unit: # If it's just a number, we don't know the unit
                                     parsed_quantity = num_only
                                 # Else: If we have a unit field, trust that even if parsing failed
                                 elif unit:
                                     parsed_quantity = num_only

                             except ValueError:
                                pass # Not a simple number either
                             
                    # Ensure unit is lowercase if found
                    if unit:
                        unit = unit.lower()

            else:
                 # Product not found, but request was successful
                 pass # Return default Nones

    except httpx.RequestError as e:
        print(f"Error fetching from Open Food Facts: {e}")

    return BarcodeLookupOut(
        name=name,
        brand=brand,
        quantity=parsed_quantity, # Return the parsed float
        unit=unit,
        image_url=image_url
    )

# add new item for current user
@app.post("/items/", response_model=ItemOut, status_code=201)
def add_item(item_in: ItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate barcode
    if not item_in.barcode or not item_in.barcode.strip():
        raise HTTPException(status_code=400, detail="Barcode is required")

    fields = item_in.model_dump()
    fields["barcode"] = item_in.barcode.strip()
    fields["unit"] = item_in.unit.lower() if item_in.unit else None # Ensure unit is lowercase

    item = Item(user_id=current_user.id, **fields)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

# update existing item for current user
@app.patch("/items/{item_id}", response_model=ItemOut)
def update_item(item_id: int, patch: ItemUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = get_owned_item(db, item_id, current_user)

    # Only apply fields the client sent; an explicit null clears the field
    changes = patch.model_dump(exclude_unset=True)
    if changes.get("unit"):
        changes["unit"] = changes["unit"].lower()
    for field, value in changes.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item

@app.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = get_owned_item(db, item_id, current_user)
    db.delete(item)
    db.commit()

# items expiring within 7 days, including already expired ones
@app.get("/items/expiring_soon/", response_model=List[ItemOut])
def list_expiring_soon_items(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    soon_date = date.today() + timedelta(days=7)
    return db.scalars(
        select(Item)
        .where(
            Item.user_id == current_user.id,
            Item.expires_on.is_not(None),
            Item.expires_on <= soon_date,
        )
        .order_by(Item.expires_on.asc())
    ).all()

@app.get("/stats/", response_model=StatsOut)
def get_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    expiry_date = today + timedelta(days=7)
    recent_date = today - timedelta(days=3)

    def count(*conditions) -> int:
        return db.scalar(
            select(func.count()).select_from(Item).where(Item.user_id == current_user.id, *conditions)
        ) or 0

    return StatsOut(
        total_items=count(),
        recently_added=count(Item.created_at >= recent_date), # last 3 days
        expiring_soon=count(Item.expires_on.is_not(None), Item.expires_on <= expiry_date), # next 7 days
    )


@app.post("/auth/request-password-reset/")
def request_password_reset(email: EmailRequest, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.scalar(select(User).where(User.email == email.email))
    if user:
        expire_delta = timedelta(minutes=15)
        reset_token = create_access_token(data={"sub": str(user.id)}, expires_delta=expire_delta)
        send_password_reset_email(email.email, reset_token)

    return {"message": "If the email is registered, a password reset link has been sent."}

@app.post("/auth/reset-password/", status_code=200)
def reset_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user_id = verify_password_reset_token(request.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = get_password_hash(request.new_password)
    db.commit()

    return {"message": "Password has been reset successfully."}


# Healthcheck
@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"ok": True, "service": "pantry-pal-api"}