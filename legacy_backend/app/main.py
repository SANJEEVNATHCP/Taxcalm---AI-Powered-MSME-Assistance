"""
TaxClam Web App - FastAPI Backend
Helps small business owners understand their GST obligations in simple terms.
"""

from fastapi import FastAPI, File, UploadFile, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json

# Import routers
from .finance_router import router as finance_router
from .blender_api import router as blender_router

# Import RAG system
try:
    from .rag_system import initialize_rag, get_rag_instance
    from .rag_seeds import get_seed_documents
    from .rag_models import (
        RAGSearchRequest, RAGSearchResponse, RAGSearchResultItem,
        RAGUploadResponse, RAGStatusResponse, RAGDeleteResponse
    )
    RAG_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ RAG not available: {e}")
    RAG_AVAILABLE = False

# Import OpenRouter integration
try:
    from .openrouter_integration import (
        enhance_chat_assistant,
        get_compliance_suggestions,
        analyze_gst_pattern,
        process_document_text,
        get_business_advice
    )
except ImportError as e:
    print(f"⚠️ OpenRouter integration not available: {e}")
    # Provide stub functions
    async def enhance_chat_assistant(*args, **kwargs): return "Service unavailable"
    async def get_compliance_suggestions(*args, **kwargs): return "Service unavailable"
    async def analyze_gst_pattern(*args, **kwargs): return "Service unavailable"
    async def process_document_text(*args, **kwargs): return "Service unavailable"
    async def get_business_advice(*args, **kwargs): return "Service unavailable"

app = FastAPI(title="TaxClam", description="Simple GST Calculator for Indian MSMEs")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000"],  # Specific origins for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Data Models ====================
class GSTCalculatorRequest(BaseModel):
    """Request model for GST calculation"""
    sales: float
    purchases: float
    rate: float  # 5, 12, or 18
    period: str  # "weekly" or "monthly"


class GSTCalculatorResponse(BaseModel):
    """Response model with calculation results and messages"""
    output_gst: float  # GST collected on sales
    input_gst: float   # GST paid on purchases
    net_gst: float     # Net GST payable (positive) or refundable (negative)
    message: str       # Plain-language explanation
    warning: Optional[str] = None  # Risk/alert message if applicable
    status: str        # "payable", "refundable", or "neutral"


class AIQuestion(BaseModel):
    """Request model for AI Q&A"""
    question: str
    context: Optional[str] = None  # Optional calculator context


class AIResponse(BaseModel):
    """Response model for AI answers"""
    answer: str
    sources: Optional[list] = None
    disclaimer: str = "This is informational only. Always consult a Chartered Accountant for official advice."


# ==================== NEW AI MODELS ====================
class ChatMessage(BaseModel):
    """Chat message for conversation history"""
    role: str  # "user" or "assistant"
    content: str


class EnhancedChatRequest(BaseModel):
    """Request for enhanced AI chat"""
    message: str
    chat_history: Optional[List[ChatMessage]] = None


class ComplianceRequest(BaseModel):
    """Request for compliance suggestions"""
    business_type: str
    turnover: float
    employees: int = 0
    recent_issues: Optional[List[str]] = None


class GSTPatterAnalysisRequest(BaseModel):
    """Request for GST pattern analysis"""
    sales_data: List[float]
    purchase_data: List[float]
    gst_rate: float
    period: str = "monthly"


class DocumentRequest(BaseModel):
    """Request for document processing"""
    document_text: str
    document_type: str = "invoice"  # invoice, bill, receipt, etc.


class BusinessAdviceRequest(BaseModel):
    """Request for business advice"""
    query: str
    business_context: Optional[Dict[str, Any]] = None


class FeedbackRequest(BaseModel):
    """Request for user feedback"""
    rating: int
    type: str
    comment: Optional[str] = ""
    user_id: Optional[int] = 1


