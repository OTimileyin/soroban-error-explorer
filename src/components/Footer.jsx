import React from 'react';
import { Terminal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Terminal size={18} color="var(--color-trace-teal)" />
          <span className="footer-brand-name">TrapTrace Ecosystem</span>
          <span>— Open Source Soroban Developer Tooling</span>
        </div>
      </div>
    </footer>
  );
}
