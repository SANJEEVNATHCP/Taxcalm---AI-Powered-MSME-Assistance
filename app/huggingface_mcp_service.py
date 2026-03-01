"""
HuggingFace MCP (Model Context Protocol) Integration
Provides AI model inference and capabilities through MCP protocol
"""

import httpx
import json
import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()


# ==================== PYDANTIC MODELS ====================

class MCPConfigRequest(BaseModel):
    """Request model for MCP configuration"""
    endpoint: str = Field(..., description="MCP server endpoint URL")
    api_key: str = Field(..., description="API key for authentication")
    enabled: bool = Field(default=True, description="Enable/disable this MCP")

class MCPTestResponse(BaseModel):
    """Response model for connection test"""
    success: bool
    message: str
    latency_ms: Optional[float] = None
    server_info: Optional[Dict[str, Any]] = None

class HFInferenceRequest(BaseModel):
    """Request model for HuggingFace inference"""
    model: str = Field(default="meta-llama/Llama-3.2-3B-Instruct", description="Model identifier")
    prompt: str = Field(..., description="Input prompt for the model")
    max_tokens: int = Field(default=500, description="Maximum tokens to generate")
    temperature: float = Field(default=0.7, description="Sampling temperature")
    top_p: float = Field(default=0.9, description="Top-p sampling")

class HFInferenceResponse(BaseModel):
    """Response model for HuggingFace inference"""
    success: bool
    text: Optional[str] = None
    model: str
    tokens_used: Optional[int] = None
    error: Optional[str] = None


# ==================== SERVICE CLASS ====================

class HuggingFaceMCPService:
    """Service for interacting with HuggingFace MCP server"""
    
    def __init__(self, endpoint: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize HuggingFace MCP service
        
        Args:
            endpoint: MCP server endpoint (defaults to env var HUGGINGFACE_MCP_ENDPOINT)
            api_key: API key for authentication (defaults to env var HUGGINGFACE_MCP_KEY)
        """
        self.endpoint = endpoint or os.getenv("HUGGINGFACE_MCP_ENDPOINT", "")
        self.api_key = api_key or os.getenv("HUGGINGFACE_MCP_KEY", "")
        self.enabled = bool(self.endpoint and self.api_key)
        self.timeout = float(os.getenv("MCP_TIMEOUT", "30"))
        
        # Initialize HTTP client
        self.client = httpx.AsyncClient(
            timeout=self.timeout,
            headers=self._get_headers()
        )
        
        if self.enabled:
            print(f"✓ HuggingFace MCP initialized: {self.endpoint}")
        else:
            print("⚠️ HuggingFace MCP not configured (missing endpoint or API key)")
    
    def _get_headers(self) -> Dict[str, str]:
        """Generate headers for MCP requests"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "TaxClam-MSME/1.0"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        return headers
    
    async def test_connection(self) -> MCPTestResponse:
        """
        Test connection to HuggingFace MCP server
        
        Returns:
            MCPTestResponse with connection status
        """
        if not self.enabled:
            return MCPTestResponse(
                success=False,
                message="HuggingFace MCP not configured"
            )
        
        try:
            import time
            start_time = time.time()
            
            # Try to get server info or health check
            response = await self.client.get(f"{self.endpoint}/health")
            latency_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                server_info = response.json() if response.text else {"status": "ok"}
                return MCPTestResponse(
                    success=True,
                    message="Connected successfully",
                    latency_ms=round(latency_ms, 2),
                    server_info=server_info
                )
            else:
                return MCPTestResponse(
                    success=False,
                    message=f"Server returned status {response.status_code}"
                )
                
        except httpx.ConnectError:
            return MCPTestResponse(
                success=False,
                message=f"Cannot connect to {self.endpoint}"
            )
        except Exception as e:
            return MCPTestResponse(
                success=False,
                message=f"Connection error: {str(e)}"
            )
    
    async def inference(self, request: HFInferenceRequest) -> HFInferenceResponse:
        """
        Run inference on HuggingFace model via MCP
        
        Args:
            request: Inference request with model and prompt
            
        Returns:
            HFInferenceResponse with generated text
        """
        if not self.enabled:
            return HFInferenceResponse(
                success=False,
                model=request.model,
                error="HuggingFace MCP not configured"
            )
        
        try:
            # Prepare MCP inference request
            payload = {
                "model": request.model,
                "prompt": request.prompt,
                "max_tokens": request.max_tokens,
                "temperature": request.temperature,
                "top_p": request.top_p
            }
            
            # Send request to MCP server
            response = await self.client.post(
                f"{self.endpoint}/inference",
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                return HFInferenceResponse(
                    success=True,
                    text=data.get("text", data.get("generated_text", "")),
                    model=request.model,
                    tokens_used=data.get("tokens_used")
                )
            else:
                error_msg = response.text or f"Status {response.status_code}"
                return HFInferenceResponse(
                    success=False,
                    model=request.model,
                    error=error_msg
                )
                
        except Exception as e:
            return HFInferenceResponse(
                success=False,
                model=request.model,
                error=f"Inference error: {str(e)}"
            )
    
    async def get_available_models(self) -> Dict[str, Any]:
        """
        Get list of available models from HuggingFace MCP
        
        Returns:
            Dictionary with available models
        """
        if not self.enabled:
            return {"success": False, "error": "HuggingFace MCP not configured"}
        
        try:
            response = await self.client.get(f"{self.endpoint}/models")
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "models": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"Status {response.status_code}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error fetching models: {str(e)}"
            }
    
    def update_config(self, endpoint: str, api_key: str, enabled: bool = True):
        """
        Update MCP configuration
        
        Args:
            endpoint: New endpoint URL
            api_key: New API key
            enabled: Enable/disable flag
        """
        self.endpoint = endpoint
        self.api_key = api_key
        self.enabled = enabled and bool(endpoint and api_key)
        
        # Update client headers
        self.client.headers.update(self._get_headers())
        
        print(f"✓ HuggingFace MCP config updated: {self.endpoint}")
    
    async def close(self):
        """Close HTTP client connection"""
        await self.client.aclose()


# ==================== SINGLETON INSTANCE ====================

_hf_mcp_instance: Optional[HuggingFaceMCPService] = None

def get_hf_mcp_service() -> HuggingFaceMCPService:
    """
    Get singleton instance of HuggingFace MCP service
    
    Returns:
        HuggingFaceMCPService instance
    """
    global _hf_mcp_instance
    if _hf_mcp_instance is None:
        _hf_mcp_instance = HuggingFaceMCPService()
    return _hf_mcp_instance


# ==================== UTILITY FUNCTIONS ====================

def mask_api_key(api_key: str) -> str:
    """
    Mask API key for display (show first 4 and last 4 characters)
    
    Args:
        api_key: Full API key
        
    Returns:
        Masked API key
    """
    if not api_key or len(api_key) < 8:
        return "****"
    return f"{api_key[:4]}...{api_key[-4:]}"
