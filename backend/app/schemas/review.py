from datetime import datetime

from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class ReviewOut(BaseModel):
    id: str
    product_id: str
    user_id: str
    reviewer_name: str
    rating: int
    comment: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewSummaryResponse(BaseModel):
    product_id: str
    review_count: int
    average_rating: float
    summary: str
    pros: list[str]
    cons: list[str]