# ==================== Helper Functions ====================
def generate_message(output_gst: float, input_gst: float, net_gst: float, period: str) -> str:
    """Generate plain-language explanation of GST situation"""
    period_label = "week" if period.lower() == "weekly" else "month"
    
    if net_gst > 0:
        return f"You need to keep aside ₹{net_gst:,.0f} for GST this {period_label}."
    elif net_gst < 0:
        return f"You may get a GST refund of ₹{abs(net_gst):,.0f} this {period_label}."
    else:
        return f"Your GST is balanced this {period_label}. No payment or refund needed."


def generate_warning(output_gst: float, input_gst: float, net_gst: float, sales: float) -> Optional[str]:
    """Generate contextual warnings and alerts"""
    
    # Warning 1: Increasing GST liability trend
    if net_gst > (output_gst * 0.5):
        return "⚠️ Your GST payable is increasing. Watch your expense/income ratio."
    
    # Warning 2: High sales - approaching registration threshold
    # GST registration threshold: ₹20 lakhs per financial year
    # Approximate monthly threshold: ~1.67 lakhs
    if sales > 1700000:  # Monthly average approaching threshold
        return "⚠️ Your sales are high. You may soon need to register for GST."
    
    # Warning 3: Very low purchases relative to sales (possible red flag)
    if sales > 0 and (input_gst / output_gst < 0.1):
        return "⚠️ Your purchases are very low compared to sales. Keep proper records."
    
    # Positive reinforcement when doing well
    if net_gst > 0 and net_gst < (output_gst * 0.2):
        return "✅ You are managing your cash flow well this period."
    
    return None


# ==================== AI Assistant Knowledge Base ====================
GST_KNOWLEDGE_BASE = {
    "output_gst": "Output GST is the tax you collect from your customers on sales. You need to pay this to the government.",
    "input_gst": "Input GST is the tax you pay when buying goods/services. You can claim this back from the Output GST.",
    "net_gst": "Net GST = Output GST - Input GST. This is what you owe or what you'll get back.",
    "registration_threshold": "GST registration is required if your turnover exceeds ₹20 lakhs per financial year (₹40 lakhs for specific states).",
    "composition_scheme": "A simpler GST regime for small businesses with turnover up to ₹1.5 crores. You pay a fixed percentage without filing returns.",
    "gst_filing": "You must file GST returns (GSTR-1, GSTR-3B, GSTR-9) on time. Late filing attracts penalties.",
    "invoicing": "Every business transaction over ₹200 requires an invoice mentioning GSTIN, items, amount, and tax.",
    "eway_bill": "E-way bill is needed for moving goods worth over ₹50,000. You can generate it online at ewaybill-gst.gov.in",
    "input_tax_credit": "You can claim ITC on purchases if you have GST invoices. Keep all bills and invoices for 6 years.",
    "penalties": "GST penalties range from ₹100-10,000+ for late filing, non-filing, or incorrect invoices.",
    "refund": "You can get a refund if Input GST > Output GST. Apply within 2 years of the filing period.",
    "supplies": "Supplies to unregistered dealers don't attract GST if they're registered farmers or government institutions.",
    "rate": "Common GST rates: 5% (essentials), 12% (goods), 18% (most goods/services), 28% (luxury items).",
    "documentation": "Keep sales invoices, purchase bills, payment records, and bank statements for audit trails.",
    "compliance": "File returns on time, keep invoices, issue receipts, and maintain records to avoid GST notices."
}


async def get_ai_response(question: str, context: Optional[str] = None) -> str:
    """
    Generate AI response using knowledge base + fallback.
    No external API call needed - uses local knowledge base.
    """
    
    question_lower = question.lower()
    
    # Check for keyword matches in knowledge base
    for key, answer in GST_KNOWLEDGE_BASE.items():
        if key in question_lower:
            return answer
    
    # Common question patterns
    if any(word in question_lower for word in ["register", "registration", "threshold"]):
        return GST_KNOWLEDGE_BASE["registration_threshold"]
    
    if any(word in question_lower for word in ["filing", "return", "file"]):
        return GST_KNOWLEDGE_BASE["gst_filing"]
    
    if any(word in question_lower for word in ["invoice", "bill", "receipt"]):
        return GST_KNOWLEDGE_BASE["invoicing"]
    
    if any(word in question_lower for word in ["refund", "get back"]):
        return GST_KNOWLEDGE_BASE["refund"]
    
    if any(word in question_lower for word in ["penalty", "fine", "notice"]):
        return GST_KNOWLEDGE_BASE["penalties"]
    
    if any(word in question_lower for word in ["rate", "percent", "%"]):
        return GST_KNOWLEDGE_BASE["rate"]
    
    # Context-based response (if calculator context provided)
    if context:
        return f"Based on your situation: {context}\n\nFor detailed advice, please consult a Chartered Accountant."
    
    # Default helpful response
    return (
        "That's a great question! Here are some common GST topics: "
        "registration, filing, invoicing, input tax credit, refunds, penalties, and rates. "
        "Ask me about any of these or describe your specific situation. "
        "For complex matters, always consult a Chartered Accountant."
    )


