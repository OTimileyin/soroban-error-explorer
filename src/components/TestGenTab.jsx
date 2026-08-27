import React, { useState } from 'react';
import { TestTube, FileCode, Copy, Check, Download, BookOpen, Sparkles } from 'lucide-react';
import { generateRustTest } from '../utils/testGenerator';

export default function TestGenTab({ catalogEntries }) {
  const [selectedErrorId, setSelectedErrorId] = useState('arith-error');
  const [copied, setCopied] = useState(false);

  const entriesList = catalogEntries && catalogEntries.length > 0
    ? catalogEntries
    : [
        { id: 'arith-error', title: 'Host Error - Arithmetic Overflow Panic', category: 'host-error' },
        { id: 'require-auth-missing', title: 'Host Error - Missing Caller Authorization', category: 'host-error' },
        { id: 'option-unwrap-none', title: 'Host Error - Option::unwrap() on None Panic', category: 'host-error' }
      ];

  const testData = generateRustTest(selectedErrorId);

  const copyCode = () => {
    navigator.clipboard.writeText(testData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTestFile = () => {
    const filename = `test_${selectedErrorId.replace(/-/g, '_')}.rs`;
    const blob = new Blob([testData.code], { type: 'text/rust' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <TestTube className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">Soroban Rust Test Generator</h2>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Generate idiomatic Soroban SDK unit test suites to reproduce traps in tests and verify error-prevention guards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedErrorId}
            onChange={(e) => setSelectedErrorId(e.target.value)}
            className="input text-xs py-1.5 px-3 max-w-sm"
          >
            {entriesList.map((entry) => (
              <option key={entry.id} value={entry.id}>
                [{entry.category || 'catalog'}] {entry.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{testData.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyCode}
              className="btn btn-secondary text-xs py-1 px-3 flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Rust Test'}
            </button>
            <button
              onClick={downloadTestFile}
              className="btn btn-primary text-xs py-1 px-3 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download .rs
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-surface-subtle border border-border font-mono text-xs text-text overflow-x-auto leading-relaxed">
            <code>{testData.code}</code>
          </pre>
        </div>

        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-text-muted space-y-1">
          <span className="font-semibold text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Integration Tip:
          </span>
          <p>
            Paste this unit test inside your contract's <code className="font-mono text-text">tests/</code> or <code className="font-mono text-text">src/test.rs</code> file. Run with <code className="font-mono text-text">cargo test</code> to verify your trap-handling logic before on-chain deployment.
          </p>
        </div>
      </div>
    </div>
  );
}
