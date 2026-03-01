"""
RAG System - Core Implementation
Free RAG using Chromadb + Simple Embeddings (no TensorFlow/ML dependencies)
"""

import os
import uuid
from datetime import datetime
from typing import List, Dict, Any
import hashlib
import math
import re

try:
    import chromadb
    from chromadb.config import Settings
except ImportError:
    import subprocess
    subprocess.check_call(["pip", "install", "chromadb", "-q"])
    import chromadb
    from chromadb.config import Settings

try:
    import PyPDF2
except ImportError:
    import subprocess
    subprocess.check_call(["pip", "install", "PyPDF2", "-q"])
    import PyPDF2

try:
    from docx import Document
except ImportError:
    import subprocess  
    subprocess.check_call(["pip", "install", "python-docx", "-q"])
    from docx import Document


class SimpleEmbedder:
    """Simple text embedder using hash-based approach (zero ML dependencies)"""
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple word tokenization"""
        text = text.lower()
        words = re.findall(r'\b\w+\b', text)
        return [w for w in words if len(w) > 2]
    
    def encode(self, texts: List[str]) -> List[List[float]]:
        """Encode texts to 384-dimensional embeddings"""
        embeddings = []
        for text in texts:
            tokens = self._tokenize(text)
            embedding = self._create_embedding(tokens)
            embeddings.append(embedding)
        return embeddings
    
    def _create_embedding(self, tokens: List[str]) -> List[float]:
        """Create embedding from tokens using consistent hashing"""
        embedding = [0.0] * 384
        
        if not tokens:
            return embedding
        
        for token in tokens:
            h = int(hashlib.md5(token.encode()).hexdigest(), 16)
            idx1 = h % 384
            idx2 = (h // 384) % 384
            
            embedding[idx1] += 0.6 / len(tokens)
            embedding[idx2] += 0.4 / len(tokens)
        
        # L2 normalize
        norm = math.sqrt(sum(x**2 for x in embedding))
        if norm > 0:
            embedding = [x / norm for x in embedding]
        
        return embedding


class RAGSystem:
    """Free RAG System using Chroma + Simple Embeddings"""
    
    def __init__(self, persist_dir: str = None):
        """Initialize RAG system"""
        self.persist_dir = persist_dir or os.path.join(os.path.dirname(__file__), "..", "rag_data")
        os.makedirs(self.persist_dir, exist_ok=True)
        
        print(f"📦 Initializing RAG System...")
        
        # Initialize Chroma with new PersistentClient API
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        
        # Use simple embedder
        self.embedding_model = SimpleEmbedder()
        print(f"🖧 Using simple hash-based embeddings (zero dependencies)")
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="msme_knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )
        
        print(f"✅ RAG System ready!")
        self.document_metadata = {}
    
    def add_text_document(self, text: str, doc_id: str, metadata: Dict[str, Any]) -> int:
        """Add text document with automatic chunking"""
        chunks = self._chunk_text(text, chunk_size=500, overlap=100)
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{doc_id}_chunk_{i}"
            embeddings = self.embedding_model.encode([chunk])
            
            self.collection.add(
                ids=[chunk_id],
                documents=[chunk],
                embeddings=embeddings,
                metadatas=[{
                    **metadata,
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "doc_id": doc_id
                }]
            )
        
        self.document_metadata[doc_id] = {
            "chunks": len(chunks),
            "metadata": metadata,
            "added_date": datetime.now().isoformat()
        }
        
        print(f"✅ Added '{doc_id}': {len(chunks)} chunks")
        return len(chunks)
    
    def add_pdf_document(self, file_path: str, doc_id: str = None, metadata: Dict = None) -> int:
        """Extract text from PDF and add to RAG"""
        doc_id = doc_id or f"pdf_{uuid.uuid4().hex[:8]}"
        
        try:
            text = ""
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text() + "\n"
            
            file_name = os.path.basename(file_path)
            default_metadata = {
                "source": file_path,
                "file_name": file_name,
                "doc_type": "pdf",
                "created_date": datetime.now().isoformat()
            }
            
            if metadata:
                default_metadata.update(metadata)
            
            chunks = self.add_text_document(text, doc_id, default_metadata)
            return chunks
            
        except Exception as e:
            print(f"❌ PDF error: {e}")
            return 0
    
    def add_docx_document(self, file_path: str, doc_id: str = None, metadata: Dict = None) -> int:
        """Extract text from DOCX and add to RAG"""
        doc_id = doc_id or f"docx_{uuid.uuid4().hex[:8]}"
        
        try:
            doc = Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            
            file_name = os.path.basename(file_path)
            default_metadata = {
                "source": file_path,
                "file_name": file_name,
                "doc_type": "docx",
                "created_date": datetime.now().isoformat()
            }
            
            if metadata:
                default_metadata.update(metadata)
            
            chunks = self.add_text_document(text, doc_id, default_metadata)
            return chunks
            
        except Exception as e:
            print(f"❌ DOCX error: {e}")
            return 0
    
    def search(self, query: str, top_k: int = 5, min_score: float = 0.0) -> List[Dict[str, Any]]:
        """Search RAG for relevant documents"""
        query_embedding = self.embedding_model.encode([query])
        
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        
        search_results = []
        if results and results["documents"]:
            for doc, metadata, distance in zip(
                results["documents"][0],
                results["metadatas"][0],
                results["distances"][0]
            ):
                similarity_score = max(0, 1 - (distance / 2))
                
                if similarity_score >= min_score:
                    search_results.append({
                        "content": doc,
                        "metadata": metadata,
                        "score": round(similarity_score, 4),
                        "source": metadata.get("source", "Unknown")
                    })
        
        return search_results
    
    def delete_document(self, doc_id: str) -> bool:
        """Delete a document from RAG"""
        try:
            results = self.collection.get(
                where={"doc_id": {"$eq": doc_id}}
            )
            
            if results["ids"]:
                self.collection.delete(ids=results["ids"])
                
                if doc_id in self.document_metadata:
                    del self.document_metadata[doc_id]
                
                print(f"✅ Deleted: '{doc_id}'")
                return True
            else:
                print(f"⚠️ Not found: '{doc_id}'")
                return False
                
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def get_status(self) -> Dict[str, Any]:
        """Get RAG system status"""
        collection_count = self.collection.count()
        
        return {
            "status": "active",
            "total_documents": len(self.document_metadata),
            "total_chunks": collection_count,
            "embedding_model": "simple_hash_based  (zero dependencies)",
            "vector_store": "chromadb",
            "persist_directory": self.persist_dir,
            "documents": list(self.document_metadata.keys())
        }
    
    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 100) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end].strip()
            
            if chunk:
                chunks.append(chunk)
            
            start += chunk_size - overlap
        
        return chunks if chunks else [text]
    
    def batch_add_documents(self, documents: List[Dict[str, str]]) -> Dict[str, int]:
        """Add multiple documents at once"""
        results = {}
        for doc in documents:
            try:
                chunks = self.add_text_document(
                    doc["text"],
                    doc["doc_id"],
                    doc.get("metadata", {})
                )
                results[doc["doc_id"]] = chunks
            except Exception as e:
                print(f"❌ Error: {e}")
                results[doc.get("doc_id", "unknown")] = 0
        
        return results


_rag_instance = None


def initialize_rag(persist_dir: str = None) -> RAGSystem:
    """Initialize global RAG instance"""
    global _rag_instance
    _rag_instance = RAGSystem(persist_dir)
    return _rag_instance


def get_rag_instance() -> RAGSystem:
    """Get global RAG instance"""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = RAGSystem()
    return _rag_instance
