/**
 * TrapTrace Browser Stellar & Soroban RPC Client
 * Zero-dependency JSON-RPC 2.0 and Horizon client with diagnostics parser
 */

export const NETWORKS = {
  testnet: {
    name: 'Testnet',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
    explorerTxUrl: 'https://stellar.expert/explorer/testnet/tx/',
    explorerContractUrl: 'https://stellar.expert/explorer/testnet/contract/'
  },
  mainnet: {
    name: 'Mainnet',
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    horizonUrl: 'https://horizon.stellar.org',
    passphrase: 'Public Global Stellar Network ; September 2015',
    explorerTxUrl: 'https://stellar.expert/explorer/public/tx/',
    explorerContractUrl: 'https://stellar.expert/explorer/public/contract/'
  },
  futurenet: {
    name: 'Futurenet',
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    passphrase: 'Test SDF Future Network ; October 2022',
    explorerTxUrl: 'https://stellar.expert/explorer/futurenet/tx/',
    explorerContractUrl: 'https://stellar.expert/explorer/futurenet/contract/'
  }
};

/**
 * Execute JSON-RPC request against Soroban node
 */
export async function sendRpcRequest(method, params = {}, network = 'testnet', customRpc = null) {
  const endpoint = customRpc || NETWORKS[network]?.rpcUrl || NETWORKS.testnet.rpcUrl;
  
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`RPC HTTP Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    const msg = data.error.message || JSON.stringify(data.error);
    const code = data.error.code ? ` (code ${data.error.code})` : '';
    throw new Error(`RPC Error${code}: ${msg}`);
  }

  return data.result;
}

/**
 * Fetch latest ledger from RPC
 */
export async function getLatestLedger(network = 'testnet') {
  return sendRpcRequest('getLatestLedger', {}, network);
}

/**
 * Fetch transaction by hash from Soroban RPC and Horizon fallback
 */
export async function inspectTransaction(txHash, network = 'testnet', customRpc = null) {
  const cleanHash = txHash.trim().replace(/^0x/, '');
  
  let rpcResult = null;
  let horizonResult = null;
  let rpcError = null;
  let horizonError = null;

  // 1. Query Soroban RPC
  try {
    rpcResult = await sendRpcRequest('getTransaction', { hash: cleanHash }, network, customRpc);
  } catch (err) {
    rpcError = err.message;
  }

  // 2. Query Horizon for complementary metadata
  const horizonUrl = NETWORKS[network]?.horizonUrl;
  if (horizonUrl) {
    try {
      const resp = await fetch(`${horizonUrl}/transactions/${cleanHash}`, { signal: AbortSignal.timeout(10000) });
      if (resp.ok) {
        horizonResult = await resp.json();
      }
    } catch (err) {
      horizonError = err.message;
    }
  }

  return {
    hash: cleanHash,
    network,
    rpcResult,
    horizonResult,
    rpcError,
    horizonError
  };
}

/**
 * Simulate transaction envelope XDR
 */
export async function simulateTransaction(transactionXdr, network = 'testnet', customRpc = null) {
  const cleanXdr = transactionXdr.trim();
  return sendRpcRequest('simulateTransaction', { transaction: cleanXdr }, network, customRpc);
}

/**
 * Audit contract storage keys & TTL
 */
export async function auditContractStorage(contractId, network = 'testnet', customRpc = null) {
  const cleanId = contractId.trim();
  
  // 1. Fetch latest ledger for TTL calculation
  const latestLedger = await getLatestLedger(network);
  const currentLedgerSeq = latestLedger?.sequence || 0;

  // 2. Query getEvents for contract activity
  let recentEvents = [];
  try {
    const eventsResult = await sendRpcRequest('getEvents', {
      startLedger: Math.max(1, currentLedgerSeq - 500),
      filters: [{ type: 'contract', contractIds: [cleanId] }],
      pagination: { limit: 10 }
    }, network, customRpc);
    recentEvents = eventsResult?.events || [];
  } catch {
    // Events might be empty or pruned
  }

  return {
    contractId: cleanId,
    network,
    currentLedgerSeq,
    protocolVersion: latestLedger?.protocolVersion,
    recentEvents
  };
}

/**
 * Query contract events for real-time live streaming
 */
export async function fetchContractEvents({ contractId, startLedger, network = 'testnet', limit = 20, customRpc = null }) {
  const params = {
    startLedger,
    pagination: { limit }
  };
  if (contractId && contractId.trim()) {
    params.filters = [{ type: 'contract', contractIds: [contractId.trim()] }];
  }
  return sendRpcRequest('getEvents', params, network, customRpc);
}

/**
 * Decode base64 DiagnosticEvent or SCVal into readable structure
 */
export function decodeDiagnosticString(base64Str) {
  try {
    const rawStr = atob(base64Str.trim());
    // Extract readable ASCII strings from binary representation
    const printableMatches = rawStr.match(/[\x20-\x7E]{3,}/g) || [];
    return {
      success: true,
      rawLength: rawStr.length,
      extractedStrings: printableMatches,
      hexPreview: Array.from(rawStr.slice(0, 64)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ')
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Intelligent Error Diagnostic Analyzer:
 * Matches transaction results & events against the TrapTrace Error Catalog
 */
export function diagnoseFailure(inspectionData, catalogEntries = []) {
  const matches = [];
  const symptomsFound = [];

  const { rpcResult, horizonResult } = inspectionData;
  const status = rpcResult?.status || (horizonResult?.successful === false ? 'FAILED' : 'UNKNOWN');
  
  const rawTextToSearch = JSON.stringify({
    rpc: rpcResult,
    horizon: horizonResult
  }).toLowerCase();

  // Search catalog for known patterns
  catalogEntries.forEach(entry => {
    let score = 0;
    const reasons = [];

    // Check exact error code
    if (entry.error_code && rawTextToSearch.includes(entry.error_code.toLowerCase())) {
      score += 50;
      reasons.push(`Exact error code match: \`${entry.error_code}\``);
    }

    // Check entry ID / keywords
    const keywords = [entry.id, ...(entry.tags || [])];
    keywords.forEach(kw => {
      if (kw.length > 3 && rawTextToSearch.includes(kw.toLowerCase())) {
        score += 15;
        reasons.push(`Matched diagnostic keyword: "${kw}"`);
      }
    });

    // Check symptoms snippet
    if (entry.symptoms) {
      const phrases = entry.symptoms.split('.').filter(p => p.trim().length > 10);
      phrases.forEach(phrase => {
        const cleanP = phrase.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim();
        if (cleanP && rawTextToSearch.includes(cleanP.slice(0, 20))) {
          score += 25;
          reasons.push(`Symptom profile match: "${phrase.trim().slice(0, 40)}..."`);
        }
      });
    }

    if (score >= 20) {
      matches.push({
        entry,
        confidence: Math.min(99, score),
        reasons: Array.from(new Set(reasons))
      });
    }
  });

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  return {
    status,
    isFailed: status === 'FAILED' || horizonResult?.successful === false,
    matches,
    symptomsFound
  };
}
