
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Search, 
  BrainCircuit, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  RotateCcw,
  BookOpen,
  LayoutDashboard,
  Zap,
  ChevronRight,
  Send,
  X,
  Plus,
  History as HistoryIcon,
  Clock,
  Trash2,
  ChevronLeft,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  FileCode,
  Wand2,
  Lightbulb,
  ShieldAlert,
  Target,
  Layers,
  RefreshCw,
  GitCompare,
  ArrowRight,
  Split
} from 'lucide-react';
import { ScenarioType, StyleMode, OptimizationResult, ChatMessage, HistoryEntry, PromptVersion, ABTestMetric, ABTestReport } from './types';
import { optimizePrompt, editImageWithText, startChat, refreshSuggestions, runABTest } from './geminiService';
// @ts-ignore
import mammoth from 'mammoth';
// @ts-ignore
import * as XLSX from 'xlsx';

const STORAGE_KEY = 'promptmaster_history_v2';
const MAX_ATTACHMENTS = 10;

interface Attachment {
  id: string;
  data: string;
  mimeType: string;
  name: string;
  type: 'image' | 'pdf' | 'word' | 'excel' | 'markdown' | 'other';
  textContent?: string;
}

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [scenario, setScenario] = useState<ScenarioType>(ScenarioType.GENERAL);
  const [style, setStyle] = useState<StyleMode>(StyleMode.BUSINESS);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const [editableResult, setEditableResult] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [isRefreshingSugg, setIsRefreshingSugg] = useState(false);

  const [isComparing, setIsComparing] = useState(false);
  const [isABTestOpen, setIsABTestOpen] = useState(false);
  const [abTestInput, setAbTestInput] = useState('');
  const [abTestMetrics, setAbTestMetrics] = useState<ABTestMetric[]>([
    { id: 'm1', name: '输出质量', type: 'score', description: '评估内容的逻辑性、连贯性和专业度' }
  ]);
  const [abTestSelectedVersions, setAbTestSelectedVersions] = useState<string[]>([]);
  const [isABTesting, setIsABTesting] = useState(false);
  const [abTestReport, setAbTestReport] = useState<ABTestReport | null>(null);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [copied, setCopied] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("加载历史记录失败", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (isChatOpen && !chatInstance.current) {
      chatInstance.current = startChat();
    }
  }, [isChatOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const activeEntry = history.find(h => h.id === activeHistoryId);
  const currentVersion = activeEntry?.versions[activeVersionIndex];
  const prevVersion = activeEntry?.versions[activeVersionIndex + 1];

  useEffect(() => {
    if (currentVersion) {
      setEditableResult(currentVersion.optimized);
      setCurrentSuggestions(currentVersion.suggestions || []);
      setSelectedSuggestions(new Set());
    }
  }, [currentVersion, activeVersionIndex]);

  const handleOptimization = async (isRefineAction: boolean = false) => {
    const baseInput = isRefineAction ? editableResult : input;
    if (!baseInput.trim() && attachments.length === 0) return;

    if (isRefineAction) setIsRefining(true);
    else setIsOptimizing(true);

    try {
      const optimizedData = await optimizePrompt(baseInput, {
        scenario,
        style,
        useThinking,
        useSearch,
        attachments: attachments.map(att => ({ 
          data: att.data, 
          mimeType: att.mimeType,
          textContent: att.textContent
        })),
        isRefinement: isRefineAction,
        selectedSuggestions: isRefineAction ? Array.from(selectedSuggestions) : [],
        previousVersion: isRefineAction ? currentVersion?.optimized : undefined
      });

      const newVersion: PromptVersion = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        optimized: optimizedData.optimized,
        highlights: optimizedData.highlights,
        suggestions: optimizedData.suggestions,
        groundingUrls: optimizedData.groundingUrls,
        settings: { scenario, style, useThinking, useSearch }
      };

      setHistory(prev => {
        const targetId = activeHistoryId;
        const existingIndex = prev.findIndex(h => h.id === targetId);
        
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            versions: [newVersion, ...updated[existingIndex].versions],
            lastModified: Date.now()
          };
          setActiveVersionIndex(0);
          return updated;
        } else {
          const newEntry: HistoryEntry = {
            id: Math.random().toString(36).substr(2, 9),
            originalInput: input,
            versions: [newVersion],
            lastModified: Date.now()
          };
          setActiveHistoryId(newEntry.id);
          setActiveVersionIndex(0);
          return [newEntry, ...prev];
        }
      });

    } catch (error) {
      console.error("优化失败:", error);
      alert(`优化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsOptimizing(false);
      setIsRefining(false);
    }
  };

  const handleRefreshSuggestions = async () => {
    if (!editableResult) return;
    setIsRefreshingSugg(true);
    try {
      const newSugg = await refreshSuggestions(editableResult);
      setCurrentSuggestions(newSugg);
      setSelectedSuggestions(new Set());
    } catch (error) {
      console.error("刷新建议失败:", error);
    } finally {
      setIsRefreshingSugg(false);
    }
  };

  const toggleSuggestion = (sugg: string) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(sugg)) next.delete(sugg);
      else next.add(sugg);
      return next;
    });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记录吗？')) {
      setHistory(prev => prev.filter(h => h.id !== id));
      if (activeHistoryId === id) setActiveHistoryId(null);
    }
  };

  const selectHistoryItem = (entry: HistoryEntry) => {
    setActiveHistoryId(entry.id);
    setActiveVersionIndex(0);
    setInput(entry.originalInput);
    const latest = entry.versions[0];
    setScenario(latest.settings.scenario);
    setStyle(latest.settings.style);
    setUseThinking(latest.settings.useThinking);
    setUseSearch(latest.settings.useSearch);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const readFile = (file: File, method: 'readAsArrayBuffer' | 'readAsDataURL' | 'readAsText'): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader[method](file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    // Clear the input so the same file can be selected again
    e.target.value = '';

    const newAttachments: Attachment[] = [];

    for (const file of files) {
      try {
        const id = Math.random().toString(36).substr(2, 9);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        let att: Attachment = {
          id,
          data: '',
          mimeType: file.type,
          name: file.name,
          type: 'other'
        };

        if (file.type.startsWith('image/')) {
          att.type = 'image';
          att.data = await readFile(file, 'readAsDataURL');
        } 
        else if (file.type === 'application/pdf') {
          att.type = 'pdf';
          att.data = await readFile(file, 'readAsDataURL');
        } 
        else if (['doc', 'docx'].includes(ext)) {
          att.type = 'word';
          att.mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          const arrayBuffer = await readFile(file, 'readAsArrayBuffer');
          const result = await mammoth.extractRawText({ arrayBuffer });
          att.textContent = result.value;
        } 
        else if (['xls', 'xlsx', 'csv'].includes(ext)) {
          att.type = 'excel';
          const arrayBuffer = await readFile(file, 'readAsArrayBuffer');
          const workbook = XLSX.read(arrayBuffer);
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          att.textContent = XLSX.utils.sheet_to_csv(worksheet);
          if (!att.mimeType) att.mimeType = 'text/csv';
        } 
        else if (['md', 'markdown'].includes(ext)) {
          att.type = 'markdown';
          att.mimeType = 'text/markdown';
          att.textContent = await readFile(file, 'readAsText');
        }

        newAttachments.push(att);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(`无法读取文件 ${file.name}: 格式可能不支持或文件已损坏`);
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const handleImageEdit = async (imgAttachment: Attachment) => {
    if (imgAttachment.type !== 'image' || !input) return;
    setIsEditingImage(true);
    try {
      const edited = await editImageWithText(imgAttachment.data, input);
      if (edited) setAttachments(prev => prev.map(att => att.id === imgAttachment.id ? { ...att, data: edited } : att));
    } catch (error) {
      console.error("图片修改失败:", error);
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', text: chatInput }]);
    const currentInput = chatInput;
    setChatInput('');
    try {
      const response = await chatInstance.current.sendMessage({ message: currentInput });
      setChatHistory(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      console.error("对话失败:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 核心优化：基于 LCS 的文本差异对比算法
  const handleRunABTest = async () => {
    if (!activeEntry || abTestSelectedVersions.length < 2 || !abTestInput.trim()) return;
    setIsABTesting(true);
    try {
      const versionsToTest = abTestSelectedVersions.map(vid => {
        const index = activeEntry.versions.findIndex(v => v.id === vid);
        return {
          id: vid,
          index: activeEntry.versions.length - index,
          content: activeEntry.versions[index].optimized
        };
      });

      const result = await runABTest(abTestInput, versionsToTest, abTestMetrics);
      
      const report: ABTestReport = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        testInput: abTestInput,
        metrics: abTestMetrics,
        results: result.results,
        summary: result.summary
      };

      setAbTestReport(report);

      // Save report to history
      setHistory(prev => {
        const updated = [...prev];
        const index = updated.findIndex(h => h.id === activeEntry.id);
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            abTestReports: [report, ...(updated[index].abTestReports || [])]
          };
        }
        return updated;
      });

    } catch (error) {
      console.error("A/B 测试失败:", error);
      alert("A/B 测试失败，请重试");
    } finally {
      setIsABTesting(false);
    }
  };

  const addMetric = () => {
    setAbTestMetrics(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: '新指标', type: 'score', description: '' }]);
  };

  const updateMetric = (id: string, field: keyof ABTestMetric, value: any) => {
    setAbTestMetrics(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMetric = (id: string) => {
    setAbTestMetrics(prev => prev.filter(m => m.id !== id));
  };

  const toggleABTestVersion = (id: string) => {
    setAbTestSelectedVersions(prev => {
      if (prev.includes(id)) return prev.filter(v => v !== id);
      if (prev.length >= 4) return prev; // Max 4 versions
      return [...prev, id];
    });
  };

  const openABTestModal = () => {
    if (activeEntry && activeEntry.versions.length >= 2) {
      setAbTestSelectedVersions([activeEntry.versions[0].id, activeEntry.versions[1].id]);
    }
    setAbTestReport(null);
    setIsABTestOpen(true);
  };

  const renderDiff = (oldStr: string, newStr: string) => {
    const oldLines = oldStr.split('\n');
    const newLines = newStr.split('\n');
    
    // LCS 算法矩阵
    const matrix = Array(oldLines.length + 1).fill(null).map(() => Array(newLines.length + 1).fill(0));
    for (let i = 1; i <= oldLines.length; i++) {
      for (let j = 1; j <= newLines.length; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) matrix[i][j] = matrix[i - 1][j - 1] + 1;
        else matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }

    const diff = [];
    let i = oldLines.length, j = newLines.length;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
        diff.unshift({ type: 'equal', text: oldLines[i - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
        diff.unshift({ type: 'add', text: newLines[j - 1] });
        j--;
      } else {
        diff.unshift({ type: 'remove', text: oldLines[i - 1] });
        i--;
      }
    }

    return diff.map((part, idx) => (
      <div 
        key={idx} 
        className={`flex min-h-[1.5rem] py-0.5 border-l-4 transition-colors ${
          part.type === 'add' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-100' :
          part.type === 'remove' ? 'bg-red-500/10 border-red-500 text-red-200 line-through' :
          'border-transparent text-slate-400'
        }`}
      >
        <div className="w-8 shrink-0 flex justify-center text-[10px] font-bold opacity-30 pt-1 select-none">
          {part.type === 'add' ? '+' : part.type === 'remove' ? '-' : ' '}
        </div>
        <div className="flex-1 px-4 whitespace-pre-wrap break-all">{part.text || ' '}</div>
      </div>
    ));
  };

  const renderAttachmentIcon = (att: Attachment) => {
    switch (att.type) {
      case 'image': return <img src={att.data} alt="预览" className="w-full h-full object-cover" />;
      case 'pdf': return <div className="w-full h-full flex flex-col items-center justify-center bg-red-500/10 text-red-500"><FileText size={24} /><span className="text-[8px] font-bold mt-1 uppercase">PDF</span></div>;
      case 'word': return <div className="w-full h-full flex flex-col items-center justify-center bg-blue-500/10 text-blue-500"><FileText size={24} /><span className="text-[8px] font-bold mt-1 uppercase">WORD</span></div>;
      case 'excel': return <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-500/10 text-emerald-500"><FileSpreadsheet size={24} /><span className="text-[8px] font-bold mt-1 uppercase">EXCEL</span></div>;
      case 'markdown': return <div className="w-full h-full flex flex-col items-center justify-center bg-amber-500/10 text-amber-500"><FileCode size={24} /><span className="text-[8px] font-bold mt-1 uppercase">MD</span></div>;
      default: return <div className="w-full h-full flex flex-col items-center justify-center bg-slate-500/10 text-slate-500"><FileIcon size={24} /><span className="text-[8px] font-bold mt-1 uppercase">FILE</span></div>;
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">提示词大师 <span className="text-indigo-400">Pro</span></h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">AI 生产力赋能工具</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <button className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"><LayoutDashboard size={18} /> 工作台</button>
          <button className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"><BookOpen size={18} /> 知识库</button>
        </nav>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-medium text-indigo-300 flex items-center gap-2"><Zap size={14} className="fill-indigo-300" /> 专业版已激活</div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col overflow-hidden hidden lg:flex">
          <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1 custom-scrollbar">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">使用场景</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(ScenarioType).map((type) => (
                  <button key={type} onClick={() => setScenario(type)} className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all border ${scenario === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    {type}<ChevronRight size={16} className={scenario === type ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">输出风格</h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(StyleMode).map((mode) => (
                  <button key={mode} onClick={() => setStyle(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${style === mode ? 'bg-slate-100 text-slate-900 shadow-xl' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>{mode}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">历史项目</h3>
              <div className="space-y-2">
                {history.length === 0 ? <p className="text-[10px] text-slate-600 italic">暂无记录...</p> : history.slice(0, 20).map(item => (
                  <div key={item.id} onClick={() => selectHistoryItem(item)} className={`group relative flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${activeHistoryId === item.id ? 'bg-indigo-500/10 border-indigo-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                    <div className="text-[11px] font-bold text-slate-300 truncate pr-6">{item.originalInput}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-500 flex items-center gap-1"><HistoryIcon size={10} /> {item.versions.length} 版本</span>
                    </div>
                    <button onClick={(e) => deleteHistoryItem(item.id, e)} className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-slate-900/30 overflow-y-auto relative custom-scrollbar">
          <div className="max-w-4xl w-full mx-auto p-8 flex flex-col gap-8 min-h-full">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2"><Plus className="text-indigo-400" size={20} /> 原始需求</h2>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    multiple 
                    onChange={handleFileUpload} 
                    accept="image/*,application/pdf,.doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.md,.markdown,text/markdown" 
                  />
                  <label htmlFor="file-upload" className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-all border border-slate-700"><Plus size={14} /> 添加附件 ({attachments.length}/10)</label>
                  <button onClick={() => { setInput(''); setActiveHistoryId(null); setAttachments([]); setEditableResult(''); }} className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 text-slate-400 hover:text-white transition-all"><RotateCcw size={14} /> 重置</button>
                </div>
              </div>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="在此输入您的原始想法..." className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner" />
              <div className="flex flex-wrap gap-3 mt-4">
                {attachments.map((att) => (
                  <div key={att.id} className="relative w-20 h-24 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group flex flex-col">
                    <div className="flex-1 flex items-center justify-center relative bg-slate-950/50">
                      {renderAttachmentIcon(att)}
                      <button onClick={() => removeAttachment(att.id)} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"><X size={10} /></button>
                    </div>
                    <div className="bg-slate-900 p-1 text-[8px] truncate text-center text-slate-400 border-t border-slate-800">{att.name}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={() => handleOptimization(false)} disabled={isOptimizing || !input.trim()} className="h-12 px-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">{isOptimizing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap size={20} />}初次生成优化</button>
              </div>
            </section>

            {activeEntry && currentVersion && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                <div className="flex items-center justify-between border-t border-slate-800 pt-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Check className="text-emerald-400" size={20} /> 优化结果工作区</h2>
                    {activeEntry.versions.length > 1 && (
                      <div className="flex items-center bg-slate-800 rounded-full px-2 py-1 border border-slate-700">
                        <button disabled={activeVersionIndex >= activeEntry.versions.length - 1} onClick={() => setActiveVersionIndex(v => v + 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                        <span className="text-[10px] font-bold px-2 text-indigo-300">V{activeEntry.versions.length - activeVersionIndex}</span>
                        <button disabled={activeVersionIndex <= 0} onClick={() => setActiveVersionIndex(v => v - 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight size={16} /></button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {activeEntry.versions.length >= 2 && (
                      <button onClick={openABTestModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-sm font-bold hover:bg-indigo-500/20 transition-all">
                        <Split size={16} /> A/B 测试
                      </button>
                    )}
                    {prevVersion && (
                      <button onClick={() => setIsComparing(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all hover:text-indigo-400">
                        <GitCompare size={16} /> 版本对比
                      </button>
                    )}
                    <button onClick={() => handleOptimization(true)} disabled={isRefining || !editableResult.trim()} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-bold hover:bg-indigo-500/30 transition-all">
                      {isRefining ? <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" /> : <Wand2 size={16} />}二次优化精炼
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-3 space-y-4">
                    <div className="relative group">
                      <textarea value={editableResult} onChange={(e) => setEditableResult(e.target.value)} className="w-full min-h-[350px] bg-slate-950 border border-slate-800 rounded-2xl p-8 text-slate-200 leading-relaxed font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-2xl resize-y" />
                      <button 
                        onClick={() => copyToClipboard(editableResult)}
                        className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg backdrop-blur-sm transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
                        title="一键复制"
                      >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        <span className="text-xs font-medium">{copied ? '已复制' : '一键复制'}</span>
                      </button>
                    </div>

                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Lightbulb size={16} className="text-amber-400" /> 针对性专家建议</h3>
                        <button onClick={handleRefreshSuggestions} disabled={isRefreshingSugg} className="text-[10px] text-slate-500 hover:text-indigo-400 flex items-center gap-1 uppercase font-bold tracking-wider">
                          <RefreshCw size={12} className={isRefreshingSugg ? 'animate-spin' : ''} /> 刷新建议
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {currentSuggestions.map((sugg, i) => (
                          <button key={i} onClick={() => toggleSuggestion(sugg)} className={`text-left px-4 py-3 rounded-xl border text-xs transition-all flex items-start gap-3 ${selectedSuggestions.has(sugg) ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                            <div className={`mt-0.5 min-w-[14px] h-[14px] rounded border flex items-center justify-center ${selectedSuggestions.has(sugg) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700'}`}>
                              {selectedSuggestions.has(sugg) && <Check size={10} className="text-white" />}
                            </div>
                            {sugg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">本次优化点</h3>
                    <div className="space-y-2">
                      {currentVersion.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-slate-900/50 border border-slate-800 rounded-xl animate-in fade-in duration-300">
                          <Check size={14} className="mt-1 text-emerald-500 shrink-0" /><span className="text-xs text-slate-300 leading-tight">{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      {/* 专业级版本对比侧抽屉 */}
      {isComparing && prevVersion && currentVersion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsComparing(false)} />
          <div className="relative w-full max-w-4xl h-full bg-slate-900 border-l border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400 border border-indigo-600/20"><GitCompare size={24} /></div>
                <div>
                  <h2 className="text-xl font-bold">版本变更追踪 (V{activeEntry!.versions.length - activeVersionIndex - 1} → V{activeEntry!.versions.length - activeVersionIndex})</h2>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">差异分析引擎已就绪</p>
                </div>
              </div>
              <button onClick={() => setIsComparing(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/40">
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-8 px-6 py-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded-md" />
                    <span className="text-xs font-bold text-slate-400 uppercase">已移除 / 变更前</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/50 rounded-md" />
                    <span className="text-xs font-bold text-slate-400 uppercase">新增项 / 变更后</span>
                  </div>
                  <div className="flex-1 text-right">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">基于 LCS 差异算法渲染</span>
                  </div>
                </div>

                <div className="font-mono text-sm leading-relaxed border border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30 shadow-2xl">
                  <div className="divide-y divide-slate-800/30">
                    {renderDiff(prevVersion.optimized, currentVersion.optimized)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <p className="text-xs text-slate-500">差异对比结果仅供参考，您可以继续在工作台中手动微调。</p>
              <button onClick={() => setIsComparing(false)} className="px-8 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-white transition-all shadow-lg active:scale-95">返回工作台</button>
            </div>
          </div>
        </div>
      )}

      {/* A/B 测试侧抽屉 */}
      {isABTestOpen && activeEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsABTestOpen(false)} />
          <div className="relative w-full max-w-5xl h-full bg-slate-900 border-l border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400 border border-indigo-600/20"><Split size={24} /></div>
                <div>
                  <h2 className="text-xl font-bold">A/B 测试实验室</h2>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">多版本提示词效果评估</p>
                </div>
              </div>
              <button onClick={() => setIsABTestOpen(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/40 p-8">
              {!abTestReport ? (
                <div className="space-y-8 max-w-3xl mx-auto">
                  {/* 1. 选择版本 */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Layers size={18} className="text-indigo-400" /> 1. 选择参与测试的版本 (2-4个)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {activeEntry.versions.map((v, idx) => {
                        const vNum = activeEntry.versions.length - idx;
                        const isSelected = abTestSelectedVersions.includes(v.id);
                        return (
                          <div 
                            key={v.id} 
                            onClick={() => toggleABTestVersion(v.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex gap-3 ${isSelected ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                          >
                            <div className={`mt-0.5 min-w-[18px] h-[18px] rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700'}`}>
                              {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-300 mb-1">版本 V{vNum}</div>
                              <div className="text-[10px] text-slate-500 line-clamp-2">{v.optimized}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* 2. 测试场景 */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Target size={18} className="text-emerald-400" /> 2. 设定测试场景 (输入)</h3>
                    <textarea 
                      value={abTestInput} 
                      onChange={(e) => setAbTestInput(e.target.value)} 
                      placeholder="例如：请帮我写一篇关于人工智能未来发展的短文，字数500字左右。" 
                      className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" 
                    />
                  </section>

                  {/* 3. 评估指标 */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><BrainCircuit size={18} className="text-amber-400" /> 3. 设定评估指标</h3>
                      <button onClick={addMetric} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"><Plus size={14} /> 添加指标</button>
                    </div>
                    <div className="space-y-3">
                      {abTestMetrics.map((metric, idx) => (
                        <div key={metric.id} className="flex gap-3 items-start p-4 bg-slate-900 border border-slate-800 rounded-xl">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              value={metric.name} 
                              onChange={(e) => updateMetric(metric.id, 'name', e.target.value)} 
                              placeholder="指标名称 (如: 逻辑清晰度)" 
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                            />
                            <select 
                              value={metric.type} 
                              onChange={(e) => updateMetric(metric.id, 'type', e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                            >
                              <option value="score">AI 智能打分 (0-100)</option>
                              <option value="keyword">关键词命中率</option>
                              <option value="custom">自定义评估</option>
                            </select>
                            {metric.type === 'keyword' ? (
                              <input 
                                type="text" 
                                value={metric.keywords?.join(', ') || ''} 
                                onChange={(e) => updateMetric(metric.id, 'keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                                placeholder="关键词列表，用逗号分隔" 
                                className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                              />
                            ) : (
                              <input 
                                type="text" 
                                value={metric.description || ''} 
                                onChange={(e) => updateMetric(metric.id, 'description', e.target.value)} 
                                placeholder="指标详细描述，指导 AI 如何打分" 
                                className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                              />
                            )}
                          </div>
                          <button onClick={() => removeMetric(metric.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors mt-1"><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* 测试报告 */}
                  <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2"><Sparkles size={20} /> AI 综合评估报告</h3>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{abTestReport.summary}</div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {abTestReport.results.map((result) => (
                      <div key={result.versionId} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                          <h4 className="font-bold text-slate-200">版本 V{result.versionIndex}</h4>
                          <div className="flex gap-2">
                            {abTestReport.metrics.filter(m => m.type === 'score').map(m => (
                              <div key={m.id} className="px-2 py-1 bg-slate-950 rounded-md text-[10px] font-bold text-indigo-400 border border-slate-700">
                                {m.name}: {result.scores[m.id] || 0}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-6 flex-1 space-y-6">
                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">生成结果</div>
                            <div className="text-sm text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                              {result.output}
                            </div>
                          </div>
                          
                          {abTestReport.metrics.some(m => m.type === 'keyword') && (
                            <div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">关键词命中</div>
                              <div className="flex flex-wrap gap-2">
                                {abTestReport.metrics.filter(m => m.type === 'keyword').map(m => (
                                  <div key={m.id} className={`px-2 py-1 rounded-md text-xs border flex items-center gap-1 ${result.keywordMatches[m.id] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                    {result.keywordMatches[m.id] ? <Check size={12} /> : <X size={12} />} {m.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">AI 独立评价</div>
                            <div className="text-xs text-slate-400 italic bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                              {result.evaluation || '无评价'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end items-center gap-4">
              {!abTestReport ? (
                <>
                  <button onClick={() => setIsABTestOpen(false)} className="px-6 py-2.5 text-slate-400 hover:text-white font-bold transition-colors">取消</button>
                  <button 
                    onClick={handleRunABTest} 
                    disabled={isABTesting || abTestSelectedVersions.length < 2 || !abTestInput.trim()} 
                    className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    {isABTesting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Split size={18} />}
                    {isABTesting ? '正在运行测试...' : '开始 A/B 测试'}
                  </button>
                </>
              ) : (
                <button onClick={() => setAbTestReport(null)} className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all">重新测试</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isChatOpen ? 'w-96 h-[500px]' : 'w-16 h-16'}`}>
        {isChatOpen ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden h-full">
            <div className="bg-indigo-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold"><MessageSquare size={20} />需求协助</div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/80"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-2 text-sm outline-none" placeholder="提问..." />
              <button onClick={handleSendChat} className="p-2 text-indigo-400"><Send size={20} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsChatOpen(true)} className="w-16 h-16 bg-indigo-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all"><MessageSquare className="text-white" /></button>
        )}
      </div>

      <footer className="h-10 border-t border-slate-800 flex items-center justify-center px-4 bg-slate-950 text-[10px] text-slate-500 uppercase tracking-widest font-bold">由 GEMINI 3 PRO 技术驱动 • 智能迭代模型已激活</footer>
    </div>
  );
};

export default App;
