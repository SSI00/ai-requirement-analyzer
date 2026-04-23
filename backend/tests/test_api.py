"""
API测试
功能: 测试需求分析API接口
状态: ✅ 已实现
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """测试健康检查接口"""
    response = client.get("/api/v1/requirements/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_root():
    """测试根路径"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data


@pytest.mark.skip(reason="需要配置OpenAI API Key")
def test_analyze_requirement():
    """测试需求分析接口 (需要API Key)"""
    payload = {
        "input_data": {
            "content": "我想要一个电商平台的秒杀功能，用户可以在特定时间抢购限量商品",
            "project_context": "B2C电商平台，日活用户约10万"
        }
    }
    response = client.post("/api/v1/requirements/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "understanding" in data
    assert "analysis" in data
    assert "output" in data
