/**
 * GPU Accelerator using GPU.js
 * Compatible with AMD Radeon, NVIDIA GeForce, and Intel GPUs
 * Accelerates mathematical calculations for GST computations
 */

class GPUAccelerator {
    constructor() {
        this.gpu = null;
        this.isAvailable = false;
        this.gpuInfo = {
            vendor: 'Unknown',
            renderer: 'Unknown',
            backend: 'CPU (Fallback)'
        };
        this.initialize();
    }

    initialize() {
        try {
            // Initialize GPU.js - works with AMD/NVIDIA/Intel GPUs
            this.gpu = new GPU({
                mode: 'gpu' // Try GPU first, fallback to CPU if unavailable
            });
            
            this.isAvailable = true;
            this.detectGPU();
            
            console.log('✅ GPU Acceleration initialized');
            console.log('   Backend:', this.gpuInfo.backend);
            console.log('   Vendor:', this.gpuInfo.vendor);
            console.log('   Renderer:', this.gpuInfo.renderer);
        } catch (error) {
            console.warn('⚠️  GPU acceleration not available, using CPU fallback:', error);
            this.isAvailable = false;
        }
    }

    detectGPU() {
        // Detect GPU information from WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                this.gpuInfo.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                this.gpuInfo.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                
                // Detect if AMD GPU
                if (this.gpuInfo.vendor.includes('AMD') || this.gpuInfo.renderer.includes('Radeon')) {
                    this.gpuInfo.backend = 'WebGL (AMD Radeon)';
                } else if (this.gpuInfo.vendor.includes('NVIDIA') || this.gpuInfo.renderer.includes('GeForce')) {
                    this.gpuInfo.backend = 'WebGL (NVIDIA)';
                } else if (this.gpuInfo.vendor.includes('Intel')) {
                    this.gpuInfo.backend = 'WebGL (Intel)';
                } else {
                    this.gpuInfo.backend = 'WebGL';
                }
            }
        }
    }

    /**
     * GPU-accelerated batch GST calculation
     * Useful for calculating multiple scenarios or comparing different rates
     */
    batchGSTCalculation(salesPrices, gstRates) {
        if (!this.isAvailable) {
            return this.batchGSTCalculationCPU(salesPrices, gstRates);
        }

        try {
            const calculateGST = this.gpu.createKernel(function(prices, rates) {
                const price = prices[this.thread.x];
                const rate = rates[this.thread.x];
                return price * (rate / 100);
            }).setOutput([salesPrices.length]);

            return calculateGST(salesPrices, gstRates);
        } catch (error) {
            console.warn('GPU calculation failed, using CPU:', error);
            return this.batchGSTCalculationCPU(salesPrices, gstRates);
        }
    }

    /**
     * CPU fallback for batch calculations
     */
    batchGSTCalculationCPU(salesPrices, gstRates) {
        return salesPrices.map((price, i) => price * (gstRates[i] / 100));
    }

    /**
     * GPU-accelerated array sum (useful for totaling GST amounts)
     */
    sumArray(numbers) {
        if (!this.isAvailable || numbers.length < 1000) {
            // For small arrays, CPU is faster due to GPU overhead
            return numbers.reduce((a, b) => a + b, 0);
        }

        try {
            const sum = this.gpu.createKernel(function(arr) {
                return arr[this.thread.x];
            }).setOutput([numbers.length]);

            const result = sum(numbers);
            return Array.from(result).reduce((a, b) => a + b, 0);
        } catch (error) {
            return numbers.reduce((a, b) => a + b, 0);
        }
    }

    /**
     * Calculate compound interest for tax projections (GPU accelerated)
     */
    calculateCompoundInterest(principals, rates, periods) {
        if (!this.isAvailable) {
            return principals.map((p, i) => p * Math.pow(1 + rates[i], periods[i]));
        }

        try {
            const compound = this.gpu.createKernel(function(p, r, n) {
                const principal = p[this.thread.x];
                const rate = r[this.thread.x];
                const period = n[this.thread.x];
                
                let result = principal;
                for (let i = 0; i < period; i++) {
                    result = result * (1 + rate);
                }
                return result;
            }).setOutput([principals.length]);

            return compound(principals, rates, periods);
        } catch (error) {
            return principals.map((p, i) => p * Math.pow(1 + rates[i], periods[i]));
        }
    }

    /**
     * Get GPU information for display
     */
    getInfo() {
        return {
            available: this.isAvailable,
            vendor: this.gpuInfo.vendor,
            renderer: this.gpuInfo.renderer,
            backend: this.gpuInfo.backend,
            isAMD: this.gpuInfo.vendor.includes('AMD') || this.gpuInfo.renderer.includes('Radeon'),
            isNVIDIA: this.gpuInfo.vendor.includes('NVIDIA'),
            isIntel: this.gpuInfo.vendor.includes('Intel')
        };
    }

    /**
     * Clean up GPU resources
     */
    destroy() {
        if (this.gpu) {
            this.gpu.destroy();
        }
    }
}

// Initialize global GPU accelerator
window.gpuAccelerator = new GPUAccelerator();

// Log GPU info to console
console.log('🚀 GPU Accelerator Status:', window.gpuAccelerator.getInfo());
