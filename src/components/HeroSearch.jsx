import React, { useEffect, useRef } from 'react';
import { Search, X, Command } from 'lucide-react';

export default function HeroSearch({ searchQuery, setSearchQuery }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className="hero">
      <div className="hero-inner">

        <h1 className="hero-title">
          Search Soroban Smart Contract Errors &amp; Fixes
        </h1>

        <p className="hero-subtitle">
          Type an error string, WASM host trap, CLI code, or RPC message to get instant root cause diagnostics and code fixes.
        </p>

        {/* Search Input */}
        <div className="search-bar">
          <Search size={20} color="var(--color-trace-teal)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Paste error text (e.g. HostError::BudgetExceeded, Storage, txBAD_SEQ)..."
            className="search-input"
            aria-label="Search errors"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="search-clear"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          ) : (
            <span className="kbd-hint">
              <Command size={12} /> /
            </span>
          )}
        </div>

        {/* Signature terminal motif */}
        <div className="terminal" aria-hidden="true">
          <div className="terminal-bar">
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-title">trap-trace — diagnostics</span>
          </div>
          <div className="terminal-body">
            <span className="terminal-line tl-cmd">
              <span className="prompt">$ </span>
              <span className="cmd-text">soroban-explain "HostError::BudgetExceeded"</span>
            </span>
            <span className="terminal-line tl-dim">┌─ TrapTrace · 10 entries indexed · 10 verified ──────────────</span>
            <span className="terminal-line tl-warn">│ cause  → unbounded loop in process_all_items (CPU budget)</span>
            <span className="terminal-line tl-ok">│ fix    → chunk processing into batches; use host crypto primitives</span>
            <span className="terminal-line tl-ok">│ status → verified on testnet · Soroban v21.0.0</span>
            <span className="terminal-line tl-dim">└──────────────────────────────────────────────────────────</span>
            <span className="terminal-line tl-dim">$ <span className="terminal-cursor" /></span>
          </div>
        </div>
      </div>
    </section>
  );
}