# ==================== API Endpoints ====================
@app.post("/api/feedback")
async def post_feedback(request: FeedbackRequest):
    """
    Submit user feedback
    """
    try:
        from .finance_models import get_db_connection
        from datetime import datetime
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        timestamp = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO user_feedback
            (user_id, rating, feedback_type, comment, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            request.user_id,
            request.rating,
            request.type,
            request.comment,
            timestamp
        ))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Thank you for your feedback!"}
    except Exception as e:
        print(f"Error submitting feedback: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}


@app.post("/calculate-gst", response_model=GSTCalculatorResponse)
def calculate_gst(request: GSTCalculatorRequest):
    """
    Calculate GST and generate plain-language results
    
    Input:
    - sales: Total sales amount (in ₹)
    - purchases: Total purchase amount (in ₹)
    - rate: GST rate (0-100%, standard rates are 5, 12, 18, 28%)
    - period: "weekly" or "monthly"
    
    Output:
    - output_gst: GST collected on sales
    - input_gst: GST paid on purchases
    - net_gst: Net GST payable (positive) or refundable (negative)
    - message: Plain-language explanation
    - warning: Optional alert message
    """
    try:
        # Validate inputs
        if not isinstance(request.sales, (int, float)) or not isinstance(request.purchases, (int, float)):
            raise ValueError("Sales and purchases must be numbers")
        
        if request.sales < 0 or request.purchases < 0:
            raise ValueError("Sales and purchases must be positive")
        
        # Validate rate - accept any rate between 0-100%
        rate = float(request.rate)
        if rate < 0 or rate > 100:
            rate = 18  # Default to 18% if out of range
        
        # Convert percentage to decimal
        rate_decimal = rate / 100
        
        # Calculate GST
        output_gst = float(request.sales) * rate_decimal
        input_gst = float(request.purchases) * rate_decimal
        net_gst = output_gst - input_gst
        
        # Generate message and warning
        message = generate_message(output_gst, input_gst, net_gst, request.period)
        warning = generate_warning(output_gst, input_gst, net_gst, request.sales)
        
        # Determine status
        if net_gst > 0:
            status = "payable"
        elif net_gst < 0:
            status = "refundable"
        else:
            status = "neutral"
        
        return GSTCalculatorResponse(
            output_gst=round(output_gst, 2),
            input_gst=round(input_gst, 2),
            net_gst=round(net_gst, 2),
            message=message,
            warning=warning,
            status=status
        )
    except Exception as e:
        print(f"Error in calculate_gst: {e}")
        # Return a default error response
        return GSTCalculatorResponse(
            output_gst=0,
            input_gst=0,
            net_gst=0,
            message="Error in calculation. Please check your inputs.",
            warning=str(e),
            status="neutral"
        )


@app.post("/ask-gst", response_model=AIResponse)
async def ask_gst(request: AIQuestion):
    """
    AI-powered GST Q&A assistant.
    Uses knowledge base to answer common GST questions.
    
    Input:
    - question: User's GST question
    - context: Optional calculator context
    
    Output:
    - answer: Plain-language answer
    - sources: Relevant GST topics
    - disclaimer: Legal disclaimer
    """
    
    # Get AI response from knowledge base
    answer = await get_ai_response(request.question, request.context)
    
    # Extract relevant topics mentioned in question
    sources = []
    question_lower = request.question.lower()
    for key in GST_KNOWLEDGE_BASE.keys():
        if key in question_lower:
            sources.append(key.replace("_", " ").title())
    
    return AIResponse(
        answer=answer,
        sources=sources if sources else ["General GST Query"],
        disclaimer="This is informational only. Always consult a Chartered Accountant for official advice."
    )


# ==================== NEW AI ENDPOINTS (OPENROUTER) ====================

@app.post("/ai/enhanced-chat")
async def enhanced_chat(request: EnhancedChatRequest):
    """
    Enhanced AI chat assistant powered by OpenRouter with RAG and Agentic Actions.
    
    Features:
    - Multi-turn conversation support
    - Context-aware responses with RAG
    - Load-balanced across 5 API keys
    - Automatic document retrieval for relevant queries
    - Agentic finance operations (navigation, transactions, reports)
    - User-configurable auto/safe mode
    """
    
    try:
        # Import agentic functions
        from .openrouter_integration import classify_intent, generate_agentic_response
        from .finance_agent import finance_agent
        from .finance_models import get_db_connection
        
        # Get user settings (agent_mode: safe or auto)
        user_id = 1  # Default user ID
        user_mode = "safe"  # Default to safe mode
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT agent_mode FROM ai_user_settings WHERE user_id = ?", (user_id,))
            row = cursor.fetchone()
            if row:
                user_mode = row["agent_mode"]
            conn.close()
        except Exception as e:
            print(f"⚠️ Settings fetch error: {e}, using default safe mode")
        
        # Step 1: Classify user intent
        intent = await classify_intent(request.message)
        intent_type = intent.get("intent_type", "general_question")
        
        print(f"🎯 Intent classified: {intent_type} (confidence: {intent.get('confidence', 0)})")
        
        # Step 2: Try to get RAG context if available
        rag_context = ""
        if RAG_AVAILABLE:
            try:
                rag = get_rag_instance()
                rag_results = rag.search(request.message, top_k=2, min_score=0.6)
                
                if rag_results:
                    rag_context = "\n\nRELEVANT REFERENCE DOCUMENTS:\n"
                    for i, result in enumerate(rag_results, 1):
                        title = result["metadata"].get("title", "Document")
                        category = result["metadata"].get("category", "")
                        rag_context += f"\n{i}. {title} [{category}]:\n{result['content']}\n"
                    
                    print(f"📚 RAG Context added: {len(rag_results)} documents retrieved")
            except Exception as e:
                print(f"⚠️ RAG search error: {e}")
        
        # Step 3: Handle intent-based routing
        
        # NAVIGATION or FINANCE_ACTION Intent
        if intent_type in ["navigation", "finance_action"]:
            agentic_response = await generate_agentic_response(
                request.message, 
                intent, 
                user_mode, 
                rag_context
            )
            
            # If finance action and should execute
            if (intent_type == "finance_action" and 
                agentic_response.get("auto_execute") and 
                user_mode == "auto"):
                
                # Execute the action automatically
                action = agentic_response.get("action")
                params = agentic_response.get("params", {})
                
                try:
                    execution_result = await finance_agent.execute_action(action, params)
                    
                    return {
                        "success": True,
                        "response_type": "action_executed",
                        "intent": intent_type,
                        "action": action,
                        "result": execution_result,
                        "message": execution_result.get("message", "Action completed"),
                        "rag_enhanced": bool(rag_context)
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "response_type": "action_failed",
                        "intent": intent_type,
                        "action": action,
                        "error": str(e),
                        "message": f"Failed to execute action: {str(e)}"
                    }
            
            # Return action for confirmation or navigation command
            return {
                "success": True,
                **agentic_response,
                "rag_enhanced": bool(rag_context)
            }
        
        # GENERAL QUESTION Intent - Use existing chat flow
        else:
            # Enhance message with RAG context if available
            enhanced_message = request.message
            if rag_context:
                enhanced_message = f"{request.message}\n{rag_context}"
            
            # Get AI response
            chat_history = None
            if request.chat_history:
                chat_history = [
                    {"role": msg.role, "content": msg.content} 
                    for msg in request.chat_history
                ]
            
            response = await enhance_chat_assistant(enhanced_message, chat_history)
            return {
                "success": True,
                "response_type": "text",
                "intent": "general_question",
                "message": response,
                "type": "enhanced_chat",
                "rag_enhanced": bool(rag_context)
            }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get AI response. Please try again."
        }


