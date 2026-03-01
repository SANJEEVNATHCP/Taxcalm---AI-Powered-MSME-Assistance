"""
Strom MCP (Model Context Protocol) Integration
Provides file and data processing capabilities through MCP protocol
"""

import httpx
import json
import os
import tempfile
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pathlib import Path

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

class StromProcessRequest(BaseModel):
    """Request model for Strom file processing"""
    operation: str = Field(default="extract", description="Processing operation (extract, analyze, summarize)")
    text: Optional[str] = None
    file_url: Optional[str] = None
    options: Optional[Dict[str, Any]] = None

class StromProcessResponse(BaseModel):
    """Response model for Strom processing"""
    success: bool
    operation: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class StromAnalysisRequest(BaseModel):
    """Request model for data analysis"""
    data: str = Field(..., description="Data to analyze")
    analysis_type: str = Field(default="general", description="Type of analysis")
    options: Optional[Dict[str, Any]] = None


# ==================== SERVICE CLASS ====================

class StromMCPService:
    """Service for interacting with Strom MCP server"""
    
    def __init__(self, endpoint: Optional[str] = None, api_key: Optional[str] = None):
        """
        Initialize Strom MCP service
        
        Args:
            endpoint: MCP server endpoint (defaults to env var STROM_MCP_ENDPOINT)
            api_key: API key for authentication (defaults to env var STROM_MCP_KEY)
        """
        self.endpoint = endpoint or os.getenv("STROM_MCP_ENDPOINT", "")
        self.api_key = api_key or os.getenv("STROM_MCP_KEY", "")
        self.enabled = bool(self.endpoint and self.api_key)
        self.timeout = float(os.getenv("MCP_TIMEOUT", "30"))
        
        # Initialize HTTP client
        self.client = httpx.AsyncClient(
            timeout=self.timeout,
            headers=self._get_headers()
        )
        
        if self.enabled:
            print(f"✓ Strom MCP initialized: {self.endpoint}")
        else:
            print("⚠️ Strom MCP not configured (missing endpoint or API key)")
    
    def _get_headers(self) -> Dict[str, str]:
        """Generate headers for MCP requests"""
        headers = {
            "User-Agent": "TaxClam-MSME/1.0"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        return headers
    
    async def test_connection(self) -> MCPTestResponse:
        """
        Test connection to Strom MCP server
        
        Returns:
            MCPTestResponse with connection status
        """
        if not self.enabled:
            return MCPTestResponse(
                success=False,
                message="Strom MCP not configured"
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
    
    async def process_file(self, file_path: str, operation: str = "extract", options: Optional[Dict] = None) -> StromProcessResponse:
        """
        Process a file through Strom MCP
        
        Args:
            file_path: Path to file to process
            operation: Operation to perform (extract, analyze, summarize)
            options: Additional options for processing
            
        Returns:
            StromProcessResponse with processing results
        """
        if not self.enabled:
            return StromProcessResponse(
                success=False,
                operation=operation,
                error="Strom MCP not configured"
            )
        
        try:
            # Prepare multipart file upload
            with open(file_path, 'rb') as f:
                files = {'file': (Path(file_path).name, f, 'application/octet-stream')}
                data = {
                    'operation': operation,
                    'options': json.dumps(options or {})
                }
                
                # Send file to MCP server
                response = await self.client.post(
                    f"{self.endpoint}/process-file",
                    files=files,
                    data=data
                )
            
            if response.status_code == 200:
                result = response.json()
                return StromProcessResponse(
                    success=True,
                    operation=operation,
                    result=result
                )
            else:
                error_msg = response.text or f"Status {response.status_code}"
                return StromProcessResponse(
                    success=False,
                    operation=operation,
                    error=error_msg
                )
                
        except Exception as e:
            return StromProcessResponse(
                success=False,
                operation=operation,
                error=f"Processing error: {str(e)}"
            )
    
    async def analyze_data(self, data: str, analysis_type: str = "general", options: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Analyze text or data through Strom MCP
        
        Args:
            data: Data to analyze
            analysis_type: Type of analysis to perform
            options: Additional options
            
        Returns:
            Analysis results dictionary
        """
        if not self.enabled:
            return {"success": False, "error": "Strom MCP not configured"}
        
        try:
            payload = {
                "data": data,
                "analysis_type": analysis_type,
                "options": options or {}
            }
            
            response = await self.client.post(
                f"{self.endpoint}/analyze",
                json=payload
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "analysis": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"Status {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Analysis error: {str(e)}"
            }
    
    async def extract_content(self, file_bytes: bytes, filename: str, file_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Extract content from file bytes
        
        Args:
            file_bytes: File content as bytes
            filename: Original filename
            file_type: MIME type of file
            
        Returns:
            Extracted content dictionary
        """
        if not self.enabled:
            return {"success": False, "error": "Strom MCP not configured"}
        
        try:
            # Create temporary file
            suffix = Path(filename).suffix
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name
            
            try:
                # Process the temp file
                result = await self.process_file(tmp_path, operation="extract")
                return {
                    "success": result.success,
                    "content": result.result if result.success else None,
                    "error": result.error
                }
            finally:
                # Clean up temp file
                try:
                    os.unlink(tmp_path)
                except:
                    pass
                    
        except Exception as e:
            return {
                "success": False,
                "error": f"Content extraction error: {str(e)}"
            }
    
    async def get_capabilities(self) -> Dict[str, Any]:
        """
        Get capabilities and supported operations from Strom MCP
        
        Returns:
            Dictionary with server capabilities
        """
        if not self.enabled:
            return {"success": False, "error": "Strom MCP not configured"}
        
        try:
            response = await self.client.get(f"{self.endpoint}/capabilities")
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "capabilities": response.json()
                }
            else:
                return {
                    "success": False,
                    "error": f"Status {response.status_code}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Error fetching capabilities: {str(e)}"
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
        
        print(f"✓ Strom MCP config updated: {self.endpoint}")
    
    async def close(self):
        """Close HTTP client connection"""
        await self.client.aclose()


# ==================== SINGLETON INSTANCE ====================

_strom_mcp_instance: Optional[StromMCPService] = None

def get_strom_mcp_service() -> StromMCPService:
    """
    Get singleton instance of Strom MCP service
    
    Returns:
        StromMCPService instance
    """
    global _strom_mcp_instance
    if _strom_mcp_instance is None:
        _strom_mcp_instance = StromMCPService()
    return _strom_mcp_instance


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
