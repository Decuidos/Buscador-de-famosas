import React, { useState, useEffect, useRef } from 'react';
import { Search, User, ExternalLink, Shield, AlertCircle, Loader2, Sparkles, Upload, Image as ImageIcon, Plus, X, Info, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { performSearch, SearchResult } from './services/geminiService';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';

interface ContentItem {
  id: string;
  name: string;
  platform: string;
  source: string;
  type: string;
  url: string;
  mimeType: string;
  createdAt: string;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ text: string; localItems: ContentItem[] } | null>(null);
  const [feed, setFeed] = useState<ContentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [view, setView] = useState<'feed' | 'search'>('feed');

  // Form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    platform: 'OnlyFans',
    source: 'Filtración',
    type: 'Imagen'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hasAgreed) {
      fetchFeed();
    }
  }, [hasAgreed]);

  const fetchFeed = async () => {
    try {
      const res = await fetch('/api/content');
      const data = await res.json();
      setFeed(data);
    } catch (err) {
      console.error('Error fetching feed:', err);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setView('search');
    try {
      const data = await performSearch(query);
      
      // Filter local feed for matching names
      const localItems = feed.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults({
        text: data.text,
        localItems
      });
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al buscar. Inténtalo de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadForm.name) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', uploadForm.name);
    formData.append('platform', uploadForm.platform);
    formData.append('source', uploadForm.source);
    formData.append('type', uploadForm.type);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setShowUploadModal(false);
        setUploadForm({ name: '', platform: 'OnlyFans', source: 'Filtración', type: 'Imagen' });
        setSelectedFile(null);
        fetchFeed();
        setView('feed');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al subir');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al subir');
    } finally {
      setIsUploading(false);
    }
  };

  if (!hasAgreed) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800 backdrop-blur-xl"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 mb-4">
              <Shield className="w-8 h-8 text-zinc-400" />
            </div>
            <h1 className="text-3xl font-light tracking-tight">Elite Search Pro</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Esta herramienta permite visualizar y compartir material multimedia de personalidades conocidas de forma anónima. 
              Al entrar, confirmas que eres mayor de 18 años y que usarás esta herramienta de forma responsable.
            </p>
          </div>
          <button
            onClick={() => setHasAgreed(true)}
            className="w-full py-4 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Soy mayor de 18 y acepto
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-zinc-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-light tracking-tighter cursor-pointer" onClick={() => setView('feed')}>
              Elite<span className="italic font-serif">Search</span>
            </h1>
            <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-zinc-500">
              <button 
                onClick={() => setView('feed')}
                className={cn("hover:text-white transition-colors", view === 'feed' && "text-white")}
              >
                Feed Público
              </button>
              <button 
                onClick={() => setView('search')}
                className={cn("hover:text-white transition-colors", view === 'search' && "text-white")}
              >
                Buscador Deep
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-black rounded-full text-xs font-bold hover:bg-white transition-all"
          >
            <Plus className="w-4 h-4" />
            SUBIR CONTENIDO
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32">
        {view === 'search' ? (
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-16">
              <h2 className="text-4xl font-light tracking-tight mb-2">Buscador Deep</h2>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Motor de Inteligencia Multimedia</p>
            </header>

            <div className="max-w-2xl mx-auto mb-20">
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busca por nombre o apodo..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-5 px-6 pl-14 text-lg focus:outline-none focus:border-zinc-600 transition-all backdrop-blur-md group-hover:border-zinc-700"
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-600 group-focus-within:text-zinc-400 transition-colors" />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-zinc-100 text-black rounded-xl font-medium hover:bg-white disabled:opacity-50 transition-all"
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                </button>
              </form>
            </div>

            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-20">
                  <Loader2 className="w-10 h-10 text-zinc-700 animate-spin mb-4" />
                  <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase animate-pulse">Escaneando bases de datos...</p>
                </motion.div>
              ) : searchResults ? (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                  <section className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-6 text-zinc-500">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-mono uppercase tracking-widest">Perfil de la Creadora</span>
                    </div>
                    <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed text-sm">
                      <ReactMarkdown>{searchResults.text}</ReactMarkdown>
                    </div>
                  </section>
                  <section>
                    <div className="flex items-center gap-2 mb-8 text-zinc-500">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-mono uppercase tracking-widest">Contenido en Base de Datos</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {searchResults.localItems.map((item) => (
                        <div key={item.id} className="group bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all">
                          <div className="aspect-square relative bg-zinc-950">
                            {item.mimeType.startsWith('image') ? (
                              <img src={item.url} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <video src={item.url} className="w-full h-full object-cover" controls />
                            )}
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[8px] font-bold uppercase tracking-wider">
                                {item.platform}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-widest">
                              <span>{item.source}</span>
                              <span>{item.type}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {searchResults.localItems.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-800">
                          <p className="text-zinc-600 text-sm italic">No se encontró contenido multimedia para esta creadora en nuestra base de datos.</p>
                        </div>
                      )}
                    </div>
                  </section>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <h2 className="text-5xl font-light tracking-tight mb-2">Feed Público</h2>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">Contenido compartido por la comunidad</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full">
                  <Filter className="w-3 h-3" />
                  <span>Más Recientes</span>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {feed.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden hover:border-zinc-600 transition-all"
                >
                  <div className="aspect-[3/4] relative bg-zinc-950 overflow-hidden">
                    {item.mimeType.startsWith('image') ? (
                      <img 
                        src={item.url} 
                        alt={item.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <video src={item.url} className="w-full h-full object-cover" controls />
                    )}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {item.platform}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">{item.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Origen</p>
                        <p className="text-xs text-zinc-400">{item.source}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Tipo</p>
                        <p className="text-xs text-zinc-400">{item.type}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-zinc-800/50 flex items-center justify-between text-[10px] text-zinc-600 uppercase tracking-widest">
                      <span>Anónimo ({item.id.slice(-4)})</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {feed.length === 0 && (
                <div className="col-span-full py-32 text-center">
                  <ImageIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                  <p className="text-zinc-600 italic">No hay contenido público todavía. Sé el primero en subir algo.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
            >
              <button onClick={() => setShowUploadModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-2xl font-light mb-8">Subir Nuevo Contenido</h3>
              
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Nombre de la Creadora</label>
                  <input
                    required
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                    placeholder="Ej: Amouranth"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500">Plataforma</label>
                    <select 
                      value={uploadForm.platform}
                      onChange={(e) => setUploadForm({...uploadForm, platform: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-xs focus:outline-none"
                    >
                      <option>OnlyFans</option>
                      <option>Fansly</option>
                      <option>Instagram</option>
                      <option>TikTok</option>
                      <option>Twitter</option>
                      <option>Patreon</option>
                      <option>Otros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500">Origen</label>
                    <select 
                      value={uploadForm.source}
                      onChange={(e) => setUploadForm({...uploadForm, source: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-xs focus:outline-none"
                    >
                      <option>Filtración</option>
                      <option>Público</option>
                      <option>Comprado</option>
                      <option>Screenshot</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-500">Tipo</label>
                    <select 
                      value={uploadForm.type}
                      onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-xs focus:outline-none"
                    >
                      <option>Imagen</option>
                      <option>Video</option>
                      <option>Galería</option>
                      <option>Descargado</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500">Archivo Multimedia</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-zinc-600 transition-all"
                  >
                    {selectedFile ? (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                        <p className="text-xs text-zinc-300">{selectedFile.name}</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-xs text-zinc-600">Click para seleccionar imagen o video</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden" 
                    accept="image/*,video/*"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                  <Info className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Tu subida es anónima. Solo registramos tu IP para moderación interna. 
                    El contenido será visible para todos los usuarios del feed público.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile || !uploadForm.name}
                  className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 disabled:opacity-50 transition-all"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'PUBLICAR AHORA'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-[10px] text-zinc-700 uppercase tracking-[0.2em]">
          <span>© 2026 Elite Search Pro</span>
          <span className="flex items-center gap-4">
            <span className="pointer-events-auto cursor-help hover:text-zinc-500">Privacidad</span>
            <span className="pointer-events-auto cursor-help hover:text-zinc-500">Términos</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
