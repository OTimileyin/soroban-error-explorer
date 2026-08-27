import React, { useEffect, useState } from 'react';
import { BookOpen, Terminal, Shield, Cpu, Database, Copy, Check, ExternalLink, AlertTriangle, Layers, Zap, Code2 } from 'lucide-react';

const SECTIONS = [
  { id: 'cli-quickstart', label: 'CLI Suite (v0.3.0)' },
  { id: 'sdk-integration', label: '@traptrace/sdk (npm)' },
  { id: 'error-architecture', label: 'Soroban Error Architecture' },
  { id: 'state-archival', label: 'State Archival & TTL Expiration' },
  { id: 'contribution-schema', label: 'Schema & Testnet Verification' }
];

export default function Documentation() {
  const [copiedCmd, setCopiedCmd] = useState('');
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    const update = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveSection(SECTIONS[SECTIONS.length - 1].id);
        return;
      }
      const bandTop = window.innerHeight * 0.25;
      let current = SECTIONS[0].id;
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= bandTop) current = id;
      }
      setActiveSection(current);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  return (
    <div className="docs">
      {/* Docs Header Banner */}
      <div className="docs-banner">
        <div className="docs-banner-title">
          <BookOpen size={28} color="var(--color-trace-teal)" />
          TrapTrace Developer Documentation &amp; Reference Guide
        </div>
        <p>
          Complete guide to the TrapTrace operational diagnostics platform: Python CLI (v0.3.0), JavaScript/TypeScript SDK (@traptrace/sdk),
          state archival lifecycles (CAP-0046), contract authorization trees, and 29 testnet-verified error patterns.
        </p>
      </div>

      <div className="docs-layout">
        {/* Sidebar Nav */}
        <aside className="docs-toc">
          <div className="toc-panel">
            <p className="section-head" style={{ marginBottom: '12px', paddingLeft: '8px' }}>
              Table of Contents
            </p>
            <nav className="toc-list" aria-label="Documentation sections">
              {SECTIONS.map(({ id, label }, idx) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`toc-link ${activeSection === id ? 'toc-link--active' : ''}`}
                  aria-current={activeSection === id ? 'location' : undefined}
                >
                  {idx + 1}. {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Body */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Section 1 */}
          <section id="cli-quickstart" className="doc-section">
            <h2 className="doc-section-title">
              <Terminal color="var(--color-trace-teal)" size={20} /> 1. Operational CLI Suite (traptrace v0.3.0)
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Install the zero-dependency Python CLI tool to inspect on-chain transactions, simulate contracts, validate authorization trees, and generate auto-fix remediation code directly from your terminal.
            </p>

            <div className="copy-row">
              <code>pip install traptrace-cli</code>
              <button onClick={() => copyToClipboard('pip install traptrace-cli', 'pip')} className="btn btn-secondary" style={{ padding: '5px 11px', fontSize: '12px' }}>
                {copiedCmd === 'pip' ? <Check size={14} color="var(--color-trace-teal)" /> : <Copy size={14} />}
              </button>
            </div>

            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>
              Operational Commands Overview:
            </h4>
            <pre className="code-block">
              <code>{`# Inspect failed on-chain transaction by hash
traptrace inspect <TX_HASH> --network testnet

# Multi-transaction batch dataset diagnostics
traptrace batch-inspect failed_transactions.json --export-md report.md

# Pre-flight simulation with ANSI TUI resource meters
traptrace simulate <TRANSACTION_ENVELOPE_XDR>

# Validate contract authorization tree and require_auth signatures
traptrace auth-check <INVOCATION_XDR>

# Generate ready-to-paste Rust remediation code
traptrace fix arith-error --export-rs fix.rs

# Compare resource costs between two transactions
traptrace diff <TX_HASH_1> <TX_HASH_2>

# Inspect contract WASM ABI and exported specifications
traptrace abi <CONTRACT_ID> --network testnet

# Run static smart contract linter
traptrace lint <CONTRACT_FILE.rs>

# Profile gas, memory, and footprint of simulation
traptrace profile <TX_ENVELOPE_XDR>

# Generate Soroban SDK reproduction unit tests
traptrace generate-test <ERROR_ID>`}</code>
            </pre>
          </section>

          {/* Section 2 */}
          <section id="sdk-integration" className="doc-section">
            <h2 className="doc-section-title">
              <Code2 color="var(--color-trace-teal)" size={20} /> 2. JavaScript / TypeScript SDK (@traptrace/sdk)
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Integrate real-time Soroban diagnostic error decoding, authorization tree checking, and auto-fix suggestions directly into your browser dApps and Node.js backend services.
            </p>

            <div className="copy-row">
              <code>npm install @traptrace/sdk</code>
              <button onClick={() => copyToClipboard('npm install @traptrace/sdk', 'npm')} className="btn btn-secondary" style={{ padding: '5px 11px', fontSize: '12px' }}>
                {copiedCmd === 'npm' ? <Check size={14} color="var(--color-trace-teal)" /> : <Copy size={14} />}
              </button>
            </div>

            <pre className="code-block">
              <code>{`import { diagnoseSorobanError, TrapTraceClient, validateAuthTree } from '@traptrace/sdk';

// 1. Decode cryptic host trap into root cause and auto-fix snippet
const diag = diagnoseSorobanError("Error: HostError::ArithDomain overflow");
console.log("Root Cause:", diag.matchedEntry.title);
console.log("Remediation Snippet:\\n", diag.fix.remediated);

// 2. Pre-flight simulate transaction on Stellar Testnet
const client = new TrapTraceClient('testnet');
const simResult = await client.simulateTransaction(txXdr);

// 3. Check authorization trees before signing
const auth = validateAuthTree(txXdr);
if (!auth.isValid) {
  console.error("Auth Failure:", auth.issues);
}

// 4. Run static linter on contract source
import { lintContractCode, profileSimulation, generateRustTest } from '@traptrace/sdk';
const lintReport = lintContractCode(contractCode);
const profile = profileSimulation(simResult);
const rustTest = generateRustTest('arith-error');`}</code>
            </pre>
          </section>

          {/* Section 3 */}
          <section id="error-architecture" className="doc-section">
            <h2 className="doc-section-title">
              <Cpu color="var(--color-trap-amber)" size={20} /> 3. Soroban Error Architecture
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Errors in Soroban occur across four distinct architectural layers. Understanding which layer emitted the error accelerates resolution:
            </p>

            <div className="doc-grid-2">
              <div className="doc-card">
                <h4 data-accent="host">Host Errors (VM Layer)</h4>
                <p>Emitted by the Soroban Environment VM when execution budget limits are exceeded, panics occur, integer overflows happen, or invalid contract IDs are called.</p>
              </div>
              <div className="doc-card">
                <h4 data-accent="cli">CLI Errors (Tooling Layer)</h4>
                <p>Occur during key management, un-funded account deployment attempts, network passphrase mismatches, or sequence number conflicts (txBAD_SEQ).</p>
              </div>
              <div className="doc-card">
                <h4 data-accent="rpc">RPC Simulation Errors</h4>
                <p>Returned by simulateTransaction when authorization trees fail verification, state entries are archived, or footprint storage keys are missing.</p>
              </div>
              <div className="doc-card">
                <h4 data-accent="sdk">SDK Conversion Errors</h4>
                <p>Raised when client libraries fail to deserialize raw XDR ScVal structures into native JavaScript or Rust types.</p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="state-archival" className="doc-section">
            <h2 className="doc-section-title">
              <Database color="#5B9DF0" size={20} /> 4. State Archival &amp; TTL Expiration (CAP-0046)
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              Soroban persistent and instance storage entries are bounded by a Time-To-Live (TTL) ledger counter. If an entry reaches zero remaining TTL ledgers, it is archived to prevent ledger bloat.
            </p>

            <div className="doc-note">
              <AlertTriangle size={18} color="var(--color-trap-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                <strong>Important:</strong> Attempting to read or write an archived storage key raises{' '}
                <code className="code-inline">HostError::EntryArchived</code>. To restore an archived key,
                issue a <code className="code-inline">RestoreFootprint</code> operation.
              </span>
            </div>

            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '8px', fontWeight: 600 }}>
              Extending TTL in Contract Logic:
            </h4>
            <pre className="code-block">
              <code>{`// Extend storage key lifespan by 100,000 ledgers if remaining TTL < 1,000 ledgers
env.storage().persistent().extend_ttl(&storage_key, 1000, 100000);`}</code>
            </pre>
          </section>

          {/* Section 5 */}
          <section id="contribution-schema" className="doc-section">
            <h2 className="doc-section-title">
              <Shield color="var(--color-trace-teal)" size={20} /> 5. Schema &amp; Testnet Verification Harness
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              All 29 catalog entries in <code className="code-inline">soroban-error-index</code> are backed by empirical testnet execution logs in <code className="code-inline">verification/</code>, validated with JSON Schema in CI.
            </p>

            <pre className="code-block">
              <code>{`# Run full automated testnet verification suite
python3 tools/verify_entries.py

# Validate schema integrity
python3 tools/validate_schema.py

# Check cross-reference link integrity
python3 tools/check_links.py`}</code>
            </pre>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ExternalLink size={13} color="var(--color-trace-teal)" />
              See the <a href="https://github.com/TrapTrace" target="_blank" rel="noreferrer" style={{ color: 'var(--color-trace-teal)' }}>TrapTrace Organization</a> on GitHub for full source code and contribution guidelines.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
