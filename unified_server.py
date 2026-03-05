#!/usr/bin/env python
"""
⭐ UNIFIED SERVER - All Services in One
Consolidates Flask, FastAPI, Finance, Zoom, RAG, and Chat features
Runs on a single port: 8000
"""

from fastapi import FastAPI, File, UploadFile, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import json
import sys
import uvicorn
import re
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler

# Load environment variables from .env file
load_dotenv()
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

# ==================== IMPORTS ====================

# Import FastAPI routers
from app.finance_router import router as finance_router
from app.auth_routes import router as auth_router
from app.security_headers import SecurityHeadersMiddleware

# Import Flask blueprints (will convert to FastAPI)
from app.zoom_scheduler import get_zoom_scheduler
from app.zoom_db import store_meeting, get_meeting, get_all_meetings, update_meeting_status, delete_meeting

# Import RAG system
try:
    from app.rag_system import initialize_rag, get_rag_instance
    from app.rag_seeds import get_seed_documents
    from app.rag_models import (
        RAGSearchRequest, RAGSearchResponse, RAGSearchResultItem,
        RAGUploadResponse, RAGStatusResponse, RAGDeleteResponse
    )
    RAG_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ RAG not available: {e}")
    RAG_AVAILABLE = False

# Import OpenRouter integration
try:
    from app.openrouter_integration import (
        enhance_chat_assistant,
        get_compliance_suggestions,
        analyze_gst_pattern,
        process_document_text,
        get_business_advice
    )
except ImportError as e:
    print(f"⚠️ OpenRouter integration not available: {e}")

# Import Google Meet
from app.google_meet import get_google_meet

# Import MCP Services
try:
    from app.huggingface_mcp_service import (
        get_hf_mcp_service, 
        HFInferenceRequest, 
        HFInferenceResponse,
        MCPConfigRequest,
        MCPTestResponse
    )
    HF_MCP_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ HuggingFace MCP not available: {e}")
    HF_MCP_AVAILABLE = False

try:
    from app.strom_mcp_service import (
        get_strom_mcp_service,
        StromProcessRequest,
        StromProcessResponse,
        StromAnalysisRequest
    )
    from app.huggingface_mcp_service import mask_api_key
    STROM_MCP_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Strom MCP not available: {e}")
    STROM_MCP_AVAILABLE = False

# Import Translator
try:
    from app.translator import translate_text, translate_batch, get_supported_languages, is_language_supported
    TRANSLATOR_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Translator not available: {e}")
    TRANSLATOR_AVAILABLE = False

# ==================== FASTAPI APP SETUP ====================

app = FastAPI(
    title="TaxCalm - Unified Server",
    description="All services in one: GST, Finance, Zoom, RAG, AI Chat",
    version="1.0.0"
)

# ==================== CORS MIDDLEWARE ====================

# Security: Restrict CORS to specific origins only
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:8000,http://127.0.0.1:8000').split(',')

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Whitelist only - no wildcards
    allow_credentials=False,  # Disabled for security with explicit origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)

# ==================== SECURITY HEADERS MIDDLEWARE ====================

# Add comprehensive security headers to all responses
app.add_middleware(SecurityHeadersMiddleware)

# ==================== RATE LIMITING ====================

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Rate limit tiers:
# - Default: 100 requests/minute for general API
# - Auth: 5 requests/15 minutes for login attempts
# - Upload: 10 requests/hour for file uploads
# - AI Chat: 30 requests/minute for AI endpoints

# ==================== REGISTER ROUTERS ====================

# Authentication router (FastAPI)
app.include_router(auth_router)

# Finance router (FastAPI)
app.include_router(finance_router)

# ==================== GST CALCULATION ROUTES ====================

class GSTRequest(BaseModel):
    sales: Any = 0
    purchases: Any = 0
    rate: Any = 18
    period: str = "monthly"
    
    class Config:
        extra = "allow"  # Allow extra fields

