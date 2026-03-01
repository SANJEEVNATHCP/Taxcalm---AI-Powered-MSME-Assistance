/**
 * Finance Navigator - Handles AI-triggered navigation within the app
 * Maps natural language targets to actual page sections
 */

class FinanceNavigator {
    constructor() {
        this.currentSection = 'dashboard';
        console.log('�� Finance Navigator initialized');
    }

    /**
     * Navigate to a specific section based on AI command
     * @param {string} target - One of: dashboard, expenses, reports, profile, next_page, previous_page
     */
    navigate(target) {
        console.log(`🧭 Navigating to: ${target}`);

        switch (target) {
            case 'dashboard':
                this.navigateToDashboard();
                break;
            
            case 'expenses':
            case 'transactions':
                this.navigateToExpenses();
                break;
            
            case 'reports':
                this.navigateToReports();
                break;
            
            case 'profile':
            case 'settings':
                this.navigateToProfile();
                break;
            
            case 'next_page':
                this.navigateNext();
                break;
                
            case 'previous_page':
            case 'back':
                this.navigatePrevious();
                break;
            
            default:
                console.warn(`Unknown navigation target: ${target}`);
                this.showMessage(`Unable to navigate to: ${target}`);
        }
    }

    /**
     * Navigate to main dashboard/home
     */
    navigateToDashboard() {
        console.log('📊 Opening dashboard');
        
        // Try clicking Finance tab if it exists
        const financeTab = document.querySelector('[onclick*="Finance"]') || 
                          document.getElementById('analyticsTab') ||
                          document.querySelector('button:contains("Analytics")');
        
        if (financeTab) {
            financeTab.click();
            this.currentSection = 'dashboard';
            
            // If there's a dashboard section within finance, activate it
            setTimeout(() => {
                const dashboardSection = document.querySelector('[data-section="dashboard"]') ||
                                        document.getElementById('dashboard');
                if (dashboardSection) {
                    dashboardSection.click();
                }
            }, 100);
        } else {
            // Fallback: scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        this.showMessage('📊 Showing dashboard');
    }

    /**
     * Navigate to expenses/transactions section
     */
    navigateToExpenses() {
        console.log('💸 Opening expenses section');
        
        // Look for Finance tab first
        const financeTab = document.querySelector('[onclick*="Finance"]') || 
                          document.getElementById('analyticsTab');
        
        if (financeTab) {
            financeTab.click();
            
            // Then look for accounting/transactions sub-section
            setTimeout(() => {
                const accountingBtn = document.querySelector('[onclick*="accounting"]') ||
                                     document.querySelector('[data-section="accounting"]') ||
                                     document.getElementById('accountingBtn');
                
                if (accountingBtn) {
                    accountingBtn.click();
                    this.currentSection = 'expenses';
                }
            }, 100);
        }
        
        this.showMessage('💸 Showing expenses and transactions');
    }

    /**
     * Navigate to reports section
     */
    navigateToReports() {
        console.log('📈 Opening reports section');
        
        // Look for Finance tab first
        const financeTab = document.querySelector('[onclick*="Finance"]') || 
                          document.getElementById('analyticsTab');
        
        if (financeTab) {
            financeTab.click();
            
            // Then look for reports sub-section
            setTimeout(() => {
                const reportsBtn = document.querySelector('[onclick*="reports"]') ||
                                  document.querySelector('[data-section="reports"]') ||
                                  document.getElementById('reportsBtn');
                
                if (reportsBtn) {
                    reportsBtn.click();
                    this.currentSection = 'reports';
                }
            }, 100);
        }
        
        this.showMessage('📈 Showing financial reports');
    }

    /**
     * Navigate to profile/settings
     */
    navigateToProfile() {
        console.log('⚙️ Opening profile/settings');
        
        const aboutTab = document.querySelector('[onclick*="About"]') || 
                        document.getElementById('aboutTab');
        
        if (aboutTab) {
            aboutTab.click();
            this.currentSection = 'profile';
        }
        
        this.showMessage('⚙️ Showing profile');
    }

    /**
     * Navigate to next page/section
     */
    navigateNext() {
        console.log('➡️ Moving to next section');
        
        // Define section order
        const sections = ['dashboard', 'expenses', 'reports', 'profile'];
        const currentIndex = sections.indexOf(this.currentSection);
        
        if (currentIndex < sections.length - 1) {
            const nextSection = sections[currentIndex + 1];
            this.navigate(nextSection);
        } else {
            this.showMessage('Already at the last section');
        }
    }

    /**
     * Navigate to previous page/section
     */
    navigatePrevious() {
        console.log('⬅️ Moving to previous section');
        
        // Define section order
        const sections = ['dashboard', 'expenses', 'reports', 'profile'];
        const currentIndex = sections.indexOf(this.currentSection);
        
        if (currentIndex > 0) {
            const prevSection = sections[currentIndex - 1];
            this.navigate(prevSection);
        } else {
            this.showMessage('Already at the first section');
        }
    }

    /**
     * Show a temporary message to user
     */
    showMessage(message) {
        // Try to add message to chat if available
        if (typeof addMessage === 'function') {
            // Function exists in ai-assistant.js
            return;
        }
        
        // Fallback: show alert or console
        console.log('📢 Navigation message:', message);
    }
}

// Initialize navigator globally
window.financeNavigator = new FinanceNavigator();
console.log('✅ Finance Navigator ready');