@app.post("/ai/compliance-suggestions")
async def compliance_suggestions(request: ComplianceRequest):
    """
    AI-powered compliance recommendations.
    
    Analyzes business profile and provides:
    - Required registrations
    - Filing deadlines
    - Documentation requirements
    - Risk areas
    - Recommended tools
    """
    
    try:
        suggestions = await get_compliance_suggestions(
            business_type=request.business_type,
            turnover=request.turnover,
            employees=request.employees,
            recent_issues=request.recent_issues
        )
        
        return {
            "success": True,
            "suggestions": suggestions,
            "type": "compliance_suggestions"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to generate compliance suggestions."
        }


@app.post("/ai/gst-analysis")
async def gst_analysis(request: GSTPatterAnalysisRequest):
    """
    AI analysis of GST payment patterns.
    
    Identifies:
    - Trends (increasing/decreasing/stable)
    - Expense-to-income ratio assessment
    - Tax optimization opportunities
    - Anomalies and red flags
    - Cash flow improvement recommendations
    """
    
    try:
        analysis = await analyze_gst_pattern(
            sales_data=request.sales_data,
            purchase_data=request.purchase_data,
            gst_rate=request.gst_rate,
            period=request.period
        )
        
        return {
            "success": True,
            "analysis": analysis,
            "type": "gst_analysis"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to analyze GST pattern."
        }


