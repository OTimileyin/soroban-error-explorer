import React, { useEffect, useRef, useState } from 'react';
import { Cpu, Search } from 'lucide-react';
import { fetchContractSpec } from '../utils/wasmInspector';

export default function AbiInspectorTab({ network }) {
  const [contractId, setContractId] = useState('CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC');
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    requestId.current += 1;
    setSpec(null);
    setError(null);
    setLoading(false);
    return () => { requestId.current += 1; };
  }, [network]);

  const fetchSpec = async () => {
    const id = ++requestId.current;
    setLoading(true);
    setSpec(null);
    setError(null);
    try {
      const result = await fetchContractSpec(contractId.trim(), network);
      if (requestId.current === id) setSpec(result);
    } catch (err) {
      if (requestId.current === id) setError(err.message);
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-5 h-5 text-teal-400" />
          <h3 className="text-base font-mono font-semibold text-paper-100">Contract WASM ABI & Spec Inspector</h3>
        </div>
        <p className="text-xs text-paper-400 mb-3">
          Read declared functions and their argument and return types from the deployed contract on {network}.
        </p>
        <div className="flex gap-2">
          <input
            aria-label="Contract address"
            type="text"
            value={contractId}
            onChange={(e) => {
              requestId.current += 1;
              setContractId(e.target.value);
              setSpec(null);
              setError(null);
              setLoading(false);
            }}
            placeholder="Contract Address (C...)"
            className="flex-1 bg-ink-950 border border-ink-800 rounded-lg px-3 py-2 text-xs font-mono text-paper-200 focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={fetchSpec}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-ink-950 font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? "Fetching Spec..." : "Inspect ABI"}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="text-xs text-amber-400">{error}</p>}

      {spec && (
        <div className="bg-ink-900 border border-ink-800 rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-mono font-bold text-paper-300">Exported Functions ({spec.functions.length})</h4>
          <p className="text-xs font-mono text-paper-400 break-all">{spec.contractId} · {spec.network}</p>
          {spec.functions.length === 0 && <p className="text-xs text-paper-400">No declared functions found.</p>}
          <div className="space-y-2">
            {spec.functions.map((fn) => (
              <div key={fn.name} className="p-3 bg-ink-950 rounded-lg border border-ink-800 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-paper-100 font-bold">{fn.name}(<span className="text-teal-400">{fn.inputs.map(i => `${i.name}: ${i.type}`).join(', ')}</span>)</span>
                  <span className="text-amber-400 font-bold">→ {fn.outputs.map(output => output.type).join(', ') || 'Void'}</span>
                </div>
                <p className="text-[11px] text-paper-400 mt-1">{fn.doc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
