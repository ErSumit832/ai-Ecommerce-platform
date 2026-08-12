from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import Product, Review, User
from app.schemas.review import ReviewCreate, ReviewOut, ReviewSummaryResponse
from app.services.ai_service import SYSTEM_REVIEW_SUMMARIZER, generate_json

router = APIRouter(prefix="/api/v1/products/{product_id}/reviews", tags=["Reviews"])


def _recalculate_rating(db: Session, product: Product) -> None:
    avg, count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.product_id == product.id)
    ).one()
    product.rating_avg = round(float(avg or 0), 2)
    product.rating_count = int(count or 0)


@router.get("", response_model=list[ReviewOut])
def list_reviews(product_id: str, db: Session = Depends(get_db)):
    rows = db.execute(
        select(Review, User.full_name).join(User, Review.user_id == User.id)
        .where(Review.product_id == product_id).order_by(Review.created_at.desc())
    ).all()
    return [
        ReviewOut(
            id=r.Review.id, product_id=r.Review.product_id, user_id=r.Review.user_id,
            reviewer_name=r.full_name, rating=r.Review.rating, comment=r.Review.comment,
            created_at=r.Review.created_at,
        )
        for r in rows
    ]


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(product_id: str, payload: ReviewCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    review = Review(product_id=product_id, user_id=user.id, rating=payload.rating, comment=payload.comment)
    db.add(review)
    db.flush()
    _recalculate_rating(db, product)
    db.commit()
    db.refresh(review)

    return ReviewOut(
        id=review.id, product_id=review.product_id, user_id=review.user_id,
        reviewer_name=user.full_name, rating=review.rating, comment=review.comment,
        created_at=review.created_at,
    )


@router.get("/ai-summary", response_model=ReviewSummaryResponse)
def ai_summarize_reviews(product_id: str, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    reviews = db.scalars(select(Review).where(Review.product_id == product_id)).all()
    if not reviews:
        return ReviewSummaryResponse(
            product_id=product_id, review_count=0, average_rating=0,
            summary="No reviews yet for this product.", pros=[], cons=[],
        )

    reviews_text = "\n".join(f"- ({r.rating}/5) {r.comment}" for r in reviews if r.comment)
    result = generate_json(SYSTEM_REVIEW_SUMMARIZER, reviews_text or "No written comments, ratings only.")

    if not result:
        # Fallback when AI is not configured or fails: simple heuristic summary
        result = {
            "summary": f"{len(reviews)} customers rated this product an average of {product.rating_avg}/5.",
            "pros": [],
            "cons": [],
        }

    return ReviewSummaryResponse(
        product_id=product_id,
        review_count=len(reviews),
        average_rating=float(product.rating_avg),
        summary=result.get("summary", ""),
        pros=result.get("pros", []),
        cons=result.get("cons", []),
    )
