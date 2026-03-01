"""
Finance Agent - Executes finance operations for the Agentic AI Assistant
Handles all finance actions: transactions, GST, tax, payroll, reports
"""

import httpx
import json
from typing import Dict, Any, Optional
from datetime import datetime


class FinanceAgent:
    """
    Agent that executes finance operations by calling internal API endpoints
    """
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.user_id = 1  # Default user ID (TODO: integrate with auth system)
    
    async def execute_action(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point - routes action to appropriate handler
        
        Args:
            action: Action name (e.g., "add_expense", "view_profit_loss")
            params: Action parameters
            
        Returns:
            {
                "success": bool,
                "message": str,
                "data": {...},
                "action_performed": str
            }
        """
        
        # Map action to handler
        action_handlers = {
            # Transactions
            "add_expense": self.add_expense,
            "add_income": self.add_income,
            "view_transactions": self.view_transactions,
            "update_transaction": self.update_transaction,
            "delete_transaction": self.delete_transaction,
            
            # GST
            "register_gst": self.register_gst,
            "file_gst_return": self.file_gst_return,
            "view_gst_returns": self.view_gst_returns,
            
            # Tax
            "add_income_source": self.add_income_source,
            "add_deduction": self.add_deduction,
            "calculate_tax": self.calculate_tax,
            "view_tax_profile": self.view_tax_profile,
            
            # Payroll
            "add_employee": self.add_employee,
            "generate_payroll": self.generate_payroll,
            "view_payroll": self.view_payroll,
            
            # Reports
            "view_profit_loss": self.view_profit_loss,
            "view_balance_sheet": self.view_balance_sheet,
            "view_cash_flow": self.view_cash_flow,
            "view_dashboard_summary": self.view_dashboard_summary,
        }
        
        handler = action_handlers.get(action)
        if not handler:
            return {
                "success": False,
                "message": f"Unknown action: {action}. Available actions: {', '.join(action_handlers.keys())}",
                "action_performed": action
            }
        
        try:
            result = await handler(params)
            return result
        except Exception as e:
            return {
                "success": False,
                "message": f"Error executing {action}: {str(e)}",
                "action_performed": action,
                "error": str(e)
            }
    
    # ========================================================================
    # TRANSACTION OPERATIONS
    # ========================================================================
    
    async def add_expense(self, params: Dict) -> Dict[str, Any]:
        """Add a new expense transaction"""
        endpoint = f"{self.base_url}/api/finance/transactions"
        
        payload = {
            "date": params.get("date", datetime.now().strftime("%Y-%m-%d")),
            "type": "Expense",
            "category": params.get("category", "General"),
            "amount": float(params.get("amount", 0)),
            "description": params.get("description", ""),
            "payment_mode": params.get("payment_mode", "Cash")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "success": True,
                    "message": f"✅ Expense of ₹{payload['amount']} added successfully for {payload['category']}",
                    "data": data,
                    "action_performed": "add_expense"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to add expense: {response.text}",
                    "action_performed": "add_expense"
                }
    
    async def add_income(self, params: Dict) -> Dict[str, Any]:
        """Add a new income transaction"""
        endpoint = f"{self.base_url}/api/finance/transactions"
        
        payload = {
            "date": params.get("date", datetime.now().strftime("%Y-%m-%d")),
            "type": "Income",
            "category": params.get("category", "Sales"),
            "amount": float(params.get("amount", 0)),
            "description": params.get("description", ""),
            "payment_mode": params.get("payment_mode", "Cash")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code == 201:
                data = response.json()
                return {
                    "success": True,
                    "message": f"✅ Income of ₹{payload['amount']} added successfully for {payload['category']}",
                    "data": data,
                    "action_performed": "add_income"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to add income: {response.text}",
                    "action_performed": "add_income"
                }
    
    async def view_transactions(self, params: Dict) -> Dict[str, Any]:
        """View transactions with optional filters"""
        endpoint = f"{self.base_url}/api/finance/transactions"
        
        # Build query parameters
        query_params = {}
        if params.get("type"):
            query_params["type"] = params["type"]
        if params.get("category"):
            query_params["category"] = params["category"]
        if params.get("start_date"):
            query_params["start_date"] = params["start_date"]
        if params.get("end_date"):
            query_params["end_date"] = params["end_date"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint, params=query_params)
            
            if response.status_code == 200:
                data = response.json()
                transactions = data.get("transactions", [])
                
                # Calculate summary
                total_income = sum(t["amount"] for t in transactions if t["type"] == "Income")
                total_expense = sum(t["amount"] for t in transactions if t["type"] == "Expense")
                
                return {
                    "success": True,
                    "message": f"Found {len(transactions)} transactions. Income: ₹{total_income}, Expenses: ₹{total_expense}",
                    "data": {
                        "transactions": transactions[:20],  # Limit to 20 for display
                        "total_count": len(transactions),
                        "total_income": total_income,
                        "total_expense": total_expense,
                        "net": total_income - total_expense
                    },
                    "action_performed": "view_transactions"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to fetch transactions: {response.text}",
                    "action_performed": "view_transactions"
                }
    
    async def update_transaction(self, params: Dict) -> Dict[str, Any]:
        """Update an existing transaction"""
        transaction_id = params.get("id")
        if not transaction_id:
            return {"success": False, "message": "Transaction ID required", "action_performed": "update_transaction"}
        
        endpoint = f"{self.base_url}/api/finance/transactions/{transaction_id}"
        
        # Remove ID from params for payload
        payload = {k: v for k, v in params.items() if k != "id"}
        
        async with httpx.AsyncClient() as client:
            response = await client.put(endpoint, json=payload)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": f"✅ Transaction #{transaction_id} updated successfully",
                    "data": response.json(),
                    "action_performed": "update_transaction"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to update transaction: {response.text}",
                    "action_performed": "update_transaction"
                }
    
    async def delete_transaction(self, params: Dict) -> Dict[str, Any]:
        """Delete a transaction"""
        transaction_id = params.get("id")
        if not transaction_id:
            return {"success": False, "message": "Transaction ID required", "action_performed": "delete_transaction"}
        
        endpoint = f"{self.base_url}/api/finance/transactions/{transaction_id}"
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(endpoint)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "message": f"✅ Transaction #{transaction_id} deleted successfully",
                    "action_performed": "delete_transaction"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to delete transaction: {response.text}",
                    "action_performed": "delete_transaction"
                }
    
    # ========================================================================
    # GST OPERATIONS
    # ========================================================================
    
    async def register_gst(self, params: Dict) -> Dict[str, Any]:
        """Register or update GST details"""
        endpoint = f"{self.base_url}/api/finance/gst/registration"
        
        payload = {
            "gstin": params.get("gstin", ""),
            "legal_name": params.get("legal_name", params.get("business_name", "")),
            "business_type": params.get("business_type", "Proprietorship"),
            "state": params.get("state", ""),
            "address": params.get("address", "")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code in [200, 201]:
                return {
                    "success": True,
                    "message": f"✅ GST registration updated for {payload['legal_name']}",
                    "data": response.json(),
                    "action_performed": "register_gst"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to register GST: {response.text}",
                    "action_performed": "register_gst"
                }
    
    async def file_gst_return(self, params: Dict) -> Dict[str, Any]:
        """File a GST return"""
        endpoint = f"{self.base_url}/api/finance/gst/returns"
        
        payload = {
            "return_type": params.get("return_type", "GSTR-3B"),
            "period_month": params.get("month", datetime.now().month),
            "period_year": params.get("year", datetime.now().year),
            "sales_amount": float(params.get("sales", 0)),
            "purchase_amount": float(params.get("purchases", 0)),
            "cgst_amount": float(params.get("cgst", 0)),
            "sgst_amount": float(params.get("sgst", 0)),
            "igst_amount": float(params.get("igst", 0)),
            "status": "Filed"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code == 201:
                return {
                    "success": True,
                    "message": f"✅ GST return {payload['return_type']} filed for {payload['period_month']}/{payload['period_year']}",
                    "data": response.json(),
                    "action_performed": "file_gst_return"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to file GST return: {response.text}",
                    "action_performed": "file_gst_return"
                }
    
    async def view_gst_returns(self, params: Dict) -> Dict[str, Any]:
        """View GST returns"""
        endpoint = f"{self.base_url}/api/finance/gst/returns"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint)
            
            if response.status_code == 200:
                data = response.json()
                returns = data.get("returns", [])
                
                return {
                    "success": True,
                    "message": f"Found {len(returns)} GST returns",
                    "data": {"returns": returns},
                    "action_performed": "view_gst_returns"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to fetch GST returns: {response.text}",
                    "action_performed": "view_gst_returns"
                }
    
    # ========================================================================
    # TAX OPERATIONS
    # ========================================================================
    
    async def add_income_source(self, params: Dict) -> Dict[str, Any]:
        """Add an income source for tax calculation"""
        endpoint = f"{self.base_url}/api/finance/tax/income-sources"
        
        payload = {
            "source_type": params.get("source_type", "Business"),
            "source_name": params.get("source_name", ""),
            "amount": float(params.get("amount", 0)),
            "tax_year": params.get("tax_year", "2025-26")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code == 201:
                return {
                    "success": True,
                    "message": f"✅ Income source '{payload['source_name']}' added: ₹{payload['amount']}",
                    "data": response.json(),
                    "action_performed": "add_income_source"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to add income source: {response.text}",
                    "action_performed": "add_income_source"
                }
    
    async def add_deduction(self, params: Dict) -> Dict[str, Any]:
        """Add a tax deduction"""
        endpoint = f"{self.base_url}/api/finance/tax/deductions"
        
        payload = {
            "section": params.get("section", "80C"),
            "description": params.get("description", ""),
            "amount": float(params.get("amount", 0)),
            "tax_year": params.get("tax_year", "2025-26")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code == 201:
                return {
                    "success": True,
                    "message": f"✅ Deduction under section {payload['section']} added: ₹{payload['amount']}",
                    "data": response.json(),
                    "action_performed": "add_deduction"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to add deduction: {response.text}",
                    "action_performed": "add_deduction"
                }
    
    async def calculate_tax(self, params: Dict) -> Dict[str, Any]:
        """Calculate income tax"""
        endpoint = f"{self.base_url}/api/finance/tax/calculate"
        
        payload = {
            "tax_year": params.get("tax_year", "2025-26"),
            "regime": params.get("regime", "new")
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "message": f"✅ Tax calculated: ₹{data.get('total_tax', 0)}",
                    "data": data,
                    "action_performed": "calculate_tax"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to calculate tax: {response.text}",
                    "action_performed": "calculate_tax"
                }
    
    async def view_tax_profile(self, params: Dict) -> Dict[str, Any]:
        """View tax profile"""
        endpoint = f"{self.base_url}/api/finance/tax/profile"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "message": "Tax profile retrieved",
                    "data": data,
                    "action_performed": "view_tax_profile"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to fetch tax profile: {response.text}",
                    "action_performed": "view_tax_profile"
                }
    
    # ========================================================================
    # PAYROLL OPERATIONS
    # ========================================================================
    
    async def add_employee(self, params: Dict) -> Dict[str, Any]:
        """Add a new employee"""
        endpoint = f"{self.base_url}/api/finance/payroll/employees"
        
        payload = {
            "employee_code": params.get("employee_code", ""),
            "name": params.get("name", ""),
            "designation": params.get("designation", ""),
            "pan_number": params.get("pan", ""),
            "uan_number": params.get("uan", ""),
            "date_of_joining": params.get("date_of_joining", datetime.now().strftime("%Y-%m-%d"))
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code == 201:
                return {
                    "success": True,
                    "message": f"✅ Employee {payload['name']} added successfully",
                    "data": response.json(),
                    "action_performed": "add_employee"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to add employee: {response.text}",
                    "action_performed": "add_employee"
                }
    
    async def generate_payroll(self, params: Dict) -> Dict[str, Any]:
        """Generate monthly payroll"""
        endpoint = f"{self.base_url}/api/finance/payroll/generate"
        
        payload = {
            "month": params.get("month", datetime.now().month),
            "year": params.get("year", datetime.now().year)
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(endpoint, json=payload)
            
            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    "success": True,
                    "message": f"✅ Payroll generated for {payload['month']}/{payload['year']}",
                    "data": data,
                    "action_performed": "generate_payroll"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to generate payroll: {response.text}",
                    "action_performed": "generate_payroll"
                }
    
    async def view_payroll(self, params: Dict) -> Dict[str, Any]:
        """View payroll for a specific month"""
        month = params.get("month", datetime.now().month)
        year = params.get("year", datetime.now().year)
        endpoint = f"{self.base_url}/api/finance/payroll/{month}/{year}"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "message": f"Payroll for {month}/{year}",
                    "data": data,
                    "action_performed": "view_payroll"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to fetch payroll: {response.text}",
                    "action_performed": "view_payroll"
                }
    
    # ========================================================================
    # REPORT OPERATIONS
    # ========================================================================
    
    async def view_profit_loss(self, params: Dict) -> Dict[str, Any]:
        """View Profit & Loss statement"""
        endpoint = f"{self.base_url}/api/finance/reports/profit-loss"
        
        query_params = {}
        if params.get("start_date"):
            query_params["start_date"] = params["start_date"]
        if params.get("end_date"):
            query_params["end_date"] = params["end_date"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint, params=query_params)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "message": f"📊 Profit & Loss: Net Profit = ₹{data.get('net_profit', 0)}",
                    "data": data,
                    "action_performed": "view_profit_loss"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to fetch P&L: {response.text}",
                    "action_performed": "view_profit_loss"
                }
    
    async def view_balance_sheet(self, params: Dict) -> Dict[str, Any]:
        """View Balance Sheet"""
        endpoint = f"{self.base_url}/api/finance/reports/balance-sheet"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "message": f"📊 Balance Sheet retrieved",
                    "data": data,
                    "action_performed": "view_balance_sheet"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to fetch balance sheet: {response.text}",
                    "action_performed": "view_balance_sheet"
                }
    
    async def view_cash_flow(self, params: Dict) -> Dict[str, Any]:
        """View Cash Flow statement"""
        endpoint = f"{self.base_url}/api/finance/reports/cash-flow"
        
        query_params = {}
        if params.get("start_date"):
            query_params["start_date"] = params["start_date"]
        if params.get("end_date"):
            query_params["end_date"] = params["end_date"]
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint, params=query_params)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "message": f"📊 Cash Flow statement retrieved",
                    "data": data,
                    "action_performed": "view_cash_flow"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to fetch cash flow: {response.text}",
                    "action_performed": "view_cash_flow"
                }
    
    async def view_dashboard_summary(self, params: Dict) -> Dict[str, Any]:
        """View finance dashboard summary"""
        endpoint = f"{self.base_url}/api/finance/dashboard/summary"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(endpoint)
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "message": f"📊 Dashboard summary retrieved",
                    "data": data,
                    "action_performed": "view_dashboard_summary"
                }
            else:
                return {
                    "success": False,
                    "message": f"Failed to fetch dashboard: {response.text}",
                    "action_performed": "view_dashboard_summary"
                }


# Global instance
finance_agent = FinanceAgent()
