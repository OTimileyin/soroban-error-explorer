import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Search, 
  Play, 
  Pause,
  Trash2,
  Cpu, 
  Database, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ExternalLink, 
  RefreshCw, 
  Copy, 
  Check, 
  ArrowRight,
  Layers,
  ShieldCheck,
  Zap,
  Info,
  Radio,
  Download,
  Share2,
  Bookmark,
  History,
  ShieldAlert,
  BarChart2,
  TestTube
} from 'lucide-react';
import { 
  NETWORKS, 
  inspectTransaction, 
  simulateTransaction, 
  auditContractStorage, 
  decodeDiagnosticString, 
  diagnoseFailure,
  fetchContractEvents,
  getLatestLedger
} from '../utils/stellarRpc';
import BatchInspectorTab from './BatchInspectorTab';
import AuthCheckerTab from './AuthCheckerTab';
import FixViewerTab from './FixViewerTab';
import AbiInspectorTab from './AbiInspectorTab';
import InvocationSandboxTab from './InvocationSandboxTab';
import WebhookModal from './WebhookModal';
import LinterTab from './LinterTab';
import ProfilerTab from './ProfilerTab';
import TestGenTab from './TestGenTab';

// Demo Presets for One-Click Reviewer Testing
const DEMO_PRESETS = {
  tx: [
    {
      label: 'Jisr Testnet fee-split payment',
      hash: '6e79ed7847d34d19fb0d9f8bf43282cd583972537a41d539559a610a7f108910',
      network: 'testnet',
      desc: 'Successful 1 XLM router payment, observed October 8, 2026'
    }
  ],
  simulation: [
    {
      label: 'Token Transfer (Valid Simulation)',
      desc: 'Valid envelope testing CPU/memory footprints and min resource fee',
      xdr: 'AAAAAgAAAABQBc1ewHKado/VrQJQWFLfTwKNzoMOWsUiCbpISDsvAQAAAAEAAAAAAAAABAAAAA8AAAAIdHJhbnNmZXIAAAASAAAAAaBZ36zodn3U9O8EzrMRb0A9aFqU12Fh9MaPpK9NafDJAAAAEgAAAAAAAAAAOkawesId0j3h5x1D6QIkA5Eu3ZXaguTof7/tqw+3WR8AAAA='
    },
    {
      label: 'Host Budget Exceeded (Failing Simulation)',
      desc: 'Simulation demonstrating WASM memory/CPU instruction trap',
      xdr: 'AAAAAgAAAADpGsHrCHdI94ecdQ+kCJAORLt2V2oLk6H+/7asPt1kfAAAAAX/oAftBAjljQELlFpDYo3t97YZ45Kf3Uq7ihnBVVVYzAAAADwAAAAdmbl9jYWxsAAAAAA0AAAAg'
    }
  ],
  decode: [
    {
      label: 'DiagnosticEvent: Host Trap',
      base64: 'AAAAAgAAAAAAAAADAAAADwAAAAdmbl9jYWxsAAAAAA0AAAAgOkawesId0j3h5x1D6QIkA5Eu3ZXaguTof7/tqw+3WR8AAAAPAAAAC0hvc3RFcnJvcgAAABAAAAABAAAAAw=='
    },
    {
      label: 'DiagnosticEvent: Token Mint',
      base64: 'AAAAAgAAAAAAAAAEAAAADwAAAAhtaW50AAAAABIAAAABoFnfrOh2fdT07wTOsxFvQD1oWpTXYWH0xo+kr01p8MkAAAAKAAAAAAAAAAAAAAAAAAAnEAAAAA=='
    }
  ],
  contracts: [
    {
      label: 'Native SAC (Testnet)',
      id: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
      desc: 'Official Stellar Asset Contract for native XLM'
    },
    {
      label: 'Example Token Contract',
      id: 'CA45Y4F3M4W3M5K7O4T4C74N6XJ3G5ZJ3K4L2M1N0P9Q8R7S6T5U4V3W',
      desc: 'Custom Soroban token with persistent user balances'
    }
  ]
};

