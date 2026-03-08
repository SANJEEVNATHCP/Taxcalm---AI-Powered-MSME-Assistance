import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'
import { Upload, FileJson, Database, CheckCircle, AlertCircle, Loader, X } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.05, ease: 'easeOut' } }),
}

export default function BulkDataImporter({ onDataImport, dataType = 'trends' }) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setMessage(null)
    setPreview(null)

    try {
      const fileExtension = file.name.split('.').pop().toLowerCase()
      const fileContent = await file.text()

      let parsedData = []
      let rowCount = 0

      if (fileExtension === 'csv') {
        // Parse CSV
        const lines = fileContent.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue
          const values = lines[i].split(',').map(v => v.trim())
          const row = {}
          headers.forEach((header, idx) => {
            row[header] = isNaN(values[idx]) ? values[idx] : parseFloat(values[idx])
          })
          parsedData.push(row)
        }
        rowCount = parsedData.length
      } 
      else if (fileExtension === 'json') {
        // Parse JSON
        parsedData = JSON.parse(fileContent)
        if (!Array.isArray(parsedData)) {
          throw new Error('JSON must be an array of objects')
        }
        rowCount = parsedData.length
      }
      else {
        throw new Error('Unsupported file format. Use CSV or JSON.')
      }

      if (rowCount === 0) {
        throw new Error('No data found in file')
      }

      // Preview first 3 rows
      setPreview({
        format: fileExtension.toUpperCase(),
        rowCount,
        sampleRows: parsedData.slice(0, 3),
        filename: file.name,
      })

      setMessage({
        type: 'success',
        text: `✅ ${rowCount} records ready to import from ${file.name}`,
      })

      // Auto-import after preview
      setTimeout(() => {
        onDataImport(parsedData, fileExtension)
        reset()
      }, 1500)
    } 
    catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Error: ${error.message}`,
      })
      setPreview(null)
    } 
    finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setMessage(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
      <div className="rounded-2xl p-6" style={{ background: 'var(--tc-card-bg)', border: '2px dashed rgba(139,92,246,0.4)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.2)' }}>
            <Database className="w-6 h-6" style={{ color: '#8b5cf6' }} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--tc-text-1)' }}>Bulk Data Import</h4>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--tc-text-3)' }}>
              Upload CSV or JSON file with 100s/1000s of records. Instant processing & visualization.
            </p>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="mt-4">
          <label className="block cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              disabled={isLoading}
              className="hidden"
            />
            <div
              className="relative rounded-xl border-2 border-dashed p-6 transition-all hover:border-opacity-100"
              style={{
                borderColor: isLoading ? 'rgba(139,92,246,0.6)' : 'rgba(139,92,246,0.3)',
                backgroundColor: isLoading ? 'rgba(139,92,246,0.05)' : 'transparent',
              }}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <Loader className="w-8 h-8 animate-spin" style={{ color: '#8b5cf6' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--tc-text-1)' }}>Processing...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8" style={{ color: '#8b5cf6' }} />
                    <div className="text-center">
                      <p className="text-sm font-medium" style={{ color: 'var(--tc-text-1)' }}>
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--tc-text-3)' }}>
                        CSV or JSON (Max 50MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </label>
        </div>

        {/* Message Alert */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 rounded-lg p-3 flex items-start gap-3 text-sm"
              style={{
                background: message.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                border: `1px solid ${message.type === 'success' ? '#34d399' : '#f87171'}`,
              }}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#34d399' }} />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#f87171' }} />
              )}
              <span style={{ color: 'var(--tc-text-1)' }}>{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Table */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {preview.format === 'JSON' ? (
                    <FileJson className="w-4 h-4" style={{ color: '#60a5fa' }} />
                  ) : (
                    <Database className="w-4 h-4" style={{ color: '#fbbf24' }} />
                  )}
                  <span className="text-xs font-medium" style={{ color: 'var(--tc-text-2)' }}>
                    {preview.format} • {preview.rowCount} records • {preview.filename}
                  </span>
                </div>
                <button
                  onClick={reset}
                  className="text-xs px-2 py-1 rounded hover:opacity-70 transition-opacity"
                  style={{ color: '#f87171' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sample Data */}
              <div className="rounded-lg overflow-hidden text-xs" style={{ background: 'var(--tc-card-border)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'rgba(139,92,246,0.1)', borderBottom: '1px solid var(--tc-card-border)' }}>
                        {preview.sampleRows[0] && Object.keys(preview.sampleRows[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left font-semibold" style={{ color: 'var(--tc-text-2)' }}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sampleRows.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < preview.sampleRows.length - 1 ? '1px solid var(--tc-card-border)' : 'none' }}>
                          {Object.values(row).map((value, vidx) => (
                            <td key={vidx} className="px-3 py-2" style={{ color: 'var(--tc-text-3)' }}>
                              {typeof value === 'number' ? value.toFixed(2) : String(value).substring(0, 30)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Format Guide */}
      <details className="text-xs" style={{ color: 'var(--tc-text-3)' }}>
        <summary className="cursor-pointer font-medium mb-2 hover:opacity-70" style={{ color: 'var(--tc-text-2)' }}>
          📋 Format Examples
        </summary>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 rounded-lg" style={{ background: 'rgba(139,92,246,0.05)' }}>
          {/* CSV Example */}
          <div>
            <p className="font-semibold mb-2" style={{ color: 'var(--tc-text-1)' }}>CSV Format:</p>
            <pre className="bg-black text-green-400 p-2 rounded text-[10px] overflow-x-auto">
{`month,revenue,expenses
Jan,150000,50000
Feb,165000,52000
Mar,180000,54000`}
            </pre>
          </div>

          {/* JSON Example */}
          <div>
            <p className="font-semibold mb-2" style={{ color: 'var(--tc-text-1)' }}>JSON Format:</p>
            <pre className="bg-black text-blue-400 p-2 rounded text-[10px] overflow-x-auto">
{`[
  {
    "month": "Jan",
    "revenue": 150000,
    "expenses": 50000
  }
]`}
            </pre>
          </div>
        </div>
      </details>
    </motion.div>
  )
}
