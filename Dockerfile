# 使用官方 Python 基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY backend/ ./backend/
COPY edu-score-manager/dist/ ./edu-score-manager/dist/

# 安装依赖
RUN pip install --no-cache-dir -r backend/requirements.txt

# 暴露端口
EXPOSE 8001

# 启动命令
CMD ["python", "backend/main.py"] 