@app.post("/ai/process-document")
async def process_document(request: DocumentRequest):
    """
    AI-powered document processing.
    
    Extracts from invoices, bills, receipts:
    - Date, party information, GSTIN
    - Amounts and tax details
    - Items and line items
    - Compliance status
    - Issues and recommendations
    """
    
    try:
        extraction = await process_document_text(
            document_text=request.document_text,
            document_type=request.document_type
        )
        
        return {
            "success": True,
            "extraction": extraction,
            "type": "document_processing"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to process document."
        }


@app.post("/ai/business-advice")
async def business_advice(request: BusinessAdviceRequest):
    """
    AI-powered business and compliance advice.
    
    Provides guidance on:
    - Business strategy
    - Compliance requirements
    - Risk management
    - Tax optimization
    - General MSME support
    """
    
    try:
        advice = await get_business_advice(
            query=request.query,
            business_context=request.business_context
        )
        
        return {
            "success": True,
            "advice": advice,
            "type": "business_advice"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to get business advice."
        }


@app.get("/ai/status")
async def ai_status():
    """Check OpenRouter AI integration status"""
    # Check actual API key availability
    try:
        from .openrouter_integration import API_KEYS
        keys_available = len(API_KEYS)
        status = "operational" if keys_available > 0 else "degraded"
    except:
        keys_available = 0
        status = "degraded"
    
    return {
        "status": status,
        "features": [
            "ask-gst",  # Always available via knowledge base
            "enhanced_chat" if keys_available > 0 else None,
            "compliance_suggestions" if keys_available > 0 else None,
            "gst_analysis" if keys_available > 0 else None,
        ],
        "api_keys_available": keys_available,
        "fallback_available": True,  # Basic Q&A always works
        "load_balancing": "active" if keys_available >= 2 else "disabled"
    }


