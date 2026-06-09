import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  File as FileIcon,
  FileCode,
  FileSpreadsheet,
  FileText,
  GitCompare,
  History as HistoryIcon,
  Lightbulb,
  MessageSquare,
  PackageOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Split,
  Target,
  Trash2,
  Upload,
  Wand2,
  X,
  Zap
} from 'lucide-react';
import {
  ABTestMetric,
  ABTestReport,
  AgentAssetSchema,
  AssetSchema,
  AssetType,
  Attachment,
  BenchmarkAssetSchema,
  CapabilityPack,
  CapabilityStatus,
  ChatMessage,
  ConnectorAssetSchema,
  DatasetAssetSchema,
  EvaluatorAssetSchema,
  HistoryEntry,
  MemoryAssetSchema,
  McpAssetSchema,
  OptimizationDirection,
  ParserAssetSchema,
  PolicyAssetSchema,
  PromptAsset,
  PromptAssetSchema,
  PromptVersion,
  ReferenceAssetSchema,
  ScenarioType,
  SdkAssetSchema,
  SkillAssetSchema,
  StyleMode,
  TemplateAssetSchema,
  ToolAssetSchema,
  WorkflowAssetSchema
} from './types';
import { editImageWithText, optimizePrompt, refreshSuggestions, runABTest, startChat } from './geminiService';
import { useAssetLibrary } from './hooks/useAssetLibrary';
import { usePromptHistory } from './hooks/usePromptHistory';
import { extractAssetText, MAX_ATTACHMENTS, parseOptimizationAttachment } from './services/fileParsing';
import {
  ASSET_TYPE_LABELS,
  ASSET_TYPE_FORMATS,
  BUILT_IN_DIRECTIONS,
  applyAssetFormatTemplate,
  createAssetDraftFromText,
  createBlankAsset,
  defaultCapabilityStatusForType,
  getAssetSchemaFieldFormat,
  listToText,
  mergeImportedAssets,
  normalizeAssetSchema,
  normalizeImportedAsset,
  parseList,
  recommendAssets
} from './services/library';
import { OpsWorkbench } from './components/ops/OpsWorkbench';
import { AppShell, AppViewMode } from './components/layout/AppShell';
import { AssetLibraryCard } from './components/library/AssetLibraryCard';
import { LibraryFilterSidebar } from './components/library/LibraryFilterSidebar';
import { BuilderWorkbench } from './components/builders/BuilderWorkbench';
import { RunLabWorkbench } from './components/run-lab/RunLabWorkbench';
import { FeedbackWorkbench } from './components/feedback/FeedbackWorkbench';
import { KnowledgeBaseView } from './components/knowledge/KnowledgeBaseView';
import { SettingsView } from './components/settings/SettingsView';
import { PromptOpsWorkspace } from './components/workspace/PromptOpsWorkspace';
import { CapabilityPacksView } from './components/packs/CapabilityPacksView';
import { Badge, Button, EmptyState, PageHeader, StatusPill } from './components/ui/DesignSystem';
import { importAssetFromUrlRemote } from './services/apiClient';
import { useCapabilityPacks } from './hooks/useCapabilityPacks';
import { getPackAssetIds } from './services/capabilityPacks';

type ViewMode = AppViewMode;

