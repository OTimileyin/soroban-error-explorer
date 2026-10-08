import React, { useState } from 'react';
import { ShieldCheck, Play } from 'lucide-react';
import { validateAuthTree } from '../utils/auth.js';

export default function AuthCheckerTab({ network }) {
  const [xdrInput, setXdrInput] = useState('');
  const [report, setReport] = useState(null);
  return <div className="space-y-6">
    <div className="bg-ink-900 border border-ink-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck className="w-5 h-5 text-teal-400" />
        <h3 className="text-base font-mono font-semibold text-paper-100">Authorization Entry Inspector</h3>
      </div>
      <p className="text-xs text-paper-400 mb-3">Decode a Soroban authorization entry locally. Signatures, expiration, nonce and acceptance on {network} require separate verification.</p>
      <textarea aria-label="Authorization entry XDR" rows={4} value={xdrInput}
        onChange={event => { setXdrInput(event.target.value); setReport(null); }}
        className="w-full bg-ink-950 border border-ink-800 rounded-lg p-3 text-xs font-mono text-paper-200 mb-4" />
      <button onClick={() => setReport(validateAuthTree(xdrInput.trim()))}
        className="px-4 py-2 bg-teal-600 text-ink-950 font-mono text-xs font-bold rounded-lg flex items-center gap-2">
        <Play className="w-4 h-4" /> Inspect Authorization Entry
      </button>
    </div>
    {report && <div className="bg-ink-900 border border-ink-800 rounded-xl p-5 space-y-3">
      <p role="status" className="text-xs font-mono text-amber-400">{report.isValid ? 'Decoded · signatures unverified' : 'Invalid authorization entry'}</p>
      {report.issues.map(issue => <p key={issue} className="text-xs text-paper-400">{issue}</p>)}
      {report.isValid && <pre className="text-xs text-paper-300 whitespace-pre-wrap break-all">{JSON.stringify({
        requiredSigners: report.requiredSigners, credentialsType: report.credentialsType, invocation: report.invocation,
      }, null, 2)}</pre>}
    </div>}
  </div>;
}
