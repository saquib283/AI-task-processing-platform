"""
Job processor for the task processing worker.
Handles the full lifecycle: validate → process → update MongoDB.
"""

from datetime import datetime, timezone
from bson import ObjectId
from .db import get_database
from .operations import execute_operation


def _append_log(db, task_id: str, message: str) -> None:
    """Append a timestamped log entry to the task document."""
    db.tasks.update_one(
        {"_id": ObjectId(task_id)},
        {
            "$push": {
                "logs": {
                    "timestamp": datetime.now(timezone.utc),
                    "message": message,
                }
            }
        },
    )


async def process_job(job, job_token) -> str:
    """
    BullMQ job processor.
    Receives a job with data: { taskId, operationType, inputText }
    Updates task status through the lifecycle: pending → running → success|failed
    """
    db = get_database()

    task_id = job.data.get("taskId")
    operation_type = job.data.get("operationType")
    input_text = job.data.get("inputText")

    print(f"Processing job {job.id} | Task: {task_id} | Op: {operation_type}")

    try:
        # Idempotency check
        task = db.tasks.find_one({"_id": ObjectId(task_id)})
        if not task:
            print(f"Task {task_id} not found in database. Skipping.")
            return "skipped: task not found"

        if task.get("status") in ("success", "failed"):
            # Skip if already in a terminal state
            print(f"Task {task_id} already in terminal state: {task['status']}. Skipping.")
            return f"skipped: already {task['status']}"

        # Transition to running state
        _append_log(db, task_id, "Started processing")

        db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {
                    "status": "running",
                    "startedAt": datetime.now(timezone.utc),
                }
            },
        )

        # Validate input
        _append_log(db, task_id, "Validating input")

        if not input_text or not isinstance(input_text, str):
            raise ValueError("Input text is empty or invalid")

        if not operation_type:
            raise ValueError("Operation type is missing")

        # Execute operation
        _append_log(db, task_id, f"Processing operation: {operation_type}")

        result = execute_operation(operation_type, input_text)

        # Record success
        _append_log(db, task_id, "Completed successfully")

        db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {
                "$set": {
                    "status": "success",
                    "result": result,
                    "completedAt": datetime.now(timezone.utc),
                }
            },
        )

        print(f"Task {task_id} completed successfully")
        return result

    except Exception as exc:
        # Handle failure
        error_msg = f"Failed with error: {str(exc)}"
        print(f"Task {task_id} failed: {exc}")

        try:
            _append_log(db, task_id, error_msg)
            db.tasks.update_one(
                {"_id": ObjectId(task_id)},
                {
                    "$set": {
                        "status": "failed",
                        "result": None,
                        "completedAt": datetime.now(timezone.utc),
                    }
                },
            )
        except Exception as db_err:
            print(f"Failed to update task status in DB: {db_err}")

        raise exc
