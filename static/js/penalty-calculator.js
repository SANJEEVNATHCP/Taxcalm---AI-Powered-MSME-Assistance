/**
 * Penalty & Risk Assessment Calculator
 * Calculates penalties for late GST filing, Income Tax delays, and compliance violations
 */

class PenaltyCalculator {
    constructor() {
        this.gstPenaltyRates = {
            late_filing_fee: 100, // Rs. 100 per day (max Rs. 5000)
            max_late_fee: 5000,
            interest_rate: 18, // 18% per annum
            nil_return_penalty: 20 // Rs. 20 per day (max Rs. 500)
        };
        
        this.incomeTaxPenaltyRates = {
            late_filing_fee: 5000, // Rs. 5000 if filed by Dec 31
            late_filing_extended: 10000, // Rs. 10000 if filed after Dec 31
            interest_rate_234a: 1, // 1% per month on unpaid tax
            interest_rate_234b: 1, // 1% per month on shortfall in advance tax
            interest_rate_234c: 1 // 1% per month on deferment of advance tax
        };
    }
    
    /**
     * Calculate GST Late Filing Penalty
     */
    calculateGSTLateFiling(daysLate, hasTransaction = true) {
        let penalty = 0;
        let details = [];
        
        if (hasTransaction) {
            // Regular GST return with transactions
            const lateFee = Math.min(daysLate * this.gstPenaltyRates.late_filing_fee, 
                                     this.gstPenaltyRates.max_late_fee);
            penalty += lateFee;
            details.push({
                type: 'Late Filing Fee',
                calculation: `${daysLate} days × ₹${this.gstPenaltyRates.late_filing_fee}/day`,
                amount: lateFee,
                note: `(Maximum: ₹${this.gstPenaltyRates.max_late_fee})`
            });
        } else {
            // Nil GST return
            const nilPenalty = Math.min(daysLate * this.gstPenaltyRates.nil_return_penalty, 500);
            penalty += nilPenalty;
            details.push({
                type: 'Nil Return Late Fee',
                calculation: `${daysLate} days × ₹${this.gstPenaltyRates.nil_return_penalty}/day`,
                amount: nilPenalty,
                note: '(Maximum: ₹500)'
            });
        }
        
        return {
            totalPenalty: penalty,
            details: details,
            daysLate: daysLate,
            recommendation: this.getGSTRecommendation(daysLate)
        };
    }
    
    /**
     * Calculate GST Interest on Late Payment
     */
    calculateGSTInterest(taxAmount, daysLate) {
        // Interest = Tax Amount × Interest Rate × (Days Late / 365)
        const interestRate = this.gstPenaltyRates.interest_rate / 100;
        const interest = taxAmount * interestRate * (daysLate / 365);
        
        return {
            interest: Math.round(interest),
            taxAmount: taxAmount,
            daysLate: daysLate,
            rate: this.gstPenaltyRates.interest_rate,
            calculation: `₹${taxAmount} × ${this.gstPenaltyRates.interest_rate}% × (${daysLate}/365)`,
            recommendation: 'Pay immediately to avoid further interest accumulation'
        };
    }
    
    /**
     * Calculate Income Tax Late Filing Penalty
     */
    calculateIncomeTaxLateFiling(filingDate, assessmentYear) {
        const dueDateJuly = new Date(assessmentYear, 6, 31); // July 31
        const dueDateDec = new Date(assessmentYear, 11, 31); // Dec 31
        const filing = new Date(filingDate);
        
        let penalty = 0;
        let penaltyType = '';
        
        if (filing <= dueDateJuly) {
            penalty = 0;
            penaltyType = 'Filed on time';
        } else if (filing <= dueDateDec) {
            penalty = this.incomeTaxPenaltyRates.late_filing_fee;
            penaltyType = 'Filed between Aug 1 - Dec 31';
        } else {
            penalty = this.incomeTaxPenaltyRates.late_filing_extended;
            penaltyType = 'Filed after Dec 31';
        }
        
        return {
            penalty: penalty,
            penaltyType: penaltyType,
            dueDate: dueDateJuly.toLocaleDateString('en-IN'),
            filingDate: filing.toLocaleDateString('en-IN'),
            recommendation: penalty > 0 ? 'File as soon as possible to avoid higher penalties' : 'Good! Filed on time'
        };
    }
    
