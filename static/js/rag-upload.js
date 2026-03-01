/**
 * RAG System Frontend - Knowledge Base Management
 * Handles document upload, search, and management
 */

class RAGManager {
    constructor() {
        this.apiBase = '/api/rag';
        this.documents = [];
        this.init();
    }

    async init() {
        console.log('🎓 Initializing RAG Manager...');
        await this.loadStatus();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Document upload
        const uploadForm = document.getElementById('rag-upload-form');
        if (uploadForm) {
            uploadForm.addEventListener('submit', (e) => this.handleUpload(e));
        }

        // File input change - show selected files
        const fileInput = document.getElementById('rag-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', () => this.updateFilesList());
        }

        // Search
        const searchBtn = document.getElementById('rag-search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // Search input - enter key
        const searchInput = document.getElementById('rag-search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSearch();
            });
        }

        // Drag and drop
        const dropZone = document.getElementById('rag-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            dropZone.addEventListener('drop', (e) => this.handleDrop(e));
            // Click to open file browser
            dropZone.addEventListener('click', () => {
                const fileInput = document.getElementById('rag-file-input');
                if (fileInput) fileInput.click();
            });
        }
    }

    updateFilesList() {
        const fileInput = document.getElementById('rag-file-input');
        const selectedDiv = document.getElementById('rag-files-selected');
        
        if (!fileInput || !selectedDiv) return;
        
        if (fileInput.files && fileInput.files.length > 0) {
            let filesText = `✅ ${fileInput.files.length} file(s) selected: `;
            const fileNames = Array.from(fileInput.files).map(f => f.name).join(', ');
            selectedDiv.textContent = filesText + fileNames;
            selectedDiv.style.display = 'block';
        } else {
            selectedDiv.style.display = 'none';
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementById('rag-drop-zone')?.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('rag-drop-zone')?.classList.remove('dragover');
    }

    async handleDrop(e) {
        e.preventDefault();
        document.getElementById('rag-drop-zone')?.classList.remove('dragover');

        const files = e.dataTransfer.files;
        for (let file of files) {
            if (file.type === 'application/pdf' || file.name.endsWith('.docx')) {
                await this.uploadFile(file);
            } else {
                this.showMessage(`❌ Unsupported file: ${file.name}. Only PDF and DOCX allowed.`, 'error');
            }
        }
    }

    async handleUpload(e) {
        e.preventDefault();
        const input = document.getElementById('rag-file-input');
        if (input?.files?.length > 0) {
            for (let file of input.files) {
                await this.uploadFile(file);
            }
            input.value = '';
            this.updateFilesList();
        } else {
            this.showMessage('📝 Please select files to upload', 'info');
        }
    }

    async uploadFile(file) {
        console.log(`📤 Uploading: ${file.name}`);

        const formData = new FormData();
        formData.append('file', file);

        const progressDiv = document.getElementById('rag-upload-progress');
        if (progressDiv) {
            progressDiv.innerHTML = `<div class="loading">⏳ Uploading ${file.name}...</div>`;
        }

        try {
            const response = await fetch(`${this.apiBase}/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage(`✅ Uploaded "${file.name}" with ${result.chunks} chunks`, 'success');
                await this.loadStatus();
            } else {
                this.showMessage(`❌ Upload failed: ${result.error || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showMessage(`❌ Upload error: ${error.message}`, 'error');
        } finally {
            if (progressDiv) {
                progressDiv.innerHTML = '';
            }
        }
    }

    async handleSearch() {
        const query = document.getElementById('rag-search-input')?.value || '';
        if (!query.trim()) {
            this.showMessage('📝 Please enter a search query', 'info');
            return;
        }

        console.log(`🔍 Searching: ${query}`);

        const resultsDiv = document.getElementById('rag-search-results');
        if (resultsDiv) {
            resultsDiv.innerHTML = '<div class="loading">🔄 Searching knowledge base...</div>';
        }

        try {
            const response = await fetch(`${this.apiBase}/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    top_k: 5,
                    min_score: 0.6
                })
            });

            const result = await response.json();

            if (result.success && result.results && result.results.length > 0) {
                this.displaySearchResults(result.results);
            } else {
                const resultsDiv = document.getElementById('rag-search-results');
                if (resultsDiv) {
                    resultsDiv.innerHTML = '<p style="color: #999; text-align: center;">📋 No relevant documents found. Try different keywords.</p>';
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showMessage(`❌ Search error: ${error.message}`, 'error');
        }
    }

    displaySearchResults(results) {
        const resultsDiv = document.getElementById('rag-search-results');
        if (!resultsDiv) return;

        let html = '<div class="rag-results-container">';

        results.forEach((result, idx) => {
            const scorePercent = Math.round(result.score * 100);
            const title = result.metadata?.title || 'Document';
            const category = result.metadata?.category || 'General';

            html += `
                <div class="rag-result-item">
                    <div class="rag-result-header">
                        <h4>${title}</h4>
                        <span class="rag-relevance" style="background: ${this.getColorByScore(result.score)};
                            color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.85em;">
                            ${scorePercent}% Match
                        </span>
                    </div>
                    <div class="rag-result-meta">
                        <span>📂 ${category}</span>
                        <span>📄 ${result.metadata?.doc_type || 'Document'}</span>
                    </div>
                    <div class="rag-result-content">
                        ${this.escapeHtml(result.content)}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        resultsDiv.innerHTML = html;
    }

    async loadStatus() {
        try {
            const response = await fetch(`${this.apiBase}/status`);
            const result = await response.json();

            if (result.success) {
                this.updateStatus(result);
            }
        } catch (error) {
            console.error('Status error:', error);
        }
    }

    updateStatus(info) {
        let statusHtml = `
            <div class="rag-status-info">
                <div><strong>📚 Total Documents:</strong> ${info.total_documents}</div>
                <div><strong>📖 Total Chunks:</strong> ${info.total_chunks}</div>
                <div><strong>🤖 Embedding Model:</strong> all-MiniLM-L6-v2</div>
                <div><strong>💾 Vector Store:</strong> Chromadb (SQLite)</div>
                <div><strong>✅ Status:</strong> ${info.status}</div>
            </div>
        `;

        const statusDiv = document.getElementById('rag-status');
        if (statusDiv) {
            statusDiv.innerHTML = statusHtml;
        }
    }

    getColorByScore(score) {
        if (score >= 0.8) return '#27ae60'; // Green
        if (score >= 0.7) return '#3498db'; // Blue
        if (score >= 0.6) return '#f39c12'; // Orange
        return '#95a5a6'; // Gray
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(text, type = 'info') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `rag-message ${type}`;
        msgDiv.textContent = text;

        const container = document.getElementById('rag-messages') || document.body;
        container.insertBefore(msgDiv, container.firstChild);

        setTimeout(() => msgDiv.remove(), 5000);
    }
}

// Initialize RAG Manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ragManager = new RAGManager();
    });
} else {
    window.ragManager = new RAGManager();
}