const resolveViewFromHash = (): ViewMode => {
  if (typeof window === 'undefined') return 'workspace';
  const hash = window.location.hash.replace('#', '');
  if (['workspace', 'library', 'packs', 'builder', 'runlab', 'feedback', 'knowledge', 'settings', 'ops'].includes(hash)) return hash as ViewMode;
  return 'workspace';
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>(() => resolveViewFromHash());
  const [input, setInput] = useState('');
  const [scenario, setScenario] = useState<ScenarioType>(ScenarioType.GENERAL);
  const [style, setStyle] = useState<StyleMode>(StyleMode.BUSINESS);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  const [history, setHistory] = usePromptHistory();

  const { assets, setAssets, customDirections, setCustomDirections } = useAssetLibrary();
  const { capabilityPacks, saveCapabilityPack, deleteCapabilityPack } = useCapabilityPacks();
  const allDirections = useMemo(() => [...BUILT_IN_DIRECTIONS, ...customDirections], [customDirections]);
  const [selectedDirectionIds, setSelectedDirectionIds] = useState<string[]>([]);
  const [customDirection, setCustomDirection] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

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

  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryType, setLibraryType] = useState<AssetType | 'all'>('all');
  const [libraryStatus, setLibraryStatus] = useState<CapabilityStatus | 'all'>('all');
  const [libraryView, setLibraryView] = useState<'table' | 'cards'>('table');
  const [assetDraft, setAssetDraft] = useState<PromptAsset | null>(null);
  const [libraryNotice, setLibraryNotice] = useState('');
  const [assetUrlInput, setAssetUrlInput] = useState('');
  const [isImportingUrl, setIsImportingUrl] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInstance = useRef<any>(null);

  const activeEntry = history.find(h => h.id === activeHistoryId);
  const currentVersion = activeEntry?.versions[activeVersionIndex];
  const prevVersion = activeEntry?.versions[activeVersionIndex + 1];
  const selectedDirections = allDirections.filter(direction => selectedDirectionIds.includes(direction.id));
  const selectedAssets = assets.filter(asset => selectedAssetIds.includes(asset.id));
  const recommendedAssets = useMemo(() => recommendAssets(
    assets,
    [input, scenario, style, customDirection].join(' '),
    selectedDirections.map(direction => `${direction.name} ${direction.description}`)
  ), [assets, input, scenario, style, customDirection, selectedDirections]);

  const openView = (view: ViewMode) => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      const hash = `#${view}`;
      if (window.location.hash !== hash) {
        window.history.pushState(null, '', hash);
      }
    }
  };

  const filteredAssets = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    return assets
      .filter(asset => libraryType === 'all' || asset.type === libraryType)
      .filter(asset => libraryStatus === 'all' || (asset.status || inferAssetStatus(asset)) === libraryStatus)
      .filter(asset => {
        if (!query) return true;
        return [
          asset.title,
          asset.summary,
          asset.content,
          asset.tags.join(' '),
          asset.useCases.join(' '),
          asset.integration.entryName,
          asset.integration.capabilities.join(' ')
        ].join(' ').toLowerCase().includes(query);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [assets, librarySearch, libraryStatus, libraryType]);

  useEffect(() => {
    if (currentVersion) {
      setEditableResult(currentVersion.optimized);
      setCurrentSuggestions(currentVersion.suggestions || []);
      setSelectedSuggestions(new Set());
    }
  }, [currentVersion, activeVersionIndex]);

  useEffect(() => {
    if (isChatOpen && !chatInstance.current) {
      chatInstance.current = startChat();
    }
  }, [isChatOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    const syncViewFromHash = () => setActiveView(resolveViewFromHash());
    window.addEventListener('hashchange', syncViewFromHash);
    window.addEventListener('popstate', syncViewFromHash);
    return () => {
      window.removeEventListener('hashchange', syncViewFromHash);
      window.removeEventListener('popstate', syncViewFromHash);
    };
  }, []);

  const handleOptimization = async (isRefineAction = false) => {
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
        previousVersion: isRefineAction ? currentVersion?.optimized : undefined,
        selectedAssets,
        recommendedAssets,
        directions: selectedDirections,
        customDirection
      });

      const newVersion: PromptVersion = {
        id: createId(),
        timestamp: Date.now(),
        optimized: optimizedData.optimized,
        highlights: optimizedData.highlights,
        suggestions: optimizedData.suggestions,
        groundingUrls: optimizedData.groundingUrls,
        settings: {
          scenario,
          style,
          useThinking,
          useSearch,
          directions: selectedDirectionIds,
          customDirection,
          selectedAssetIds
        }
      };

      setHistory(prev => {
        const existingIndex = prev.findIndex(h => h.id === activeHistoryId);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            versions: [newVersion, ...updated[existingIndex].versions],
            lastModified: Date.now()
          };
          setActiveVersionIndex(0);
          return updated;
        }

        const newEntry: HistoryEntry = {
          id: createId(),
          originalInput: input || baseInput,
          versions: [newVersion],
          lastModified: Date.now()
        };
        setActiveHistoryId(newEntry.id);
        setActiveVersionIndex(0);
        return [newEntry, ...prev];
      });
    } catch (error) {
      console.error('优化失败:', error);
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
      const newSuggestions = await refreshSuggestions(editableResult);
      setCurrentSuggestions(newSuggestions);
      setSelectedSuggestions(new Set());
    } catch (error) {
      console.error('刷新建议失败:', error);
    } finally {
      setIsRefreshingSugg(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, MAX_ATTACHMENTS - attachments.length);
    const selectedFiles = files.slice(0, remainingSlots);
    if (selectedFiles.length < files.length) {
      alert(`最多只能添加 ${MAX_ATTACHMENTS} 个附件`);
    }

    const nextAttachments: Attachment[] = [];
    for (const file of selectedFiles) {
      try {
        nextAttachments.push(await parseOptimizationAttachment(file));
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        alert(`无法读取文件 ${file.name}: 格式可能不支持或文件已损坏`);
      }
    }

    setAttachments(prev => [...prev, ...nextAttachments]);
  };

  const handleAssetFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    try {
      const importedAssets: PromptAsset[] = [];
      let importedDirections: OptimizationDirection[] = [];

      for (const file of files) {
        const text = await extractAssetText(file);
        if (file.name.toLowerCase().endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.assets)) {
            importedAssets.push(...parsed.assets.map(normalizeImportedAsset));
            if (Array.isArray(parsed.directions)) {
              importedDirections = parsed.directions
                .filter((direction: Partial<OptimizationDirection>) => direction.name)
                .map((direction: Partial<OptimizationDirection>) => ({
                  id: direction.id || createId(),
                  name: direction.name || '自定义方向',
                  description: direction.description || '',
                  builtIn: false
                }));
            }
            continue;
          }
          if (parsed.title || parsed.content) {
            importedAssets.push(normalizeImportedAsset(parsed));
            continue;
          }
        }
        importedAssets.push(createAssetDraftFromText(file.name, text));
      }

      if (importedAssets.length === 1 && files.length === 1 && !files[0].name.toLowerCase().endsWith('.json')) {
        setAssetDraft(importedAssets[0]);
        setLibraryNotice('已生成资产草稿，请检查字段后保存。');
      } else {
        setAssets(prev => mergeImportedAssets(prev, importedAssets));
        if (importedDirections.length > 0) {
          setCustomDirections(prev => mergeDirections(prev, importedDirections));
        }
        setLibraryNotice(`已导入 ${importedAssets.length} 个资产${importedDirections.length ? `，${importedDirections.length} 个方向` : ''}。`);
      }
      openView('library');
    } catch (error) {
      console.error('资产导入失败:', error);
      alert(`资产导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleExportLibrary = () => {
    const payload = JSON.stringify({ version: 1, assets, directions: customDirections }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promptmaster-library-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAssetUrlImport = async () => {
    const url = assetUrlInput.trim();
    if (!url) return;
    setIsImportingUrl(true);
    setLibraryNotice('');
    try {
      const result = await importAssetFromUrlRemote({ url });
      if (!result.ok || !result.asset) {
        setLibraryNotice(result.message || 'URL 导入失败，可改用文件导入或手动粘贴内容生成资产草稿。');
        return;
      }
      setAssetDraft(normalizeImportedAsset(result.asset));
      setLibraryNotice(result.message);
      setAssetUrlInput('');
      openView('library');
    } catch (error) {
      setLibraryNotice(`URL 导入失败：${error instanceof Error ? error.message : '未知错误'}。可改用文件导入或手动粘贴内容生成资产草稿。`);
    } finally {
      setIsImportingUrl(false);
    }
  };

  const saveAssetDraft = () => {
    if (!assetDraft) return;
    const title = assetDraft.title.trim();
    if (!title) {
      alert('资产标题不能为空');
      return;
    }
    const normalized = normalizeImportedAsset({ ...assetDraft, title, updatedAt: Date.now() });
    setAssets(prev => mergeImportedAssets(prev.filter(asset => asset.id !== normalized.id), [normalized]));
    setAssetDraft(null);
    setLibraryNotice('资产已保存。');
  };

  const deleteAsset = (id: string) => {
    if (!confirm('确定要删除这个项目库资产吗？')) return;
    setAssets(prev => prev.filter(asset => asset.id !== id));
    setSelectedAssetIds(prev => prev.filter(assetId => assetId !== id));
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
    setSelectedDirectionIds(latest.settings.directions || []);
    setCustomDirection(latest.settings.customDirection || '');
    setSelectedAssetIds(latest.settings.selectedAssetIds || []);
    openView('workspace');
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记录吗？')) {
      setHistory(prev => prev.filter(h => h.id !== id));
      if (activeHistoryId === id) setActiveHistoryId(null);
    }
  };

  const toggleAssetSelection = (id: string) => {
    setSelectedAssetIds(prev => {
      if (prev.includes(id)) return prev.filter(assetId => assetId !== id);
      if (prev.length >= 8) return prev;
      return [...prev, id];
    });
  };

  const injectAssetToWorkspace = (id: string) => {
    setSelectedAssetIds(prev => {
      if (prev.includes(id) || prev.length >= 8) return prev;
      return [...prev, id];
    });
    setAssets(prev => prev.map(asset => asset.id === id ? {
      ...asset,
      usageCount: (asset.usageCount || 0) + 1,
      lastUsedAt: Date.now(),
      status: asset.status || inferAssetStatus(asset)
    } : asset));
    openView('workspace');
  };

  const useCapabilityPack = (pack: CapabilityPack) => {
    const assetIds = getPackAssetIds(pack).slice(0, 8);
    sessionStorage.setItem('promptmaster_workspace_pack_use_v1', JSON.stringify({
      packId: pack.id,
      packName: pack.name,
      assetIds
    }));
    setAssets(prev => prev.map(asset => assetIds.includes(asset.id) ? {
      ...asset,
      usageCount: (asset.usageCount || 0) + 1,
      lastUsedAt: Date.now(),
      status: asset.status || inferAssetStatus(asset)
    } : asset));
    saveCapabilityPack({
      ...pack,
      usageCount: (pack.usageCount || 0) + 1,
      lastUsedAt: Date.now(),
      updatedAt: Date.now()
    });
    openView('workspace');
  };

  const openBuilderForPackSlot = (assetType: AssetType, pack: CapabilityPack, slot: { key: string; label: string; role: string }) => {
    sessionStorage.setItem('promptmaster_builder_handoff_v1', JSON.stringify({
      assetType,
      packId: pack.id,
      slotKey: slot.key,
      prompt: [
        `请为能力包“${pack.name}”构建一个 ${ASSET_TYPE_LABELS[assetType]} 资产。`,
        `槽位：${slot.label}`,
        `槽位职责：${slot.role}`,
        `能力包场景：${pack.scenario}`,
        `能力包摘要：${pack.summary}`
      ].join('\n')
    }));
    openView('builder');
  };

  const toggleDirection = (id: string) => {
    setSelectedDirectionIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const addCustomDirectionPreset = () => {
    const value = customDirection.trim();
    if (!value) return;
    const direction: OptimizationDirection = {
      id: createId(),
      name: value.slice(0, 18),
      description: value,
      builtIn: false
    };
    setCustomDirections(prev => [direction, ...prev]);
    setSelectedDirectionIds(prev => [...prev, direction.id]);
    setLibraryNotice('自定义方向已保存为预设。');
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const updateAssetDraftType = (type: AssetType) => {
    if (!assetDraft) return;
    setAssetDraft(applyAssetFormatTemplate({
      ...assetDraft,
      status: defaultCapabilityStatusForType(type),
      content: '',
      examples: [],
      schema: undefined
    }, type, true));
  };

  const applyCurrentAssetTemplate = (overwrite = false) => {
    if (!assetDraft) return;
    setAssetDraft(applyAssetFormatTemplate(assetDraft, assetDraft.type, overwrite));
  };

  const updateAssetSchema = (schema: AssetSchema) => {
    setAssetDraft(prev => prev ? { ...prev, schema } : prev);
  };

  const handleImageEdit = async (imgAttachment: Attachment) => {
    if (imgAttachment.type !== 'image' || !input) return;
    setIsEditingImage(true);
    try {
      const edited = await editImageWithText(imgAttachment.data, input);
      if (edited) {
        setAttachments(prev => prev.map(att => att.id === imgAttachment.id ? { ...att, data: edited } : att));
      }
    } catch (error) {
      console.error('图片修改失败:', error);
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
      console.error('对话失败:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        id: createId(),
        timestamp: Date.now(),
        testInput: abTestInput,
        metrics: abTestMetrics,
        results: result.results,
        summary: result.summary
      };

      setAbTestReport(report);
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
      console.error('A/B 测试失败:', error);
      alert('A/B 测试失败，请重试');
    } finally {
      setIsABTesting(false);
    }
  };

  const addMetric = () => {
    setAbTestMetrics(prev => [...prev, { id: createId(), name: '新指标', type: 'score', description: '' }]);
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
      if (prev.length >= 4) return prev;
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
    const matrix = Array(oldLines.length + 1).fill(null).map(() => Array(newLines.length + 1).fill(0));
    for (let i = 1; i <= oldLines.length; i++) {
      for (let j = 1; j <= newLines.length; j++) {
        if (oldLines[i - 1] === newLines[j - 1]) matrix[i][j] = matrix[i - 1][j - 1] + 1;
        else matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }

    const diff = [];
    let i = oldLines.length;
    let j = newLines.length;
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
      case 'image':
        return <img src={att.data} alt="预览" className="w-full h-full object-cover" />;
      case 'pdf':
        return <FileBadge icon={<FileText size={24} />} label="PDF" color="text-red-400" />;
      case 'word':
        return <FileBadge icon={<FileText size={24} />} label="WORD" color="text-blue-400" />;
      case 'excel':
        return <FileBadge icon={<FileSpreadsheet size={24} />} label="EXCEL" color="text-emerald-400" />;
      case 'markdown':
        return <FileBadge icon={<FileCode size={24} />} label="MD" color="text-amber-400" />;
      case 'json':
        return <FileBadge icon={<FileCode size={24} />} label="JSON" color="text-cyan-400" />;
      case 'text':
        return <FileBadge icon={<FileText size={24} />} label="TXT" color="text-slate-300" />;
      default:
        return <FileBadge icon={<FileIcon size={24} />} label="FILE" color="text-slate-500" />;
    }
  };

  return (
    <AppShell activeView={activeView} assetCount={assets.length} onViewChange={openView}>
      {renderActiveView()}

      {renderCompareDrawer()}
      {renderABTestDrawer()}
      {renderAssetEditor()}
      {renderChat()}
    </AppShell>
  );

  function renderActiveView() {
    switch (activeView) {
      case 'workspace':
        return (
          <PromptOpsWorkspace
            assets={assets}
            directions={allDirections}
            scenario={scenario}
            setAssets={setAssets}
            onOpenLibrary={() => openView('library')}
            onOpenBuilder={() => openView('builder')}
          />
        );
      case 'library':
        return renderLibrary();
      case 'packs':
        return (
          <CapabilityPacksView
            assets={assets}
            packs={capabilityPacks}
            onSave={saveCapabilityPack}
            onDelete={deleteCapabilityPack}
            onUse={useCapabilityPack}
            onImportAssets={(incomingAssets) => setAssets(previous => mergeImportedAssets(previous, incomingAssets))}
            onOpenBuilder={openBuilderForPackSlot}
          />
        );
      case 'builder':
        return (
          <BuilderWorkbench
            assets={assets}
            directions={allDirections}
            scenario={scenario}
            onAssetCreate={(asset) => {
              setAssets(previous => [asset, ...previous]);
              setLibraryNotice(`已从构建器保存资产：${asset.title}`);
            }}
          />
        );
      case 'runlab':
        return <RunLabWorkbench assets={assets} directions={allDirections} scenario={scenario} />;
      case 'feedback':
        return <FeedbackWorkbench assets={assets} directions={allDirections} scenario={scenario} setAssets={setAssets} />;
      case 'knowledge':
        return <KnowledgeBaseView />;
      case 'settings':
        return <SettingsView assetCount={assets.length} directionCount={allDirections.length} historyCount={history.length} />;
      case 'ops':
      default:
        return <OpsWorkbench assets={assets} directions={allDirections} scenario={scenario} />;
    }
  }

  function renderWorkspace() {
    return (
      <div className="flex h-full overflow-hidden">
        <aside className="w-80 border-r border-slate-800 bg-slate-950 flex-col overflow-hidden hidden lg:flex">
          <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1 custom-scrollbar">
            <SidebarSection title="使用场景">
              <div className="grid grid-cols-1 gap-2">
                {Object.values(ScenarioType).map(type => (
                  <button key={type} onClick={() => setScenario(type)} className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all border ${scenario === type ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    {type}<ChevronRight size={16} className={scenario === type ? 'opacity-100' : 'opacity-0'} />
                  </button>
                ))}
              </div>
            </SidebarSection>

            <SidebarSection title="输出风格">
              <div className="flex flex-wrap gap-2">
                {Object.values(StyleMode).map(mode => (
                  <button key={mode} onClick={() => setStyle(mode)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${style === mode ? 'bg-slate-100 text-slate-900 shadow-xl' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>{mode}</button>
                ))}
              </div>
            </SidebarSection>

            <SidebarSection title="执行模式">
              <div className="space-y-2">
                <ToggleRow label="深度思考" description="使用更强模型和更高思考预算" checked={useThinking} onChange={setUseThinking} />
                <ToggleRow label="联网检索" description="允许模型使用 Google Search grounding" checked={useSearch} onChange={setUseSearch} />
              </div>
            </SidebarSection>

            <SidebarSection title="历史项目">
              <div className="space-y-2">
                {history.length === 0 ? <p className="text-[10px] text-slate-600 italic">暂无记录...</p> : history.slice(0, 20).map(item => (
                  <div key={item.id} onClick={() => selectHistoryItem(item)} className={`group relative flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${activeHistoryId === item.id ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                    <div className="text-[11px] font-bold text-slate-300 truncate pr-6">{item.originalInput}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-500 flex items-center gap-1"><HistoryIcon size={10} /> {item.versions.length} 版本</span>
                      {item.versions[0]?.settings.selectedAssetIds?.length ? <span className="text-[9px] text-cyan-400">{item.versions[0].settings.selectedAssetIds?.length} 资产</span> : null}
                    </div>
                    <button onClick={(e) => deleteHistoryItem(item.id, e)} className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </SidebarSection>
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-slate-900/20 overflow-y-auto relative custom-scrollbar">
          <div className="max-w-6xl w-full mx-auto p-6 lg:p-8 flex flex-col gap-8 min-h-full">
            <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Plus className="text-cyan-300" size={20} /> 原始需求</h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf,.docx,.xls,.xlsx,.csv,.md,.markdown,.txt,.json,text/plain,text/markdown,application/json"
                    />
                    <label htmlFor="file-upload" className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-all border border-slate-700"><Plus size={14} /> 附件 ({attachments.length}/10)</label>
                    <button onClick={() => { setInput(''); setActiveHistoryId(null); setAttachments([]); setEditableResult(''); setSelectedAssetIds([]); }} className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 text-slate-400 hover:text-white transition-all"><RotateCcw size={14} /> 重置</button>
                  </div>
                </div>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="在此输入您的原始想法，项目库会自动推荐可复用资产..." className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl p-6 text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none shadow-inner" />
                <div className="flex flex-wrap gap-3">
                  {attachments.map(att => (
                    <div key={att.id} className="relative w-20 h-24 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 group flex flex-col">
                      <div className="flex-1 flex items-center justify-center relative bg-slate-950/50">
                        {renderAttachmentIcon(att)}
                        <button onClick={() => removeAttachment(att.id)} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"><X size={10} /></button>
                        {att.type === 'image' && <button onClick={() => handleImageEdit(att)} disabled={isEditingImage} className="absolute bottom-1 right-1 p-1 bg-slate-950/80 text-cyan-300 rounded-md opacity-0 group-hover:opacity-100"><Wand2 size={10} /></button>}
                      </div>
                      <div className="bg-slate-900 p-1 text-[8px] truncate text-center text-slate-400 border-t border-slate-800">{att.name}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button onClick={() => handleOptimization(false)} disabled={isOptimizing || (!input.trim() && attachments.length === 0)} className="h-12 px-10 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-lg font-bold flex items-center gap-2 transition-all shadow-xl shadow-cyan-500/10 active:scale-95">{isOptimizing ? <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : <Zap size={20} />}初次生成优化</button>
                </div>
              </div>

              <div className="space-y-4">
                {renderDirectionPanel()}
                {renderAssetInjectionPanel()}
              </div>
            </section>

            {activeEntry && currentVersion && renderResultWorkspace()}
          </div>
        </div>
      </div>
    );
  }

  function renderDirectionPanel() {
    return (
      <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2"><Target size={16} className="text-amber-300" /> 优化方向</h3>
          <span className="text-[10px] text-slate-500">{selectedDirectionIds.length} 已选</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {allDirections.map(direction => (
            <button key={direction.id} onClick={() => toggleDirection(direction.id)} className={`text-left px-3 py-2 rounded-lg border transition-all ${selectedDirectionIds.includes(direction.id) ? 'bg-amber-400/10 border-amber-300 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
              <div className="text-xs font-bold truncate">{direction.name}</div>
              <div className="text-[10px] opacity-70 line-clamp-2 mt-1">{direction.description}</div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customDirection} onChange={(e) => setCustomDirection(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-amber-300" placeholder="输入本次自定义优化方向" />
          <button onClick={addCustomDirectionPreset} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-200" title="保存为方向预设"><Save size={14} /></button>
        </div>
      </section>
    );
  }

  function renderAssetInjectionPanel() {
    return (
      <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2"><PackageOpen size={16} className="text-cyan-300" /> 资产注入</h3>
          <button onClick={() => openView('library')} className="text-[10px] text-cyan-300 hover:text-cyan-200 font-bold">管理项目库</button>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">推荐资产</div>
          {recommendedAssets.length === 0 ? (
            <div className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-lg p-3">暂无匹配资产。可先到项目库添加 Prompt、Skill、MCP 或 SDK。</div>
          ) : recommendedAssets.map(asset => (
            <AssetPickRow key={asset.id} asset={asset} selected={selectedAssetIds.includes(asset.id)} onClick={() => toggleAssetSelection(asset.id)} />
          ))}
        </div>
        {selectedAssets.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">已注入 ({selectedAssets.length}/8)</div>
            <div className="flex flex-wrap gap-2">
              {selectedAssets.map(asset => (
                <button key={asset.id} onClick={() => toggleAssetSelection(asset.id)} className="px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 text-[10px] font-bold">
                  {asset.title} ×
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderResultWorkspace() {
    return (
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        <div className="flex items-center justify-between border-t border-slate-800 pt-8 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Check className="text-emerald-400" size={20} /> 优化结果工作区</h2>
            {activeEntry!.versions.length > 1 && (
              <div className="flex items-center bg-slate-800 rounded-full px-2 py-1 border border-slate-700">
                <button disabled={activeVersionIndex >= activeEntry!.versions.length - 1} onClick={() => setActiveVersionIndex(v => v + 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-[10px] font-bold px-2 text-cyan-300">V{activeEntry!.versions.length - activeVersionIndex}</span>
                <button disabled={activeVersionIndex <= 0} onClick={() => setActiveVersionIndex(v => v - 1)} className="p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {activeEntry!.versions.length >= 2 && (
              <button onClick={openABTestModal} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-lg text-sm font-bold hover:bg-cyan-500/20 transition-all">
                <Split size={16} /> A/B 测试
              </button>
            )}
            {prevVersion && (
              <button onClick={() => setIsComparing(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm font-bold hover:bg-slate-700 transition-all hover:text-cyan-300">
                <GitCompare size={16} /> 版本对比
              </button>
            )}
            <button onClick={() => handleOptimization(true)} disabled={isRefining || !editableResult.trim()} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-sm font-bold hover:bg-cyan-500/30 transition-all">
              {isRefining ? <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" /> : <Wand2 size={16} />}二次优化精炼
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 space-y-4">
            <div className="relative group">
              <textarea value={editableResult} onChange={(e) => setEditableResult(e.target.value)} className="w-full min-h-[350px] bg-slate-950 border border-slate-800 rounded-xl p-8 text-slate-200 leading-relaxed font-mono text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all shadow-2xl resize-y" />
              <button
                onClick={() => copyToClipboard(editableResult)}
                className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg backdrop-blur-sm transition-all flex items-center gap-2 opacity-0 group-hover:opacity-100"
                title="一键复制"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span className="text-xs font-medium">{copied ? '已复制' : '一键复制'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Lightbulb size={16} className="text-amber-400" /> 针对性专家建议</h3>
                <button onClick={handleRefreshSuggestions} disabled={isRefreshingSugg} className="text-[10px] text-slate-500 hover:text-cyan-300 flex items-center gap-1 uppercase font-bold tracking-wider">
                  <RefreshCw size={12} className={isRefreshingSugg ? 'animate-spin' : ''} /> 刷新建议
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {currentSuggestions.map((sugg, i) => (
                  <button key={i} onClick={() => {
                    setSelectedSuggestions(prev => {
                      const next = new Set(prev);
                      if (next.has(sugg)) next.delete(sugg);
                      else next.add(sugg);
                      return next;
                    });
                  }} className={`text-left px-4 py-3 rounded-lg border text-xs transition-all flex items-start gap-3 ${selectedSuggestions.has(sugg) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    <div className={`mt-0.5 min-w-[14px] h-[14px] rounded border flex items-center justify-center ${selectedSuggestions.has(sugg) ? 'bg-cyan-500 border-cyan-500' : 'border-slate-700'}`}>
                      {selectedSuggestions.has(sugg) && <Check size={10} className="text-slate-950" />}
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
              {currentVersion!.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg animate-in fade-in duration-300">
                  <Check size={14} className="mt-1 text-emerald-500 shrink-0" /><span className="text-xs text-slate-300 leading-tight">{h}</span>
                </div>
              ))}
            </div>
            {(currentVersion!.settings.selectedAssetIds?.length || currentVersion!.settings.directions?.length) ? (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="text-xs font-bold text-slate-400">上下文记录</div>
                <div className="text-[11px] text-slate-500">资产: {currentVersion!.settings.selectedAssetIds?.length || 0}</div>
                <div className="text-[11px] text-slate-500">方向: {currentVersion!.settings.directions?.length || 0}</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  function renderLibrary() {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar bg-zinc-950">
        <PageHeader
          eyebrow="Asset Library"
          title="资产库"
          description="以能力状态、质量和使用记录管理 Prompt、Skill、MCP、SDK、Workflow 等可注入资产。"
          actions={
            <>
              <input id="asset-import" type="file" className="hidden" multiple onChange={handleAssetFileImport} accept=".md,.markdown,.txt,.json,.docx,.xls,.xlsx,.csv,text/plain,text/markdown,application/json" />
              <label htmlFor="asset-import" className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"><Upload size={16} /> 导入</label>
              <Button onClick={handleExportLibrary} icon={<Download size={16} />}>导出</Button>
              <Button variant="primary" onClick={() => setAssetDraft(createBlankAsset('prompt'))} icon={<Plus size={16} />}>新建资产</Button>
            </>
          }
        />

        <div className="max-w-7xl mx-auto p-4 lg:p-5 space-y-4">
          {libraryNotice && (
            <div className="flex items-center justify-between rounded-md border border-teal-900/60 bg-teal-950/30 px-4 py-3 text-sm text-teal-100">
              <span>{libraryNotice}</span>
              <button onClick={() => setLibraryNotice('')}><X size={16} /></button>
            </div>
          )}

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-zinc-200">外部链接导入</div>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">支持公开网页、GitHub 文档、API/SDK/MCP 文档链接。读取失败时会提示手动粘贴或文件导入。</p>
              </div>
              <div className="flex min-w-0 flex-1 gap-2">
                <input
                  value={assetUrlInput}
                  onChange={(event) => setAssetUrlInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleAssetUrlImport();
                  }}
                  className="field-input min-w-0"
                  placeholder="https://example.com/docs"
                />
                <Button onClick={handleAssetUrlImport} disabled={isImportingUrl || !assetUrlInput.trim()}>
                  {isImportingUrl ? '导入中' : '生成草稿'}
                </Button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
            <LibraryFilterSidebar
              directions={allDirections}
              librarySearch={librarySearch}
              libraryType={libraryType}
              libraryStatus={libraryStatus}
              onSearchChange={setLibrarySearch}
              onTypeChange={setLibraryType}
              onStatusChange={setLibraryStatus}
            />

            <section className="space-y-3 min-w-0">
              <div className="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{filteredAssets.length} / {assets.length} 资产</Badge>
                  <Badge tone="muted">后端优先 state</Badge>
                  <Badge tone="accent">能力状态分级</Badge>
                </div>
                <div className="flex rounded-md border border-zinc-800 bg-zinc-900 p-1">
                  <button onClick={() => setLibraryView('table')} className={`rounded px-3 py-1.5 text-xs font-semibold ${libraryView === 'table' ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-500 hover:text-zinc-200'}`}>表格</button>
                  <button onClick={() => setLibraryView('cards')} className={`rounded px-3 py-1.5 text-xs font-semibold ${libraryView === 'cards' ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-500 hover:text-zinc-200'}`}>卡片</button>
                </div>
              </div>
              {filteredAssets.length === 0 ? (
                <EmptyState title="没有匹配资产" description="调整类型、能力状态或搜索词，或新建一个资产。" action={<Button variant="primary" onClick={() => setAssetDraft(createBlankAsset('prompt'))}>新建资产</Button>} />
              ) : libraryView === 'table' ? renderAssetTable(filteredAssets) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 content-start">
                  {filteredAssets.map(asset => (
                    <AssetLibraryCard
                      key={asset.id}
                      asset={asset}
                      onEdit={setAssetDraft}
                      onDelete={deleteAsset}
                      onInject={injectAssetToWorkspace}
                    />
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    );
  }

  function renderAssetTable(items: PromptAsset[]) {
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-900 bg-zinc-950 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-bold">资产</th>
                <th className="px-4 py-3 font-bold">类型</th>
                <th className="px-4 py-3 font-bold">状态</th>
                <th className="px-4 py-3 font-bold">质量</th>
                <th className="px-4 py-3 font-bold">使用</th>
                <th className="px-4 py-3 font-bold">更新</th>
                <th className="px-4 py-3 text-right font-bold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {items.map(asset => (
                <tr key={asset.id} className="hover:bg-zinc-900/50">
                  <td className="max-w-[360px] px-4 py-3">
                    <div className="truncate font-semibold text-zinc-100">{asset.title || '未命名资产'}</div>
                    <div className="mt-1 line-clamp-1 text-xs text-zinc-500">{asset.summary || asset.integration.usageNotes || '暂无摘要'}</div>
                  </td>
                  <td className="px-4 py-3"><Badge tone="neutral">{ASSET_TYPE_LABELS[asset.type]}</Badge></td>
                  <td className="px-4 py-3"><StatusPill status={asset.status || inferAssetStatus(asset)} /></td>
                  <td className="px-4 py-3 text-zinc-400">{asset.qualityScore || estimateAssetQuality(asset)}%</td>
                  <td className="px-4 py-3 text-zinc-400">{asset.usageCount || 0}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{new Date(asset.updatedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button className="px-2 py-1 text-xs" onClick={() => injectAssetToWorkspace(asset.id)}>注入</Button>
                      <Button className="px-2 py-1 text-xs" onClick={() => setAssetDraft(asset)}>编辑</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderAssetEditor() {
    if (!assetDraft) return null;
    const format = ASSET_TYPE_FORMATS[assetDraft.type];
    const draftStatus = assetDraft.status || inferAssetStatus(assetDraft);
    const draftQuality = estimateAssetQuality(assetDraft);
    const completeness = getAssetCompleteness(assetDraft);
    const statusOptions: CapabilityStatus[] = ['context_only', 'schema_ready', 'testable', 'connected', 'executable'];
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-zinc-950/82 backdrop-blur-md" onClick={() => setAssetDraft(null)} />
        <div className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="border-b border-zinc-900 px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{ASSET_TYPE_LABELS[assetDraft.type]}</Badge>
                  <StatusPill status={draftStatus} />
                  <Badge tone="neutral">v{assetDraft.version || 1}</Badge>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-zinc-50">资产编辑器</h3>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-500">{format.name} · {format.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" onClick={() => applyCurrentAssetTemplate(false)}>补齐空字段</Button>
                <Button variant="ghost" onClick={() => applyCurrentAssetTemplate(true)}>重置模板</Button>
                <button onClick={() => setAssetDraft(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-900 hover:text-zinc-100"><X size={18} /></button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Field label="类型">
                    <select value={assetDraft.type} onChange={(e) => updateAssetDraftType(e.target.value as AssetType)} className="field-input">
                      {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map(type => <option key={type} value={type}>{ASSET_TYPE_LABELS[type]}</option>)}
                    </select>
                  </Field>
                  <Field label="标题">
                    <input value={assetDraft.title} onChange={(e) => setAssetDraft({ ...assetDraft, title: e.target.value })} className="field-input" placeholder={format.titlePlaceholder} />
                  </Field>
                  <Field label="摘要">
                    <textarea value={assetDraft.summary} onChange={(e) => setAssetDraft({ ...assetDraft, summary: e.target.value })} className="field-input min-h-[78px]" placeholder={format.summaryPlaceholder} />
                  </Field>
                  <Field label="标签">
                    <input value={listToText(assetDraft.tags)} onChange={(e) => setAssetDraft({ ...assetDraft, tags: parseList(e.target.value) })} className="field-input" placeholder={format.tagsPlaceholder} />
                  </Field>
                  <Field label={format.useCasesLabel}>
                    <textarea value={assetDraft.useCases.join('\n')} onChange={(e) => setAssetDraft({ ...assetDraft, useCases: parseList(e.target.value) })} className="field-input min-h-[88px]" placeholder={format.useCasesPlaceholder} />
                  </Field>
                  <Field label="能力状态">
                    <select value={draftStatus} onChange={(e) => setAssetDraft({ ...assetDraft, status: e.target.value as CapabilityStatus })} className="field-input">
                      {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </Field>
                </div>

                {renderAssetArchitecture(assetDraft)}

                <Field label={format.examplesLabel}>
                  <textarea value={assetDraft.examples.join('\n---\n')} onChange={(e) => setAssetDraft({ ...assetDraft, examples: e.target.value.split(/\n---\n/).map(item => item.trim()).filter(Boolean) })} className="field-input min-h-[96px]" placeholder={format.examplesPlaceholder} />
                </Field>
                <Field label={format.contentLabel}>
                  <textarea value={assetDraft.content} onChange={(e) => setAssetDraft({ ...assetDraft, content: e.target.value })} className="field-input min-h-[200px] font-mono" placeholder={format.contentPlaceholder} />
                </Field>
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">保存前检查</div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                        <span>完整度</span>
                        <span>{completeness}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${completeness}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                        <span>质量估算</span>
                        <span>{draftQuality}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-900">
                        <div className="h-full rounded-full bg-zinc-300" style={{ width: `${draftQuality}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <InfoMini label="能力" value={`${assetDraft.integration.capabilities.length}`} />
                    <InfoMini label="示例" value={`${assetDraft.examples.length}`} />
                    <InfoMini label="用例" value={`${assetDraft.useCases.length}`} />
                    <InfoMini label="使用" value={`${assetDraft.usageCount || 0}`} />
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{format.name} 规格</div>
                  <div className="mt-3 space-y-2">
                    {format.formatBullets.map(item => (
                      <div key={item} className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-relaxed text-zinc-400">{item}</div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-amber-900/50 bg-amber-950/15 p-4 text-xs leading-relaxed text-amber-100/80">
                  MCP、SDK、Tool、Connector 默认只作为工程上下文参与编译。只有状态达到可执行，并由用户显式确认时，后续版本才允许真实调用。
                </div>
              </aside>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-900 px-5 py-4">
            <Button variant="ghost" onClick={() => setAssetDraft(null)}>取消</Button>
            <Button variant="primary" onClick={saveAssetDraft} icon={<Save size={16} />}>保存资产</Button>
          </div>
        </div>
      </div>
    );
  }

  function renderAssetArchitecture(asset: PromptAsset) {
    const schema = normalizeAssetSchema(asset.type, asset.schema);
    switch (asset.type) {
      case 'prompt':
        return renderPromptArchitecture(schema as PromptAssetSchema);
      case 'skill':
        return renderSkillArchitecture(schema as SkillAssetSchema);
      case 'mcp':
        return renderMcpArchitecture(schema as McpAssetSchema);
      case 'sdk':
        return renderSdkArchitecture(schema as SdkAssetSchema);
      case 'workflow':
        return renderWorkflowArchitecture(schema as WorkflowAssetSchema);
      case 'reference':
        return renderReferenceArchitecture(schema as ReferenceAssetSchema);
      case 'agent':
        return renderGenericArchitecture(asset.type, 'Agent 架构组成', 'Agent 是带身份、目标、工具、记忆、计划和停止条件的执行体。', schema as AgentAssetSchema);
      case 'tool':
        return renderGenericArchitecture(asset.type, 'Tool 架构组成', 'Tool 是单个轻量可调用能力，重点是参数、返回、前置条件、副作用和失败回退。', schema as ToolAssetSchema);
      case 'template':
        return renderGenericArchitecture(asset.type, 'Template 架构组成', 'Template 是结构骨架和变量槽位，服务于 Prompt、文档和流程复用。', schema as TemplateAssetSchema);
      case 'evaluator':
        return renderGenericArchitecture(asset.type, 'Evaluator 架构组成', 'Evaluator 用于评估输出，包含维度、评分标准、阈值和审查模式。', schema as EvaluatorAssetSchema);
      case 'dataset':
        return renderGenericArchitecture(asset.type, 'Dataset 架构组成', 'Dataset 保存 few-shot 样例、正反例、标签和质量备注。', schema as DatasetAssetSchema);
      case 'policy':
        return renderGenericArchitecture(asset.type, 'Policy 架构组成', 'Policy/Guardrail 保存规则、触发、执行、升级和拒答风格。', schema as PolicyAssetSchema);
      case 'memory':
        return renderGenericArchitecture(asset.type, 'Memory 架构组成', 'Memory 保存长期事实、偏好、项目约定、可信度和失效规则。', schema as MemoryAssetSchema);
      case 'connector':
        return renderGenericArchitecture(asset.type, 'Connector 架构组成', 'Connector 描述外部系统连接、认证、端点、权限和数据边界。', schema as ConnectorAssetSchema);
      case 'parser':
        return renderGenericArchitecture(asset.type, 'Parser 架构组成', 'Parser/Extractor 描述输入类型、提取字段、清洗、输出 schema 和失败处理。', schema as ParserAssetSchema);
      case 'benchmark':
        return renderGenericArchitecture(asset.type, 'Benchmark 架构组成', 'Benchmark 记录测试任务、输入、期望输出、指标和回归记录。', schema as BenchmarkAssetSchema);
    }
  }

  function renderPromptArchitecture(schema: PromptAssetSchema) {
    const update = (patch: Partial<PromptAssetSchema>) => updateAssetSchema({ ...schema, ...patch });
    return (
      <ArchitectureBox title="Prompt 架构组成" description="Prompt 不是普通文本，它由角色、上下文、任务、变量、约束、输出契约和评价标准组成。">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="角色">
            <input value={schema.role} onChange={(e) => update({ role: e.target.value })} className="field-input" placeholder="提示词要求模型扮演的角色" />
          </Field>
          <Field label="任务">
            <input value={schema.task} onChange={(e) => update({ task: e.target.value })} className="field-input" placeholder="提示词要稳定完成的核心任务" />
          </Field>
          <Field label="上下文">
            <textarea value={schema.context} onChange={(e) => update({ context: e.target.value })} className="field-input min-h-[96px]" placeholder="背景、业务场景、目标用户、已有资料" />
          </Field>
          <Field label="输出契约">
            <textarea value={schema.outputFormat} onChange={(e) => update({ outputFormat: e.target.value })} className="field-input min-h-[96px]" placeholder="格式、字段、语言、长度、结构" />
          </Field>
          {renderListEditor('变量', schema.variables, value => update({ variables: value }), '{{输入}}\n{{目标}}\n{{资料}}')}
          {renderListEditor('约束', schema.constraints, value => update({ constraints: value }), '不能编造\n必须先澄清缺失信息')}
          {renderListEditor('评价标准', schema.evaluationCriteria, value => update({ evaluationCriteria: value }), '准确性\n完整性\n可执行性')}
          {renderListEditor('反模式', schema.antiPatterns, value => update({ antiPatterns: value }), '不要输出空泛建议\n不要忽略用户附件')}
        </div>
      </ArchitectureBox>
    );
  }

  function renderSkillArchitecture(schema: SkillAssetSchema) {
    const update = (patch: Partial<SkillAssetSchema>) => updateAssetSchema({ ...schema, ...patch });
    const updateTrigger = (patch: Partial<SkillAssetSchema['trigger']>) => update({ trigger: { ...schema.trigger, ...patch } });
    const updateResources = (patch: Partial<SkillAssetSchema['resources']>) => update({ resources: { ...schema.resources, ...patch } });

    return (
      <ArchitectureBox title="Skill 架构组成" description="Skill 是能力包：入口是 SKILL.md，复杂内容渐进加载到 references/scripts/assets/agents/mcp，并有触发策略、边界和验证。">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="触发描述">
            <textarea value={schema.trigger.description} onChange={(e) => updateTrigger({ description: e.target.value })} className="field-input min-h-[90px]" placeholder="什么时候应该使用这个 Skill" />
          </Field>
          {renderListEditor('显式触发', schema.trigger.explicitInvocations, value => updateTrigger({ explicitInvocations: value }), '$skill-name\n使用 xxx skill')}
          {renderListEditor('隐式触发信号', schema.trigger.implicitSignals, value => updateTrigger({ implicitSignals: value }), '用户提到具体任务/文件/工具/错误场景')}
          {renderListEditor('避免触发', schema.trigger.avoidWhen, value => updateTrigger({ avoidWhen: value }), '任务太泛\n不属于该能力边界')}
          {renderListEditor('目录结构', schema.packageStructure, value => update({ packageStructure: value }), 'SKILL.md\nreferences/\nscripts/\nassets/\nagents/openai.yaml\nmcp/')}
          <Field label="SKILL.md 职责">
            <textarea value={schema.resources.skillMd} onChange={(e) => updateResources({ skillMd: e.target.value })} className="field-input min-h-[90px]" placeholder="精简入口：触发、边界、流程、资源索引、验证说明" />
          </Field>
          {renderListEditor('references 资料', schema.resources.references, value => updateResources({ references: value }), 'architecture.md\nexamples.md\nschema.md')}
          {renderListEditor('scripts 脚本', schema.resources.scripts, value => updateResources({ scripts: value }), 'validate_skill.py\nscaffold.ts')}
          {renderListEditor('assets 素材', schema.resources.assets, value => updateResources({ assets: value }), 'templates/\nexamples/\nimages/')}
          {renderListEditor('agents 配置', schema.resources.agents, value => updateResources({ agents: value }), 'agents/openai.yaml\n禁用隐式触发策略')}
          {renderListEditor('mcp 接入', schema.resources.mcp, value => updateResources({ mcp: value }), 'mcp/server/\nmcp/config/\n工具规格')}
          {renderListEditor('执行流程', schema.workflow, value => update({ workflow: value }), '判断触发\n读取必要 references\n执行脚本或生成输出\n验证结果')}
          {renderListEditor('能力边界', schema.boundaries, value => update({ boundaries: value }), '不处理哪些任务\n什么时候需要澄清')}
          {renderListEditor('验证方式', schema.validation, value => update({ validation: value }), '结构校验\n输出验收\n示例回归')}
          {renderListEditor('交接/组合', schema.handoff, value => update({ handoff: value }), '交给其他 Skill\n路由到 MCP\n请求用户确认')}
        </div>
      </ArchitectureBox>
    );
  }

  function renderMcpArchitecture(schema: McpAssetSchema) {
    const update = (patch: Partial<McpAssetSchema>) => updateAssetSchema({ ...schema, ...patch });
    const updateServer = (patch: Partial<McpAssetSchema['server']>) => update({ server: { ...schema.server, ...patch } });
    const updateTool = (index: number, patch: Partial<McpAssetSchema['tools'][number]>) => {
      const tools = schema.tools.map((tool, i) => i === index ? { ...tool, ...patch } : tool);
      update({ tools });
    };

    return (
      <ArchitectureBox title="MCP 架构组成" description="MCP 是可注册的外部能力：server 提供 tools/resources/prompts，工具要有 schema、注解、错误处理、安全边界和评测。">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Server 名称">
            <input value={schema.server.name} onChange={(e) => updateServer({ name: e.target.value })} className="field-input" placeholder="例如 github-mcp" />
          </Field>
          <Field label="Transport">
            <select value={schema.server.transport} onChange={(e) => updateServer({ transport: e.target.value as McpAssetSchema['server']['transport'] })} className="field-input">
              <option value="unknown">unknown</option>
              <option value="stdio">stdio</option>
              <option value="streamable-http">streamable-http</option>
              <option value="sse">sse</option>
            </select>
          </Field>
          <Field label="Runtime">
            <input value={schema.server.runtime} onChange={(e) => updateServer({ runtime: e.target.value })} className="field-input" placeholder="TypeScript / Python / remote service" />
          </Field>
          <Field label="Auth">
            <input value={schema.server.auth} onChange={(e) => updateServer({ auth: e.target.value })} className="field-input" placeholder="env var / OAuth / none" />
          </Field>
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-500">Tools</div>
              <button onClick={() => update({ tools: [...schema.tools, { name: '', description: '', inputSchema: '', outputSchema: '', annotations: [] }] })} className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-800">添加 Tool</button>
            </div>
            {schema.tools.map((tool, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 lg:grid-cols-2">
                <Field label="Tool 名称"><input value={tool.name} onChange={(e) => updateTool(index, { name: e.target.value })} className="field-input" placeholder="github_list_pull_requests" /></Field>
                <Field label="描述"><input value={tool.description} onChange={(e) => updateTool(index, { description: e.target.value })} className="field-input" placeholder="这个工具完成什么任务" /></Field>
                <Field label="Input Schema"><textarea value={tool.inputSchema} onChange={(e) => updateTool(index, { inputSchema: e.target.value })} className="field-input min-h-[80px] font-mono" placeholder="{ owner, repo, pullNumber }" /></Field>
                <Field label="Output Schema"><textarea value={tool.outputSchema} onChange={(e) => updateTool(index, { outputSchema: e.target.value })} className="field-input min-h-[80px] font-mono" placeholder="{ comments, status }" /></Field>
                {renderListEditor('Annotations', tool.annotations, value => updateTool(index, { annotations: value }), 'readOnlyHint: true\nidempotentHint: true')}
              </div>
            ))}
          </div>
          {renderListEditor('Resources', schema.resources, value => update({ resources: value }), 'resource uri / 数据资源')}
          {renderListEditor('Prompts', schema.prompts, value => update({ prompts: value }), 'mcp prompt 模板')}
          {renderListEditor('错误处理', schema.errorHandling, value => update({ errorHandling: value }), '参数缺失时返回可操作错误\n分页过大时提示缩小范围')}
          {renderListEditor('安全边界', schema.security, value => update({ security: value }), '密钥只来自环境变量\n破坏性操作需要确认')}
          {renderListEditor('评测问题', schema.evaluations, value => update({ evaluations: value }), '独立可验证的真实任务问题')}
        </div>
      </ArchitectureBox>
    );
  }

  function renderSdkArchitecture(schema: SdkAssetSchema) {
    const update = (patch: Partial<SdkAssetSchema>) => updateAssetSchema({ ...schema, ...patch });
    const updatePackage = (patch: Partial<SdkAssetSchema['package']>) => update({ package: { ...schema.package, ...patch } });
    const updateMethod = (index: number, patch: Partial<SdkAssetSchema['coreMethods'][number]>) => {
      const coreMethods = schema.coreMethods.map((method, i) => i === index ? { ...method, ...patch } : method);
      update({ coreMethods });
    };

    return (
      <ArchitectureBox title="SDK 架构组成" description="SDK 是可被开发者接入的代码能力：需要包、安装、初始化、认证、核心方法、参数返回、错误和测试。">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="包名"><input value={schema.package.name} onChange={(e) => updatePackage({ name: e.target.value })} className="field-input" placeholder="@vendor/sdk" /></Field>
          <Field label="语言"><input value={schema.package.language} onChange={(e) => updatePackage({ language: e.target.value })} className="field-input" placeholder="TypeScript / Python" /></Field>
          <Field label="版本"><input value={schema.package.version} onChange={(e) => updatePackage({ version: e.target.value })} className="field-input" placeholder="^1.0.0" /></Field>
          <Field label="安装命令"><input value={schema.package.install} onChange={(e) => updatePackage({ install: e.target.value })} className="field-input" placeholder="npm install ..." /></Field>
          <Field label="初始化"><textarea value={schema.initialization} onChange={(e) => update({ initialization: e.target.value })} className="field-input min-h-[90px] font-mono" placeholder="client 初始化代码或配置" /></Field>
          <Field label="认证"><textarea value={schema.auth} onChange={(e) => update({ auth: e.target.value })} className="field-input min-h-[90px]" placeholder="API key / OAuth / 环境变量 / 权限边界" /></Field>
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-500">核心方法</div>
              <button onClick={() => update({ coreMethods: [...schema.coreMethods, { name: '', purpose: '', parameters: [], returns: [], errors: [] }] })} className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-800">添加方法</button>
            </div>
            {schema.coreMethods.map((method, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 lg:grid-cols-2">
                <Field label="方法名"><input value={method.name} onChange={(e) => updateMethod(index, { name: e.target.value })} className="field-input" placeholder="client.responses.create" /></Field>
                <Field label="用途"><input value={method.purpose} onChange={(e) => updateMethod(index, { purpose: e.target.value })} className="field-input" placeholder="生成结构化输出" /></Field>
                {renderListEditor('参数', method.parameters, value => updateMethod(index, { parameters: value }), 'model: string\ninput: string')}
                {renderListEditor('返回', method.returns, value => updateMethod(index, { returns: value }), 'id: string\noutput_text: string')}
                {renderListEditor('错误', method.errors, value => updateMethod(index, { errors: value }), '401 Unauthorized\n429 Rate limited')}
              </div>
            ))}
          </div>
          {renderListEditor('代码示例', schema.examples, value => update({ examples: value }), '```ts\n...\n```')}
          {renderListEditor('兼容性', schema.compatibility, value => update({ compatibility: value }), 'Node >= 20\nBrowser 不可暴露密钥')}
          {renderListEditor('测试方式', schema.testing, value => update({ testing: value }), 'mock client\n集成测试\n错误分支测试')}
        </div>
      </ArchitectureBox>
    );
  }

  function renderWorkflowArchitecture(schema: WorkflowAssetSchema) {
    const update = (patch: Partial<WorkflowAssetSchema>) => updateAssetSchema({ ...schema, ...patch });
    const updateStage = (index: number, patch: Partial<WorkflowAssetSchema['stages'][number]>) => {
      const stages = schema.stages.map((stage, i) => i === index ? { ...stage, ...patch } : stage);
      update({ stages });
    };

    return (
      <ArchitectureBox title="Workflow 架构组成" description="Workflow 是可编排流程：由目标、参与者、触发器、输入、阶段、状态、失败处理和最终输出组成。">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="流程目标"><textarea value={schema.goal} onChange={(e) => update({ goal: e.target.value })} className="field-input min-h-[90px]" placeholder="这个流程最终要稳定完成什么" /></Field>
          {renderListEditor('参与者', schema.actors, value => update({ actors: value }), '用户\nAgent\nReviewer\n外部系统')}
          {renderListEditor('触发器', schema.triggers, value => update({ triggers: value }), '用户提交资料\n定时任务\n上游节点完成')}
          {renderListEditor('输入', schema.inputs, value => update({ inputs: value }), 'sourceFiles\nrequirements\nconfig')}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-500">阶段 / 节点</div>
              <button onClick={() => update({ stages: [...schema.stages, { name: '', objective: '', actions: [], outputs: [], qualityGate: [] }] })} className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-800">添加阶段</button>
            </div>
            {schema.stages.map((stage, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 lg:grid-cols-2">
                <Field label="阶段名"><input value={stage.name} onChange={(e) => updateStage(index, { name: e.target.value })} className="field-input" placeholder="parse_materials" /></Field>
                <Field label="阶段目标"><input value={stage.objective} onChange={(e) => updateStage(index, { objective: e.target.value })} className="field-input" placeholder="解析并标准化输入资料" /></Field>
                {renderListEditor('动作', stage.actions, value => updateStage(index, { actions: value }), '读取文件\n抽取表格\n生成结构化数据')}
                {renderListEditor('输出', stage.outputs, value => updateStage(index, { outputs: value }), 'parsedData\nvalidationLog')}
                {renderListEditor('质量门', stage.qualityGate, value => updateStage(index, { qualityGate: value }), '字段齐全\n失败原因可追踪')}
              </div>
            ))}
          </div>
          {renderListEditor('状态', schema.state, value => update({ state: value }), 'pending\nrunning\nblocked\ndone')}
          {renderListEditor('失败处理', schema.failureHandling, value => update({ failureHandling: value }), '返回失败阶段\n记录原始错误\n允许重试')}
          {renderListEditor('最终输出', schema.finalOutputs, value => update({ finalOutputs: value }), 'report.docx\nsummary\nvalidationLog')}
        </div>
      </ArchitectureBox>
    );
  }

  function renderReferenceArchitecture(schema: ReferenceAssetSchema) {
    const update = (patch: Partial<ReferenceAssetSchema>) => updateAssetSchema({ ...schema, ...patch });
    return (
      <ArchitectureBox title="Reference 架构组成" description="Reference 是知识来源，不是工具：它由来源、版本、范围、事实、术语、引用规则、限制和时效组成。">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="来源"><input value={schema.source} onChange={(e) => update({ source: e.target.value })} className="field-input" placeholder="标准名、论文、网页、内部文档" /></Field>
          <Field label="版本"><input value={schema.version} onChange={(e) => update({ version: e.target.value })} className="field-input" placeholder="版本号 / 日期 / commit" /></Field>
          <Field label="范围"><textarea value={schema.scope} onChange={(e) => update({ scope: e.target.value })} className="field-input min-h-[90px]" placeholder="这份参考资料覆盖什么、不覆盖什么" /></Field>
          <Field label="时效"><textarea value={schema.freshness} onChange={(e) => update({ freshness: e.target.value })} className="field-input min-h-[90px]" placeholder="是否可能过期、何时需要重新确认" /></Field>
          {renderListEditor('关键事实', schema.keyFacts, value => update({ keyFacts: value }), '事实 1\n事实 2')}
          {renderListEditor('术语', schema.terminology, value => update({ terminology: value }), '术语: 定义')}
          {renderListEditor('引用规则', schema.citationRules, value => update({ citationRules: value }), '必须标明来源\n不可超出原文范围')}
          {renderListEditor('限制', schema.limitations, value => update({ limitations: value }), '不是实时信息\n不能替代法律/医学建议')}
        </div>
      </ArchitectureBox>
    );
  }

  function renderGenericArchitecture(type: AssetType, title: string, description: string, schema: AssetSchema) {
    const schemaRecord = schema as unknown as Record<string, unknown>;
    const update = (key: string, value: unknown) => {
      updateAssetSchema({ ...schemaRecord, [key]: value } as unknown as AssetSchema);
    };

    return (
      <ArchitectureBox title={title} description={description}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(schemaRecord).map(([key, value]) => {
            const fieldFormat = getAssetSchemaFieldFormat(type, key);
            const label = fieldFormat.label;
            if (Array.isArray(value)) {
              return (
                <React.Fragment key={key}>
                  {renderListEditor(label, value.map(item => String(item)), next => update(key, next), fieldFormat.placeholder)}
                </React.Fragment>
              );
            }
            if (typeof value === 'string') {
              if (fieldFormat.options?.length) {
                return (
                  <Field key={key} label={label}>
                    <select value={value} onChange={(e) => update(key, e.target.value)} className="field-input">
                      {fieldFormat.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                );
              }
              return (
                <Field key={key} label={label}>
                  <textarea value={value} onChange={(e) => update(key, e.target.value)} className="field-input min-h-[92px]" placeholder={fieldFormat.placeholder} />
                </Field>
              );
            }
            return (
              <Field key={key} label={label}>
                <textarea value={JSON.stringify(value, null, 2)} onChange={(e) => {
                  try {
                    update(key, JSON.parse(e.target.value));
                  } catch {
                    update(key, e.target.value);
                  }
                }} className="field-input min-h-[120px] font-mono" placeholder={fieldFormat.placeholder} />
              </Field>
            );
          })}
        </div>
      </ArchitectureBox>
    );
  }

  function renderListEditor(label: string, items: string[], onChange: (items: string[]) => void, placeholder: string) {
    return (
      <Field label={label}>
        <textarea value={items.join('\n')} onChange={(e) => onChange(parseList(e.target.value))} className="field-input min-h-[92px]" placeholder={placeholder} />
      </Field>
    );
  }

  function renderCompareDrawer() {
    if (!isComparing || !prevVersion || !currentVersion || !activeEntry) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-end">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsComparing(false)} />
        <div className="relative w-full max-w-4xl h-full bg-slate-900 border-l border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-300 border border-cyan-500/20"><GitCompare size={24} /></div>
              <div>
                <h2 className="text-xl font-bold">版本变更追踪 (V{activeEntry.versions.length - activeVersionIndex - 1} → V{activeEntry.versions.length - activeVersionIndex})</h2>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">基于 LCS 差异算法渲染</p>
              </div>
            </div>
            <button onClick={() => setIsComparing(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/40 p-8">
            <div className="font-mono text-sm leading-relaxed border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30 shadow-2xl">
              <div className="divide-y divide-slate-800/30">
                {renderDiff(prevVersion.optimized, currentVersion.optimized)}
              </div>
            </div>
          </div>
          <div className="p-8 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <p className="text-xs text-slate-500">差异对比结果仅供参考，您可以继续在工作台中手动微调。</p>
            <button onClick={() => setIsComparing(false)} className="px-8 py-3 bg-slate-100 text-slate-900 rounded-lg font-bold hover:bg-white transition-all shadow-lg active:scale-95">返回工作台</button>
          </div>
        </div>
      </div>
    );
  }

  function renderABTestDrawer() {
    if (!isABTestOpen || !activeEntry) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-end">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsABTestOpen(false)} />
        <div className="relative w-full max-w-5xl h-full bg-slate-900 border-l border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-300 border border-cyan-500/20"><Split size={24} /></div>
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
                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><PackageOpen size={18} className="text-cyan-300" /> 1. 选择参与测试的版本 (2-4个)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {activeEntry.versions.map((v, idx) => {
                      const vNum = activeEntry.versions.length - idx;
                      const isSelected = abTestSelectedVersions.includes(v.id);
                      return (
                        <div key={v.id} onClick={() => toggleABTestVersion(v.id)} className={`p-4 rounded-lg border cursor-pointer transition-all flex gap-3 ${isSelected ? 'bg-cyan-500/10 border-cyan-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                          <div className={`mt-0.5 min-w-[18px] h-[18px] rounded border flex items-center justify-center ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-700'}`}>
                            {isSelected && <Check size={12} className="text-slate-950" />}
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

                <section className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Target size={18} className="text-emerald-400" /> 2. 设定测试场景</h3>
                  <textarea value={abTestInput} onChange={(e) => setAbTestInput(e.target.value)} placeholder="例如：请帮我写一篇关于人工智能未来发展的短文，字数500字左右。" className="w-full h-32 bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none" />
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><BrainCircuit size={18} className="text-amber-400" /> 3. 设定评估指标</h3>
                    <button onClick={addMetric} className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 font-bold"><Plus size={14} /> 添加指标</button>
                  </div>
                  <div className="space-y-3">
                    {abTestMetrics.map(metric => (
                      <div key={metric.id} className="flex gap-3 items-start p-4 bg-slate-900 border border-slate-800 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input type="text" value={metric.name} onChange={(e) => updateMetric(metric.id, 'name', e.target.value)} placeholder="指标名称" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500" />
                          <select value={metric.type} onChange={(e) => updateMetric(metric.id, 'type', e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500">
                            <option value="score">AI 智能打分 (0-100)</option>
                            <option value="keyword">关键词命中率</option>
                            <option value="custom">自定义评估</option>
                          </select>
                          {metric.type === 'keyword' ? (
                            <input type="text" value={metric.keywords?.join(', ') || ''} onChange={(e) => updateMetric(metric.id, 'keywords', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="关键词列表，用逗号分隔" className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500" />
                          ) : (
                            <input type="text" value={metric.description || ''} onChange={(e) => updateMetric(metric.id, 'description', e.target.value)} placeholder="指标详细描述，指导 AI 如何打分" className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500" />
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
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-cyan-200 mb-4 flex items-center gap-2"><Sparkles size={20} /> AI 综合评估报告</h3>
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{abTestReport.summary}</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {abTestReport.results.map(result => (
                    <div key={result.versionId} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
                        <h4 className="font-bold text-slate-200">版本 V{result.versionIndex}</h4>
                        <div className="flex gap-2">
                          {abTestReport.metrics.filter(m => m.type === 'score').map(m => (
                            <div key={m.id} className="px-2 py-1 bg-slate-950 rounded-md text-[10px] font-bold text-cyan-300 border border-slate-700">
                              {m.name}: {result.scores[m.id] || 0}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 flex-1 space-y-6">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">生成结果</div>
                          <div className="text-sm text-slate-300 bg-slate-950 p-4 rounded-lg border border-slate-800 h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap">{result.output}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">AI 独立评价</div>
                          <div className="text-xs text-slate-400 italic bg-slate-900/50 p-3 rounded-lg border border-slate-800">{result.evaluation || '无评价'}</div>
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
                <button onClick={handleRunABTest} disabled={isABTesting || abTestSelectedVersions.length < 2 || !abTestInput.trim()} className="px-8 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  {isABTesting ? <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : <Split size={18} />}
                  {isABTesting ? '正在运行测试...' : '开始 A/B 测试'}
                </button>
              </>
            ) : (
              <button onClick={() => setAbTestReport(null)} className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-all">重新测试</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderChat() {
    return (
      <div className={`fixed bottom-5 right-5 z-50 transition-all duration-300 ${isChatOpen ? 'h-[500px] w-[380px] max-w-[calc(100vw-2rem)]' : 'h-11 w-11'}`}>
        {isChatOpen ? (
          <div className="flex h-full flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-900 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100"><MessageSquare size={18} className="text-teal-300" />需求协助</div>
              <button onClick={() => setIsChatOpen(false)} className="text-zinc-500 hover:text-zinc-100"><X size={18} /></button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto bg-zinc-950 p-4 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg border px-4 py-2 text-sm ${msg.role === 'user' ? 'border-teal-800 bg-teal-950/50 text-teal-50' : 'border-zinc-800 bg-zinc-900 text-zinc-200'}`}>{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2 border-t border-zinc-900 bg-zinc-950 p-4">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-teal-600" placeholder="提问..." />
              <button onClick={handleSendChat} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-teal-300 hover:bg-zinc-800"><Send size={18} /></button>
            </div>
          </div>
        ) : (
          <button onClick={() => setIsChatOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-teal-300 shadow-lg transition-colors hover:bg-zinc-800"><MessageSquare size={19} /></button>
        )}
      </div>
    );
  }
};

const SidebarSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">{title}</h3>
    {children}
  </div>
);

const ToggleRow = ({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) => (
  <button onClick={() => onChange(!checked)} className={`w-full text-left p-3 rounded-lg border transition-all ${checked ? 'bg-cyan-500/10 border-cyan-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-slate-200">{label}</span>
      <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </span>
    </div>
    <div className="text-[10px] text-slate-500 mt-1">{description}</div>
  </button>
);

const AssetPickRow: React.FC<{ asset: PromptAsset; selected: boolean; onClick: () => void }> = ({ asset, selected, onClick }) => (
  <button onClick={onClick} className={`w-full text-left p-3 rounded-lg border transition-all flex gap-3 ${selected ? 'bg-cyan-500/10 border-cyan-500 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
    <div className={`mt-0.5 min-w-[16px] h-4 rounded border flex items-center justify-center ${selected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-700'}`}>
      {selected && <Check size={10} className="text-slate-950" />}
    </div>
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-cyan-300">{ASSET_TYPE_LABELS[asset.type]}</span>
        <span className="text-xs font-bold truncate">{asset.title}</span>
      </div>
      <div className="text-[10px] opacity-70 line-clamp-2 mt-1">{asset.summary || asset.content || '暂无摘要'}</div>
    </div>
  </button>
);

const FileBadge = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
  <div className={`w-full h-full flex flex-col items-center justify-center bg-slate-900 ${color}`}>
    {icon}
    <span className="text-[8px] font-bold mt-1 uppercase">{label}</span>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-2">
    <span className="text-xs font-semibold text-zinc-400">{label}</span>
    {children}
  </label>
);

const InfoMini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border border-zinc-800 bg-zinc-950 p-2">
    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">{label}</div>
    <div className="mt-1 text-sm font-semibold text-zinc-100">{value}</div>
  </div>
);

const inferAssetStatus = (asset: PromptAsset): CapabilityStatus => {
  if (asset.status) return asset.status;
  if (['mcp', 'sdk', 'tool', 'connector'].includes(asset.type)) return asset.schema ? 'schema_ready' : 'context_only';
  if (asset.schema && asset.integration.capabilities.length > 0) return 'schema_ready';
  return 'context_only';
};

const estimateAssetQuality = (asset: PromptAsset): number => {
  if (typeof asset.qualityScore === 'number') return asset.qualityScore;
  let score = 45;
  if (asset.title.trim()) score += 8;
  if (asset.summary.trim()) score += 8;
  if (asset.content.trim().length > 120) score += 12;
  if (asset.schema) score += 10;
  if (asset.examples.length > 0) score += 6;
  if (asset.integration.capabilities.length > 0) score += 6;
  return Math.min(96, score);
};

const getAssetCompleteness = (asset: PromptAsset): number => {
  const checks = [
    asset.title.trim(),
    asset.summary.trim(),
    asset.content.trim(),
    asset.tags.length > 0,
    asset.useCases.length > 0,
    asset.examples.length > 0,
    asset.integration.entryName.trim(),
    asset.integration.capabilities.length > 0,
    asset.integration.inputs.length > 0,
    asset.integration.outputs.length > 0,
    asset.integration.constraints.length > 0,
    asset.schema
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};

const ArchitectureBox = ({ title, description, children }: { title: string; description: string; children: React.ReactNode }) => (
  <section className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
    <div>
      <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
    </div>
    {children}
  </section>
);

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const mergeDirections = (current: OptimizationDirection[], incoming: OptimizationDirection[]) => {
  const byId = new Map(current.map(direction => [direction.id, direction]));
  incoming.forEach(direction => byId.set(direction.id, { ...direction, builtIn: false }));
  return Array.from(byId.values());
};

export default App;
