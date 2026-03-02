from fastapi import APIRouter
from app.api.v1.endpoints import documents, petitions, admin_rag, users, admin_articles, compat, payments

api_router = APIRouter()

# Include sub-routers here
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(petitions.router, prefix="/petitions", tags=["petitions"])
api_router.include_router(admin_rag.router, prefix="/admin/rag", tags=["admin-rag"])
api_router.include_router(admin_articles.admin_router, prefix="/admin/articles", tags=["admin-articles"])
api_router.include_router(admin_articles.public_router, prefix="/articles", tags=["articles"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(compat.router, tags=["compat"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])

# Future endpoints:
# api_router.include_router(users.router, prefix="/users", tags=["users"])
