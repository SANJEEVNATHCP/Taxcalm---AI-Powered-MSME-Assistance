"""
OpenRouter API Integration for GST Stress-Reducer
Implements multi-API key load balancing and advanced AI features
"""

import httpx
import json
import random
import os
from typing import Optional, List, Dict, Any
from enum import Enum
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# 5 OpenRouter API Keys - Load Balanced from Environment
API_KEYS = [
    os.getenv("OPENROUTER_KEY_1", "sk-or-v1-your-key-1"),
    os.getenv("OPENROUTER_KEY_2", "sk-or-v1-your-key-2"),
    os.getenv("OPENROUTER_KEY_3", "sk-or-v1-your-key-3"),
    os.getenv("OPENROUTER_KEY_4", "sk-or-v1-your-key-4"),
    os.getenv("OPENROUTER_KEY_5", "sk-or-v1-your-key-5"),
]

# Remove any placeholder keys
API_KEYS = [k for k in API_KEYS if not k.startswith("sk-or-v1-your-key")]

print(f"[OK] Loaded {len(API_KEYS)} OpenRouter API keys")
if len(API_KEYS) == 0:
    print("[WARNING] No API keys found. Create .env file with OPENROUTER_KEY_1 to OPENROUTER_KEY_5")

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Available models for different tasks
class AIModel(str, Enum):
    FAST = "openai/gpt-3.5-turbo"  # Fast, lightweight
    BALANCED = "openai/gpt-4-turbo-preview"  # Balanced
    POWER = "openai/gpt-4"  # Most powerful

