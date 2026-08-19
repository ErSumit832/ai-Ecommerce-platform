"""
AI service layer.

Wraps OpenAI and Anthropic behind one interface so routers don't care which
provider is configured. Controlled by AI_PROVIDER in settings ("openai" | "anthropic").
All calls degrade gracefully (return a clear fallback string) if no API key
is configured, so the rest of the app keeps working in local/dev mode.
"""
import json
from typing import Any

from app.core.config import settings

SYSTEM_SHOPPING_ASSISTANT = (
    "You are the AI shopping assistant for an e-commerce platform that sells "
    "tech products (laptops, monitors, keyboards, networking gear, cloud/DevOps "
    "hardware accessories, etc). Be concise, friendly, and specific. When you "
    "recommend a type of product, mention concrete specs/features to look for."
)

SYSTEM_REVIEW_SUMMARIZER = (
    "You summarize customer product reviews. Respond ONLY with strict JSON in this "
    'shape: {"summary": string, "pros": string[], "cons": string[]}. No markdown, no prose.'
)

SYSTEM_INCIDENT_ASSISTANT = (
    "You are an SRE / incident-response assistant. Given raw application log text, "
    "identify the likely root cause, severity (low/medium/high/critical), and concrete "
    'suggested fixes. Respond ONLY with strict JSON in this shape: '
    '{"root_cause": string, "severity": string, "suggested_fixes": string[], "summary": string}.'
)

SYSTEM_SALES_INSIGHT = (
    "You are a retail analytics assistant. Given aggregated sales numbers, write a short "
    "(2-3 sentence) plain-English insight highlighting trends and one actionable recommendation."
)


def _is_configured() -> bool:
    if settings.AI_PROVIDER == "openai":
        return bool(settings.OPENAI_API_KEY)
    if settings.AI_PROVIDER == "anthropic":
        return bool(settings.ANTHROPIC_API_KEY)
    return False


def _call_openai(system: str, user: str, json_mode: bool = False) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    kwargs: dict[str, Any] = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    response = client.chat.completions.create(
        model=settings.AI_MODEL_OPENAI,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        temperature=0.4,
        max_tokens=600,
        **kwargs,
    )
    return response.choices[0].message.content or ""


def _call_anthropic(system: str, user: str) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=settings.AI_MODEL_ANTHROPIC,
        max_tokens=600,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(block.text for block in response.content if block.type == "text")


def generate_text(system: str, user: str, json_mode: bool = False) -> str:
    """Route a prompt to the configured provider. Returns raw text (may be JSON)."""
    if not _is_configured():
        return ""
    try:
        if settings.AI_PROVIDER == "anthropic":
            return _call_anthropic(system, user)
        return _call_openai(system, user, json_mode=json_mode)
    except Exception as exc:  # noqa: BLE001 - AI calls must never crash the request
        return f"__AI_ERROR__:{exc}"


def generate_json(system: str, user: str) -> dict | None:
    raw = generate_text(system, user, json_mode=True)
    if not raw or raw.startswith("__AI_ERROR__"):
        return None
    try:
        # Strip accidental markdown fences before parsing
        cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None


def is_ai_configured() -> bool:
    return _is_configured()
