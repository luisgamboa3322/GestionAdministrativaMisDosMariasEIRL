import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, status


class SlidingWindowRateLimiter:
    """Thread-safe in-memory sliding-window rate limiter for sensitive endpoints."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 300) -> None:
        self._max_requests = max_requests
        self._window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> None:
        """Raise HTTP 429 if the key exceeded max_requests within the current window."""
        now = time.monotonic()
        cutoff = now - self._window_seconds
        with self._lock:
            bucket = self._hits[key]
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self._max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Demasiados intentos de inicio de sesión. Espera unos minutos.",
                )
            bucket.append(now)

    def reset(self, key: str | None = None) -> None:
        """Clear recorded attempts for a key or all keys (primarily for tests)."""
        with self._lock:
            if key is None:
                self._hits.clear()
            else:
                self._hits.pop(key, None)


login_rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_seconds=300)
