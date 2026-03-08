import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileJson, Database, FileSpreadsheet, Edit3, Copy } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export default function MultiFormatDataInput({ onDataSubmit, dataType = 'transactions' }) {
  const [format, setFormat] = useState('manual') // manual, csv, json, excel, paste
  const [manualData, setManualData] = useState({
    date: '',
    description: '',
    amount: '',
    category: '',
  })
  const [csvText, setCsvText] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const parseCSV = (text) => {
    try {
      const lines = text.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const data = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx]
        })
        data.push(row)
      }
      
      return data
    } catch (e) {
      throw new Error(`CSV Parse Error: ${e.message}`)
    }
  }

  const parseJSON = (text) => {
    try {
      return JSON.parse(text)
    } catch (e) {
      throw new Error(`JSON Parse Error: ${e.message}`)
    }
  }

  const parsePaste = (text) => {
    // Handle tab-separated or space-separated data
    try {
      const lines = text.trim().split('\n')
      const data = []
      
      lines.forEach(line => {
        const values = line.split(/\t+|\s{2,}/).map(v => v.trim()).filter(v => v)
        data.push(values)
      })
      
      return data
    } catch (e) {
      throw new Error(`Paste Parse Error: ${e.message}`)
    }
  }

  const handleSubmitManual = () => {
    if (!manualData.date || !manualData.amount) {
      setError('Date and Amount are required')
      return
    }
    
    try {
      const payload = [{
        date: manualData.date,
        description: manualData.description || 'Manual Entry',
        amount: parseFloat(manualData.amount),
        category: manualData.category || 'Other',
      }]
      
      onDataSubmit(payload, 'manual')
      setSuccess('Data added successfully!')
      setManualData({ date: '', description: '', amount: '', category: '' })
      setError('')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSubmitCSV = () => {
    if (!csvText) {
      setError('Please enter CSV data')
      return
    }
    
    try {
      const data = parseCSV(csvText)
      onDataSubmit(data, 'csv')
      setSuccess(`Successfully imported ${data.length} records`)
      setCsvText('')
      setError('')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSubmitJSON = () => {
    if (!jsonText) {
      setError('Please enter JSON data')
      return
    }
    
    try {
      const data = parseJSON(jsonText)
      onDataSubmit(Array.isArray(data) ? data : [data], 'json')
      setSuccess(`Successfully imported ${Array.isArray(data) ? data.length : 1} record(s)`)
      setJsonText('')
      setError('')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSubmitPaste = () => {
    if (!pasteText) {
      setError('Please paste data')
      return
    }
    
    try {
      const data = parsePaste(pasteText)
      onDataSubmit(data, 'paste')
      setSuccess(`Successfully imported ${data.length} records`)
      setPasteText('')
      setError('')
      setTimeout(() => setSuccess(''), 2000)
    } catch (e) {
      setError(e.message)
    }
  }

  const getExampleCSV = () => {
    return `date,description,amount,category,type\n2026-03-08,Client Payment,50000,Revenue,credit\n2026-03-07,Office Rent,-15000,Rent,debit\n2026-03-06,Utilities,-2500,Expenses,debit`
  }

  const getExampleJSON = () => {
    return JSON.stringify([
      { date: '2026-03-08', description: 'Client Payment', amount: 50000, category: 'Revenue', type: 'credit' },
      { date: '2026-03-07', description: 'Office Rent', amount: -15000, category: 'Rent', type: 'debit' },
    ], null, 2)
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-2xl p-6" style={{ background: 'var(--tc-card-bg)', border: '1px solid var(--tc-card-border)' }}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-base font-semibold" style={{ color: 'var(--tc-text-1)' }}>Add Financial Data</h3>
        <p className="text-xs mt-1" style={{ color: 'var(--tc-text-3)' }}>Enter data in your preferred format</p>
      </div>

      {/* Format Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'manual', label: 'Manual Entry', icon: Edit3 },
          { id: 'csv', label: 'CSV', icon: Database },
          { id: 'json', label: 'JSON', icon: FileJson },
          { id: 'paste', label: 'Paste Data', icon: Copy },
        ].map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => { setFormat(tab.id); setError('') }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: format === tab.id ? 'var(--tc-accent)' : 'var(--tc-btn-micro)',
                color: format === tab.id ? '#fff' : 'var(--tc-text-2)',
                border: format === tab.id ? 'none' : '1px solid var(--tc-card-border)',
              }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Error & Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-lg text-xs"
            style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-lg text-xs"
            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Entry Form */}
      {format === 'manual' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={manualData.date}
              onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
              placeholder="Date"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ 
                background: 'var(--tc-input-bg)',
                color: 'var(--tc-text-1)',
                border: '1px solid var(--tc-divider)',
              }}
            />
            <input
              type="number"
              value={manualData.amount}
              onChange={(e) => setManualData({ ...manualData, amount: e.target.value })}
              placeholder="Amount (positive for income, negative for expense)"
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ 
                background: 'var(--tc-input-bg)',
                color: 'var(--tc-text-1)',
                border: '1px solid var(--tc-divider)',
              }}
            />
          </div>
          <input
            type="text"
            value={manualData.description}
            onChange={(e) => setManualData({ ...manualData, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ 
              background: 'var(--tc-input-bg)',
              color: 'var(--tc-text-1)',
              border: '1px solid var(--tc-divider)',
            }}
          />
          <input
            type="text"
            value={manualData.category}
            onChange={(e) => setManualData({ ...manualData, category: e.target.value })}
            placeholder="Category (Revenue, Rent, Utilities, etc.)"
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ 
              background: 'var(--tc-input-bg)',
              color: 'var(--tc-text-1)',
              border: '1px solid var(--tc-divider)',
            }}
          />
          <button
            onClick={handleSubmitManual}
            className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--tc-accent)' }}
          >
            Add Entry
          </button>
        </motion.div>
      )}

      {/* CSV Input */}
      {format === 'csv' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--tc-text-3)' }}>Format: date,description,amount,category,type</p>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={getExampleCSV()}
              rows={6}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono"
              style={{ 
                background: 'var(--tc-input-bg)',
                color: 'var(--tc-text-1)',
                border: '1px solid var(--tc-divider)',
              }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCsvText(getExampleCSV())}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--tc-btn-micro)', color: 'var(--tc-text-2)', border: '1px solid var(--tc-card-border)' }}
            >
              Load Example
            </button>
            <button
              onClick={handleSubmitCSV}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--tc-accent)' }}
            >
              Import CSV
            </button>
          </div>
        </motion.div>
      )}

      {/* JSON Input */}
      {format === 'json' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={getExampleJSON()}
            rows={8}
            className="w-full px-3 py-2 rounded-lg text-xs font-mono"
            style={{ 
              background: 'var(--tc-input-bg)',
              color: 'var(--tc-text-1)',
              border: '1px solid var(--tc-divider)',
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setJsonText(getExampleJSON())}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ background: 'var(--tc-btn-micro)', color: 'var(--tc-text-2)', border: '1px solid var(--tc-card-border)' }}
            >
              Load Example
            </button>
            <button
              onClick={handleSubmitJSON}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--tc-accent)' }}
            >
              Import JSON
            </button>
          </div>
        </motion.div>
      )}

      {/* Paste Data */}
      {format === 'paste' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--tc-text-3)' }}>
            Paste tab-separated or space-separated data (e.g., from spreadsheets)
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="2026-03-08  Client Payment  50000  Revenue  credit&#10;2026-03-07  Office Rent  -15000  Rent  debit"
            rows={8}
            className="w-full px-3 py-2 rounded-lg text-xs font-mono"
            style={{ 
              background: 'var(--tc-input-bg)',
              color: 'var(--tc-text-1)',
              border: '1px solid var(--tc-divider)',
            }}
          />
          <button
            onClick={handleSubmitPaste}
            className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--tc-accent)' }}
          >
            Import Data
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