    /**
     * Calculate Income Tax Interest (Section 234A, 234B, 234C)
     */
    calculateIncomeTaxInterest(taxAmount, months, section = '234A') {
        const rate = section === '234A' ? this.incomeTaxPenaltyRates.interest_rate_234a :
                     section === '234B' ? this.incomeTaxPenaltyRates.interest_rate_234b :
                     this.incomeTaxPenaltyRates.interest_rate_234c;
        
        const interest = taxAmount * (rate / 100) * months;
        
        return {
            interest: Math.round(interest),
            section: section,
            rate: rate,
            months: months,
            taxAmount: taxAmount,
            calculation: `₹${taxAmount} × ${rate}% × ${months} months`,
            description: this.getSectionDescription(section)
        };
    }
    
    /**
     * Risk Assessment for Business
     */
    assessComplianceRisk(profile) {
        const risks = [];
        let riskScore = 0;
        
        // Check GST registration
        if (!profile.gstin || profile.gstin.length !== 15) {
            risks.push({
                level: 'HIGH',
                category: 'GST Registration',
                issue: 'Invalid or missing GSTIN',
                impact: 'Cannot claim Input Tax Credit, legal penalties',
                action: 'Register for GST immediately if turnover > ₹40 lakhs'
            });
            riskScore += 30;
        }
        
        // Check PAN
        if (!profile.pan || profile.pan.length !== 10) {
            risks.push({
                level: 'HIGH',
                category: 'PAN',
                issue: 'Invalid or missing PAN',
                impact: 'Cannot file Income Tax returns, banking restrictions',
                action: 'Apply for PAN card immediately'
            });
            riskScore += 25;
        }
        
        // Check turnover vs GST threshold
        if (profile.turnover) {
            const turnover = parseInt(profile.turnover.replace(/[^0-9]/g, '')) || 0;
            if (turnover > 4000000 && !profile.gstin) {
                risks.push({
                    level: 'CRITICAL',
                    category: 'GST Compliance',
                    issue: 'Turnover exceeds GST threshold but not registered',
                    impact: 'Immediate penalty, cannot operate legally',
                    action: 'Register for GST within 30 days'
                });
                riskScore += 40;
            }
        }
        
        // Check business type specific risks
        if (profile.type === 'Partnership' && !profile.partnershipDeed) {
            risks.push({
                level: 'MEDIUM',
                category: 'Legal Documentation',
                issue: 'Partnership deed not on record',
                impact: 'Disputes, tax complications',
                action: 'Register partnership deed'
            });
            riskScore += 15;
        }
        
        // Industry-specific risks
        if (profile.industry === 'Manufacturing') {
            risks.push({
                level: 'MEDIUM',
                category: 'Labor Laws',
                issue: 'Manufacturing businesses must comply with Factory Act',
                impact: 'Labor law violations, penalties',
                action: 'Ensure Factory Act compliance, PF/ESI registration'
            });
            riskScore += 10;
        }
        
        // Calculate overall risk level
        let overallRisk = 'LOW';
        if (riskScore > 50) overallRisk = 'CRITICAL';
        else if (riskScore > 30) overallRisk = 'HIGH';
        else if (riskScore > 15) overallRisk = 'MEDIUM';
        
        return {
            overallRisk: overallRisk,
            riskScore: riskScore,
            risks: risks,
            totalRisks: risks.length,
            recommendation: this.getRiskRecommendation(overallRisk)
        };
    }
    
    /**
     * Helper Methods
     */
    getGSTRecommendation(daysLate) {
        if (daysLate === 0) return 'Good! You are on time.';
        if (daysLate <= 15) return 'File immediately to minimize penalties.';
        if (daysLate <= 60) return 'Urgent! File now and pay penalty to avoid legal action.';
        return 'Critical! Consult a CA immediately. You may face notices from GST department.';
    }
    
    getSectionDescription(section) {
        const descriptions = {
            '234A': 'Interest for delay in filing return',
            '234B': 'Interest for default in payment of advance tax',
            '234C': 'Interest for deferment of advance tax'
        };
        return descriptions[section] || '';
    }
    
    getRiskRecommendation(riskLevel) {
        const recommendations = {
            'LOW': 'Your compliance is good. Continue regular filing and maintain records.',
            'MEDIUM': 'Some compliance gaps exist. Address them within 30 days to avoid penalties.',
            'HIGH': 'Immediate action required. Consult with a CA and file pending returns.',
            'CRITICAL': 'Severe compliance issues. Seek professional help immediately to avoid legal action.'
        };
        return recommendations[riskLevel];
    }
    
    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize penalty calculator globally
window.penaltyCalculator = new PenaltyCalculator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PenaltyCalculator;
}
