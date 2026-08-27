/**
 * TrapTrace Linter for Soroban Smart Contracts (Browser & Node.js Engine).
 */

export const LINT_RULES = [
  {
    id: 'TT-LINT-001',
    name: 'UNSAFE_UNWRAP',
    severity: 'CRITICAL',
    category: 'panic',
    errorId: 'option-unwrap-none',
    pattern: /\.(?:unwrap|expect)\s*\(/g,
    message: 'Unsafe .unwrap() or .expect() detected; unhandled None/Err will trigger a WASM panic and revert transactions.',
    remediation: "Use '?' operator with custom #[contracterror] enums, or use .unwrap_or() / match."
  },
  {
    id: 'TT-LINT-002',
    name: 'RAW_ARITHMETIC',
    severity: 'WARNING',
    category: 'math',
    errorId: 'arith-error',
    pattern: /(?:\b[a-zA-Z_]\w*\s*(?:\+|\-|\*|\/)\s*[a-zA-Z0-9_]+)(?!\s*\/\/)(?!\s*=>)/g,
    message: 'Raw arithmetic operator detected; unchecked arithmetic may trigger HostError::ArithDomain on overflow/underflow.',
    remediation: 'Use checked_add(), checked_sub(), checked_mul(), or saturating arithmetic methods.'
  },
  {
    id: 'TT-LINT-003',
    name: 'MISSING_STORAGE_TTL_EXTEND',
    severity: 'WARNING',
    category: 'storage',
    errorId: 'instance-storage-expired',
    pattern: /env\.storage\(\)\.(?:instance|persistent)\(\)\.set\s*\(/g,
    negativeCheck: /extend_ttl/,
    message: 'State written to storage without explicit TTL extension; idle entries risk archival under CAP-0046.',
    remediation: 'Add env.storage().instance().extend_ttl(threshold, extend_to) after storage writes.'
  },
  {
    id: 'TT-LINT-004',
    name: 'UNGUARDED_CALLER_MUTATION',
    severity: 'CRITICAL',
    category: 'auth',
    errorId: 'require-auth-missing',
    pattern: /pub\s+fn\s+\w+\s*\([^)]*caller\s*:\s*Address[^)]*\)/g,
    negativeCheck: /caller\.require_auth\s*\(/,
    message: 'Function accepts caller Address but lacks explicit require_auth() validation check.',
    remediation: 'Invoke caller.require_auth() at the beginning of the function body.'
  },
  {
    id: 'TT-LINT-005',
    name: 'DIRECT_VEC_INDEXING',
    severity: 'CRITICAL',
    category: 'collection',
    errorId: 'vec-index-out-of-bounds',
    pattern: /\.get\s*\([^)]+\)\.unwrap\s*\(/g,
    message: 'Direct vector/map .get().unwrap() indexing will panic on out-of-bounds or key miss.',
    remediation: 'Handle None return value safely with match, if-let, or ok_or(Error::NotFound)?.'
  }
];

export function lintContractCode(code) {
  const findings = [];
  const lines = (code || '').split('\n');

  for (const rule of LINT_RULES) {
    if (rule.negativeCheck && rule.negativeCheck.test(code)) {
      continue;
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return;
      }

      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        if (rule.id === 'TT-LINT-002') {
          if (line.includes('fn ') || line.includes('impl ') || line.includes('struct ') || !line.includes('let ')) {
            return;
          }
          if (!line.includes('+ 1') && !line.includes('- 1') && !line.includes(' * ') && !line.includes(' / ')) {
            return;
          }
        }

        findings.push({
          ruleId: rule.id,
          name: rule.name,
          severity: rule.severity,
          message: rule.message,
          lineNum: index + 1,
          lineContent: trimmed,
          remediation: rule.remediation,
          errorId: rule.errorId
        });
      }
    });
  }

  return {
    totalFindings: findings.length,
    criticalCount: findings.filter(f => f.severity === 'CRITICAL').length,
    warningCount: findings.filter(f => f.severity === 'WARNING').length,
    findings
  };
}
