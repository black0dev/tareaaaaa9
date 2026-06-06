from fastapi import APIRouter

from app.schemas.common import APIResponse
from app.schemas.config import PublicConfigResponse

router = APIRouter(prefix="/config", tags=["Config"])


STORE_CONFIG = {
    "payment_methods": ["manual"],
    "shipping_cost": 1500,
    "delivery_modes": ["shipping", "pickup"],
}


@router.get("", response_model=APIResponse)
async def get_public_config():
    return APIResponse.success(data=STORE_CONFIG)
