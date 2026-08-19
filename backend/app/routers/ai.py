from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin
from app.db.database import get_db
from app.db.models import AIChatLog, Order, OrderItem, Product
from app.schemas.ai import (
    ChatMessageRequest, ChatMessageResponse, IncidentAnalysisRequest, IncidentAnalysisResponse,
    RecommendationRequest, RecommendationResponse, SalesAnalyticsResponse,
)
from app.services.ai_service import (
    SYSTEM_INCIDENT_ASSISTANT, SYSTEM_SALES_INSIGHT, SYSTEM_SHOPPING_ASSISTANT,
    generate_json, generate_text, is_ai_configured,
)

router = APIRouter(prefix="/api/v1/ai", tags=["AI Features"])


def _keyword_match_products(db: Session, query: str, limit: int = 6) -> list[Product]:
    """Simple fallback matcher used when no LLM is configured, and to source
    candidate products that the LLM then explains/ranks."""
    words = [w.strip().lower() for w in query.replace(",", " ").split() if len(w.strip()) > 2]
    stmt = select(Product).where(Product.is_active.is_(True))
    products = db.scalars(stmt).all()
    if not words:
        return products[:limit]

    def score(p: Product) -> int:
        haystack = f"{p.name} {p.brand} {p.tags} {p.description}".lower()
        return sum(1 for w in words if w in haystack)

    ranked = sorted(products, key=score, reverse=True)
    ranked = [p for p in ranked if score(p) > 0] or products
    return ranked[:limit]


@router.post("/recommend", response_model=RecommendationResponse)
def ai_recommend(payload: RecommendationRequest, db: Session = Depends(get_db)):
    candidates = _keyword_match_products(db, payload.query)

    if is_ai_configured() and candidates:
        catalog_snippet = "\n".join(f"- {p.name} | {p.brand} | ${p.price} | tags: {p.tags}" for p in candidates)
        prompt = (
            f"Customer request: \"{payload.query}\"\n\n"
            f"Candidate products:\n{catalog_snippet}\n\n"
            "In 2-3 sentences, explain which of these best fit the request and why."
        )
        explanation = generate_text(SYSTEM_SHOPPING_ASSISTANT, prompt)
        if explanation.startswith("__AI_ERROR__") or not explanation:
            explanation = "Here are products matched to your request based on our catalog."
    else:
        explanation = "Here are products matched to your request based on our catalog."

    return RecommendationResponse(query=payload.query, explanation=explanation, products=candidates)


@router.post("/chat", response_model=ChatMessageResponse)
def ai_shopping_assistant(payload: ChatMessageRequest, db: Session = Depends(get_db)):
    db.add(AIChatLog(session_id=payload.session_id, role="user", message=payload.message))

    candidates = _keyword_match_products(db, payload.message, limit=4)

    if is_ai_configured():
        reply = generate_text(SYSTEM_SHOPPING_ASSISTANT, payload.message)
        if reply.startswith("__AI_ERROR__") or not reply:
            reply = "Sorry, I couldn't reach the AI service right now — please try again shortly."
    else:
        reply = (
            "AI provider isn't configured yet (set OPENAI_API_KEY or ANTHROPIC_API_KEY). "
            "Meanwhile, here are a few products that match what you asked about."
        )

    db.add(AIChatLog(session_id=payload.session_id, role="assistant", message=reply))
    db.commit()

    return ChatMessageResponse(session_id=payload.session_id, reply=reply, suggested_products=candidates)


@router.get("/sales-analytics", response_model=SalesAnalyticsResponse, dependencies=[Depends(get_current_admin)])
def ai_sales_analytics(db: Session = Depends(get_db)):
    total_revenue = db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0))) or 0
    total_orders = db.scalar(select(func.count(Order.id))) or 0

    top_products_rows = db.execute(
        select(OrderItem.product_name, func.sum(OrderItem.quantity).label("units"),
               func.sum(OrderItem.unit_price * OrderItem.quantity).label("revenue"))
        .group_by(OrderItem.product_name).order_by(func.sum(OrderItem.quantity).desc()).limit(5)
    ).all()
    top_products = [{"name": r.product_name, "units_sold": int(r.units), "revenue": float(r.revenue)} for r in top_products_rows]

    since = datetime.utcnow() - timedelta(days=14)
    daily_rows = db.execute(
        select(func.date(Order.created_at).label("day"), func.sum(Order.total_amount).label("revenue"))
        .where(Order.created_at >= since).group_by(func.date(Order.created_at)).order_by("day")
    ).all()
    revenue_by_day = [{"date": str(r.day), "revenue": float(r.revenue)} for r in daily_rows]

    if is_ai_configured():
        prompt = (
            f"Total revenue: ${total_revenue}. Total orders: {total_orders}. "
            f"Top products: {top_products}. Last 14 days revenue trend: {revenue_by_day}."
        )
        insight = generate_text(SYSTEM_SALES_INSIGHT, prompt)
        if insight.startswith("__AI_ERROR__") or not insight:
            insight = "AI insight unavailable right now."
    else:
        insight = "Configure OPENAI_API_KEY or ANTHROPIC_API_KEY to enable AI-generated sales insights."

    return SalesAnalyticsResponse(
        total_revenue=float(total_revenue), total_orders=int(total_orders),
        top_products=top_products, revenue_by_day=revenue_by_day, ai_insight=insight,
    )


@router.post("/incident-analysis", response_model=IncidentAnalysisResponse, dependencies=[Depends(get_current_admin)])
def ai_incident_analysis(payload: IncidentAnalysisRequest):
    result = generate_json(SYSTEM_INCIDENT_ASSISTANT, payload.log_text)
    if not result:
        return IncidentAnalysisResponse(
            root_cause="Unable to analyze — AI provider not configured or request failed.",
            severity="unknown",
            suggested_fixes=["Set OPENAI_API_KEY or ANTHROPIC_API_KEY in backend .env", "Retry the analysis"],
            summary="AI incident analysis is unavailable in the current environment.",
        )
    return IncidentAnalysisResponse(
        root_cause=result.get("root_cause", "Unknown"),
        severity=result.get("severity", "unknown"),
        suggested_fixes=result.get("suggested_fixes", []),
        summary=result.get("summary", ""),
    )
