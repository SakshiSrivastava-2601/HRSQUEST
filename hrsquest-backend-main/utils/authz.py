from fastapi import Depends, HTTPException, status

from utils.user_authentication import get_current_user


ROLE_SUPERADMIN = "superadmin"
ROLE_TEACHER = "teacher"
ROLE_STUDENT = "student"


def require_roles(*allowed_roles: str):
    allowed = {role.lower() for role in allowed_roles}

    def dependency(current_user: dict = Depends(get_current_user)):
        role = str(current_user.get("role", "")).lower()
        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this resource.",
            )
        return current_user

    return dependency


def get_current_superadmin(current_user: dict = Depends(require_roles(ROLE_SUPERADMIN))):
    return current_user


def get_current_teacher(
    current_user: dict = Depends(require_roles(ROLE_SUPERADMIN, ROLE_TEACHER))
):
    return current_user


def get_current_student(current_user: dict = Depends(require_roles(ROLE_STUDENT))):
    return current_user