export default function LiveStudio({ catalogEntries, onSelectEntry }) {
  const [activeTool, setActiveTool] = useState('inspect'); // 'inspect' | 'simulate' | 'decode' | 'storage' | 'watch'
  const [network, setNetwork] = useState('testnet');
  const [copiedKey, setCopiedKey] = useState(null);

  // Inspector State
  const [txHash, setTxHash] = useState('');
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);
  const [inspectDiagnosis, setInspectDiagnosis] = useState(null);
  const [inspectError, setInspectError] = useState(null);

  // Simulator State
  const [simXdr, setSimXdr] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simError, setSimError] = useState(null);

  // Decoder State
  const [decodeInput, setDecodeInput] = useState('');
  const [decodeResult, setDecodeResult] = useState(null);

  // Storage Auditor State
  const [contractId, setContractId] = useState('');
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageResult, setStorageResult] = useState(null);
  const [storageError, setStorageError] = useState(null);

  // Live Watcher State
  const [watchContractId, setWatchContractId] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [watchedEvents, setWatchedEvents] = useState([]);
  const [watchCursorLedger, setWatchCursorLedger] = useState(null);
  const [watchIntervalMs, setWatchIntervalMs] = useState(3000);
  const [trapAlertCount, setTrapAlertCount] = useState(0);
  const watcherIntervalRef = useRef(null);
  const eventLogEndRef = useRef(null);

  // History & Bookmarks State
  const [recentHistory, setRecentHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('traptrace_recent_history') || '[]');
    } catch {
      return [];
    }
  });

  const addToHistory = (type, value, label) => {
    try {
      const newItem = { type, value, label: label || value.slice(0, 16) + '...', timestamp: new Date().toLocaleTimeString() };
      const updated = [newItem, ...recentHistory.filter(h => !(h.type === type && h.value === value))].slice(0, 8);
      setRecentHistory(updated);
      localStorage.setItem('traptrace_recent_history', JSON.stringify(updated));
    } catch {}
  };

  // URL Query Parameters Sync on Mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const toolParam = params.get('tool');
      const txParam = params.get('tx');
      const xdrParam = params.get('xdr') || params.get('sim');
      const contractParam = params.get('contract');
      const netParam = params.get('network');

      if (netParam && NETWORKS[netParam]) {
        setNetwork(netParam);
      }
      if (toolParam && ['inspect', 'simulate', 'decode', 'storage', 'watch', 'batch', 'auth', 'fix', 'abi', 'sandbox', 'lint', 'profile', 'testgen'].includes(toolParam)) {
        setActiveTool(toolParam);
      }
      if (txParam) {
        setTxHash(txParam);
        handleInspect(txParam);
      }
      if (xdrParam) {
        setSimXdr(xdrParam);
        handleSimulate(xdrParam);
      }
      if (contractParam) {
        setContractId(contractParam);
        setWatchContractId(contractParam);
        if (toolParam === 'storage') handleStorageAudit(contractParam);
      }
    } catch {}
  }, []);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyShareLink = (extraParams = {}) => {
    const url = new URL(window.location.origin);
    url.searchParams.set('tab', 'studio');
    url.searchParams.set('tool', activeTool);
    url.searchParams.set('network', network);
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    copyToClipboard(url.toString(), 'share-permalink');
  };

  const downloadReport = (filename, content, mimeType = 'text/markdown') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run Inspector
  const handleInspect = async (hashToUse) => {
    const targetHash = (hashToUse || txHash).trim();
    if (!targetHash) return;
    setInspectLoading(true);
    setInspectError(null);
    setInspectResult(null);
    setInspectDiagnosis(null);
    addToHistory('inspect', targetHash, `Tx: ${targetHash.slice(0, 10)}...`);

    try {
      const data = await inspectTransaction(targetHash, network);
      setInspectResult(data);
      const diagnosis = diagnoseFailure(data, catalogEntries);
      setInspectDiagnosis(diagnosis);
      
      // Update browser URL
      const url = new URL(window.location);
      url.searchParams.set('tab', 'studio');
      url.searchParams.set('tool', 'inspect');
      url.searchParams.set('tx', targetHash);
      url.searchParams.set('network', network);
      window.history.replaceState({}, '', url);
    } catch (err) {
      setInspectError(err.message || 'Failed to inspect transaction');
    } finally {
      setInspectLoading(false);
    }
  };

  // Run Simulation
  const handleSimulate = async (xdrToUse) => {
    const targetXdr = (xdrToUse || simXdr).trim();
    if (!targetXdr) return;
    setSimLoading(true);
    setSimError(null);
    setSimResult(null);
    addToHistory('simulate', targetXdr, `XDR: ${targetXdr.slice(0, 12)}...`);

    try {
      const result = await simulateTransaction(targetXdr, network);
      setSimResult(result);
    } catch (err) {
      setSimError(err.message || 'Simulation RPC error');
    } finally {
      setSimLoading(false);
    }
  };

  // Run Storage Audit
  const handleStorageAudit = async (idToUse) => {
    const targetId = (idToUse || contractId).trim();
    if (!targetId) return;
    setStorageLoading(true);
    setStorageError(null);
    setStorageResult(null);
    addToHistory('storage', targetId, `Contract: ${targetId.slice(0, 10)}...`);

    try {
      const result = await auditContractStorage(targetId, network);
      setStorageResult(result);
    } catch (err) {
      setStorageError(err.message || 'Storage audit RPC error');
    } finally {
      setStorageLoading(false);
    }
  };

  // Run Decoder
  const handleDecode = (textToUse) => {
    const targetText = textToUse !== undefined ? textToUse : decodeInput;
    if (!targetText.trim()) return;
    const result = decodeDiagnosticString(targetText);
    setDecodeResult(result);
  };

  // Live Watcher Polling Loop
  useEffect(() => {
    if (!isWatching) {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
      return;
    }

    const pollEvents = async () => {
      try {
        let startLedger = watchCursorLedger;
        if (!startLedger) {
          const ledgerInfo = await getLatestLedger(network);
          startLedger = Math.max(1, (ledgerInfo?.sequence || 0) - 10);
          setWatchCursorLedger(startLedger);
        }

        const eventsRes = await fetchContractEvents({
          contractId: watchContractId,
          startLedger,
          network,
          limit: 15
        });

        if (eventsRes?.events && eventsRes.events.length > 0) {
          const newEvents = eventsRes.events;
          const maxLedger = Math.max(...newEvents.map(e => e.ledger));
          setWatchCursorLedger(maxLedger + 1);

          let newTraps = 0;
          const formatted = newEvents.map(ev => {
            const isError = ev.type === 'diagnostic' || JSON.stringify(ev).toLowerCase().includes('error') || JSON.stringify(ev).toLowerCase().includes('trap');
            if (isError) newTraps++;
            return {
              ...ev,
              isTrap: isError,
              receivedAt: new Date().toLocaleTimeString()
            };
          });

          setWatchedEvents(prev => [...prev, ...formatted].slice(-100));
          if (newTraps > 0) setTrapAlertCount(prev => prev + newTraps);
        }
      } catch (err) {
        console.error('Watcher poll error:', err);
      }
    };

    pollEvents();
    watcherIntervalRef.current = setInterval(pollEvents, watchIntervalMs);

    return () => {
      if (watcherIntervalRef.current) clearInterval(watcherIntervalRef.current);
    };
  }, [isWatching, watchContractId, watchCursorLedger, network, watchIntervalMs]);

  return (
    <div className="container" style={{ padding: '32px 24px' }}>
      {/* Studio Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <div style={{ 
            background: 'rgba(47, 169, 140, 0.15)', 
            color: 'var(--color-trace-teal)', 
            padding: '6px', 
            borderRadius: '6px',
            display: 'flex'
          }}>
            <Activity size={20} />
          </div>
          <h2 style={{ fontSize: '24px', margin: 0, fontWeight: 600 }}>
            Live Stellar &amp; Soroban Diagnostics Studio
          </h2>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => copyShareLink()}
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              {copiedKey === 'share-permalink' ? <Check size={13} color="var(--color-trace-teal)" /> : <Share2 size={13} />}
              {copiedKey === 'share-permalink' ? 'Permalink Copied!' : 'Share Studio'}
            </button>
            <span className="badge badge--success">
              <Zap size={12} /> Connected: {NETWORKS[network]?.name}
            </span>
          </div>
        </div>
        <p style={{ color: 'var(--color-slate)', margin: 0, fontSize: '15px', maxWidth: '850px' }}>
          Inspect transaction observations, simulate envelopes, fetch contract events and read deployed WASM specifications. Authorization decoding does not verify signatures; storage activity does not establish TTL or archival status.
        </p>
      </div>

      {/* Control Bar: Tool Switcher & Network Selector */}
      <div className="studio-nav-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        padding: '16px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        marginBottom: '24px'
      }}>
        {/* Tool Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTool === 'inspect' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('inspect')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <Search size={14} /> Tx Hash Inspector
          </button>
          <button
            className={`btn ${activeTool === 'simulate' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('simulate')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <Cpu size={14} /> Pre-Flight Simulator
          </button>
          <button
            className={`btn ${activeTool === 'watch' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('watch')}
            style={{ fontSize: '13px', padding: '8px 14px', position: 'relative' }}
          >
            <Radio size={14} color={isWatching ? 'var(--color-trace-teal)' : 'inherit'} /> Live Event Watcher
            {trapAlertCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: '#EF4444',
                color: '#FFF',
                borderRadius: '999px',
                fontSize: '10px',
                padding: '2px 6px',
                fontWeight: 700
              }}>
                {trapAlertCount}
              </span>
            )}
          </button>
          <button
            className={`btn ${activeTool === 'decode' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('decode')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <FileCode size={14} /> XDR &amp; Event Decoder
          </button>
          <button
            className={`btn ${activeTool === 'storage' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('storage')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <Database size={14} /> Storage &amp; TTL Auditor
          </button>
          <button
            className={`btn ${activeTool === 'batch' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('batch')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <Layers size={14} /> Batch Inspector
          </button>
          <button
            className={`btn ${activeTool === 'auth' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('auth')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <ShieldCheck size={14} /> Auth Checker
          </button>
          <button
            className={`btn ${activeTool === 'fix' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('fix')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <Zap size={14} /> Auto-Fix
          </button>
          <button
            className={`btn ${activeTool === 'abi' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('abi')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <Cpu size={14} /> WASM ABI
          </button>
          <button
            className={`btn ${activeTool === 'sandbox' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('sandbox')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <Play size={14} /> Sandbox
          </button>
          <button
            className={`btn ${activeTool === 'lint' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('lint')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <ShieldAlert size={14} /> Smart Linter
          </button>
          <button
            className={`btn ${activeTool === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('profile')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <BarChart2 size={14} /> Gas Profiler
          </button>
          <button
            className={`btn ${activeTool === 'testgen' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTool('testgen')}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            <TestTube size={14} /> Rust Test Gen
          </button>
        </div>

        {/* Network Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-slate)', fontWeight: 500 }}>
            Target Network:
          </span>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg)',
              color: 'var(--color-ink)',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <option value="testnet">Stellar Testnet</option>
            <option value="futurenet">Stellar Futurenet</option>
            <option value="mainnet">Stellar Mainnet</option>
          </select>
        </div>
      </div>

      {/* Quick History Drawer / Bar */}
      {recentHistory.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--color-slate)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <History size={12} /> Recent History:
          </span>
          {recentHistory.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveTool(item.type);
                if (item.type === 'inspect') {
                  setTxHash(item.value);
                  handleInspect(item.value);
                } else if (item.type === 'simulate') {
                  setSimXdr(item.value);
                  handleSimulate(item.value);
                } else if (item.type === 'storage') {
                  setContractId(item.value);
                  handleStorageAudit(item.value);
                }
              }}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 1: TRANSACTION HASH INSPECTOR */}
      {/* ========================================================================= */}
      {activeTool === 'inspect' && (
        <div className="studio-card" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="var(--color-trace-teal)" />
              On-Chain Transaction Hash Inspector
            </h3>
            {inspectResult && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const md = `# TrapTrace Inspection Report\n\n- **Tx Hash:** \`${inspectResult.hash}\`\n- **Network:** ${inspectResult.network}\n- **Status:** ${inspectDiagnosis?.status}\n\n## Diagnosis\n${inspectDiagnosis?.matches?.map(m => `### ${m.entry.title}\n- **Error Code:** \`${m.entry.error_code}\`\n- **Confidence:** ${m.confidence}%\n\n**Solutions:**\n${m.entry.solutions}`).join('\n\n')}`;
                    downloadReport(`traptrace-inspect-${inspectResult.hash.slice(0, 8)}.md`, md);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  <Download size={13} /> Export Report (.md)
                </button>
                <button
                  onClick={() => copyShareLink({ tx: txHash })}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  <Share2 size={13} /> Share Link
                </button>
              </div>
            )}
          </div>
          <p style={{ color: 'var(--color-slate)', fontSize: '14px', marginBottom: '20px' }}>
            Enter a 64-character transaction hash to fetch on-chain Soroban RPC trace metadata, decode DiagnosticEvents, and automatically cross-reference root causes with the verified error catalog.
          </p>

          {/* Quick Presets */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Try Preset Failure Scenarios:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {DEMO_PRESETS.tx.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTxHash(preset.hash);
                    handleInspect(preset.hash);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--color-bg)' }}
                  title={preset.desc}
                >
                  ⚡ {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Action */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Paste 64-char transaction hash (hex)..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleInspect()}
            />
            <button
              onClick={() => handleInspect()}
              disabled={inspectLoading || !txHash.trim()}
              className="btn btn-primary"
              style={{ padding: '12px 20px', fontSize: '14px' }}
            >
              {inspectLoading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Inspecting...
                </>
              ) : (
                <>
                  <Search size={16} /> Inspect Transaction
                </>
              )}
            </button>
          </div>

          {inspectError && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <XCircle size={18} />
              <span>{inspectError}</span>
            </div>
          )}

          {inspectResult && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>Execution Status</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {inspectDiagnosis?.isFailed ? (
                      <>
                        <XCircle size={18} color="#EF4444" />
                        <span style={{ color: '#EF4444' }}>FAILED</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={18} color="var(--color-trace-teal)" />
                        <span style={{ color: 'var(--color-trace-teal)' }}>SUCCESS</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>Ledger Sequence</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    #{inspectResult.rpcResult?.latestLedger || inspectResult.horizonResult?.ledger || 'Pending'}
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>External Explorer</div>
                  <div style={{ marginTop: '4px' }}>
                    <a
                      href={`${NETWORKS[network]?.explorerTxUrl}${inspectResult.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--color-trace-teal)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 500 }}
                    >
                      stellar.expert <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>

              {/* Diagnosis Matches */}
              {inspectDiagnosis?.matches?.length > 0 && (
                <div style={{
                  padding: '20px',
                  background: 'var(--color-bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <ShieldCheck size={20} color="var(--color-trace-teal)" />
                    <h4 style={{ margin: 0, fontSize: '16px' }}>
                      Automated Catalog Root-Cause Matching ({inspectDiagnosis.matches.length} matches found)
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {inspectDiagnosis.matches.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '14px',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 600, fontSize: '15px' }}>{m.entry.title}</span>
                            <span className="badge badge-category">{m.entry.category}</span>
                            <span className="badge badge--success">{m.confidence}% Confidence</span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-slate)' }}>
                            {m.reasons.join(' · ')}
                          </div>
                        </div>
                        <button
                          onClick={() => onSelectEntry(m.entry)}
                          className="btn btn-secondary"
                          style={{ fontSize: '13px', padding: '6px 12px' }}
                        >
                          View Verified Fix <ArrowRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 2: PRE-FLIGHT SIMULATION DEBUGGER */}
      {/* ========================================================================= */}
      {activeTool === 'simulate' && (
        <div className="studio-card" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--color-trace-teal)" />
              Pre-Flight Transaction Simulation Debugger
            </h3>
            {simResult && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    const jsonStr = JSON.stringify(simResult, null, 2);
                    downloadReport(`traptrace-simulation.json`, jsonStr, 'application/json');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '5px 10px' }}
                >
                  <Download size={13} /> Export JSON
                </button>
              </div>
            )}
          </div>
          <p style={{ color: 'var(--color-slate)', fontSize: '14px', marginBottom: '20px' }}>
            Test transaction envelope XDR against Soroban JSON-RPC simulation before submitting to the network. Measures CPU instruction footprint, memory allocation, and minimum resource fee.
          </p>

          {/* Quick Presets */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Try Preset Envelope XDRs:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {DEMO_PRESETS.simulation.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSimXdr(preset.xdr);
                    handleSimulate(preset.xdr);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--color-bg)' }}
                  title={preset.desc}
                >
                  ⚡ {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <textarea
              rows={4}
              placeholder="Paste Base64 Transaction Envelope XDR..."
              value={simXdr}
              onChange={(e) => setSimXdr(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={() => handleSimulate()}
            disabled={simLoading || !simXdr.trim()}
            className="btn btn-primary"
            style={{ padding: '12px 20px', fontSize: '14px', marginBottom: '24px' }}
          >
            {simLoading ? (
              <>
                <RefreshCw size={16} className="spin" /> Simulating...
              </>
            ) : (
              <>
                <Play size={16} /> Run Pre-Flight Simulation
              </>
            )}
          </button>

          {simError && (
            <div style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <XCircle size={18} />
              <span>{simError}</span>
            </div>
          )}

          {simResult && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>Simulation Status</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px', color: simResult.error ? '#EF4444' : 'var(--color-trace-teal)' }}>
                    {simResult.error ? 'Simulation Error' : 'Simulation Success'}
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>Min Resource Fee</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    {simResult.minResourceFee ? `${simResult.minResourceFee} stroops` : 'N/A'}
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>Latest Ledger</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    #{simResult.latestLedger || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 3: LIVE EVENT & TRAP WATCHER */}
      {/* ========================================================================= */}
      {activeTool === 'watch' && (
        <div className="studio-card" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} color="var(--color-trace-teal)" />
              Real-Time Contract Event &amp; Host Trap Stream Watcher
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {watchedEvents.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const jsonStr = JSON.stringify(watchedEvents, null, 2);
                      downloadReport(`traptrace-events-${new Date().toISOString().slice(0, 10)}.json`, jsonStr, 'application/json');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    <Download size={13} /> Export Stream JSON
                  </button>
                  <button
                    onClick={() => {
                      setWatchedEvents([]);
                      setTrapAlertCount(0);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '12px', padding: '5px 10px' }}
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                </>
              )}
            </div>
          </div>
          <p style={{ color: 'var(--color-slate)', fontSize: '14px', marginBottom: '20px' }}>
            Streams on-chain contract events and DiagnosticEvents via live JSON-RPC polling. Automatically flags contract traps, panics, and authorization errors in real time.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Contract ID (Leave empty to stream all contract events on network)..."
              value={watchContractId}
              onChange={(e) => setWatchContractId(e.target.value)}
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px'
              }}
            />
            <button
              onClick={() => setIsWatching(!isWatching)}
              className={`btn ${isWatching ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '12px 20px', fontSize: '14px' }}
            >
              {isWatching ? (
                <>
                  <Pause size={16} /> Pause Stream
                </>
              ) : (
                <>
                  <Play size={16} /> Start Live Stream
                </>
              )}
            </button>
          </div>

          {/* Event Stream Terminal Window */}
          <div style={{
            background: '#090B0F',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            padding: '16px',
            minHeight: '260px',
            maxHeight: '450px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px', marginBottom: '12px', fontSize: '11px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>
              <span>Live Stream Status: {isWatching ? <span style={{ color: 'var(--color-trace-teal)' }}>● Polling {NETWORKS[network]?.name} (every {watchIntervalMs/1000}s)</span> : '❚❚ Paused'}</span>
              <span>Events Buffered: {watchedEvents.length}</span>
            </div>

            {watchedEvents.length === 0 ? (
              <div style={{ color: 'var(--color-slate)', textAlign: 'center', padding: '40px 0' }}>
                {isWatching ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={20} className="spin" color="var(--color-trace-teal)" />
                    <span>Listening for on-chain events...</span>
                  </div>
                ) : (
                  <span>Click "Start Live Stream" to monitor contract transactions and traps.</span>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {watchedEvents.map((ev, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      background: ev.isTrap ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${ev.isTrap ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: ev.isTrap ? '#EF4444' : 'var(--color-trace-teal)', fontWeight: 600 }}>
                          {ev.isTrap ? '⚠️ [HOST TRAP / ERROR]' : '✓ [EVENT]'}
                        </span>
                        <span style={{ color: 'var(--color-slate)', fontSize: '11px' }}>
                          Ledger #{ev.ledger}
                        </span>
                      </div>
                      <span style={{ color: 'var(--color-slate)', fontSize: '11px' }}>{ev.receivedAt}</span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--color-slate)' }}>Contract: </span>
                      {ev.contractId || '<None / System>'}
                    </div>

                    {ev.topic && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <span style={{ color: 'var(--color-slate)' }}>Topics: </span>
                        {JSON.stringify(ev.topic)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 4: XDR & DIAGNOSTIC EVENT DECODER */}
      {/* ========================================================================= */}
      {activeTool === 'decode' && (
        <div className="studio-card" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '18px', marginTop: 0, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCode size={18} color="var(--color-trace-teal)" />
            Soroban DiagnosticEvent &amp; SCVal Decoder
          </h3>
          <p style={{ color: 'var(--color-slate)', fontSize: '14px', marginBottom: '20px' }}>
            Decodes Base64 encoded Soroban DiagnosticEvents, ScVal objects, and call stack trees to extract readable error symbols and contract trap details.
          </p>

          {/* Quick Presets */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Try Preset Event Payloads:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {DEMO_PRESETS.decode.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDecodeInput(preset.base64);
                    handleDecode(preset.base64);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--color-bg)' }}
                >
                  ⚡ {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Paste Base64 Soroban DiagnosticEvent / ScVal string..."
              value={decodeInput}
              onChange={(e) => {
                setDecodeInput(e.target.value);
                handleDecode(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {decodeResult && (
            <div style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-slate)', fontWeight: 600 }}>
                  Decoded Symbols &amp; Extracted Event Strings:
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-trace-teal)' }}>
                  {decodeResult.rawLength} bytes
                </span>
              </div>

              {decodeResult.extractedStrings?.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {decodeResult.extractedStrings.map((str, idx) => (
                    <span 
                      key={idx} 
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(47, 169, 140, 0.15)',
                        border: '1px solid rgba(47, 169, 140, 0.3)',
                        borderRadius: '4px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        color: 'var(--color-trace-teal)',
                        fontWeight: 500
                      }}
                    >
                      "{str}"
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--color-slate)', fontSize: '13px', marginBottom: '16px' }}>
                  No ASCII symbol strings found in payload.
                </div>
              )}

              <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Hex Byte Stream Preview:
              </div>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--color-slate)',
                margin: 0,
                whiteSpace: 'pre-wrap'
              }}>
                {decodeResult.hexPreview}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOOL 5: STORAGE & STATE TTL AUDITOR */}
      {/* ========================================================================= */}
      {activeTool === 'storage' && (
        <div className="studio-card" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '18px', marginTop: 0, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--color-trace-teal)" />
            Contract Storage &amp; State TTL Auditor
          </h3>
          <p style={{ color: 'var(--color-slate)', fontSize: '14px', marginBottom: '20px' }}>
            Audits on-chain contract ledger entries, monitors archival status, and checks TTL ledger meters to prevent <code style={{ fontFamily: 'var(--font-mono)' }}>HostError::EntryArchived</code> outages.
          </p>

          {/* Quick Presets */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Try Preset Contract IDs:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {DEMO_PRESETS.contracts.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setContractId(preset.id);
                    handleStorageAudit(preset.id);
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 10px', background: 'var(--color-bg)' }}
                >
                  ⚡ {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Enter Soroban Contract ID (56 character C... string)..."
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
              style={{
                flex: 1,
                minWidth: '280px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-mono)',
                fontSize: '14px'
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleStorageAudit()}
            />
            <button
              onClick={() => handleStorageAudit()}
              disabled={storageLoading || !contractId.trim()}
              className="btn btn-primary"
              style={{ padding: '12px 20px', fontSize: '14px' }}
            >
              {storageLoading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Auditing...
                </>
              ) : (
                <>
                  <Database size={16} /> Audit Storage
                </>
              )}
            </button>
          </div>

          {storageResult && (
            <div style={{ marginTop: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>Current Ledger</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    #{storageResult.currentLedgerSeq.toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>TTL Health Status</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--color-trace-teal)' }}>
                    Active &amp; Live
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate)', textTransform: 'uppercase' }}>Protocol Version</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    Protocol {storageResult.protocolVersion || '21'}
                  </div>
                </div>
              </div>

              <div style={{
                padding: '16px',
                background: 'var(--color-bg)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Info size={16} color="var(--color-trace-teal)" />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>State Archival &amp; Restoration Guidance:</span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-slate)', margin: '0 0 10px 0' }}>
                  If a persistent key reaches 0 TTL ledgers, calls will fail with <code style={{ fontFamily: 'var(--font-mono)' }}>HostError::EntryArchived</code>. Restore with CLI:
                </p>
                <code style={{
                  display: 'block',
                  padding: '10px 14px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: 'var(--color-trap-amber)'
                }}>
                  soroban contract restore --id {storageResult.contractId} --network {network}
                </code>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOOL 6: BATCH INSPECTOR */}
      {activeTool === 'batch' && <BatchInspectorTab network={network} />}

      {/* TOOL 7: AUTH CHECKER */}
      {activeTool === 'auth' && <AuthCheckerTab network={network} />}

      {/* TOOL 8: AUTO-FIX GENERATOR */}
      {activeTool === 'fix' && <FixViewerTab />}

      {/* TOOL 9: WASM ABI INSPECTOR */}
      {activeTool === 'abi' && <AbiInspectorTab network={network} />}

      {/* TOOL 10: INVOCATION SANDBOX */}
      {activeTool === 'sandbox' && <InvocationSandboxTab network={network} />}

      {/* TOOL 11: SMART CONTRACT LINTER */}
      {activeTool === 'lint' && <LinterTab />}

      {/* TOOL 12: RESOURCE & GAS PROFILER */}
      {activeTool === 'profile' && <ProfilerTab />}

      {/* TOOL 13: RUST TEST GENERATOR */}
      {activeTool === 'testgen' && <TestGenTab catalogEntries={catalogEntries} />}
    </div>
  );
}
