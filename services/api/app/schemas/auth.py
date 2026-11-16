from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    """Credentials payload for General Manager sign-in."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class OrganizationPublic(BaseModel):
    """Public organization summary."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    legal_name: str


class UserPublic(BaseModel):
    """Public authenticated user profile."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime


class AuthSessionResponse(BaseModel):
    """Authenticated session envelope returned by login and /me."""

    user: UserPublic
    organization: OrganizationPublic


class MessageResponse(BaseModel):
    """Simple confirmation message response."""

    message: str
