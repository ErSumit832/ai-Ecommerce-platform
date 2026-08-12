from pydantic import BaseModel

from app.schemas.product import ProductOut


class RecommendationRequest(BaseModel):
    query: str


class RecommendationResponse(BaseModel):
    query: str
    explanation: str
    products: list[ProductOut]


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str


class ChatMessageResponse(BaseModel):
    session_id: str
    reply: str
    suggested_products: list[ProductOut] = []


class SalesAnalyticsResponse(BaseModel):
    total_revenue: float
    total_orders: int
    top_products: list[dict]
    revenue_by_day: list[dict]
    ai_insight: str


class IncidentAnalysisRequest(BaseModel):
    log_text: str


class IncidentAnalysisResponse(BaseModel):
    root_cause: str
    severity: str
    suggested_fixes: list[str]
    summary: str
