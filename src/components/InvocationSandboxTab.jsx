import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play } from 'lucide-react';
import { simulateTransaction } from '../utils/stellarRpc.js';

export default function InvocationSandboxTab({ network }) {
  const [xdr, setXdr] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const requestId = useRef(0);
  useEffect(() => {
    requestId.current += 1; setResult(null); setError(null); setLoading(false);
    return () => { requestId.current += 1; };
  }, [network]);
  async function simulate() {
    const id = ++requestId.current;
    setLoading(true); setResult(null); setError(null);
    try {
      const response = await simulateTransaction(xdr.trim(), network);
      if (requestId.current === id) setResult(response);
    } catch (err) { if (requestId.current === id) setError(err.message); }
    finally { if (requestId.current === id) setLoading(false); }
  }
  return <div className="space-y-6">
    <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4"><Terminal className="w-5 h-5 text-teal-400" />
        <h3 className="text-base font-mono font-semibold text-paper-100">Transaction Simulation</h3></div>
      <p className="text-xs text-paper-400 mb-3">Simulate transaction envelope XDR against {network}. Simulation never submits the transaction and does not prove signature validity or settlement.</p>
      <textarea aria-label="Transaction envelope XDR" rows={4} value={xdr}
        onChange={event => { requestId.current += 1; setXdr(event.target.value); setResult(null); setError(null); setLoading(false); }}
        className="w-full bg-ink-950 border border-ink-800 rounded-lg p-3 text-xs font-mono text-paper-200 mb-3" />
      <button onClick={simulate} disabled={loading || !xdr.trim()}
        className="px-4 py-2 bg-teal-600 text-ink-950 font-mono text-xs font-bold rounded-lg flex items-center gap-2">
        <Play className="w-4 h-4" />{loading ? 'Simulating...' : 'Simulate Transaction'}</button>
    </div>
    {error && <p role="alert" className="text-xs text-amber-400">{error}</p>}
    {result && <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
      <p role="status" className="text-xs font-mono text-amber-400">{result.error ? 'Simulation failed' : result.results?.length ? 'Simulation returned execution results' : 'Incomplete simulation response'}</p>
      <pre className="mt-3 text-xs text-paper-300 whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
    </div>}
  </div>;
}
