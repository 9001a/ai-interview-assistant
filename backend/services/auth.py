from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from backend.config import settings


class AuthService:
    """认证服务"""
    
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.verification_codes = {}  # 内存存储验证码（生产环境用 Redis）
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """创建访问令牌"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt
    
    def verify_access_token(self, token: str) -> Optional[dict]:
        """验证访问令牌"""
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            email: str = payload.get("sub")
            if email is None:
                return None
            return {"email": email, "name": payload.get("name")}
        except JWTError:
            return None
    
    def generate_verification_code(self, email: str) -> str:
        """生成6位验证码"""
        import random
        code = str(random.randint(100000, 999999))
        self.verification_codes[email] = {
            "code": code,
            "expires_at": datetime.utcnow() + timedelta(minutes=5)
        }
        print(f"📧 验证码已生成: {email} -> {code}")  # 开发阶段打印
        return code
    
    def verify_code(self, email: str, code: str) -> bool:
        """验证验证码"""
        stored = self.verification_codes.get(email)
        if not stored:
            return False
        if stored["code"] != code:
            return False
        if datetime.utcnow() > stored["expires_at"]:
            del self.verification_codes[email]
            return False
        del self.verification_codes[email]
        return True
    
    def extract_username_from_email(self, email: str) -> str:
        """从邮箱中提取用户名"""
        return email.split("@")[0]


auth_service = AuthService()
