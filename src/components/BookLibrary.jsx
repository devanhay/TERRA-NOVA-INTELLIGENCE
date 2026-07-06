import { useState, useEffect, useRef } from 'react'
import { GeminiService } from '../core/terraAI/GeminiService.js'

const PRESET_BOOKS = [
  {
    id: 'gdrive_book1',
    title: 'Bioprocess Engineering Principles',
    author: 'Pauline M. Doran',
    edition: '2nd Edition',
    category: 'Biochemical',
    coverColor: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
    driveId: '1PzDO0zdWGlpkivfVnprM-tnuhMBTaNNr',
    pages: []
  },
  {
    id: 'gdrive_book2',
    title: 'Coulson & Richardson\'s Chemical Engineering',
    author: 'J.M. Coulson & J.F. Richardson',
    edition: '6th Edition',
    category: 'Process Design',
    coverColor: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
    driveId: '1kPc7mdhw3Zdqms0jzmHnritXa91mBPbI',
    pages: []
  }
]

export default function BookLibrary() {
  const [books, setBooks] = useState(() => {
    const saved = localStorage.getItem('engineeros_uploaded_books')
    return saved ? [...PRESET_BOOKS, ...JSON.parse(saved)] : PRESET_BOOKS
  })
  
  const [selectedBook, setSelectedBook] = useState(PRESET_BOOKS[0])
  const [currentPage, setCurrentPage] = useState(1)
  const [uploadedFile, setUploadedFile] = useState(null)
  
  // Highlight / Translate State
  const [selectedText, setSelectedText] = useState('')
  const [translationResult, setTranslationResult] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [aiExplanation, setAiExplanation] = useState('')
  const [isExplaining, setIsExplaining] = useState(false)
  const [highlights, setHighlights] = useState(() => {
    const saved = localStorage.getItem('engineeros_book_highlights')
    return saved ? JSON.parse(saved) : []
  })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAiOverlay, setShowAiOverlay] = useState(false)
  const [readDimmer, setReadDimmer] = useState(0) // range: 0 (no dimming) to 80 (80% dimming)
  const [showTextPanel, setShowTextPanel] = useState(false)  // toggleable extracted-text panel
  const [copyToast, setCopyToast] = useState('')              // quick copy feedback

  // Reading Customization & Study Helper States
  const [fontSize, setFontSize] = useState('medium') // small, medium, large
  const [fontFamily, setFontFamily] = useState('serif') // serif, sans, mono
  const [readTheme, setReadTheme] = useState('void') // void (theme match), slate, sepia
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarkNote, setBookmarkNote] = useState('')
  const [pdfParsing, setPdfParsing] = useState(false)
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pdfZoom, setPdfZoom] = useState(1.0)
  const [pdfLoading, setPdfLoading] = useState(false)
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)

  // PubChem State
  const [pubchemQuery, setPubchemQuery] = useState('')
  const [pubchemResult, setPubchemResult] = useState(null)
  const [pubchemLoading, setPubchemLoading] = useState(false)
  const [pubchemError, setPubchemError] = useState('')

  const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '';
  const [apiKey, setApiKey] = useState(() => {
    if (envKey) {
      localStorage.setItem('gemini_api_key', envKey);
      return envKey;
    }
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [tempKey, setTempKey] = useState('')
  const [workspaceTab, setWorkspaceTab] = useState('reader')
  const [selectedDiscipline, setSelectedDiscipline] = useState('fluid')

  // Fluid Flow inputs
  const [fluidDens, setFluidDens] = useState(1000)
  const [fluidVel, setFluidVel] = useState(1.5)
  const [fluidDiam, setFluidDiam] = useState(0.05)
  const [fluidVisc, setFluidVisc] = useState(0.001)

  // Heat Exchanger inputs
  const [tempH1, setTempH1] = useState(120)
  const [tempH2, setTempH2] = useState(80)
  const [tempC1, setTempC1] = useState(25)
  const [tempC2, setTempC2] = useState(60)
  const [isCounterCurrent, setIsCounterCurrent] = useState(true)

  // Kinetics inputs
  const [reactorVol, setReactorVol] = useState(2.5)
  const [flowRateVal, setFlowRateVal] = useState(0.05)
  const [rateConstantVal, setRateConstantVal] = useState(0.2)

  const fileInputRef = useRef(null)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    localStorage.setItem('engineeros_book_highlights', JSON.stringify(highlights))
  }, [highlights])

  // PDF Document Auto-loader (for visual canvas viewing)
  useEffect(() => {
    if (selectedBook && selectedBook.isUploaded && selectedBook.fileData) {
      const loadPdf = async () => {
        setPdfLoading(true)
        try {
          if (!window.pdfjsLib) return
          const pdf = await window.pdfjsLib.getDocument({ data: selectedBook.fileData }).promise
          setPdfDoc(pdf)
        } catch (e) {
          console.error("Gagal memuat ulang PDF:", e)
        } finally {
          setPdfLoading(false)
        }
      }
      loadPdf()
    } else {
      setPdfDoc(null)
    }
  }, [selectedBook])

  // Set default readTheme to 'light' (Original) for uploaded books, otherwise 'void' (Cosmic Dark)
  useEffect(() => {
    if (selectedBook) {
      if (selectedBook.isUploaded) {
        setReadTheme('light')
      } else {
        setReadTheme('void')
      }
    }
  }, [selectedBook])

  // PDF Canvas Page Renderer & selectable transparent text layer builder
  useEffect(() => {
    if (pdfDoc && selectedBook && selectedBook.isUploaded && canvasRef.current && textLayerRef.current) {
      const renderPage = async () => {
        setPdfLoading(true)
        try {
          const page = await pdfDoc.getPage(currentPage)
          const canvas = canvasRef.current
          const textLayerDiv = textLayerRef.current
          if (!canvas || !textLayerDiv) return
          const context = canvas.getContext('2d')
          
          // Render in high-definition (HD) by scaling with the device pixel ratio (minimum 2x zoom resolution)
          const pixelRatio = window.devicePixelRatio || 1.5
          const scaleFactor = Math.max(pixelRatio, 2.0)
          
          const renderViewport = page.getViewport({ scale: pdfZoom * scaleFactor })
          canvas.width = renderViewport.width
          canvas.height = renderViewport.height
          
          // CSS layout size (on screen)
          const layoutViewport = page.getViewport({ scale: pdfZoom })
          canvas.style.width = `${layoutViewport.width}px`
          canvas.style.height = `${layoutViewport.height}px`
          
          // Set text layer boundaries to match the layout exactly
          textLayerDiv.style.width = `${layoutViewport.width}px`
          textLayerDiv.style.height = `${layoutViewport.height}px`
          
          // Render page background graphics
          const renderContext = {
            canvasContext: context,
            viewport: renderViewport
          }
          await page.render(renderContext).promise

          // Build transparent selectable text spans overlaid on top of canvas text
          const textContent = await page.getTextContent()
          textLayerDiv.innerHTML = ''
          
          if (window.pdfjsLib && window.pdfjsLib.renderTextLayer) {
            await window.pdfjsLib.renderTextLayer({
              textContent: textContent,
              container: textLayerDiv,
              viewport: layoutViewport,
              textDivs: []
            }).promise
          }
        } catch (e) {
          console.error("Gagal me-render halaman PDF:", e)
        } finally {
          setPdfLoading(false)
        }
      }
      renderPage()
    }
  }, [pdfDoc, currentPage, pdfZoom, selectedBook])

  const getCanvasFilter = () => {
    if (readTheme === 'void') {
      return 'invert(0.93) hue-rotate(180deg) brightness(0.95) contrast(1.02)'
    }
    if (readTheme === 'sepia') {
      return 'sepia(0.55) contrast(0.95) saturate(1.1) brightness(0.96)'
    }
    return 'none'
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setPdfParsing(true)
    
    const fileReader = new FileReader()
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result)
        
        if (!window.pdfjsLib) {
          throw new Error('Pustaka pengurai PDF gagal dimuat. Harap periksa koneksi internet Anda.')
        }

        const pdf = await window.pdfjsLib.getDocument({ data: typedarray }).promise
        const numPages = pdf.numPages
        const extractedPages = []

        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          
          let pageText = ''
          let lastY = -1
          for (let item of textContent.items) {
            // Group words into lines based on Y coordinate differences
            if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 6) {
              pageText += '\n'
            }
            pageText += item.str + ' '
            lastY = item.transform[5]
          }

          extractedPages.push({
            pageNum: i,
            title: `Halaman ${i} dari ${numPages}`,
            content: pageText.trim() || '(Halaman Kosong atau Hanya Berisi Gambar)'
          })
        }

        const newBook = {
          id: 'uploaded-' + Date.now(),
          title: file.name.replace('.pdf', ''),
          author: 'Uploaded PDF Document',
          edition: 'Original Layout',
          category: 'Reference PDF',
          coverColor: 'linear-gradient(135deg, #7209b7 0%, #4cc9f0 100%)',
          isUploaded: true,
          pages: extractedPages.length > 0 ? extractedPages : [
            {
              pageNum: 1,
              title: 'Empty Document',
              content: 'Dokumen kosong atau tidak ada teks yang berhasil diekstrak.'
            }
          ],
          fileData: typedarray // Save binary data in state memory for session-based canvas rendering
        }

        setBooks(prev => {
          const updated = [...prev, newBook]
          const uploadMetadata = updated.filter(b => b.isUploaded).map(b => ({
            id: b.id,
            title: b.title,
            author: b.author,
            edition: b.edition,
            category: b.category,
            coverColor: b.coverColor,
            isUploaded: true,
            pages: b.pages
          }))
          localStorage.setItem('engineeros_uploaded_books', JSON.stringify(uploadMetadata))
          return updated
        })

        setSelectedBook(newBook)
        setCurrentPage(1)
        setUploadedFile(file)
      } catch (err) {
        alert('Gagal mengekstrak PDF: ' + err.message)
      } finally {
        setPdfParsing(false)
      }
    }
    fileReader.readAsArrayBuffer(file)
  }

  const deleteBook = (bookId) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus dokumen ini dari perpustakaan?')) {
      setBooks(prev => {
        const updated = prev.filter(b => b.id !== bookId)
        const uploadMetadata = updated.filter(b => b.isUploaded).map(b => ({
          id: b.id,
          title: b.title,
          author: b.author,
          edition: b.edition,
          category: b.category,
          coverColor: b.coverColor,
          isUploaded: true,
          pages: b.pages
        }))
        localStorage.setItem('engineeros_uploaded_books', JSON.stringify(uploadMetadata))
        return updated
      })

      if (selectedBook.id === bookId) {
        setSelectedBook(PRESET_BOOKS[0])
        setCurrentPage(1)
        setTranslationResult('')
        setAiExplanation('')
      }
    }
  }

  const handleTextSelection = () => {
    // Small timeout so browser finalises the selection before we read it
    setTimeout(() => {
      const text = window.getSelection()?.toString().trim() || ''
      if (text.length > 0) {
        setSelectedText(text)
      }
    }, 50)
  }

  const handleCopyPage = async () => {
    const text = activePage?.content || ''
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopyToast('✅ Teks halaman berhasil disalin!')
    } catch {
      // Fallback for browsers that block clipboard API
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopyToast('✅ Teks halaman berhasil disalin!')
    }
    setTimeout(() => setCopyToast(''), 2500)
  }

  const handleCopySelection = async () => {
    const text = selectedText
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopyToast('✅ Teks yang dipilih berhasil disalin!')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopyToast('✅ Teks yang dipilih berhasil disalin!')
    }
    setTimeout(() => setCopyToast(''), 2500)
  }

  const translateText = async () => {
    if (!selectedText) return
    setIsTranslating(true)
    setTranslationResult('')
    
    try {
      if (!apiKey) {
        throw new Error('API Key Gemini tidak ditemukan. Silakan masukkan API Key di panel input.')
      }
      const service = new GeminiService(apiKey)
      const systemInstruction = 'You are an expert chemical engineering translator translating technical English texts into clear, contextually accurate Indonesian. Use standard terms from chemical process industries (e.g. steady-state -> keadaan tunak, recycle -> sirkulasi balik). Return only the translated text.'
      const res = await service.generateResponse(systemInstruction, selectedText)
      setTranslationResult(res)
    } catch (e) {
      console.error(e)
      setTranslationResult(`Error: ${e.message}`)
    } finally {
      setIsTranslating(false)
    }
  }

  const explainWithAI = async () => {
    if (!selectedText) return
    setIsExplaining(true)
    setAiExplanation('')

    try {
      if (!apiKey) {
        throw new Error('API Key Gemini tidak ditemukan. Silakan masukkan API Key di panel input.')
      }
      const service = new GeminiService(apiKey)
      const systemInstruction = 'You are Terra, an expert AI mentor in chemical engineering. Explain the provided text, equations, or concepts simply yet rigorously, emphasizing process design, kinetics, or thermodynamics implications.'
      const res = await service.generateResponse(systemInstruction, selectedText)
      setAiExplanation(res)
    } catch (e) {
      console.error(e)
      setAiExplanation(`Error: ${e.message}`)
    } finally {
      setIsExplaining(false)
    }
  }

  const saveHighlight = () => {
    if (!selectedText) return
    const newHighlight = {
      id: Date.now(),
      bookId: selectedBook.id,
      bookTitle: selectedBook.title,
      pageNum: currentPage,
      text: selectedText,
      note: bookmarkNote || '',
      timestamp: new Date().toLocaleDateString('id-ID')
    }
    setHighlights(prev => [newHighlight, ...prev])
    setBookmarkNote('') // Reset note input
  }

  const removeHighlight = (id) => {
    setHighlights(prev => prev.filter(h => h.id !== id))
  }

  const handleBookmarkClick = (h) => {
    const targetBook = books.find(b => b.id === h.bookId)
    if (targetBook) {
      setSelectedBook(targetBook)
      setCurrentPage(h.pageNum || 1)
      setSelectedText(h.text)
    }
  }

  const renderHighlightedContent = (text, query) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={index} style={{ background: 'rgba(255, 158, 0, 0.4)', color: '#fff', borderRadius: 2, padding: '0 2px' }}>{part}</mark> 
        : part
    )
  }

  const searchPubChem = async () => {
    if (!pubchemQuery.trim()) return
    setPubchemLoading(true)
    setPubchemError('')
    setPubchemResult(null)

    try {
      const propUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(pubchemQuery.trim())}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`
      const propRes = await fetch(propUrl)
      if (!propRes.ok) {
        throw new Error('Senyawa tidak ditemukan di database PubChem.')
      }
      const propData = await propRes.json()
      
      if (!propData || !propData.PropertyTable || !propData.PropertyTable.Properties || propData.PropertyTable.Properties.length === 0) {
        throw new Error('Properti senyawa tidak tersedia.')
      }

      const properties = propData.PropertyTable.Properties[0]
      const cid = properties.CID

      let description = ''
      try {
        const descUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/JSON`
        const descRes = await fetch(descUrl)
        if (descRes.ok) {
          const descData = await descRes.json()
          if (descData.InformationList && descData.InformationList.Information) {
            const info = descData.InformationList.Information.find(i => i.Description)
            if (info) description = info.Description
          }
        }
      } catch (e) {
        console.warn('Gagal mengambil deskripsi senyawa.', e)
      }

      setPubchemResult({
        cid,
        formula: properties.MolecularFormula,
        weight: properties.MolecularWeight,
        iupac: properties.IUPACName || 'N/A',
        smiles: properties.CanonicalSMILES || 'N/A',
        description: description || 'Tidak ada deskripsi tertulis untuk senyawa ini.'
      })
    } catch (err) {
      setPubchemError(err.message || 'Gagal menghubungi server PubChem.')
    } finally {
      setPubchemLoading(false)
    }
  }

  const activePage = selectedBook.pages[currentPage - 1] || selectedBook.pages[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Dynamic Futuristic Glassmorphic Shelf header */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(24, 30, 48, 0.45) 0%, rgba(10, 16, 26, 0.7) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }}>
        {/* Decorative Grid Glows */}
        <div style={{ position: 'absolute', top: '-10%', left: '5%', width: 250, height: 100, background: 'radial-gradient(circle, rgba(0, 255, 163, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '5%', width: 250, height: 100, background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title" style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              📚 Bookmart Reference Library
              <span style={{
                background: 'var(--accent-glow)',
                color: 'var(--accent)',
                border: '1px solid rgba(76, 201, 240, 0.25)',
                fontSize: '0.62rem',
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}>
                MANUAL AI TRIGGER ACTIVE
              </span>
            </div>
            <div className="card-desc" style={{ marginBottom: 0 }}>Attach reference books, select definitions to translate or explain, and search global chemicals.</div>
          </div>
          <div>
            <input 
              type="file" 
              accept=".pdf" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />
            <button 
              className="btn btn-accent" 
              onClick={() => fileInputRef.current.click()}
              style={{ padding: '8px 16px', fontSize: '0.8rem', boxShadow: '0 0 10px rgba(76, 201, 240, 0.25)' }}
            >
              📥 Upload Reference PDF
            </button>
          </div>
        </div>

        {/* The Beautiful Book Shelf Grid */}
        <div style={{ display: 'flex', gap: 16, marginTop: 24, overflowX: 'auto', paddingBottom: 12 }}>
          {books.map(b => {
            const isSelected = selectedBook.id === b.id
            return (
              <div 
                key={b.id}
                onClick={() => { setSelectedBook(b); setCurrentPage(1); setTranslationResult(''); setAiExplanation(''); }}
                style={{
                  minWidth: 125,
                  width: 125,
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.04) translateY(-6px)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  position: 'relative'
                }}
              >
                {b.isUploaded && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteBook(b.id); }}
                    style={{
                      position: 'absolute',
                      right: -6,
                      top: -6,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.95)',
                      color: 'white',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
                    }}
                  >
                    ×
                  </button>
                )}
                
                {/* Visual Book Cover */}
                <div style={{
                  height: 160,
                  background: b.coverColor,
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: `2px solid ${isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isSelected ? '0 16px 28px rgba(0,0,0,0.5), 0 0 15px rgba(76, 201, 240, 0.25)' : '0 8px 16px rgba(0,0,0,0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Book spine overlay effect */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: 'linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0))' }} />
                  {/* Soft highlights */}
                  <div style={{ position: 'absolute', right: 0, top: 0, width: '80%', height: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.06), transparent)', pointerEvents: 'none' }} />
                  
                  <div style={{ fontSize: '0.52rem', fontFamily: 'monospace', color: '#000', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: 4, width: 'fit-content' }}>
                    {b.category}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 800, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
                    {b.author}
                  </div>
                </div>

                <div style={{ 
                  fontSize: '0.72rem', 
                  color: isSelected ? 'var(--accent)' : '#94a3b8', 
                  textAlign: 'center', 
                  marginTop: 8, 
                  fontWeight: isSelected ? 'bold' : 'normal',
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap' 
                }}>
                  {b.title}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="os-tabs" style={{ marginBottom: 0 }}>
        <button 
          className={`os-tab ${workspaceTab === 'reader' ? 'active' : ''}`}
          onClick={() => setWorkspaceTab('reader')}
          style={{ fontSize: '0.82rem', padding: '10px 16px' }}
        >
          📖 Reference Document Reader
        </button>
        <button 
          className={`os-tab ${workspaceTab === 'pubchem' ? 'active' : ''}`}
          onClick={() => setWorkspaceTab('pubchem')}
          style={{ fontSize: '0.82rem', padding: '10px 16px' }}
        >
          🧪 PubChem Chemical Lookup
        </button>
        <button 
          className={`os-tab ${workspaceTab === 'cheat_sheet' ? 'active' : ''}`}
          onClick={() => setWorkspaceTab('cheat_sheet')}
          style={{ fontSize: '0.82rem', padding: '10px 16px' }}
        >
          📐 Formula Quick-Solver Cheat Sheet
        </button>
      </div>

      {workspaceTab === 'reader' && (
        /* ── READER WORKSPACE (TWO COLUMN BEAUTIFUL INTERFACE) ── */
        <div style={{ display: 'grid', gridTemplateColumns: (isFullscreen || isMobile) ? '1fr' : '1.1fr 0.9fr', gap: 16, transition: 'all 0.3s ease' }}>
          
          {/* Main Reading Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: isFullscreen ? '85vh' : 460, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setIsFullscreen(p => !p)}
                  style={{ padding: '4px 8px', fontSize: '0.68rem', background: isFullscreen ? 'rgba(76, 201, 240, 0.1)' : 'rgba(255, 255, 255, 0.02)', color: isFullscreen ? 'var(--accent)' : '#94a3b8' }}
                >
                  {isFullscreen ? '🗗 Split View' : '🗖 Focus Mode'}
                </button>
                {isFullscreen && (
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setShowAiOverlay(prev => !prev)}
                    style={{ padding: '4px 8px', fontSize: '0.68rem', background: showAiOverlay ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)', color: showAiOverlay ? '#c084fc' : '#94a3b8', border: showAiOverlay ? '1px solid rgba(168, 85, 247, 0.4)' : 'none', marginLeft: 4 }}
                  >
                    🤖 {showAiOverlay ? 'Tutup Asisten' : 'Buka Asisten AI'}
                  </button>
                )}
                <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>{selectedBook.title}</div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{selectedBook.author} · {selectedBook.edition}</div>
                  </div>
                  {selectedBook.driveId && (
                    <a
                      href={`https://drive.google.com/file/d/${selectedBook.driveId}/view?usp=drivesdk`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.62rem',
                        color: 'var(--accent)',
                        border: '1px solid rgba(76, 201, 240, 0.25)',
                        background: 'rgba(76, 201, 240, 0.05)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        textDecoration: 'none'
                      }}
                    >
                      🗗 Open in Google Drive
                    </a>
                  )}
                </div>
              </div>

              {selectedBook.pages && selectedBook.pages.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button 
                    className="btn btn-ghost" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{ padding: '4px 8px', fontSize: '0.68rem' }}
                  >
                    ◀ Prev
                  </button>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8' }}>
                    {currentPage} / {selectedBook.pages.length}
                  </span>
                  <button 
                    className="btn btn-ghost" 
                    disabled={currentPage === selectedBook.pages.length}
                    onClick={() => setCurrentPage(prev => Math.min(selectedBook.pages.length, prev + 1))}
                    style={{ padding: '4px 8px', fontSize: '0.68rem' }}
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </div>

            {/* Reading Customization Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 8,
              padding: '6px 12px',
              marginBottom: 12,
              gap: 8,
              flexWrap: 'wrap',
              border: '1px solid rgba(255,255,255,0.02)'
            }}>
              {/* Font Sizer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace' }}>SIZE:</span>
                {['small', 'medium', 'large'].map(sz => (
                  <button
                    key={sz}
                    onClick={() => setFontSize(sz)}
                    style={{
                      background: fontSize === sz ? 'rgba(76, 201, 240, 0.15)' : 'transparent',
                      border: fontSize === sz ? '1px solid var(--accent)' : 'none',
                      color: fontSize === sz ? 'var(--accent)' : '#94a3b8',
                      fontSize: '0.62rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {sz === 'small' ? 'A-' : sz === 'large' ? 'A+' : 'A'}
                  </button>
                ))}
              </div>

              {/* Font Family */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace' }}>FONT:</span>
                {['serif', 'sans', 'mono'].map(ft => (
                  <button
                    key={ft}
                    onClick={() => setFontFamily(ft)}
                    style={{
                      background: fontFamily === ft ? 'rgba(76, 201, 240, 0.15)' : 'transparent',
                      border: fontFamily === ft ? '1px solid var(--accent)' : 'none',
                      color: fontFamily === ft ? 'var(--accent)' : '#94a3b8',
                      fontSize: '0.62rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontFamily: ft === 'serif' ? 'Georgia, serif' : ft === 'mono' ? 'monospace' : 'sans-serif'
                    }}
                  >
                    {ft.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Theme Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace' }}>THEME:</span>
                {['void', 'sepia', 'light'].map(th => (
                  <button
                    key={th}
                    onClick={() => setReadTheme(th)}
                    style={{
                      background: readTheme === th ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                      border: readTheme === th ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.05)',
                      color: th === 'sepia' ? '#856404' : '#94a3b8',
                      fontSize: '0.62rem',
                      padding: '2px 6px',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    {th === 'void' ? '🌌 Dark HUD' : th === 'sepia' ? '📜 Sepia' : '📄 Original'}
                  </button>
                ))}
              </div>

              {/* Zoom Controls for PDF */}
              {selectedBook.isUploaded && selectedBook.fileData && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace' }}>ZOOM:</span>
                  <button onClick={() => setPdfZoom(z => Math.max(0.6, z - 0.15))} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0', padding: '1px 6px', borderRadius: 4, fontSize: '0.62rem', cursor: 'pointer' }}>-</button>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#fff', minWidth: 32, textAlign: 'center' }}>{Math.round(pdfZoom * 100)}%</span>
                  <button onClick={() => setPdfZoom(z => Math.min(2.0, z + 0.15))} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.06)', color: '#e2e8f0', padding: '1px 6px', borderRadius: 4, fontSize: '0.62rem', cursor: 'pointer' }}>+</button>
                </div>
              )}

              {/* Dimmer Controller */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '0.6rem', color: '#64748b', fontFamily: 'monospace' }}>DIM:</span>
                <input 
                  type="range" 
                  min="0" 
                  max="80" 
                  value={readDimmer} 
                  onChange={e => setReadDimmer(parseInt(e.target.value))}
                  style={{
                    width: 50,
                    height: 3,
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 2,
                    outline: 'none',
                    cursor: 'pointer',
                    accentColor: 'var(--accent)'
                  }}
                />
                <span style={{ fontSize: '0.62rem', color: '#94a3b8', minWidth: 22, fontFamily: 'monospace', textAlign: 'right' }}>{readDimmer}%</span>
              </div>

              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="text"
                  placeholder="Cari kata kunci..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    color: '#fff',
                    outline: 'none',
                    width: 100
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '0.65rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {pdfParsing ? (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: 350, 
                background: 'rgba(7,11,21,0.2)', 
                border: '1px solid rgba(255,255,255,0.03)', 
                borderRadius: 8 
              }}>
                <div className="boot-spinner-container" style={{ width: 60, height: 60, marginBottom: 16 }}>
                  <div className="boot-spinner-outer" style={{ borderTopColor: 'var(--accent)', borderBottomColor: 'var(--accent)' }} />
                  <div className="boot-spinner-inner" style={{ borderLeftColor: 'var(--purple)', borderRightColor: 'var(--purple)' }} />
                  <div className="boot-spinner-core" />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                  EXTRACTING PDF TEXT CORES...
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 4 }}>
                  Menyusun layout halaman & mengekstrak konten bacaan...
                </div>
              </div>
            ) : selectedBook.driveId ? (
              /* Google Drive Iframe Viewer */
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(7,11,21,0.4)',
                border: '1px solid rgba(255,255,255,0.03)',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative'
              }}>
                <iframe
                  src={`https://drive.google.com/file/d/${selectedBook.driveId}/preview`}
                  style={{
                    width: '100%',
                    height: isFullscreen ? '78vh' : (isMobile ? '380px' : '480px'),
                    border: 'none'
                  }}
                  allow="autoplay"
                />
              </div>
            ) : selectedBook.isUploaded && selectedBook.fileData ? (
              /* Original Layout PDF Canvas Viewer */
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: readTheme === 'sepia' ? '#f5eedc' : readTheme === 'void' ? 'rgba(7,11,21,0.4)' : '#171d2b',
                border: '1px solid rgba(255,255,255,0.03)',
                borderRadius: 8,
                padding: '16px',
                overflow: 'auto',
                maxHeight: isFullscreen ? '78vh' : 380,
                transition: 'background 0.3s',
                position: 'relative'
              }}>
                {pdfLoading && (
                  <div style={{ position: 'absolute', zIndex: 10, background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 6, fontSize: '0.62rem', color: 'var(--accent)', fontFamily: 'monospace', border: '1px solid rgba(255,255,255,0.08)' }}>
                    RENDERING PAGE...
                  </div>
                )}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <canvas 
                    ref={canvasRef} 
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                      borderRadius: 4,
                      filter: getCanvasFilter(),
                      transition: 'filter 0.3s'
                    }}
                  />
                  <div 
                    ref={textLayerRef}
                    className="textLayer"
                    onMouseUp={handleTextSelection}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      zIndex: 2,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'auto',
                      userSelect: 'text'
                    }}
                  />
                </div>
              </div>
            ) : selectedBook.isUploaded ? (
              /* Fallback extracted text viewer for refreshed sessions */
              <div 
                onMouseUp={handleTextSelection}
                style={{
                  flex: 1,
                  background: readTheme === 'sepia' ? '#f5eedc' : readTheme === 'void' ? 'rgba(7,11,21,0.2)' : '#181e2e',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: '16px 20px',
                  color: readTheme === 'sepia' ? '#2e251b' : '#e2e8f0',
                  lineHeight: 1.75,
                  fontSize: '0.88rem',
                  whiteSpace: 'pre-wrap',
                  overflowY: 'auto',
                  maxHeight: isFullscreen ? '78vh' : 380,
                  transition: 'background 0.3s, color 0.3s'
                }}
              >
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(255, 158, 0, 0.08)', border: '1px solid rgba(255, 158, 0, 0.2)', borderRadius: 6, fontSize: '0.68rem', color: '#ff9e00' }}>
                  ℹ️ <strong>Sesi telah disegarkan:</strong> Salinan teks halaman ditampilkan di bawah. Unggah ulang PDF asli untuk mengaktifkan kembali penampil visual layout halaman asli.
                </div>
                <h4 style={{ 
                  color: readTheme === 'sepia' ? '#6b4c1b' : 'var(--accent)', 
                  fontSize: '0.94rem', 
                  fontWeight: 800, 
                  marginBottom: 12,
                  fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-body)'
                }}>
                  {activePage ? activePage.title : 'No page loaded'}
                </h4>
                <p style={{ 
                  cursor: 'text', 
                  margin: 0,
                  fontSize: fontSize === 'small' ? '0.78rem' : fontSize === 'large' ? '1.05rem' : '0.88rem',
                  fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-body)'
                }}>
                  {activePage ? renderHighlightedContent(activePage.content, searchQuery) : 'No content available.'}
                </p>
              </div>
            ) : (
              /* Preset text books reader */
              <div 
                onMouseUp={handleTextSelection}
                style={{
                  flex: 1,
                  background: readTheme === 'sepia' ? '#f5eedc' : readTheme === 'slate' ? '#181e2e' : 'rgba(7,11,21,0.2)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  borderRadius: 8,
                  padding: '16px 20px',
                  color: readTheme === 'sepia' ? '#2e251b' : '#e2e8f0',
                  lineHeight: 1.75,
                  fontSize: '0.88rem',
                  whiteSpace: 'pre-wrap',
                  overflowY: 'auto',
                  maxHeight: isFullscreen ? '78vh' : 380,
                  transition: 'background 0.3s, color 0.3s'
                }}
              >
                <h4 style={{ 
                  color: readTheme === 'sepia' ? '#6b4c1b' : 'var(--accent)', 
                  fontSize: '0.94rem', 
                  fontWeight: 800, 
                  marginBottom: 12,
                  fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-body)'
                }}>
                  {activePage ? activePage.title : 'No page loaded'}
                </h4>
                <p style={{ 
                  cursor: 'text', 
                  margin: 0,
                  fontSize: fontSize === 'small' ? '0.78rem' : fontSize === 'large' ? '1.05rem' : '0.88rem',
                  fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-body)'
                }}>
                  {activePage ? renderHighlightedContent(activePage.content, searchQuery) : 'No content available.'}
                </p>
              </div>
            )}
            
            {/* ── UNIVERSAL TEXT PANEL (visible for ALL books) ─────────── */}
            {activePage && (
              <div style={{ marginTop: 10 }}>
                {/* Header row: toggle + copy buttons */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(0,0,0,0.28)', borderRadius: showTextPanel ? '8px 8px 0 0' : 8,
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderBottom: showTextPanel ? 'none' : undefined,
                  padding: '7px 12px'
                }}>
                  <button
                    onClick={() => setShowTextPanel(p => !p)}
                    style={{
                      background: 'none', border: 'none',
                      color: 'var(--accent)', fontSize: '0.72rem',
                      fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    📋 {showTextPanel ? 'Tutup Panel Teks' : 'Buka Panel Teks (Select & Copy)'}
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {copyToast && (
                      <span style={{ fontSize: '0.66rem', color: '#4ade80', fontFamily: 'monospace' }}>{copyToast}</span>
                    )}
                    <button
                      onClick={handleCopyPage}
                      title="Copy teks seluruh halaman ini"
                      style={{
                        background: 'rgba(76,201,240,0.08)',
                        border: '1px solid rgba(76,201,240,0.22)',
                        color: 'var(--accent)', borderRadius: 6,
                        padding: '3px 10px', fontSize: '0.65rem',
                        cursor: 'pointer', fontWeight: 600
                      }}
                    >
                      ⊕ Copy Halaman
                    </button>
                    {selectedText && (
                      <button
                        onClick={handleCopySelection}
                        title="Copy teks yang sudah dipilih"
                        style={{
                          background: 'rgba(181,23,158,0.08)',
                          border: '1px solid rgba(181,23,158,0.22)',
                          color: 'var(--purple)', borderRadius: 6,
                          padding: '3px 10px', fontSize: '0.65rem',
                          cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        ✂ Copy Seleksi
                      </button>
                    )}
                  </div>
                </div>

                {/* Selectable text area */}
                {showTextPanel && (
                  <div
                    onMouseUp={handleTextSelection}
                    onTouchEnd={handleTextSelection}
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.78rem',
                      color: '#C8D5E8',
                      lineHeight: 1.72,
                      maxHeight: 220,
                      overflowY: 'auto',
                      background: 'rgba(5, 3, 14, 0.55)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderTop: 'none',
                      borderRadius: '0 0 8px 8px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      userSelect: 'text',
                      WebkitUserSelect: 'text',
                      cursor: 'text',
                      fontFamily: fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'mono' ? 'var(--font-mono)' : 'var(--font-body)'
                    }}
                  >
                    <div style={{ fontSize: '0.6rem', color: '#556880', marginBottom: 8, fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                      SELECT TEXT BELOW · DRAG TO HIGHLIGHT · CTRL+C TO COPY
                    </div>
                    {activePage.content || '(Halaman ini tidak mengandung teks yang bisa diekstrak)'}
                  </div>
                )}
              </div>
            )}

            {/* Dimmer Mask Overlay */}
            {readDimmer > 0 && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: `rgba(0, 0, 0, ${readDimmer / 100})`,
                pointerEvents: 'none',
                zIndex: 90, // overlay above canvas and text reader, but below focus AI console (zIndex 100)
                transition: 'background-color 0.2s',
                borderRadius: 8
              }} />
            )}

            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              
              /* Selectable transparent text layer styles */
              .textLayer {
                position: absolute;
                left: 0;
                top: 0;
                right: 0;
                bottom: 0;
                overflow: hidden;
                opacity: 1.0;
                line-height: 1.0;
                user-select: text !important;
                -webkit-user-select: text !important;
              }
              .textLayer span {
                color: transparent !important;
                position: absolute;
                white-space: pre;
                cursor: text;
                transform-origin: 0% 0%;
              }
              .textLayer span::selection {
                background: rgba(76, 201, 240, 0.35) !important;
                color: transparent !important;
              }
              .textLayer span::-moz-selection {
                background: rgba(76, 201, 240, 0.35) !important;
                color: transparent !important;
              }
            `}</style>

            {isFullscreen && showAiOverlay && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: 320,
                background: 'rgba(8, 7, 18, 0.95)',
                backdropFilter: 'blur(20px)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                zIndex: 100,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '-10px 0 30px rgba(0,0,0,0.6)',
                borderRadius: '0 8px 8px 0',
                overflowY: 'auto',
                animation: 'slideInRight 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent)' }}>🤖 Focus AI Console</span>
                  <button onClick={() => setShowAiOverlay(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
                </div>

                {!apiKey && (
                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px dashed rgba(239,68,68,0.2)', padding: 8, borderRadius: 6 }}>
                    <div style={{ fontSize: '0.58rem', color: 'var(--red)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>API Key Required</div>
                    <input 
                      type="password" 
                      className="field-input" 
                      placeholder="Masukkan Gemini API Key..." 
                      value={tempKey}
                      onChange={e => setTempKey(e.target.value)}
                      style={{ fontSize: '0.7rem', padding: '4px 8px', marginBottom: 4 }}
                    />
                    <button 
                      className="btn btn-ghost" 
                      onClick={() => {
                        if (tempKey.trim()) {
                          localStorage.setItem('gemini_api_key', tempKey.trim());
                          setApiKey(tempKey.trim());
                        }
                      }}
                      style={{ fontSize: '0.62rem', padding: '3px', width: '100%' }}
                    >
                      Save API Key
                    </button>
                  </div>
                )}

                {/* Selected Text Area */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="field-label" style={{ fontSize: '0.6rem', color: '#94a3b8', margin: 0 }}>Selected Text</label>
                    {activePage && (
                      <button 
                        onClick={() => setSelectedText(activePage.content)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.6rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Salin 1 Halaman
                      </button>
                    )}
                  </div>
                  <textarea 
                    className="field-input" 
                    rows="3"
                    value={selectedText}
                    onChange={e => setSelectedText(e.target.value)}
                    placeholder="Sorot teks di halaman atau ketik di sini..."
                    style={{ fontSize: '0.74rem', resize: 'none', background: 'rgba(0,0,0,0.4)', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                {/* Translate and Explain Buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button 
                    className="btn btn-accent" 
                    onClick={translateText}
                    disabled={!selectedText || isTranslating}
                    style={{ flex: 1, fontSize: '0.7rem', padding: '6px' }}
                  >
                    {isTranslating ? 'Translating...' : '🇮🇩 Terjemah'}
                  </button>
                  <button 
                    className="btn btn-ghost" 
                    onClick={explainWithAI}
                    disabled={!selectedText || isExplaining}
                    style={{ flex: 1, fontSize: '0.7rem', padding: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}
                  >
                    {isExplaining ? 'Explaining...' : '🔬 Jelaskan'}
                  </button>
                </div>

                {/* Output Panels */}
                {translationResult && (
                  <div style={{ background: 'rgba(76, 201, 240, 0.05)', border: '1px solid rgba(76, 201, 240, 0.1)', padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: '0.58rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>🇮🇩 Terjemahan</div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', maxHeight: 100, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                      {translationResult}
                    </div>
                  </div>
                )}

                {aiExplanation && (
                  <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)', padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: '0.58rem', color: '#c084fc', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>🔬 Penjelasan AI</div>
                    <div style={{ fontSize: '0.72rem', color: '#cbd5e1', maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                      {aiExplanation}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action & AI Console Card */}
          <div style={{ display: isFullscreen ? 'none' : 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="card-title" style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                🤖 Bookmart AI Console
              </div>
              <div className="card-desc">Contextual translator & explanation generator (Gemini Service)</div>

              {!apiKey && (
                <div style={{ marginBottom: 12, background: 'rgba(239,68,68,0.05)', border: '1px dashed rgba(239,68,68,0.2)', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--red)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Gemini API Key Required</div>
                  <input 
                    type="password" 
                    className="field-input" 
                    placeholder="Masukkan Gemini API Key..." 
                    value={tempKey}
                    onChange={e => setTempKey(e.target.value)}
                    style={{ fontSize: '0.74rem', padding: '6px 10px', marginBottom: 6 }}
                  />
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => {
                      if (tempKey.trim()) {
                        localStorage.setItem('gemini_api_key', tempKey.trim());
                        setApiKey(tempKey.trim());
                      }
                    }}
                    style={{ fontSize: '0.68rem', padding: '4px', width: '100%' }}
                  >
                    Save API Key
                  </button>
                </div>
              )}

              {/* Text Selection Box */}
              <div style={{ marginBottom: 14 }}>
                <label className="field-label" style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Selected Text</label>
                <textarea 
                  className="field-input" 
                  rows="3"
                  value={selectedText}
                  onChange={e => setSelectedText(e.target.value)}
                  placeholder="Sorot teks di sebelah kiri atau ketik teks teknik kimia di sini..."
                  style={{ fontSize: '0.78rem', resize: 'none', background: 'rgba(7,11,21,0.6)', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              {/* Optional Study Note input */}
              <div style={{ marginBottom: 12 }}>
                <label className="field-label" style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Add study note to bookmark (Optional)</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Ketik catatan studi/rumus penting..."
                  value={bookmarkNote}
                  onChange={e => setBookmarkNote(e.target.value)}
                  style={{ fontSize: '0.74rem', padding: '6px 10px', background: 'rgba(7,11,21,0.6)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button 
                  className="btn btn-accent" 
                  onClick={translateText}
                  disabled={!selectedText || isTranslating}
                  style={{ flex: 1, fontSize: '0.74rem', padding: '8px' }}
                >
                  {isTranslating ? 'Translating...' : '🇮🇩 Translate'}
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={explainWithAI}
                  disabled={!selectedText || isExplaining}
                  style={{ flex: 1, fontSize: '0.74rem', padding: '8px', border: '1px solid rgba(56, 189, 248, 0.25)' }}
                >
                  {isExplaining ? 'Explaining...' : '🔬 Explain AI'}
                </button>
                <button 
                  className="btn btn-ghost" 
                  onClick={saveHighlight}
                  disabled={!selectedText}
                  style={{ fontSize: '0.74rem', padding: '8px' }}
                  title="Bookmark Definition"
                >
                  ★ Bookmark
                </button>
              </div>

              {/* Results Displays */}
              {(translationResult || aiExplanation) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {translationResult && (
                    <div style={{
                      background: 'rgba(16,185,129,0.04)',
                      border: '1px solid rgba(16,185,129,0.18)',
                      borderRadius: 8,
                      padding: 12
                    }}>
                      <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 4 }}>Indonesian Translation</div>
                      <div style={{ fontSize: '0.78rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: translationResult.replace(/\*\*(.*?)\*\*/g, '<b style="color:var(--accent)">$1</b>') }} />
                    </div>
                  )}
                  {aiExplanation && (
                    <div style={{
                      background: 'rgba(56,189,248,0.04)',
                      border: '1px solid rgba(56,189,248,0.18)',
                      borderRadius: 8,
                      padding: 12
                    }}>
                      <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#38bdf8', textTransform: 'uppercase', marginBottom: 4 }}>AI Explanation</div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                        {aiExplanation}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Highlights Deck */}
            <div className="card" style={{ maxHeight: 200, overflowY: 'auto' }}>
              <div className="card-title" style={{ fontSize: '0.8rem', marginBottom: 2 }}>★ Saved Bookmarks & Notes</div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: 10 }}>Klik bookmark untuk kembali ke buku/halaman asal</div>

              {highlights.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {highlights.map(h => (
                    <div 
                      key={h.id} 
                      onClick={() => handleBookmarkClick(h)}
                      style={{ 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid rgba(255,255,255,0.03)', 
                        borderRadius: 6, 
                        padding: 8,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(76, 201, 240, 0.3)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.03)'}
                      title="Klik untuk membuka buku & halaman ini"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.58rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                          {h.bookTitle} {h.pageNum ? `(Hal. ${h.pageNum})` : ''}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeHighlight(h.id); }}
                          style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: '0.58rem', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.3, marginBottom: h.note ? 6 : 0 }}>
                        "{h.text}"
                      </div>
                      {h.note && (
                        <div style={{ fontSize: '0.62rem', color: '#ff9e00', background: 'rgba(255,158,0,0.06)', borderLeft: '2px solid #ff9e00', padding: '2px 6px', borderRadius: '0 4px 4px 0' }}>
                          📝 {h.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 12, color: '#475569', fontSize: '0.7rem' }}>
                  Belum ada bookmark tersimpan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {workspaceTab === 'pubchem' && (
        /* ── PUBCHEM CHEMICAL DATABASE LOOKUP WORKSPACE ── */
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 460 }}>
          <div>
            <div className="card-title" style={{ fontSize: '1rem', fontWeight: 800 }}>🧪 PubChem Global Chemical Database Lookup</div>
            <div className="card-desc">Cari dan hubungkan data properti fisika senyawa kimia secara dinamis dari API resmi PubChem</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              className="field-input" 
              placeholder="Masukkan nama senyawa (misal: Methanol, Benzene, Acetone, Water)..." 
              value={pubchemQuery}
              onChange={e => setPubchemQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchPubChem()}
              style={{ margin: 0 }}
            />
            <button 
              className="btn btn-accent" 
              onClick={searchPubChem}
              disabled={pubchemLoading || !pubchemQuery.trim()}
              style={{ padding: '10px 20px', fontSize: '0.78rem' }}
            >
              {pubchemLoading ? 'Searching...' : '🔍 Search'}
            </button>
          </div>

          {pubchemError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              color: 'var(--red)',
              borderRadius: 6,
              padding: 10,
              fontSize: '0.76rem'
            }}>
              ⚠️ {pubchemError}
            </div>
          )}

          {pubchemResult && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 10 }}>
              
              {/* Properties Box */}
              <div className="card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 14 }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--accent)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 }}>
                  CHEMICAL PROPERTIES (CID: {pubchemResult.cid})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="res-cell">
                    <div className="res-cell-label">Formula Molekul</div>
                    <span className="res-cell-val" style={{ color: 'white' }}>{pubchemResult.formula}</span>
                  </div>
                  <div className="res-cell">
                    <div className="res-cell-label">Berat Molekul (Molecular Weight)</div>
                    <span className="res-cell-val" style={{ color: 'white' }}>{pubchemResult.weight} g/mol</span>
                  </div>
                  <div className="res-cell">
                    <div className="res-cell-label">IUPAC Name</div>
                    <span className="res-cell-val" style={{ fontSize: '0.74rem', color: 'white', whiteSpace: 'normal', wordBreak: 'break-all' }}>{pubchemResult.iupac}</span>
                  </div>
                  <div className="res-cell">
                    <div className="res-cell-label">Canonical SMILES</div>
                    <span className="res-cell-val" style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'normal', wordBreak: 'break-all', fontFamily: 'monospace' }}>{pubchemResult.smiles}</span>
                  </div>
                </div>
              </div>

              {/* Description & Structures Box */}
              <div className="card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 0 }}>
                  COMPOUND DESCRIPTION & STRUCTURE
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.5, background: 'rgba(0,0,0,0.1)', padding: 10, borderRadius: 6, flex: 1, overflowY: 'auto' }}>
                  {pubchemResult.description}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: 10, borderRadius: 6 }}>
                  <span style={{ fontSize: '0.58rem', color: '#64748b', marginBottom: 6, fontFamily: 'monospace' }}>Structure rendering from PubChem</span>
                  <img 
                    src={`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${pubchemResult.cid}/PNG?image_size=150x150`} 
                    alt={pubchemQuery} 
                    style={{ background: 'white', borderRadius: 4, padding: 4 }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {workspaceTab === 'cheat_sheet' && (
        /* ── CHEAT SHEET QUICK SOLVER WORKSPACE ── */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 16 }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
            {/* Discipline tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 12 }}>
              {['fluid', 'heat', 'kinetics'].map(disc => (
                <button
                  key={disc}
                  className="btn btn-ghost"
                  onClick={() => setSelectedDiscipline(disc)}
                  style={{
                    fontSize: '0.72rem',
                    padding: '6px 12px',
                    background: selectedDiscipline === disc ? 'rgba(255,255,255,0.04)' : 'transparent',
                    color: selectedDiscipline === disc ? 'var(--accent)' : '#64748b',
                    border: selectedDiscipline === disc ? '1px solid rgba(255,255,255,0.06)' : 'none'
                  }}
                >
                  {disc === 'fluid' ? '🌊 Fluid Flow' : disc === 'heat' ? '🔥 Heat Exchanger' : '⚛ Chemical Kinetics'}
                </button>
              ))}
            </div>

            {/* FLUID FLOW CALCULATOR */}
            {selectedDiscipline === 'fluid' && (() => {
              const reynolds = (fluidDens * fluidVel * fluidDiam) / fluidVisc
              let regime = 'Laminar'
              let regimeColor = 'var(--accent)'
              if (reynolds > 4000) { regime = 'Turbulent'; regimeColor = 'var(--red)'; }
              else if (reynolds > 2100) { regime = 'Transitional'; regimeColor = 'var(--gold)'; }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="field-label">Density (kg/m³)</label>
                      <input type="number" className="field-input" value={fluidDens} onChange={e => setFluidDens(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="field-label">Velocity (m/s)</label>
                      <input type="number" className="field-input" step="0.1" value={fluidVel} onChange={e => setFluidVel(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="field-label">Pipe Diameter (m)</label>
                      <input type="number" className="field-input" step="0.01" value={fluidDiam} onChange={e => setFluidDiam(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="field-label">Dynamic Viscosity (Pa·s)</label>
                      <input type="number" className="field-input" step="0.0001" value={fluidVisc} onChange={e => setFluidVisc(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="res-cell" style={{ marginTop: 10 }}>
                    <div className="res-cell-label">Calculated Reynolds Number</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="res-cell-val" style={{ color: regimeColor }}>{reynolds.toFixed(1)}</span>
                      <span className="chip" style={{ background: 'rgba(255,255,255,0.03)', color: regimeColor, border: `1px solid ${reynolds > 4000 ? 'var(--red)' : reynolds > 2100 ? 'var(--gold)' : 'var(--accent)'}` }}>
                        {regime} Flow
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: 8, fontFamily: 'monospace' }}>Interactive Pipe Flow Simulator</div>
                    <svg viewBox="0 0 400 80" style={{ width: '100%', height: 80 }}>
                      <rect x="10" y="15" width="380" height="50" fill="rgba(30,41,59,0.3)" stroke="rgba(255,255,255,0.15)" strokeWidth="2" rx="4" />
                      <line x1="20" y1="25" x2="380" y2="25" stroke="rgba(0,255,163,0.35)" strokeWidth="2" strokeDasharray="10 15">
                        <animate attributeName="stroke-dashoffset" values="300;0" dur={Math.max(0.2, 3 / fluidVel) + 's'} repeatCount="indefinite" />
                      </line>
                      <line x1="20" y1="40" x2="380" y2="40" stroke="rgba(0,255,163,0.5)" strokeWidth="3" strokeDasharray="15 20">
                        <animate attributeName="stroke-dashoffset" values="300;0" dur={Math.max(0.15, 2.5 / fluidVel) + 's'} repeatCount="indefinite" />
                      </line>
                      <line x1="20" y1="55" x2="380" y2="55" stroke="rgba(0,255,163,0.35)" strokeWidth="2" strokeDasharray="10 15">
                        <animate attributeName="stroke-dashoffset" values="300;0" dur={Math.max(0.2, 3 / fluidVel) + 's'} repeatCount="indefinite" />
                      </line>
                    </svg>
                  </div>
                </div>
              )
            })()}

            {/* HEAT EXCHANGER CALCULATOR */}
            {selectedDiscipline === 'heat' && (() => {
              const dt1 = isCounterCurrent ? (tempH1 - tempC2) : (tempH1 - tempC1)
              const dt2 = isCounterCurrent ? (tempH2 - tempC1) : (tempH2 - tempC2)
              const lmtd = (dt1 === dt2) ? dt1 : (dt1 - dt2) / Math.log(Math.abs(dt1 / dt2))

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    <button
                      className="btn"
                      onClick={() => setIsCounterCurrent(true)}
                      style={{
                        flex: 1,
                        fontSize: '0.7rem',
                        background: isCounterCurrent ? 'rgba(0,255,163,0.1)' : 'rgba(255,255,255,0.02)',
                        border: isCounterCurrent ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                        color: isCounterCurrent ? 'var(--accent)' : '#94a3b8'
                      }}
                    >
                      🔁 Counter-Current
                    </button>
                    <button
                      className="btn"
                      onClick={() => setIsCounterCurrent(false)}
                      style={{
                        flex: 1,
                        fontSize: '0.7rem',
                        background: !isCounterCurrent ? 'rgba(0,255,163,0.1)' : 'rgba(255,255,255,0.02)',
                        border: !isCounterCurrent ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                        color: !isCounterCurrent ? 'var(--accent)' : '#94a3b8'
                      }}
                    >
                      ➡️ Co-Current
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label className="field-label">Hot Fluid Temp IN (°C)</label>
                      <input type="number" className="field-input" value={tempH1} onChange={e => setTempH1(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="field-label">Hot Fluid Temp OUT (°C)</label>
                      <input type="number" className="field-input" value={tempH2} onChange={e => setTempH2(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="field-label">Cold Fluid Temp IN (°C)</label>
                      <input type="number" className="field-input" value={tempC1} onChange={e => setTempC1(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="field-label">Cold Fluid Temp OUT (°C)</label>
                      <input type="number" className="field-input" value={tempC2} onChange={e => setTempC2(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="res-cell" style={{ marginTop: 10 }}>
                    <div className="res-cell-label">Log Mean Temperature Difference (LMTD)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="res-cell-val" style={{ color: 'var(--accent)' }}>
                        {isNaN(lmtd) || !isFinite(lmtd) ? 'Error (Check Input Temps)' : `${lmtd.toFixed(2)} °C`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginBottom: 8, fontFamily: 'monospace' }}>Thermal Profile Schematic</div>
                    <svg viewBox="0 0 400 80" style={{ width: '100%', height: 80 }}>
                      <path d="M 20 20 L 380 20" fill="none" stroke="var(--red)" strokeWidth="4" />
                      <text x="25" y="15" fill="var(--red)" fontSize="8px">H1: {tempH1}°C</text>
                      <text x="340" y="15" fill="var(--red)" fontSize="8px">H2: {tempH2}°C</text>
                      
                      <path d="M 20 60 L 380 60" fill="none" stroke="var(--blue)" strokeWidth="4" />
                      <text x="25" y="72" fill="var(--blue)" fontSize="8px">C1: {tempC1}°C</text>
                      <text x="340" y="72" fill="var(--blue)" fontSize="8px">C2: {tempC2}°C</text>

                      <polygon points="200,17 210,20 200,23" fill="var(--red)" />
                      {isCounterCurrent ? (
                        <polygon points="190,57 180,60 190,63" fill="var(--blue)" />
                      ) : (
                        <polygon points="200,57 210,60 200,63" fill="var(--blue)" />
                      )}
                    </svg>
                  </div>
                </div>
              )
            })()}

            {/* CHEMICAL KINETICS CALCULATOR */}
            {selectedDiscipline === 'kinetics' && (() => {
              const spaceTime = reactorVol / flowRateVal
              const da = rateConstantVal * spaceTime
              const conversion = da / (1 + da)

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="field-label">Reactor Volume (m³)</label>
                      <input type="number" className="field-input" step="0.1" value={reactorVol} onChange={e => setReactorVol(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="field-label">Vol. Flow Rate (m³/s)</label>
                      <input type="number" className="field-input" step="0.01" value={flowRateVal} onChange={e => setFlowRateVal(Number(e.target.value))} />
                    </div>
                    <div>
                      <label className="field-label">Rate Constant k (1/s)</label>
                      <input type="number" className="field-input" step="0.05" value={rateConstantVal} onChange={e => setRateConstantVal(Number(e.target.value))} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
                    <div className="res-cell">
                      <div className="res-cell-label">Space Time (τ)</div>
                      <span className="res-cell-val">{spaceTime.toFixed(1)} s</span>
                    </div>
                    <div className="res-cell">
                      <div className="res-cell-label">Damköhler Number (Da)</div>
                      <span className="res-cell-val" style={{ color: 'var(--gold)' }}>{da.toFixed(3)}</span>
                    </div>
                  </div>

                  <div className="res-cell">
                    <div className="res-cell-label">Predicted CSTR Conversion (X)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="res-cell-val" style={{ color: 'var(--accent)' }}>{(conversion * 100).toFixed(2)} %</span>
                      <span className="chip chip-green">First-Order Reactant</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Quick Solver Formula Information panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card-title" style={{ fontSize: '0.88rem' }}>📐 Theoretical Reference</div>
            <div className="card-desc">Governing chemical engineering equations and dimensionless numbers</div>

            {selectedDiscipline === 'fluid' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="formula-block" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
                  {"Re = \\\\frac{\\\\rho \\\\cdot v \\\\cdot D}{\\\\mu}"}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  <strong>Reynolds Number (Re)</strong> adalah bilangan tak berdimensi yang menyatakan rasio gaya inersia terhadap gaya viskos pada fluida mengalir.
                  <br /><br />
                  * <strong>Re ≤ 2100:</strong> Aliran Laminar (aliran berlapis lurus).
                  <br />
                  * <strong>2100 &lt; Re &lt; 4000:</strong> Aliran Transisi.
                  <br />
                  * <strong>Re ≥ 4000:</strong> Aliran Turbulent (penuh pusaran & mixing tinggi).
                </div>
              </div>
            )}

            {selectedDiscipline === 'heat' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="formula-block" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
                  {"\\\\Delta T_{lm} = \\\\frac{\\\\Delta T_1 - \\\\Delta T_2}{\\\\ln(\\\\frac{\\\\Delta T_1}{\\\\Delta T_2})}"}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  <strong>Log Mean Temperature Difference (LMTD)</strong> digunakan untuk menentukan gaya dorong temperatur rata-rata untuk perpindahan panas dalam sistem aliran, khususnya pada penukar panas (heat exchanger).
                  <br /><br />
                  * Aliran <strong>Counter-Current</strong> selalu menghasilkan LMTD yang lebih tinggi dibanding <strong>Co-Current</strong> untuk profil suhu yang sama, sehingga memerlukan luas permukaan perpindahan panas yang lebih kecil.
                </div>
              </div>
            )}

            {selectedDiscipline === 'kinetics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="formula-block" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
                  {"\\\\tau = \\\\frac{V}{v_0} \\\\quad , \\\\quad Da = k \\\\cdot \\\\tau"}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  <strong>Damköhler Number (Da)</strong> adalah rasio laju reaksi kimia terhadap laju transfer massa konvektif dalam reaktor alir.
                  <br /><br />
                  * Untuk reaktor tangki berpengaduk kontinyu (CSTR) orde satu, persamaan konversi diturunkan langsung dari neraca massa komponen:
                  <div className="formula-block" style={{ fontSize: '0.78rem', marginTop: 8 }}>
                    {"X = \\\\frac{Da}{1 + Da}"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