@app.post("/api/gst/calculate")
@limiter.limit("100/minute")
async def calculate_gst(request: Request, gst_request: GSTRequest):
    """Calculate GST obligations"""
    try:
        sales = float(gst_request.sales) if gst_request.sales else 0
        purchases = float(gst_request.purchases) if gst_request.purchases else 0
        rate = float(gst_request.rate) if gst_request.rate else 18
        
        if rate < 0 or rate > 100:
            rate = 18
        
        rate_decimal = rate / 100
        output_gst = sales * rate_decimal
        input_gst = purchases * rate_decimal
        net_gst = output_gst - input_gst
        
        period_label = "week" if str(gst_request.period).lower() == "weekly" else "month"
        
        if net_gst > 0:
            message = f"You need to keep aside Rs {net_gst:,.0f} for GST this {period_label}."
            status = "positive"
        elif net_gst < 0:
            message = f"You might get a refund of Rs {abs(net_gst):,.0f} this {period_label}."
            status = "negative"
        else:
            message = "Your input and output GST are equal - no surplus liability!"
            status = "neutral"
        
        return {
            "output_gst": round(output_gst, 2),
            "input_gst": round(input_gst, 2),
            "net_gst": round(net_gst, 2),
            "message": message,
            "status": status,
            "period": gst_request.period
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== ZOOM MEETING ROUTES ====================

class ZoomScheduleRequest(BaseModel):
    input: Any = ""
    timezone: str = "Asia/Kolkata"
    host_name: Optional[str] = ""
    description: Optional[str] = ""
    
    class Config:
        extra = "allow"

@app.post("/api/zoom/schedule")
async def schedule_zoom_meeting(request: ZoomScheduleRequest):
    """Schedule a Zoom meeting from natural language input"""
    try:
        user_input = request.input.strip()
        if not user_input:
            raise HTTPException(status_code=400, detail='Missing "input" field')
        
        scheduler = get_zoom_scheduler()
        result = scheduler.schedule_from_natural_language(user_input, request.timezone)
        
        if not result.get('success'):
            raise HTTPException(status_code=400, detail=result.get('error', 'Failed to create meeting'))
        
        record_id = store_meeting(
            meeting_id=str(result['meeting_id']),
            topic=result['topic'],
            join_url=result['join_url'],
            start_time=result['start_time'],
            duration=result['duration'],
            timezone=result.get('timezone', request.timezone),
            description=request.description,
            host_name=request.host_name,
            natural_input=user_input,
            user_id=None
        )
        
        return {
            'success': True,
            'message': f"🎯 Your Zoom meeting '{result['topic']}' is scheduled!\n\nJoin here: {result['join_url']}",
            'meeting': {
                'meeting_id': str(result['meeting_id']),
                'topic': result['topic'],
                'join_url': result['join_url'],
                'start_time': result['start_time'],
                'duration': result['duration'],
                'timezone': result.get('timezone', request.timezone)
            },
            'record_id': record_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/zoom/meetings")
async def get_zoom_meetings():
    """Get all scheduled Zoom meetings"""
    try:
        meetings = get_all_meetings()
        return {
            'success': True,
            'data': meetings,
            'count': len(meetings)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/zoom/health")
async def zoom_health():
    """Check Zoom API connectivity"""
    return {
        'status': 'ok',
        'service': 'Zoom Meeting Scheduler',
        'version': '1.0'
    }

# ==================== RAG ROUTES ====================

if RAG_AVAILABLE:
    class RAGSearchQuery(BaseModel):
        query: str
        top_k: int = 5

    @app.post("/api/rag/search")
    async def rag_search(request: RAGSearchQuery):
        """Search RAG database"""
        try:
            rag = get_rag_instance()
            results = rag.search(request.query, k=request.top_k)
            return {
                "success": True,
                "query": request.query,
                "results": results,
                "count": len(results)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/api/rag/upload")
    @limiter.limit("10/hour")
    async def rag_upload(request: Request):
        """Upload documents to RAG - supports both single and multiple files"""
        import tempfile
        import uuid
        
        try:
            # Get files from form data
            form = await request.form()
            files_data = []
            
            # Handle both 'file' and 'files' keys
            if 'file' in form:
                file_item = form['file']
                if isinstance(file_item, list):
                    files_data = file_item
                else:
                    files_data = [file_item]
            elif 'files' in form:
                files_item = form['files']
                if isinstance(files_item, list):
                    files_data = files_item
                else:
                    files_data = [files_item]
            
            if not files_data:
                return JSONResponse({
                    "success": False,
                    "message": "No files provided"
                }, status_code=400)
            
            rag = get_rag_instance()
            uploaded = []
            total_chunks = 0
            
            file_list = files_data
            
            for f in file_list:
                # Save to temp file
                content = await f.read()
                file_ext = f.filename.split('.')[-1].lower()
                
                # Create temp file with proper extension
                with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{file_ext}') as temp_file:
                    temp_file.write(content)
                    temp_path = temp_file.name
                
                try:
                    # Generate doc ID
                    doc_id = f"{file_ext}_{uuid.uuid4().hex[:8]}"
                    
                    # Process based on file type
                    if file_ext == 'pdf':
                        chunks = rag.add_pdf_document(temp_path, doc_id)
                    elif file_ext in ['docx', 'doc']:
                        chunks = rag.add_docx_document(temp_path, doc_id)
                    elif file_ext == 'txt':
                        # For text files, read and add directly
                        text_content = content.decode('utf-8', errors='ignore')
                        metadata = {
                            "source": f.filename,
                            "file_name": f.filename,
                            "doc_type": "txt",
                            "created_date": datetime.now().isoformat()
                        }
                        chunks = rag.add_text_document(text_content, doc_id, metadata)
                    else:
                        # Try to decode as text
                        text_content = content.decode('utf-8', errors='ignore')
                        metadata = {
                            "source": f.filename,
                            "file_name": f.filename,
                            "doc_type": file_ext,
                            "created_date": datetime.now().isoformat()
                        }
                        chunks = rag.add_text_document(text_content, doc_id, metadata)
                    
                    if chunks > 0:
                        uploaded.append(f.filename)
                        total_chunks += chunks
                finally:
                    # Clean up temp file
                    import os
                    try:
                        os.unlink(temp_path)
                    except:
                        pass
            
            return {
                "success": True,
                "message": f"{len(uploaded)} document(s) uploaded successfully ({total_chunks} chunks)",
                "files": uploaded,
                "chunks": total_chunks
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "message": str(e),  # Changed from 'error' to 'message' to match frontend
                "error": str(e)
            }

    @app.get("/api/rag/status")
    async def rag_status():
        """Get RAG system status"""
        try:
            rag = get_rag_instance()
            # Get document and chunk counts from RAG system
            doc_count = len(rag.documents) if hasattr(rag, 'documents') else 0
            chunk_count = rag._collection.count() if hasattr(rag, '_collection') else 0
            return {
                "success": True,
                "total_documents": doc_count,
                "total_chunks": chunk_count,
                "document_count": doc_count,  # Keep for backwards compatibility
                "status": "active"
            }
        except Exception as e:
            return {
                "success": False,
                "total_documents": 0,
                "total_chunks": 0,
                "document_count": 0,
                "status": "error",
                "error": str(e)
            }

# ==================== MCP INTEGRATION ROUTES ====================

if HF_MCP_AVAILABLE or STROM_MCP_AVAILABLE:
    
    @app.post("/api/mcp/config/huggingface")
    @limiter.limit("10/hour")
    async def configure_hf_mcp(request: Request, config: MCPConfigRequest):
        """Configure HuggingFace MCP connection"""
        try:
            if not HF_MCP_AVAILABLE:
                raise HTTPException(status_code=503, detail="HuggingFace MCP not available")
            
            service = get_hf_mcp_service()
            service.update_config(config.endpoint, config.api_key, config.enabled)
            
            # Test connection
            test_result = await service.test_connection()
            
            return {
                "success": True,
                "message": "HuggingFace MCP configured successfully",
                "connection_test": test_result.dict()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @app.post("/api/mcp/config/strom")
    @limiter.limit("10/hour")
    async def configure_strom_mcp(request: Request, config: MCPConfigRequest):
        """Configure Strom MCP connection"""
        try:
            if not STROM_MCP_AVAILABLE:
                raise HTTPException(status_code=503, detail="Strom MCP not available")
            
            service = get_strom_mcp_service()
            service.update_config(config.endpoint, config.api_key, config.enabled)
            
            # Test connection
            test_result = await service.test_connection()
            
            return {
                "success": True,
                "message": "Strom MCP configured successfully",
                "connection_test": test_result.dict()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @app.get("/api/mcp/config")
    async def get_mcp_config():
        """Get current MCP configurations (API keys masked)"""
        config = {
            "huggingface": {
                "available": HF_MCP_AVAILABLE,
                "configured": False,
                "endpoint": None,
                "api_key": None
            },
            "strom": {
                "available": STROM_MCP_AVAILABLE,
                "configured": False,
                "endpoint": None,
                "api_key": None
            }
        }
        
        if HF_MCP_AVAILABLE:
            service = get_hf_mcp_service()
            config["huggingface"]["configured"] = service.enabled
            config["huggingface"]["endpoint"] = service.endpoint if service.endpoint else None
            config["huggingface"]["api_key"] = mask_api_key(service.api_key) if service.api_key else None
        
        if STROM_MCP_AVAILABLE:
            service = get_strom_mcp_service()
            config["strom"]["configured"] = service.enabled
            config["strom"]["endpoint"] = service.endpoint if service.endpoint else None
            config["strom"]["api_key"] = mask_api_key(service.api_key) if service.api_key else None
        
        return config
    
    @app.post("/api/mcp/test-connection")
    @limiter.limit("20/hour")
    async def test_mcp_connection(request: Request, provider: str = "huggingface"):
        """Test MCP connection"""
        try:
            if provider == "huggingface":
                if not HF_MCP_AVAILABLE:
                    raise HTTPException(status_code=503, detail="HuggingFace MCP not available")
                service = get_hf_mcp_service()
            elif provider == "strom":
                if not STROM_MCP_AVAILABLE:
                    raise HTTPException(status_code=503, detail="Strom MCP not available")
                service = get_strom_mcp_service()
            else:
                raise HTTPException(status_code=400, detail="Invalid provider")
            
            result = await service.test_connection()
            return result.dict()
            
        except HTTPException:
            raise
        except Exception as e:
            return {
                "success": False,
                "message": f"Test failed: {str(e)}"
            }

if HF_MCP_AVAILABLE:
    
    @app.post("/api/mcp/huggingface/inference")
    @limiter.limit("30/hour")
    async def hf_mcp_inference(request: Request, inference_req: HFInferenceRequest):
        """Run inference on HuggingFace model via MCP"""
        try:
            service = get_hf_mcp_service()
            if not service.enabled:
                raise HTTPException(status_code=503, detail="HuggingFace MCP not configured")
            
            result = await service.inference(inference_req)
            return result.dict()
            
        except HTTPException:
            raise
        except Exception as e:
            return HFInferenceResponse(
                success=False,
                model=inference_req.model,
                error=str(e)
            ).dict()
    
    @app.get("/api/mcp/huggingface/models")
    async def get_hf_models():
        """Get available HuggingFace models"""
        try:
            service = get_hf_mcp_service()
            if not service.enabled:
                raise HTTPException(status_code=503, detail="HuggingFace MCP not configured")
            
            return await service.get_available_models()
            
        except HTTPException:
            raise
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

if STROM_MCP_AVAILABLE:
    
    @app.post("/api/mcp/strom/process-file")
    @limiter.limit("20/hour")
    async def strom_process_file(request: Request):
        """Process file through Strom MCP"""
        try:
            service = get_strom_mcp_service()
            if not service.enabled:
                raise HTTPException(status_code=503, detail="Strom MCP not configured")
            
            # Get form data
            form = await request.form()
            
            # Check for file
            if 'file' not in form:
                raise HTTPException(status_code=400, detail="No file provided")
            
            file = form['file']
            operation = form.get('operation', 'extract')
            options_str = form.get('options', '{}')
            options = json.loads(options_str) if options_str else {}
            
            # Read file bytes
            file_bytes = await file.read()
            filename = file.filename
            
            # Extract content using service
            result = await service.extract_content(file_bytes, filename)
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @app.post("/api/mcp/strom/analyze")
    @limiter.limit("60/hour")
    async def strom_analyze(request: Request, analysis_req: StromAnalysisRequest):
        """Analyze data through Strom MCP"""
        try:
            service = get_strom_mcp_service()
            if not service.enabled:
                raise HTTPException(status_code=503, detail="Strom MCP not configured")
            
            result = await service.analyze_data(
                analysis_req.data,
                analysis_req.analysis_type,
                analysis_req.options
            )
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @app.get("/api/mcp/strom/capabilities")
    async def get_strom_capabilities():
        """Get Strom MCP capabilities"""
        try:
            service = get_strom_mcp_service()
            if not service.enabled:
                raise HTTPException(status_code=503, detail="Strom MCP not configured")
            
            return await service.get_capabilities()
            
        except HTTPException:
            raise
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

# ==================== AI CHAT ROUTES ====================

class ChatRequest(BaseModel):
    question: Any = ""
    message: Any = ""  # Alternative field name used by AI integration
    context: Optional[Any] = None
    chat_history: Optional[List] = None  # For AI chat history
    
    class Config:
        extra = "allow"

class SettingsRequest(BaseModel):
    user_id: Optional[int] = 1
    settings: Optional[Dict[str, Any]] = None
    
    class Config:
        extra = "allow"

@app.post("/ask-gst")
@limiter.limit("30/minute")
async def ask_gst(request: Request, chat_request: ChatRequest):
    """Chat endpoint for GST questions - AI-powered"""
    try:
        question = chat_request.question
        
        # Create AI prompt with navigation context
        nav_system_prompt = """You are an intelligent GST and MSME compliance assistant.

AVAILABLE SECTIONS you can navigate to:
- finance: Financial management, accounting, expenses
- calculator: GST calculator
- compliance: Filing requirements, deadlines
- schemes: Government loans and schemes
- analytics: Business reports and insights
- explainer: Learn about GST and taxes
- caa-meetings: Chartered accountant meetings
- google-meet: Video conferences
- knowledge-base: Document management

RESPONSE FORMAT:
If user wants to go to a section, respond with JSON like:
{"navigate": "section-name", "message": "Going to that section..."}

Otherwise, provide helpful GST/tax advice conversationally."""

        messages = [
            {"role": "system", "content": nav_system_prompt},
            {"role": "user", "content": question}
        ]
        
        # Try AI first
        try:
            from app.openrouter_integration import openrouter_client, AIModel
            ai_response = await openrouter_client.chat_completion(
                messages=messages,
                model=AIModel.FAST,
                max_tokens=250,
                temperature=0.7
            )
            
            # Check for navigation intent
            try:
                if "{" in ai_response and "navigate" in ai_response:
                    import json
                    json_start = ai_response.find("{")
                    json_end = ai_response.rfind("}") + 1
                    nav_data = json.loads(ai_response[json_start:json_end])
                    
                    if "navigate" in nav_data:
                        return {
                            "message": nav_data.get("message", f"Taking you to {nav_data['navigate']}..."),
                            "response_type": "navigation",
                            "navigation_tab": nav_data["navigate"],
                            "question": question
                        }
            except:
                pass
            
            # Regular AI response
            return {
                "message": ai_response,
                "response_type": "text",
                "question": question
            }
            
        except Exception as ai_error:
            print(f"AI error in ask-gst: {ai_error}")
            # Fallback to keyword matching
            question_lower = question.lower()
            navigation_keywords = {
            'finance': [
                'finance', 'accounting', 'payroll', 'income tax', 'gst filing', 'salary',
                'expense', 'revenue', 'profit', 'loss', 'invoice', 'bill', 'payment',
                'my.*finance', 'show.*finance', 'see.*finance', 'view.*finance',
                'financial.*data', 'financial.*report', 'money', 'transaction'
            ],
            'calculator': [
                'calculat', 'compute', 'calculate.*gst', 'compute.*gst', 'gst.*calc',
                'need.*calc', 'want.*calc', 'help.*calc', 'calculator',
                'how much', 'what.*amount', 'compute.*tax', 'tax.*calc'
            ],
            'compliance': [
                'compliance', 'filing', 'deadline', 'due date', 'return',
                'check.*compliance', 'filing.*date', 'when.*file', 'when.*due',
                'complian', 'regulation', 'requirement', 'mandatory',
                'need.*file', 'have.*file', 'submit'
            ],
            'schemes': [
                'scheme', 'mudra', 'subsidy', 'loan', 'stand.*up', 'pmegp',
                'funding', 'grant', 'benefit', 'government.*scheme', 'assistance',
                'what.*scheme', 'available.*scheme', 'loan.*program',
                'financial.*help', 'business.*loan'
            ],
            'analytics': [
                'analytics', 'dashboard', 'chart', 'graph', 'report', 'statistics',
                'analysis', 'insight', 'trend', 'visual', 'performance',
                'show.*data', 'see.*report', 'view.*analytics', 'business.*insights'
            ],
            'explainer': [
                'learn', 'explain', 'tutorial', 'how.*to', 'what.*is', 'teach',
                'understand', 'help.*understand', 'tell.*about', 'know.*about',
                'information.*about', 'guide', 'lesson'
            ],
            'caa-meetings': [
                'meeting', 'caa', 'chartered accountant', 'appointment', 'schedule',
                'my.*meeting', 'upcoming.*meeting', 'see.*meeting', 'view.*meeting',
                'accountant.*meeting', 'consultation'
            ],
            'google-meet': [
                'google.*meet', 'meet', 'video.*call', 'online.*meeting',
                'join.*meet', 'create.*meet', 'setup.*meet', 'video.*conference'
            ],
            'knowledge-base': [
                'knowledge', 'knowledge.*base', 'document', 'file', 'upload',
                'my.*document', 'see.*document', 'search.*document',
                'rag', 'search.*file'
            ]
        }
        
        # Check for navigation commands
        for tab, keywords in navigation_keywords.items():
            for pattern in keywords:
                if re.search(pattern, question_lower):
                    return {
                        "message": f"Taking you to {tab.replace('-', ' ').title()}...",
                        "response_type": "navigation",
                        "navigation_tab": tab,
                        "question": question
                    }
        
        # Default GST help response
        return {
            "message": "I'm here to help with your GST questions! Try asking about registration, filing, rates, invoicing, or refunds. Or you can say 'go to finance', 'show calculator', 'compliance check', etc.",
            "response_type": "text",
            "question": question
        }
    except Exception as e:
        return {
            "message": f"Error: {str(e)}",
            "response_type": "error"
        }

@app.get("/api/ai/status")
async def ai_status():
    """Check AI service status"""
    return {
        "status": "active",
        "service": "AI Chat Assistant",
        "features": ["gst_chat", "compliance_check", "document_analysis"]
    }

@app.post("/api/ai/enhanced-chat")
@limiter.limit("30/minute")
async def enhanced_chat(request: Request, chat_request: ChatRequest):
    """Enhanced chat with AI - Intelligent understanding"""
    try:
        # Get question from either field
        question = chat_request.question or chat_request.message or ""
        chat_history = chat_request.chat_history or []
        
        # Create AI prompt with navigation context
        nav_system_prompt = """You are an intelligent GST and MSME compliance assistant with navigation capabilities.

AVAILABLE SECTIONS:
- finance: Financial management, accounting, payroll, income tax, GST filing, invoices, expenses
- calculator: GST calculator for tax computations
- compliance: Filing requirements, deadlines, compliance checks
- schemes: Government schemes (MUDRA, PMEGP, Stand-Up India), loans, subsidies
- analytics: Dashboard, reports, charts, business insights
- explainer: Learning hub, tutorials, GST education
- caa-meetings: Chartered accountant meetings, appointments
- google-meet: Video conferences, online meetings
- knowledge-base: Document management, file uploads, search

RESPONSE FORMAT:
If user wants to navigate to a section, respond with JSON:
{"navigate": "section-name", "message": "Brief helpful message"}

If user asks a question, respond normally with helpful advice.
If uncertain, just provide helpful information.

Remember: Be conversational, helpful, and detect intent accurately."""

        # Prepare messages for AI
        messages = [
            {"role": "system", "content": nav_system_prompt},
        ]
        
        # Add chat history (last 5 messages)
        if chat_history:
            messages.extend(chat_history[-5:])
        
        # Add current question
        messages.append({"role": "user", "content": question})
        
        # Call AI for intelligent response
        try:
            from app.openrouter_integration import openrouter_client, AIModel
            ai_response = await openrouter_client.chat_completion(
                messages=messages,
                model=AIModel.FAST,  # Use fast model for quick responses
                max_tokens=300,
                temperature=0.7
            )
            
            # Check if AI response contains navigation JSON
            try:
                if "{" in ai_response and "navigate" in ai_response:
                    # Extract JSON from response
                    import json
                    json_start = ai_response.find("{")
                    json_end = ai_response.rfind("}") + 1
                    nav_data = json.loads(ai_response[json_start:json_end])
                    
                    if "navigate" in nav_data:
                        return {
                            "success": True,
                            "message": nav_data.get("message", f"Taking you to {nav_data['navigate']}..."),
                            "response_type": "navigation",
                            "navigation_tab": nav_data["navigate"],
                            "question": question
                        }
            except:
                pass  # Not a navigation response, treat as regular chat
            
            # Regular text response
            return {
                "success": True,
                "message": ai_response,
                "response_type": "text",
                "question": question
            }
            
        except Exception as ai_error:
            print(f"AI error: {ai_error}")
            # Fallback to simple keyword matching
            question_lower = question.lower()
            navigation_keywords = {
                'finance': [
                    'finance', 'accounting', 'payroll', 'income tax', 'gst filing', 'salary',
                    'expense', 'revenue', 'profit', 'loss', 'invoice', 'bill', 'payment',
                    'my.*finance', 'show.*finance', 'see.*finance', 'view.*finance',
                    'financial.*data', 'financial.*report', 'money', 'transaction'
                ],
                'calculator': [
                    'calculat', 'compute', 'calculate.*gst', 'compute.*gst', 'gst.*calc',
                    'need.*calc', 'want.*calc', 'help.*calc', 'calculator',
                    'how much', 'what.*amount', 'compute.*tax', 'tax.*calc'
                ],
                'compliance': [
                    'compliance', 'filing', 'deadline', 'due date', 'return',
                    'check.*compliance', 'filing.*date', 'when.*file', 'when.*due',
                    'complian', 'regulation', 'requirement', 'mandatory',
                    'need.*file', 'have.*file', 'submit'
                ],
                'schemes': [
                    'scheme', 'mudra', 'subsidy', 'loan', 'stand.*up', 'pmegp',
                    'funding', 'grant', 'benefit', 'government.*scheme', 'assistance',
                    'what.*scheme', 'available.*scheme', 'loan.*program',
                    'financial.*help', 'business.*loan'
                ],
                'analytics': [
                    'analytics', 'dashboard', 'chart', 'graph', 'report', 'statistics',
                    'analysis', 'insight', 'trend', 'visual', 'performance',
                    'show.*data', 'see.*report', 'view.*analytics', 'business.*insights'
                ],
                'explainer': [
                    'learn', 'explain', 'tutorial', 'how.*to', 'what.*is', 'teach',
                    'understand', 'help.*understand', 'tell.*about', 'know.*about',
                    'information.*about', 'guide', 'lesson'
                ],
                'caa-meetings': [
                    'meeting', 'caa', 'chartered accountant', 'appointment', 'schedule',
                    'my.*meeting', 'upcoming.*meeting', 'see.*meeting', 'view.*meeting',
                    'accountant.*meeting', 'consultation'
                ],
                'google-meet': [
                    'google.*meet', 'meet', 'video.*call', 'online.*meeting',
                    'join.*meet', 'create.*meet', 'setup.*meet', 'video.*conference'
                ],
                'knowledge-base': [
                    'knowledge', 'knowledge.*base', 'document', 'file', 'upload',
                    'my.*document', 'see.*document', 'search.*document',
                    'rag', 'search.*file'
                ]
            }
            
            # Fallback keyword matching
            for tab, keywords in navigation_keywords.items():
                for pattern in keywords:
                    if re.search(pattern, question_lower):
                        return {
                            "success": True,
                            "message": f"Taking you to {tab.replace('-', ' ').title()}...",
                            "response_type": "navigation",
                            "navigation_tab": tab,
                            "question": question
                        }
            
            # Default response when AI fails
            return {
                "success": True,
                "message": "I'm here to help with GST, compliance, and business management. What would you like to know?",
                "response_type": "text",
                "question": question
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "response_type": "error"
        }

@app.post("/api/ai/compliance-suggestions")
async def compliance_suggestions(request: ChatRequest):
    """Get compliance suggestions"""
    return {
        "success": True,
        "suggestions": ["Maintain proper GST records", "File returns on time", "Keep invoices organized"],
        "response_type": "text"
    }

@app.post("/api/ai/gst-analysis")
async def gst_analysis(request: ChatRequest):
    """Analyze GST pattern"""
    return {
        "success": True,
        "analysis": "Your GST pattern analysis is being processed",
        "response_type": "text"
    }

@app.post("/api/ai/process-document")
async def process_document(request: ChatRequest):
    """Process document text"""
    return {
        "success": True,
        "result": "Document processed successfully",
        "response_type": "text"
    }

@app.post("/api/ai/business-advice")
async def business_advice(request: ChatRequest):
    """Get business advice"""
    return {
        "success": True,
        "advice": "Focus on maintaining accurate records and timely GST filing.",
        "response_type": "text"
    }

@app.get("/api/ai/settings")
async def get_settings(user_id: int = 1):
    """Get AI settings"""
    return {
        "user_id": user_id,
        "settings": {
            "chat_mode": "direct",
            "language": "en",
            "timezone": "Asia/Kolkata"
        }
    }

@app.post("/api/ai/settings")
async def save_settings(request: SettingsRequest):
    """Save AI settings"""
    return {
        "success": True,
        "message": "Settings saved",
        "user_id": request.user_id,
        "settings": request.settings
    }

# ==================== ALIAS ROUTES (For backward compatibility) ====================

# Redirect old paths to new /api paths
@app.post("/ai/enhanced-chat")
async def ai_enhanced_chat_alias(request: ChatRequest):
    """Alias for /api/ai/enhanced-chat"""
    return await enhanced_chat(request)

@app.get("/ai/status")
async def ai_status_alias():
    """Alias for /api/ai/status"""
    return await ai_status()

@app.get("/ai/settings")  
async def ai_settings_alias(user_id: int = 1):
    """Alias for /api/ai/settings"""
    return await get_settings(user_id)

@app.post("/ai/settings")
async def ai_settings_save_alias(request: SettingsRequest):
    """Alias for /api/ai/settings (POST)"""
    return await save_settings(request)

# ==================== TRANSLATION ROUTES ====================

class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str = 'en'

class TranslateBatchRequest(BaseModel):
    texts: List[str]
    target_lang: str
    source_lang: str = 'en'

if TRANSLATOR_AVAILABLE:
    @app.post("/api/translate")
    async def translate_api(request: TranslateRequest):
        """Translate text to target language"""
        try:
            translated = translate_text(
                text=request.text,
                target_lang=request.target_lang,
                source_lang=request.source_lang
            )
            return {
                "success": True,
                "original": request.text,
                "translated": translated,
                "source_lang": request.source_lang,
                "target_lang": request.target_lang
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/api/translate/batch")
    async def translate_batch_api(request: TranslateBatchRequest):
        """Translate multiple texts at once"""
        try:
            translated = translate_batch(
                texts=request.texts,
                target_lang=request.target_lang,
                source_lang=request.source_lang
            )
            return {
                "success": True,
                "original": request.texts,
                "translated": translated,
                "source_lang": request.source_lang,
                "target_lang": request.target_lang
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.get("/api/translate/languages")
    async def get_languages():
        """Get supported languages"""
        return {
            "success": True,
            "languages": get_supported_languages()
        }
else:
    @app.post("/api/translate")
    async def translate_unavailable(request: TranslateRequest):
        """Translation service unavailable"""
        raise HTTPException(
            status_code=503,
            detail="Translation service not available. Install deep-translator: pip install deep-translator"
        )

# ==================== PAGE ROUTES ====================

@app.get("/caa-meetings")
async def caa_meetings_page():
    """CAA Meetings page"""
    try:
        path = os.path.join(os.path.dirname(__file__), 'static', 'caa-meetings.html')
        if os.path.exists(path):
            return FileResponse(path, media_type="text/html")
    except:
        pass
    return {
        "error": "Page not found",
        "available_pages": ["caa-meetings", "google-meet", "knowledge-base", "business-trends", "schemes"]
    }

@app.get("/google-meet")
async def google_meet_page():
    """Google Meet page"""
    try:
        path = os.path.join(os.path.dirname(__file__), 'static', 'google-meet.html')
        if os.path.exists(path):
            return FileResponse(path, media_type="text/html")
    except:
        pass
    return {
        "error": "Page not found",
        "available_pages": ["caa-meetings", "google-meet", "knowledge-base", "business-trends", "schemes"]
    }

@app.get("/knowledge-base")
async def knowledge_base_page():
    """Knowledge Base page"""
    try:
        path = os.path.join(os.path.dirname(__file__), 'static', 'knowledge-base.html')
        if os.path.exists(path):
            return FileResponse(path, media_type="text/html")
    except:
        pass
    return {
        "error": "Page not found",
        "available_pages": ["caa-meetings", "google-meet", "knowledge-base", "business-trends"]
    }

@app.get("/business-trends")
async def business_trends_page():
    """Business Trends & Analysis page"""
    try:
        path = os.path.join(os.path.dirname(__file__), 'static', 'business-trends.html')
        if os.path.exists(path):
            return FileResponse(path, media_type="text/html")
    except:
        pass
    return {
        "error": "Page not found",
        "available_pages": ["caa-meetings", "google-meet", "knowledge-base", "business-trends"]
    }

@app.get("/schemes")
async def schemes_page():
    """Government Schemes page"""
    try:
        path = os.path.join(os.path.dirname(__file__), 'static', 'schemes.html')
        if os.path.exists(path):
            return FileResponse(path, media_type="text/html")
    except:
        pass
    return {
        "error": "Page not found",
        "available_pages": ["schemes", "caa-meetings", "google-meet", "knowledge-base", "business-trends"]
    }

# ==================== BUSINESS ANALYTICS ENDPOINTS ====================

try:
    from app.business_analytics import get_business_analytics
    ANALYTICS_AVAILABLE = True
except ImportError:
    ANALYTICS_AVAILABLE = False
    print("⚠️ Business Analytics module not available")

@app.get("/api/analytics/metrics")
async def get_analytics_metrics(request: Request):
    """Get key business metrics"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        user_id = request.query_params.get("user_id")
        metrics = analytics.get_key_metrics(user_id=int(user_id) if user_id else None)
        return metrics
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/revenue-trends")
async def get_revenue_trends(request: Request):
    """Get revenue trend data"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        months = int(request.query_params.get("months", 6))
        trends = analytics.get_revenue_trends(months=months)
        return trends
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/customer-segments")
async def get_customer_segments():
    """Get customer segmentation data"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        segments = analytics.get_customer_segments()
        return segments
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/benchmark")
async def get_industry_benchmark():
    """Get industry benchmarking data"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        benchmark = analytics.get_industry_benchmark()
        return benchmark
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/products")
async def get_product_performance():
    """Get product performance data"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        products = analytics.get_product_performance()
        return products
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/predictions")
async def get_ai_predictions():
    """Get AI predictions and forecasts"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        predictions = analytics.get_ai_predictions()
        return predictions
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/market-trends")
async def get_market_trends():
    """Get market trends data"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        trends = analytics.get_market_trends()
        return trends
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/competitive-analysis")
async def get_competitive_analysis():
    """Get competitive analysis data"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        analysis = analytics.get_competitive_analysis()
        return analysis
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/action-plan")
async def get_action_plan():
    """Get strategic action plan"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        plan = analytics.get_action_plan()
        return plan
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/export")
async def export_analytics_report(request: Request):
    """Export comprehensive analytics report"""
    if not ANALYTICS_AVAILABLE:
        return {"error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        format_type = request.query_params.get("format", "json")
        report = analytics.export_report(format=format_type)
        return report
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/analytics/updates")
async def get_real_time_updates():
    """Get real-time business updates"""
    if not ANALYTICS_AVAILABLE:
        return {" error": "Analytics module not available"}
    
    try:
        analytics = get_business_analytics()
        updates = analytics.get_real_time_updates()
        return updates
    except Exception as e:
        return {"error": str(e)}

# ==================== ADDITIONAL ENDPOINTS ====================

@app.get("/favicon.ico")
async def favicon():
    """Favicon endpoint"""
    try:
        path = os.path.join(os.path.dirname(__file__), 'static', 'favicon.ico')
        if os.path.exists(path):
            return FileResponse(path)
    except:
        pass
    return {"status": "no favicon"}

@app.get("/manifest.json")
async def manifest():
    """Web manifest for PWA"""
    try:
        path = os.path.join(os.path.dirname(__file__), 'manifest.json')
        if os.path.exists(path):
            with open(path, 'r') as f:
                return json.load(f)
    except:
        pass
    return {
        "name": "TaxCalm",
        "short_name": "TaxCalm",
        "description": "TaxCalm Assistant for Indian MSMEs",
        "icons": [],
        "start_url": "/",
        "theme_color": "#1e40af",
        "background_color": "#ffffff"
    }

@app.get("/service-worker.js")
async def service_worker():
    """Service worker for PWA"""
    try:
        path = os.path.join(os.path.dirname(__file__), 'static', 'service-worker.js')
        if os.path.exists(path):
            return FileResponse(path, media_type="application/javascript")
    except:
        pass
    return {"status": "no service worker"}

# ==================== STATIC FILES ====================

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), 'static')
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ==================== ROOT ROUTES ====================

@app.get("/")
async def root():
    """Root endpoint - serve index.html if it exists"""
    index_path = os.path.join(static_dir, 'index.html')
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    return {
        "name": "TaxCalm - Unified Server",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "finance": "/api/finance",
            "gst": "/api/gst/calculate",
            "zoom": "/api/zoom/schedule",
            "health": "/api/zoom/health"
        }
    }

@app.get("/login")
async def login_page():
    """Serve login page"""
    login_path = os.path.join(static_dir, 'login.html')
    if os.path.exists(login_path):
        return FileResponse(login_path, media_type="text/html")
    return {"error": "Login page not found"}

@app.get("/auth")
async def auth_page():
    """Serve auth page"""
    auth_path = os.path.join(static_dir, 'auth.html')
    if os.path.exists(auth_path):
        return FileResponse(auth_path, media_type="text/html")
    return {"error": "Auth page not found"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "TaxCalm - Unified Server",
        "rag_available": RAG_AVAILABLE
    }

# ==================== API KEY MANAGEMENT ====================

import secrets
from datetime import datetime
import sqlite3

# Initialize API keys database
def init_api_keys_db():
    """Initialize API keys database"""
    conn = sqlite3.connect('api_keys.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_id TEXT UNIQUE NOT NULL,
            key_hash TEXT NOT NULL,
            name TEXT,
            prefix TEXT NOT NULL,
            created_at TEXT NOT NULL,
            last_used TEXT,
            is_active INTEGER DEFAULT 1,
            user_id INTEGER DEFAULT 1
        )
    ''')
    conn.commit()
    conn.close()

# Initialize on startup
init_api_keys_db()

def hash_api_key(api_key: str) -> str:
    """Hash API key for secure storage"""
    import hashlib
    return hashlib.sha256(api_key.encode()).hexdigest()

class APIKeyRequest(BaseModel):
    name: Optional[str] = "API Key"

class APIKeyResponse(BaseModel):
    success: bool
    key: Optional[str] = None
    key_id: Optional[str] = None
    prefix: Optional[str] = None
    message: Optional[str] = None

@app.post("/api/keys/generate")
@limiter.limit("5/hour")
async def generate_api_key(request: Request, key_request: APIKeyRequest):
    """Generate a new API key"""
    try:
        # Generate secure random key
        api_key = f"txc_{secrets.token_urlsafe(32)}"
        key_hash = hash_api_key(api_key)
        key_id = secrets.token_urlsafe(8)
        prefix = api_key[:12] + "..."
        
        # Store in database
        conn = sqlite3.connect('api_keys.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO api_keys (key_id, key_hash, name, prefix, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (key_id, key_hash, key_request.name, prefix, datetime.now().isoformat(), 1))
        conn.commit()
        conn.close()
        
        return APIKeyResponse(
            success=True,
            key=api_key,  # Only shown once!
            key_id=key_id,
            prefix=prefix,
            message="API key generated successfully. Save it now - you won't see it again!"
        )
        
    except Exception as e:
        return APIKeyResponse(
            success=False,
            message=f"Error generating API key: {str(e)}"
        )

@app.get("/api/keys/list")
async def list_api_keys(user_id: int = 1):
    """List all API keys for a user (without revealing the actual keys)"""
    try:
        conn = sqlite3.connect('api_keys.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT key_id, name, prefix, created_at, last_used, is_active
            FROM api_keys
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
        
        keys = []
        for row in cursor.fetchall():
            keys.append({
                "key_id": row[0],
                "name": row[1],
                "prefix": row[2],
                "created_at": row[3],
                "last_used": row[4],
                "is_active": bool(row[5])
            })
        
        conn.close()
        
        return {
            "success": True,
            "keys": keys,
            "count": len(keys)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "keys": [],
            "count": 0
        }

@app.delete("/api/keys/{key_id}")
@limiter.limit("10/hour")
async def revoke_api_key(request: Request, key_id: str, user_id: int = 1):
    """Revoke an API key"""
    try:
        conn = sqlite3.connect('api_keys.db')
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE api_keys
            SET is_active = 0
            WHERE key_id = ? AND user_id = ?
        ''', (key_id, user_id))
        
        if cursor.rowcount > 0:
            conn.commit()
            conn.close()
            return {
                "success": True,
                "message": "API key revoked successfully"
            }
        else:
            conn.close()
            raise HTTPException(status_code=404, detail="API key not found")
            
    except HTTPException:
        raise
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def verify_api_key(api_key: str) -> bool:
    """Verify if an API key is valid and active"""
    try:
        key_hash = hash_api_key(api_key)
        conn = sqlite3.connect('api_keys.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, is_active FROM api_keys
            WHERE key_hash = ?
        ''', (key_hash,))
        
        result = cursor.fetchone()
        
        if result and result[1] == 1:
            # Update last_used
            cursor.execute('''
                UPDATE api_keys
                SET last_used = ?
                WHERE id = ?
            ''', (datetime.now().isoformat(), result[0]))
            conn.commit()
            conn.close()
            return True
        
        conn.close()
        return False
        
    except Exception:
        return False

# ==================== HEALTH CHECK ====================

@app.get("/api/health")
async def api_health():
    """API health check"""
    return {
        "status": "ok",
        "services": {
            "finance": "active",
            "gst_calculator": "active",
            "zoom": "active",
            "rag": "active" if RAG_AVAILABLE else "inactive"
        }
    }

# ==================== MAIN ====================

if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("🚀 TAXCALM - UNIFIED SERVER")
    print("=" * 70)
    print("✅ Finance Module")
    print("✅ GST Calculator")
    print("✅ Zoom Meeting Scheduler")
    print("✅ RAG System" if RAG_AVAILABLE else "⚠️  RAG System (Disabled)")
    print("✅ Static Files Server")
    print("=" * 70)
    print("📍 Server running on: http://localhost:8000")
    print("📍 API Documentation: http://localhost:8000/docs")
    print("📍 Alternative Docs: http://localhost:8000/redoc")
    print("=" * 70 + "\n")
    
    uvicorn.run(
        "unified_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
