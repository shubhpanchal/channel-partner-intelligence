"""Tests for configuration parsing and environment handling."""

from app.core.config import Settings


def test_default_settings():
    """Test standard default settings values."""
    config = Settings()
    assert config.PROJECT_NAME == "Channel Partner Intelligence"
    assert config.VERSION == "0.1.0"
    assert config.ENVIRONMENT in ["development", "production", "test"]
    assert config.API_V1_STR == "/api/v1"
    assert len(config.BACKEND_CORS_ORIGINS) >= 1


def test_cors_origins_parsing_comma_separated():
    """Test parsing comma-separated string for CORS origins."""
    config = Settings(BACKEND_CORS_ORIGINS="http://example.com, https://app.example.com")
    assert config.BACKEND_CORS_ORIGINS == ["http://example.com", "https://app.example.com"]


def test_cors_origins_parsing_json_list():
    """Test parsing JSON array string for CORS origins."""
    config = Settings(BACKEND_CORS_ORIGINS='["http://localhost:3000", "http://localhost:8080"]')
    assert config.BACKEND_CORS_ORIGINS == ["http://localhost:3000", "http://localhost:8080"]


def test_cors_origins_parsing_list():
    """Test passing a list directly."""
    config = Settings(BACKEND_CORS_ORIGINS=["http://site.com", "http://test.com"])
    assert config.BACKEND_CORS_ORIGINS == ["http://site.com", "http://test.com"]


def test_cors_origins_invalid_fallback():
    """Test fallback when given invalid format."""
    config = Settings(BACKEND_CORS_ORIGINS="[invalid json")
    assert "http://localhost:3000" in config.BACKEND_CORS_ORIGINS