@app.get("/ai/settings")
async def get_ai_settings(user_id: int = 1):
    """Get AI agent settings for a user"""
    from .finance_models import get_db_connection
    from datetime import datetime
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM ai_user_settings WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        
        if row:
            settings = {
                "user_id": row["user_id"],
                "agent_mode": row["agent_mode"],
                "auto_navigate": bool(row["auto_navigate"]),
                "require_confirmation_amount": row["require_confirmation_amount"],
                "updated_at": row["updated_at"]
            }
        else:
            # Return defaults if no settings exist
            settings = {
                "user_id": user_id,
                "agent_mode": "safe",
                "auto_navigate": True,
                "require_confirmation_amount": 0
            }
            
            # Create default settings
            now = datetime.now().isoformat()
            cursor.execute("""
                INSERT INTO ai_user_settings 
                (user_id, agent_mode, auto_navigate, require_confirmation_amount, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, "safe", 1, 0, now, now))
            conn.commit()
        
        conn.close()
        
        return {
            "success": True,
            "settings": settings
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to fetch AI settings"
        }


@app.post("/ai/settings")
async def update_ai_settings(request: Request):
    """Update AI agent settings for a user"""
    from .finance_models import get_db_connection
    from datetime import datetime
    
    try:
        data = await request.json()
        user_id = data.get("user_id", 1)
        agent_mode = data.get("agent_mode", "safe")
        auto_navigate = data.get("auto_navigate", True)
        require_confirmation_amount = data.get("require_confirmation_amount", 0)
        
        # Validate agent_mode
        if agent_mode not in ["safe", "auto"]:
            return {
                "success": False,
                "error": "Invalid agent_mode. Must be 'safe' or 'auto'"
            }
        
        conn = get_db_connection()
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        
        # Check if settings exist
        cursor.execute("SELECT id FROM ai_user_settings WHERE user_id = ?", (user_id,))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing settings
            cursor.execute("""
                UPDATE ai_user_settings 
                SET agent_mode = ?, 
                    auto_navigate = ?, 
                    require_confirmation_amount = ?,
                    updated_at = ?
                WHERE user_id = ?
            """, (agent_mode, int(auto_navigate), require_confirmation_amount, now, user_id))
        else:
            # Insert new settings
            cursor.execute("""
                INSERT INTO ai_user_settings 
                (user_id, agent_mode, auto_navigate, require_confirmation_amount, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, agent_mode, int(auto_navigate), require_confirmation_amount, now, now))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"AI settings updated to {agent_mode} mode",
            "settings": {
                "user_id": user_id,
                "agent_mode": agent_mode,
                "auto_navigate": auto_navigate,
                "require_confirmation_amount": require_confirmation_amount
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to update AI settings"
        }


@app.get("/")
def read_root():
    """Serve the main calculator page"""
    return FileResponse("static/index.html")


@app.get("/schemes")
def read_schemes():
    """Serve the government schemes page"""
    return FileResponse("static/schemes.html")


@app.get("/about")
def read_about():
    """Serve the about/disclaimer page"""
    return FileResponse("static/about.html")


@app.get("/caa-meetings")
def read_caa_meetings():
    """Serve the CAA meetings page"""
    return FileResponse("static/caa-meetings.html")


@app.get("/google-meet")
def read_google_meet():
    """Serve the Google Meet scheduler page"""
    return FileResponse("static/google-meet.html")


@app.get("/knowledge-base")
def read_knowledge_base():
    """Serve the RAG knowledge base page"""
    return FileResponse("static/knowledge-base.html")


# ==================== RAG ENDPOINTS ====================

@app.on_event("startup")
async def startup_event():
    """Initialize RAG system on startup"""
    if RAG_AVAILABLE:
        try:
            print("🚀 Initializing RAG System on startup...")
            rag = initialize_rag()
            
            # Seed compliance documents
            from .rag_seeds import get_seed_documents
            seed_docs = get_seed_documents()
            
            documents_to_add = []
            for key, doc in seed_docs.items():
                documents_to_add.append({
                    "text": doc["content"],
                    "doc_id": f"seed_{key}",
                    "metadata": {
                        "source": "compliance_guide",
                        "doc_type": "seed",
                        "title": doc["title"],
                        "category": doc["category"],
                        "created_date": str(__import__('datetime').datetime.now().isoformat())
                    }
                })
            
            results = rag.batch_add_documents(documents_to_add)
            print(f"✅ Seeded {len(results)} compliance documents")
            
        except Exception as e:
            print(f"⚠️ Error initializing RAG: {e}")


