"""
RAG System - Data Models
Pydantic models for RAG requests and responses
"""

from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class RAGSearchRequest(BaseModel):
    """Request model for RAG search"""
    query: str
    top_k: Optional[int] = 5
    min_score: Optional[float] = 0.0


class RAGSearchResultItem(BaseModel):
    """Single search result item"""
    document_id: str
    content: str
    metadata: dict
    score: float
    source: str


class RAGSearchResponse(BaseModel):
    """Response model for RAG search"""
    success: bool
    query: str
    results: List[RAGSearchResultItem]
    count: int


class RAGUploadResponse(BaseModel):
    """Response model for document upload"""
    success: bool
    message: str
    document_id: Optional[str] = None
    chunks: int = 0
    file_name: Optional[str] = None


class DocumentMetadata(BaseModel):
    """Metadata for stored documents"""
    doc_id: str
    file_name: str
    doc_type: str  # 'compliance', 'user_upload', 'seed'
    source: str
    upload_date: str
    pages: int = 0
    chunks: int = 0


class RAGStatusResponse(BaseModel):
    """Response model for RAG system status"""
    success: bool
    total_documents: int
    total_chunks: int
    available_models: List[str]
    chroma_collection: str
    status: str


class RAGDeleteResponse(BaseModel):
    """Response model for document deletion"""
    success: bool
    message: str
    document_id: str
