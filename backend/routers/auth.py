from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.services.auth import auth_service


router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer()


class SendCodeRequest(BaseModel):
    """发送验证码请求"""
    email: EmailStr


class VerifyCodeRequest(BaseModel):
    """验证验证码请求"""
    email: EmailStr
    code: str


class AuthResponse(BaseModel):
    """认证响应"""
    access_token: str
    token_type: str = "bearer"
    user: dict


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=401,
        detail="无法验证凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = auth_service.verify_access_token(credentials.credentials)
    if not user:
        raise credentials_exception
    return user


@router.post("/send-code")
async def send_verification_code(request: SendCodeRequest):
    """发送验证码"""
    code = auth_service.generate_verification_code(request.email)
    
    # 开发阶段返回验证码（生产环境需要真实发送邮件）
    return {
        "success": True,
        "message": "验证码已发送",
        "code": code,  # 开发阶段调试用，生产环境删除
    }


@router.post("/verify", response_model=AuthResponse)
async def verify_code_and_login(request: VerifyCodeRequest):
    """验证验证码并登录"""
    if not auth_service.verify_code(request.email, request.code):
        raise HTTPException(status_code=400, detail="验证码错误或已过期")
    
    # 提取用户名
    username = auth_service.extract_username_from_email(request.email)
    
    # 创建访问令牌
    access_token = auth_service.create_access_token(
        data={"sub": request.email, "name": username}
    )
    
    return AuthResponse(
        access_token=access_token,
        user={
            "email": request.email,
            "name": username
        }
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """获取当前用户信息"""
    return {
        "email": current_user["email"],
        "name": current_user["name"]
    }