@app.post("/rag/search")
async def rag_search(request: RAGSearchRequest):
    """Search the RAG knowledge base
    
    Args:
        request: RAG search request with query and parameters
        
    Returns:
        Search results with relevant documents and scores
    """
    if not RAG_AVAILABLE:
        return {"success": False, "error": "RAG system not available"}
    
    try:
        rag = get_rag_instance()
        results = rag.search(request.query, top_k=request.top_k, min_score=request.min_score)
        
        search_results = []
        for result in results:
            search_results.append(RAGSearchResultItem(
                document_id=result["metadata"].get("doc_id", "unknown"),
                content=result["content"][:500],  # Truncate for response
                metadata=result["metadata"],
                score=result["score"],
                source=result["source"]
            ))
        
        return RAGSearchResponse(
            success=True,
            query=request.query,
            results=search_results,
            count=len(search_results)
        ).model_dump()
    
    except Exception as e:
        print(f"Error in RAG search: {e}")
        return {"success": False, "error": str(e)}


@app.get("/rag/status")
async def rag_status():
    """Get RAG system status"""
    if not RAG_AVAILABLE:
        return {"success": False, "status": "RAG system not available"}
    
    try:
        rag = get_rag_instance()
        status = rag.get_status()
        
        return RAGStatusResponse(
            success=True,
            total_documents=status["total_documents"],
            total_chunks=status["total_chunks"],
            available_models=["sentence-transformers/all-MiniLM-L6-v2"],
            chroma_collection="msme_knowledge_base",
            status="active"
        ).model_dump()
    
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/rag/upload")
async def rag_upload(file: UploadFile = File(...)):
    """Upload a document to RAG (PDF or DOCX)
    
    Args:
        file: File to upload (PDF or DOCX)
        
    Returns:
        Upload response with document ID and chunk count
    """
    if not RAG_AVAILABLE:
        return {"success": False, "error": "RAG system not available"}
    
    try:
        import tempfile
        import os
        from pathlib import Path
        
        # Save temporary file
        suffix = Path(file.filename).suffix.lower()
        if suffix not in [".pdf", ".docx"]:
            return {"success": False, "error": "Only PDF and DOCX files supported"}
        
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name
        
        try:
            rag = get_rag_instance()
            doc_id = f"upload_{__import__('uuid').uuid4().hex[:8]}"
            
            # Add document based on type
            if suffix == ".pdf":
                chunks = rag.add_pdf_document(tmp_path, doc_id, {"category": "user_upload"})
            else:  # .docx
                chunks = rag.add_docx_document(tmp_path, doc_id, {"category": "user_upload"})
            
            return RAGUploadResponse(
                success=True,
                message=f"Document uploaded successfully",
                document_id=doc_id,
                chunks=chunks,
                file_name=file.filename
            ).model_dump()
        
        finally:
            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except:
                pass
    
    except Exception as e:
        print(f"Error uploading document: {e}")
        return {"success": False, "error": str(e)}


@app.delete("/rag/documents/{doc_id}")
async def rag_delete_document(doc_id: str):
    """Delete a document from RAG
    
    Args:
        doc_id: Document ID to delete
        
    Returns:
        Deletion status
    """
    if not RAG_AVAILABLE:
        return {"success": False, "error": "RAG system not available"}
    
    try:
        rag = get_rag_instance()
        success = rag.delete_document(doc_id)
        
        if success:
            return RAGDeleteResponse(
                success=True,
                message="Document deleted successfully",
                document_id=doc_id
            ).model_dump()
        else:
            return {"success": False, "error": "Document not found"}
    
    except Exception as e:
        return {"success": False, "error": str(e)}


# Include routers
print("Including finance router...")
app.include_router(finance_router)
print("Including blender API router...")
app.include_router(blender_router)
print("Routers included successfully")

# Mount static files (CSS, JS, images)
app.mount("/static", StaticFiles(directory="static"), name="static")


# ==================== Health Check ====================
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "app": "TaxClam"}


if __name__ == "__main__":
    import uvicorn
    print("\n" + "=" * 70)
    print("🚀 TAXCLAM - MAIN SERVER")
    print("=" * 70)
    print("📍 Server running on: http://localhost:8000")
    print("📍 API Documentation: http://localhost:8000/docs")
    print("=" * 70 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
