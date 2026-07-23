"""
Text operations for AI Task Processing Platform.
Each operation is a pure function that takes input text and returns the result.
"""


def uppercase(text: str) -> str:
    """Convert text to uppercase."""
    return text.upper()


def lowercase(text: str) -> str:
    """Convert text to lowercase."""
    return text.lower()


def reverse_string(text: str) -> str:
    """Reverse the input text."""
    return text[::-1]


def word_count(text: str) -> str:
    """Count words in the text and return a detailed breakdown."""
    words = text.split()
    total = len(words)
    chars = len(text)
    chars_no_space = len(text.replace(" ", ""))
    lines = text.count("\n") + 1

    return (
        f"Word count: {total}\n"
        f"Character count: {chars}\n"
        f"Characters (no spaces): {chars_no_space}\n"
        f"Line count: {lines}"
    )


# Map operation type strings to handler functions
OPERATIONS = {
    "uppercase": uppercase,
    "lowercase": lowercase,
    "reverse_string": reverse_string,
    "word_count": word_count,
}


def execute_operation(operation_type: str, input_text: str) -> str:
    """
    Execute a text operation by type.
    Raises ValueError if operation_type is unknown.
    """
    handler = OPERATIONS.get(operation_type)
    if handler is None:
        raise ValueError(f"Unknown operation type: {operation_type}")
    return handler(input_text)
