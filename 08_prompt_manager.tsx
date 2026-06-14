import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Trash2, Download, Upload, Plus, FileText, AlertCircle, ImagePlus, Folder, X } from 'lucide-react';

interface Prompt {
  id: string;
  title: string;
  content: string;
  group: string;
  images: string[];
  createdAt: number;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load from Local Storage on mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem('my_prompts');
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts));
      } catch (e) {
        console.error("Error parsing saved prompts", e);
      }
    }
  }, []);

  // Save to Local Storage whenever prompts change
  useEffect(() => {
    try {
      localStorage.setItem('my_prompts', JSON.stringify(prompts));
    } catch (e: any) {
      // LocalStorage is limited to ~5MB. We catch the quota error here.
      if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
        showToast('Storage full! Please delete some images or prompts to save new ones.', 'error');
      }
    }
  }, [prompts]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Compress image to save localStorage space
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const processedImages = await Promise.all(files.map(processImage));
    setNewImages((prev) => [...prev, ...processedImages]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    
    if (imageFiles.length > 0) {
      e.preventDefault(); // Prevent pasting the image as text
      const processedImages = await Promise.all(imageFiles.map(processImage));
      setNewImages((prev) => [...prev, ...processedImages]);
      showToast(`${imageFiles.length} image(s) pasted`);
    }
  };

  const handleAddPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() && newImages.length === 0) {
      showToast('Prompt content or image cannot be empty', 'error');
      return;
    }

    const newPrompt: Prompt = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      title: newTitle.trim() || 'Untitled Prompt',
      content: newContent.trim(),
      group: newGroup.trim() || 'General',
      images: newImages,
      createdAt: Date.now(),
    };

    setPrompts([newPrompt, ...prompts]);
    setNewTitle('');
    setNewContent('');
    setNewGroup('');
    setNewImages([]);
    showToast('Prompt added successfully!');
  };

  const handleDelete = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id));
    showToast('Prompt deleted');
  };

  const handleCopy = async (text: string, id: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopiedId(id);
        } else {
          showToast('Failed to copy text', 'error');
        }
      }
    } catch (err) {
      showToast('Oops, unable to copy', 'error');
    }
  };

  const handleExport = () => {
    if (prompts.length === 0) {
      showToast('No prompts to export', 'error');
      return;
    }
    const dataStr = JSON.stringify(prompts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Prompts exported successfully!');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          const existingIds = new Set(prompts.map(p => p.id));
          const newPrompts = importedData.filter(p => !existingIds.has(p.id));
          
          setPrompts(prev => [...newPrompts, ...prev]);
          showToast(`Successfully imported ${newPrompts.length} prompts!`);
        } else {
          showToast('Invalid file format. Please upload a valid JSON backup.', 'error');
        }
      } catch (err) {
        showToast('Error reading the file.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Group prompts for rendering
  const groupedPrompts = prompts.reduce<Record<string, Prompt[]>>((acc, prompt) => {
    const groupName = prompt.group || 'General';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(prompt);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white transition-opacity duration-300 ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl">
              <FileText className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Prompt Manager</h1>
              <p className="text-sm text-slate-500">Store, group, and copy your best prompts & images.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImportFile} 
            />
            <button 
              onClick={handleImportClick}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Upload size={16} />
              Import
            </button>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </header>

        {/* Add New Prompt Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={20} className="text-indigo-500"/>
            Add New Prompt
          </h2>
          <form onSubmit={handleAddPrompt} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Prompt Title (e.g., Code Review)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Folder className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value)}
                  placeholder="Group Name (e.g., Coding, Marketing)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="relative">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste or type text... You can also paste images directly here!"
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-y font-mono text-sm"
              ></textarea>
            </div>

            {newImages.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {newImages.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
                    <button type="button" onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center">
              <div>
                <input type="file" accept="image/*" multiple className="hidden" ref={imageInputRef} onChange={handleImageUpload} />
                <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  <ImagePlus size={16} /> Add Images
                </button>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm"
              >
                <Plus size={18} />
                Save Prompt
              </button>
            </div>
          </form>
        </section>

        {/* Prompts Grid */}
        <section>
          {prompts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm border-dashed">
              <Folder className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-600">No prompts saved yet</h3>
              <p className="text-slate-500 mt-1">Add your first prompt above or import an existing JSON backup.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedPrompts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([groupName, groupPrompts]) => (
                <div key={groupName} className="space-y-4">
                  
                  {/* Group Header */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Folder className="text-indigo-500" size={20} />
                    <h2 className="text-xl font-bold text-slate-800">{groupName}</h2>
                    <span className="text-sm font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {groupPrompts.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupPrompts.map((prompt) => {
                      const isCopied = copiedId === prompt.id;
                      return (
                        <div 
                          key={prompt.id} 
                          className={`group relative flex flex-col bg-white rounded-2xl p-5 shadow-sm border-2 transition-all duration-300 ${isCopied ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-indigo-100 hover:shadow-md'}`}
                        >
                          <div className="flex justify-between items-start mb-3 gap-2">
                            <h3 className="font-semibold text-slate-800 line-clamp-1 flex-1" title={prompt.title}>
                              {prompt.title}
                            </h3>
                            <button
                              onClick={() => handleDelete(prompt.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete Prompt"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          {/* Render Images if they exist */}
                          {prompt.images && prompt.images.length > 0 && (
                            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                              {prompt.images.map((img, idx) => (
                                <img key={idx} src={img} alt="attachment" className="h-20 w-20 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-slate-50" />
                              ))}
                            </div>
                          )}

                          {/* Render Text Content if it exists */}
                          {prompt.content && (
                            <div className="flex-1 mb-4">
                              <pre className="text-sm text-slate-600 font-mono whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100 h-full max-h-40 overflow-y-auto">
                                {prompt.content}
                              </pre>
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleCopy(prompt.content, prompt.id)}
                            className={`w-full mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                              isCopied 
                                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check size={18} />
                                Copied to Clipboard!
                              </>
                            ) : (
                              <>
                                <Copy size={18} />
                                Copy Text
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
