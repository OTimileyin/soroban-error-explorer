import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Play, Copy, Check, FileCode, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import { lintContractCode } from '../utils/linter';

const LINT_PRESETS = [
  {
    label: 'Vulnerable Token Transfer (Unwrap & Missing Auth)',
    code: `use soroban_sdk::{contract, contractimpl, Env, Address, Vec};\n\n#[contract]\npub struct VulnerableToken;\n\n#[contractimpl]\nimpl VulnerableToken {\n    pub fn transfer(env: Env, caller: Address, recipient: Address, amount: i128) {\n        // Missing caller.require_auth()!\n        let balances: Vec<i128> = env.storage().persistent().get(&caller).unwrap();\n        \n        let new_balance = amount + 1;\n        env.storage().persistent().set(&caller, &balances);\n    }\n}`
  },
  {
    label: 'Unchecked Arithmetic & Direct Vector Indexing',
    code: `use soroban_sdk::{contract, contractimpl, Env, Vec};\n\n#[contract]\npub struct MathPool;\n\n#[contractimpl]\nimpl MathPool {\n    pub fn calculate_reward(env: Env, index: u32, multiplier: u32) -> u32 {\n        let factors: Vec<u32> = env.storage().instance().get(&1).unwrap();\n        let base = factors.get(index).unwrap();\n        let result = base * multiplier;\n        result\n    }\n}`
  },
  {
    label: 'Secure & Idiomatic Contract (Passing Clean)',
    code: `use soroban_sdk::{contract, contractimpl, Env, Address, panic_with_error};\n\n#[contract]\npub struct SecureVault;\n\n#[contractimpl]\nimpl SecureVault {\n    pub fn deposit(env: Env, caller: Address, amount: i128) -> Result<i128, ()> {\n        caller.require_auth();\n        env.storage().instance().extend_ttl(50000, 100000);\n        \n        let current = env.storage().persistent().get(&caller).unwrap_or(0);\n        let updated = current.checked_add(amount).ok_or(())?;\n        env.storage().persistent().set(&caller, &updated);\n        Ok(updated)\n    }\n}`
  }
];

export default function LinterTab() {
  const [code, setCode] = useState(LINT_PRESETS[0].code);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleRunLint = () => {
    const result = lintContractCode(code);
    setReport(result);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">Soroban Smart Contract Static Linter</h2>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Detect common Soroban host traps, unhandled unwraps, missing auth checks, and storage anti-patterns before deploying.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="input text-xs py-1.5 px-3 max-w-xs"
            onChange={(e) => {
              const selected = LINT_PRESETS.find(p => p.label === e.target.value);
              if (selected) {
                setCode(selected.code);
                setReport(null);
              }
            }}
            defaultValue={LINT_PRESETS[0].label}
          >
            {LINT_PRESETS.map((p, idx) => (
              <option key={idx} value={p.label}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Area */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold flex items-center gap-2">
              <FileCode className="w-4 h-4 text-primary" />
              Soroban Rust Contract Code
            </label>
            <button onClick={copyCode} className="btn btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={15}
            className="input font-mono text-xs w-full leading-relaxed p-3 bg-surface-subtle"
            placeholder="Paste your Soroban Rust contract code here..."
          />

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleRunLint} className="btn btn-primary flex items-center gap-2 text-sm">
              <Play className="w-4 h-4" />
              Run Linter & Analysis
            </button>
            <button
              onClick={() => {
                setCode('');
                setReport(null);
              }}
              className="btn btn-secondary flex items-center gap-1 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Static Analysis Report
          </h3>

          {!report ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface-subtle/50 text-text-muted space-y-2">
              <BookOpen className="w-8 h-8 mx-auto opacity-40 text-primary" />
              <p className="text-sm font-medium">No analysis performed yet</p>
              <p className="text-xs">Click "Run Linter & Analysis" to scan the contract code against 5 verified Soroban anti-pattern rules.</p>
            </div>
          ) : report.totalFindings === 0 ? (
            <div className="p-6 rounded-xl border border-success/30 bg-success/10 text-success space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Zero Vulnerabilities Detected!
              </div>
              <p className="text-xs text-text-muted">
                The analyzed code follows Soroban best practices with verified auth guards, safe error handling, and TTL hygiene.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-danger/10 text-danger border border-danger/20">
                  {report.criticalCount} Critical
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning border border-warning/20">
                  {report.warningCount} Warnings
                </span>
                <span className="text-xs text-text-muted ml-auto">
                  {report.totalFindings} total findings
                </span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {report.findings.map((f, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                      f.severity === 'CRITICAL'
                        ? 'border-danger/30 bg-danger/5'
                        : 'border-warning/30 bg-warning/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-text">
                        Line {f.lineNum}: {f.name}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        f.severity === 'CRITICAL' ? 'bg-danger text-white' : 'bg-warning text-black'
                      }`}>
                        {f.severity}
                      </span>
                    </div>

                    <p className="text-text-muted">{f.message}</p>

                    <div className="p-1.5 rounded bg-surface font-mono text-[11px] text-text-muted truncate">
                      {f.lineContent}
                    </div>

                    <div className="pt-1 text-[11px] text-accent">
                      <span className="font-semibold">Remedy:</span> {f.remediation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
