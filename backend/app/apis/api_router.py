from fastapi import APIRouter
from .controller import loginController, dashboardController, profileController, courseController, gradeController

router = APIRouter()

# 注册登录相关路由
router.include_router(
    loginController.router,
    prefix="/auth",
    tags=["auth"]
)

# 注册仪表盘相关路由
router.include_router(
    dashboardController.router,
    prefix="/dashboard",
    tags=["仪表盘"]
)

# 注册个人信息相关路由
router.include_router(
    profileController.router,
    prefix="/profile",
    tags=["个人信息"]
)

# 注册课程管理相关路由
router.include_router(
    courseController.router,
    prefix="/course",
    tags=["课程管理"]
)

# 注册成绩管理相关路由
router.include_router(
    gradeController.router,
    prefix="/grade",
    tags=["成绩管理"]
)

# 后续可以在这里添加其他模块的路由
# router.include_router(
#     courseController.router,
#     prefix="/course",
#     tags=["课程管理"]
# )