class OpenRouterClient:
    """Client for OpenRouter API with load balancing"""
    
    def __init__(self, api_keys: List[str] = None):
        self.api_keys = api_keys or API_KEYS
        self.key_index = 0
        self.failed_keys = set()
    
    def get_next_key(self) -> str:
        """Get next available API key with round-robin load balancing"""
        available_keys = [k for k in self.api_keys if k not in self.failed_keys]
        
        if not available_keys:
            # Reset if all keys failed
            self.failed_keys.clear()
            available_keys = self.api_keys
        
        key = available_keys[self.key_index % len(available_keys)]
        self.key_index += 1
        return key
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: AIModel = AIModel.BALANCED,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """Make a chat completion request to OpenRouter"""
        
        api_key = self.get_next_key()
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://gst-stress-reducer.app",
            "X-Title": "GST Stress-Reducer"
        }
        
        payload = {
            "model": model.value,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{OPENROUTER_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    self.failed_keys.add(api_key)
                    raise Exception(f"OpenRouter API Error: {response.status_code}")
        
        except Exception as e:
            self.failed_keys.add(api_key)
            raise e


# Initialize global client
openrouter_client = OpenRouterClient()


async def enhance_chat_assistant(user_message: str, chat_history: List[Dict] = None) -> str:
    """
    Enhanced chat assistant using OpenRouter
    Provides contextual GST and compliance advice
    """
    
    system_prompt = """You are an expert GST and MSME compliance advisor for Indian businesses.
Provide clear, practical advice using simple language. Always end with:
"For complex matters, consult a Chartered Accountant."

Your expertise covers:
- GST registration and compliance
- Tax calculations and filings
- Business compliance
- MSME schemes and support
- Risk management

Be conversational, helpful, and accurate."""
    
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add chat history if provided
    if chat_history:
        messages.extend(chat_history[-5:])  # Last 5 messages for context
    
    # Add current message
    messages.append({"role": "user", "content": user_message})
    
    try:
        response = await openrouter_client.chat_completion(
            messages=messages,
            model=AIModel.BALANCED,
            max_tokens=500,
            temperature=0.7
        )
        return response
    except Exception as e:
        return f"Error: {str(e)}. Please try again."


async def get_compliance_suggestions(
    business_type: str,
    turnover: float,
    employees: int = 0,
    recent_issues: List[str] = None
) -> Dict[str, Any]:
    """
    AI-powered compliance suggestions based on business profile
    """
    
    prompt = f"""
You are a GST and compliance expert. Analyze this business profile and provide compliance recommendations:

Business Type: {business_type}
Annual Turnover: ₹{turnover:,.0f}
Employees: {employees}
Recent Issues: {', '.join(recent_issues) if recent_issues else 'None'}

Provide:
1. Required registrations and licenses (GST, PAN, TAN, ESIC, etc.)
2. Filing deadlines and schedules
3. Documentation requirements
4. Risk areas and how to mitigate them
5. Recommended software/tools

Format as JSON with keys: registrations, deadlines, documentation, risks, tools
"""
    
    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]
    
    try:
        response = await openrouter_client.chat_completion(
            messages=messages,
            model=AIModel.BALANCED,
            max_tokens=1000,
            temperature=0.5
        )
        
        # Try to parse as JSON
        try:
            return json.loads(response)
        except:
            return {
                "suggestions": response,
                "raw": True
            }
    except Exception as e:
        return {"error": str(e)}


async def analyze_gst_pattern(
    sales_data: List[float],
    purchase_data: List[float],
    gst_rate: float,
    period: str = "monthly"
) -> Dict[str, Any]:
    """
    AI analysis of GST payment patterns
    Identifies trends, anomalies, and optimization opportunities
    """
    
    avg_sales = sum(sales_data) / len(sales_data) if sales_data else 0
    avg_purchases = sum(purchase_data) / len(purchase_data) if purchase_data else 0
    
    prompt = f"""
Analyze this GST pattern and provide insights:

Period: {period}
Number of periods: {len(sales_data)}
Average Sales: ₹{avg_sales:,.0f}
Average Purchases: ₹{avg_purchases:,.0f}
GST Rate: {gst_rate}%
Sales Trend: {sales_data}
Purchase Trend: {purchase_data}

Provide:
1. Trend analysis (increasing/decreasing/stable)
2. Expense-to-income ratio assessment
3. Potential tax optimization opportunities
4. Red flags or anomalies
5. Recommendations for better cash flow management

Be concise and actionable."""
    
    messages = [{"role": "user", "content": prompt}]
    
    try:
        response = await openrouter_client.chat_completion(
            messages=messages,
            model=AIModel.BALANCED,
            max_tokens=800,
            temperature=0.6
        )
        
        return {
            "analysis": response,
            "data_points": len(sales_data),
            "success": True
        }
    except Exception as e:
        return {"error": str(e), "success": False}


async def process_document_text(
    document_text: str,
    document_type: str = "invoice"
) -> Dict[str, Any]:
    """
    AI-powered document processing and extraction
    Extracts key information from invoices, bills, receipts
    """
    
    prompt = f"""
Extract key information from this {document_type}:

{document_text}

Extract and return as JSON:
{{
    "document_type": "{document_type}",
    "date": "YYYY-MM-DD or extracted date",
    "party_name": "Name of billing party",
    "party_gstin": "GSTIN if present",
    "total_amount": numeric amount,
    "gst_amount": numeric GST amount if shown,
    "items": ["item1", "item2"],
    "gst_rate": percentage,
    "compliance_status": "valid/invalid/missing_info",
    "issues": ["any issues found"],
    "recommendation": "brief advice"
}}

Be accurate and extract only what's present in the text."""
    
    messages = [{"role": "user", "content": prompt}]
    
    try:
        response = await openrouter_client.chat_completion(
            messages=messages,
            model=AIModel.FAST,
            max_tokens=600,
            temperature=0.3
        )
        
        try:
            return json.loads(response)
        except:
            return {
                "raw_extraction": response,
                "success": True
            }
    except Exception as e:
        return {"error": str(e), "success": False}


async def get_business_advice(
    query: str,
    business_context: Dict = None
) -> str:
    """
    General business and compliance advice
    """
    
    system_prompt = """You are a business advisor specializing in GST, compliance, and MSME support.
Provide practical, actionable advice relevant to Indian MSMEs.
Always mention consulting a CA for complex matters."""
    
    context_str = ""
    if business_context:
        context_str = f"\nBusiness Context: {json.dumps(business_context)}"
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"{query}{context_str}"}
    ]
    
    try:
        response = await openrouter_client.chat_completion(
            messages=messages,
            model=AIModel.BALANCED,
            max_tokens=600,
            temperature=0.7
        )
        return response
    except Exception as e:
        return f"Error: {str(e)}"


