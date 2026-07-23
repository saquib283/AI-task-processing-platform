"""
AI Task Processing Worker — Main Entry Point

Consumes jobs from the BullMQ 'task-processing' queue and processes them.
Supports horizontal scaling: multiple replicas can safely consume from
the same Redis queue without double-processing (BullMQ handles atomic
job claiming via Redis + Lua scripts).
"""

import asyncio
import signal
import sys
from bullmq import Worker

from .config import config
from .processor import process_job
from .db import get_database, close_database


# Track shutdown state
_shutdown_event = asyncio.Event()


def _handle_signal(sig, frame):
    """Handle shutdown signals gracefully."""
    print(f"\nReceived signal {sig}. Shutting down gracefully...")
    _shutdown_event.set()


async def main():
    """Start the BullMQ worker and run until shutdown."""

    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    # Verify MongoDB connection on startup
    try:
        get_database()
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        sys.exit(1)

    # Create BullMQ worker
    redis_url = f"redis://{config.REDIS_HOST}:{config.REDIS_PORT}"

    worker = Worker(
        "task-processing",
        process_job,
        {
            "connection": redis_url,
            "concurrency": config.WORKER_CONCURRENCY,
            "autorun": True,
        },
    )

    print(
        f"AI Task Worker started | Queue: task-processing | "
        f"Concurrency: {config.WORKER_CONCURRENCY} | Redis: {redis_url}"
    )

    # Wait for shutdown signal
    await _shutdown_event.wait()

    # Cleanup
    print("Closing worker...")
    await worker.close()
    close_database()
    print("Worker shut down cleanly.")


if __name__ == "__main__":
    asyncio.run(main())
