from core.database import engine, SessionLocal, Base
from sqlalchemy import text, inspect
from models.student import Student
from models.teacher import Teacher
from models.course import Course
from models.grade import StudentGrade, StudentCourse



def test_database_connection():
    try:
        # 创建数据库会话
        db = SessionLocal()
        # 尝试查询，使用 text() 包装 SQL 语句
        db.execute(text("SELECT 1"))
        print("✅ 数据库连接成功！")
        
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        print("✅ 所有数据表创建成功！")
        
        # 检查表是否存在
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print("\n已创建的表：")
        for table in tables:
            print(f"- {table}")
        
        return True
    except Exception as e:
        print("❌ 数据库连接失败！")
        print(f"错误信息: {str(e)}")
        return False
    finally:
        db.close()


print("开始测试数据库连接...")
test_database_connection()
print("\n测试完成")
