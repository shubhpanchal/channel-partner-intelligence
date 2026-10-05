"""Tests for health check endpoints."""

from unittest.mock import patch

from fastapi.testclient import TestClient


def test_root_endpoint(client: TestClient):
    """Test GET / returns service information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert "environment" in data
    assert data["health"] == "/health"


def test_root_health_endpoint_healthy(client: TestClient):
    """Test GET /health returns healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "project" in data
    assert "version" in data
    assert "timestamp" in data
    assert data["database"]["status"] == "connected"
    assert data["database"]["type"] == "sqlite"


def test_api_v1_health_endpoint(client: TestClient):
    """Test GET /api/v1/health returns healthy status."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"]["status"] == "connected"


def test_health_endpoint_degraded_when_db_fails(client: TestClient):
    """Test health check returns degraded when database check raises error."""
    with patch("app.api.v1.health.check_db_health", return_value=False):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"]["status"] == "disconnected"