# ============================================================================
# AGENTIC AI ASSISTANT - Intent Classification & Action Generation
# ============================================================================

async def classify_intent(user_message: str, context: Dict = None) -> Dict[str, Any]:
    """
    Classify user intent as navigation, finance_action, or general_question
    
    Returns:
        {
            "intent_type": "navigation" | "finance_action" | "general_question",
            "confidence": 0.0-1.0,
            "entities": {...},
            "action_category": "transaction" | "gst" | "tax" | "payroll" | "report" | null
        }
    """
    
    system_prompt = """You are an intent classifier for a finance application. Analyze the user's message and classify it into ONE of these categories:

1. **navigation** - User wants to navigate to a different page/section
   Examples: "show dashboard", "go to expenses", "open reports", "next page"
   
2. **finance_action** - User wants to perform a finance operation (create, update, delete, view financial data)
   Examples: "add expense", "create transaction", "show profit", "file GST return", "calculate tax"
   
3. **general_question** - User is asking a question or having a conversation
   Examples: "what is GST?", "how to register?", "explain compliance", "tell me about..."

Respond ONLY with valid JSON in this exact format:
{
  "intent_type": "navigation|finance_action|general_question",
  "confidence": 0.95,
  "entities": {
    "amount": 5000,
    "category": "rent",
    "type": "expense",
    "date": "2024-03-15",
    "target_page": "dashboard"
  },
  "action_category": "transaction|gst|tax|payroll|report|null"
}

Rules:
- If user wants to GO/NAVIGATE/SHOW a page: intent_type = "navigation"
- If user wants to ADD/CREATE/UPDATE/DELETE/VIEW/CALCULATE finance data: intent_type = "finance_action"
- If user is ASKING/QUESTIONING: intent_type = "general_question"
- Extract all relevant entities (amounts, dates, categories, etc.)
- Set action_category for finance_action: transaction, gst, tax, payroll, or report
- confidence should reflect certainty (0.0-1.0)"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Classify this message: \"{user_message}\""}
    ]
    
    try:
        response = await openrouter_client.chat_completion(
            messages=messages,
            model=AIModel.BALANCED,
            max_tokens=300,
            temperature=0.3
        )
        
        # Parse JSON response
        result = json.loads(response)
        return result
    except json.JSONDecodeError:
        # Fallback: assume general question if parsing fails
        return {
            "intent_type": "general_question",
            "confidence": 0.5,
            "entities": {},
            "action_category": None
        }
    except Exception as e:
        return {
            "intent_type": "general_question",
            "confidence": 0.3,
            "entities": {},
            "action_category": None,
            "error": str(e)
        }


async def parse_finance_action(user_message: str, intent: Dict) -> Dict[str, Any]:
    """
    Parse finance action message to extract detailed parameters
    
    Returns structured action with parameters ready for execution
    """
    
    action_category = intent.get("action_category", "")
    entities = intent.get("entities", {})
    
    system_prompt = f"""You are a finance action parser. Extract all parameters from the user's request.

Action Category: {action_category}
User Message: "{user_message}"

Available Actions:
- TRANSACTIONS: add_expense, add_income, view_transactions, update_transaction, delete_transaction
- GST: register_gst, file_gst_return, view_gst_returns
- TAX: add_income_source, add_deduction, calculate_tax
- PAYROLL: add_employee, generate_payroll, view_payroll
- REPORTS: view_profit_loss, view_balance_sheet, view_cash_flow

