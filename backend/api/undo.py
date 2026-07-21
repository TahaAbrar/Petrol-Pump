"""Helpers for 5-minute admin undo snapshots on page banner / feature cards."""

from __future__ import annotations

from copy import deepcopy

from django.utils import timezone

from .models import BannerImage, PageContent, UndoSnapshot


def cleanup_expired_undos(page: PageContent | None = None) -> None:
    qs = UndoSnapshot.objects.filter(expires_at__lte=timezone.now())
    if page is not None:
        qs = qs.filter(page=page)
    for snap in qs:
        snap.purge_expired(force=True)


def active_undos_for(page: PageContent) -> list[dict]:
    cleanup_expired_undos(page)
    out = []
    for snap in UndoSnapshot.objects.filter(page=page, expires_at__gt=timezone.now()):
        out.append(
            {
                "scope": snap.scope,
                "token": str(snap.token),
                "expires_at": snap.expires_at.isoformat(),
            }
        )
    return out


def snapshot_banner_state(page: PageContent) -> dict:
    live_images = list(
        page.banner_images.filter(archived=False).order_by("order", "id").values_list("id", flat=True)
    )
    extra = page.extra if isinstance(page.extra, dict) else {}
    return {
        "title": page.title,
        "subtitle": page.subtitle,
        "body": page.body,
        "banner": page.banner.name if page.banner else None,
        "banner_image_ids": live_images,
        "stats": deepcopy(extra.get("stats")),
        "text_colors": deepcopy((extra.get("text_colors") or {})),
        "banner_fields": deepcopy(extra.get("banner_fields")),
    }


def snapshot_features_state(page: PageContent) -> dict:
    extra = page.extra if isinstance(page.extra, dict) else {}
    return {"features": deepcopy(extra.get("features"))}


def snapshot_feature_card(page: PageContent, index: int) -> dict:
    extra = page.extra if isinstance(page.extra, dict) else {}
    features = extra.get("features") if isinstance(extra.get("features"), dict) else {}
    cards = features.get("cards") if isinstance(features.get("cards"), list) else []
    card = deepcopy(cards[index]) if 0 <= index < len(cards) else None
    return {"index": index, "card": card, "cards": deepcopy(cards)}


def archive_live_banner_images(page: PageContent, token) -> None:
    page.banner_images.filter(archived=False).update(archived=True, undo_token=token)


def apply_banner_restore(page: PageContent, snap: UndoSnapshot) -> None:
    data = snap.previous_data or {}
    archived = list(page.banner_images.filter(undo_token=snap.token, archived=True))
    prev_ids = set(data.get("banner_image_ids") or [])

    if archived:
        # Image set was replaced during the edit — drop current live slides, revive archived.
        for img in page.banner_images.filter(archived=False):
            if img.image:
                img.image.delete(save=False)
            img.delete()
        page.banner_images.filter(undo_token=snap.token, archived=True).update(
            archived=False, undo_token=None
        )
    else:
        # Text-only undo — keep current slides; only remove slides that didn't exist before.
        for img in page.banner_images.filter(archived=False):
            if prev_ids and img.id not in prev_ids:
                if img.image:
                    img.image.delete(save=False)
                img.delete()

    page.title = data.get("title") or ""
    page.subtitle = data.get("subtitle") or ""
    page.body = data.get("body") or ""

    banner_name = data.get("banner")
    if banner_name:
        page.banner.name = banner_name
    else:
        # Prefer first live slide as primary banner.
        first = page.banner_images.filter(archived=False).order_by("order", "id").first()
        if first and first.image:
            page.banner = first.image
        else:
            page.banner = None

    extra = dict(page.extra or {})
    if "stats" in data:
        if data["stats"] is None:
            extra.pop("stats", None)
        else:
            extra["stats"] = data["stats"]
    colors = extra.get("text_colors") if isinstance(extra.get("text_colors"), dict) else {}
    colors = dict(colors)
    prev_colors = data.get("text_colors") if isinstance(data.get("text_colors"), dict) else {}
    for k in ("subtitle", "title", "body"):
        if k in prev_colors:
            colors[k] = prev_colors[k]
        else:
            colors.pop(k, None)
    # Restore / clear stats_* color keys from snapshot
    for k in list(colors.keys()):
        if k.startswith("stats_"):
            colors.pop(k, None)
    for k, v in (prev_colors or {}).items():
        if k.startswith("stats_"):
            colors[k] = v
    if "banner_fields" in data:
        if data["banner_fields"] is None:
            extra.pop("banner_fields", None)
        else:
            extra["banner_fields"] = data["banner_fields"]
    extra["text_colors"] = colors
    page.extra = extra
    page.save()

    first = page.banner_images.filter(archived=False).order_by("order", "id").first()
    if first and first.image:
        page.banner = first.image
        page.save(update_fields=["banner", "updated_at"])


def apply_features_restore(page: PageContent, snap: UndoSnapshot) -> None:
    data = snap.previous_data or {}
    extra = dict(page.extra or {})
    if "features" in data:
        if data["features"] is None:
            extra.pop("features", None)
        else:
            extra["features"] = data["features"]
    page.extra = extra
    page.save(update_fields=["extra", "updated_at"])


def apply_feature_card_restore(page: PageContent, snap: UndoSnapshot) -> None:
    data = snap.previous_data or {}
    index = int(data.get("index", -1))
    card = data.get("card")
    extra = dict(page.extra or {})
    features = dict(extra.get("features") or {}) if isinstance(extra.get("features"), dict) else {}
    cards = list(features.get("cards") or [])
    if card is None:
        # Card was newly created after edit? Restore full cards list if provided.
        if "cards" in data and isinstance(data["cards"], list):
            features["cards"] = data["cards"]
    elif 0 <= index < len(cards):
        cards[index] = card
        features["cards"] = cards
    elif isinstance(data.get("cards"), list):
        features["cards"] = data["cards"]
    extra["features"] = features
    page.extra = extra
    page.save(update_fields=["extra", "updated_at"])


def restore_undo(page: PageContent, token: str) -> UndoSnapshot | None:
    cleanup_expired_undos(page)
    try:
        snap = UndoSnapshot.objects.get(page=page, token=token)
    except (UndoSnapshot.DoesNotExist, ValueError):
        return None
    if snap.is_expired:
        snap.purge_expired(force=True)
        return None

    scope = snap.scope
    if scope == "banner":
        apply_banner_restore(page, snap)
    elif scope == "features":
        apply_features_restore(page, snap)
    elif scope.startswith("feature_card:"):
        apply_feature_card_restore(page, snap)
    else:
        return None

    # After successful undo, drop the snapshot (no purge of archived — already revived).
    # Any leftover archived rows for this token should be cleaned.
    for img in BannerImage.objects.filter(undo_token=snap.token, archived=True):
        if img.image:
            img.image.delete(save=False)
        img.delete()
    snap.delete()
    return snap
