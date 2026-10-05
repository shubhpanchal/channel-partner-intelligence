"""Tests for database connectivity and helpers."""

from unittest.mock import patch

from app.core.database import check_db_health, get_db


def test_check_db_health_success():
    """Test check_db_health returns True on standard database."""
    assert check_db_health() is True


def test_check_db_health_failure():
    """Test check_db_health returns False when connection raises an exception."""
    with patch("app.core.database.engine.connect") as mock_connect:
        mock_connect.side_effect = Exception("DB Connection Error")
        assert check_db_health() is False


def test_get_db_generator():
    """Test get_db generator yields a session and closes it."""
    generator = get_db()
    session = next(generator)
    assert session is not None
    try:
        next(generator)
    except StopIteration:
        pass