Respond ONLY with valid JSON:
{{
  "action": "add_expense",
  "params": {{
    "amount": 5000,
    "category": "Rent",
    "description": "Office rent for March",
    "date": "2024-03-15",
    "payment_mode": "Bank Transfer"
  }},
  "requires_confirmation": true
}}

Rules:
- Infer the specific action from user intent
- Extract ALL parameters mentioned
- Use today's date if not specified: {json.dumps({"today": "2026-02-17"})}
- Default payment_mode to "Cash" if not mentioned
- Set requires_confirmation: true for write operations (add, update, delete)
- Set requires_confirmation: false for read operations (view, show)"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    
    try:
        response = await openrouter_client.chat_completion(
            messages=messages,
            model=AIModel.BALANCED,
            max_tokens=400,
            temperature=0.3
        )
        
        parsed = json.loads(response)
        return parsed
    except Exception as e:
        # Fallback structure
        return {
            "action": "unknown",
            "params": entities,
            "requires_confirmation": True,
            "error": str(e)
        }


async def generate_navigation_command(user_message: str, entities: Dict) -> Dict[str, Any]:
    """
    Generate navigation command from user message
    
    Allowed targets: dashboard, expenses, reports, profile, next_page, previous_page
    """
    
    system_prompt = """You are a navigation command generator. Map the user's request to ONE navigation target.

Allowed Targets:
- dashboard: Main finance overview/summary
- expenses: Expense tracking/transactions page
- reports: Financial reports (P&L, balance sheet, cash flow)
- profile: User profile/settings
- next_page: Go to next page/section
- previous_page: Go to previous page/section

Respond ONLY with valid JSON:
{
  "action": "navigate",
  "target": "dashboard",
  "section": "summary"
}

Rules:
- Choose the CLOSEST matching target
- If user says "show expenses" or "view transactions": target = "expenses"
- If user says "profit", "balance", "cash flow": target = "reports"
- If user says "next" or "forward": target = "next_page"
- Default to "dashboard" if unclear"""
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Generate navigation for: \"{user_message}\""}
    ]
    
    try:
        response = await openrouter_client.chat_completion(
            messages=messages,
            model=AIModel.FAST,
            max_tokens=100,
            temperature=0.2
        )
        
        nav_command = json.loads(response)
        return nav_command
    except Exception as e:
        # Fallback to dashboard
        return {
            "action": "navigate",
            "target": "dashboard",
            "error": str(e)
        }


async def generate_agentic_response(
    user_message: str, 
    intent: Dict, 
    user_mode: str = "safe",
    rag_context: str = None
) -> Dict[str, Any]:
    """
    Main agentic response generator - orchestrates intent handling
    
    Args:
        user_message: User's natural language input
        intent: Classified intent from classify_intent()
        user_mode: "safe" (requires confirmation) or "auto" (executes directly)
        rag_context: Optional RAG-retrieved context
        
    Returns:
        Structured response with action/text based on intent type
    """
    
    intent_type = intent.get("intent_type")
    
    # NAVIGATION Intent
    if intent_type == "navigation":
        nav_command = await generate_navigation_command(user_message, intent.get("entities", {}))
        return {
            "response_type": "action",
            "intent": "navigation",
            **nav_command
        }
    
    # FINANCE ACTION Intent
    elif intent_type == "finance_action":
        action_data = await parse_finance_action(user_message, intent)
        
        # Check if action requires confirmation based on user mode
        requires_confirmation = action_data.get("requires_confirmation", True)
        should_execute = (user_mode == "auto" and not requires_confirmation)
        
        return {
            "response_type": "action",
            "intent": "finance_action",
            "action": action_data.get("action"),
            "params": action_data.get("params", {}),
            "requires_confirmation": requires_confirmation and user_mode == "safe",
            "auto_execute": should_execute,
            "action_category": intent.get("action_category")
        }
    
    # GENERAL QUESTION Intent - return signal to use existing chat flow
    else:
        return {
            "response_type": "text",
            "intent": "general_question",
            "use_standard_chat": True,
            "include_rag": rag_context is not None
        }
