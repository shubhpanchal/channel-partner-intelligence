"""Tests for CLI database management and seeding commands."""

from unittest.mock import patch

import pytest

from app.cli import main
from app.seed.validator import ValidationReport


def test_cli_help_no_args():
    """Test running CLI with no arguments exits with code 1."""
    with patch("sys.argv", ["cli.py"]), pytest.raises(SystemExit) as exc_info:
        main()
    assert exc_info.value.code == 1


def test_cli_init_db():
    """Test running init-db command."""
    with patch("sys.argv", ["cli.py", "init-db"]), patch("app.cli.init_db") as mock_init:
        main()
        mock_init.assert_called_once()


def test_cli_seed_db():
    """Test running seed-db command."""
    with patch("sys.argv", ["cli.py", "seed-db", "--seed", "42"]), \
         patch("app.cli.init_db") as mock_init, \
         patch("app.cli.seed_database", return_value={"projects": 5}) as mock_seed:
        main()
        mock_init.assert_called_once()
        mock_seed.assert_called_once()


def test_cli_validate_db_success():
    """Test running validate-db command with passing validation."""
    fake_report = ValidationReport()
    fake_report.add_check("Projects Count", True, "5")

    with patch("sys.argv", ["cli.py", "validate-db"]), \
         patch("app.cli.validate_dataset", return_value=fake_report), \
         patch("app.cli.print_validation_report") as mock_print:
        main()
        mock_print.assert_called_once_with(fake_report)


def test_cli_validate_db_failure_exits():
    """Test running validate-db command when validation fails exits with 1."""
    fake_report = ValidationReport()
    fake_report.add_check("Projects Count", False, "Missing projects")

    with patch("sys.argv", ["cli.py", "validate-db"]), \
         patch("app.cli.validate_dataset", return_value=fake_report), \
         patch("app.cli.print_validation_report"), \
         pytest.raises(SystemExit) as exc_info:
        main()
    assert exc_info.value.code == 1


def test_cli_reset_db_success():
    """Test running reset-db command successfully."""
    fake_report = ValidationReport()
    fake_report.add_check("Projects Count", True, "5")

    with patch("sys.argv", ["cli.py", "reset-db", "--seed", "42"]), \
         patch("app.cli.reset_db") as mock_reset, \
         patch("app.cli.seed_database", return_value={"projects": 5}) as mock_seed, \
         patch("app.cli.validate_dataset", return_value=fake_report), \
         patch("app.cli.print_validation_report"):
        main()
        mock_reset.assert_called_once()
        mock_seed.assert_called_once()


def test_cli_reset_db_failure_exits():
    """Test running reset-db command when validation fails exits with 1."""
    fake_report = ValidationReport()
    fake_report.add_check("Projects Count", False, "Reset validation error")

    with patch("sys.argv", ["cli.py", "reset-db", "--seed", "42"]), \
         patch("app.cli.reset_db") as mock_reset, \
         patch("app.cli.seed_database", return_value={"projects": 5}), \
         patch("app.cli.validate_dataset", return_value=fake_report), \
         patch("app.cli.print_validation_report"), \
         pytest.raises(SystemExit) as exc_info:
        main()
    mock_reset.assert_called_once()
    assert exc_info.value.code == 1
