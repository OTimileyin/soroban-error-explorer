/**
 * TrapTrace Gas & Resource Profiler for Web Explorer.
 */

export const MAX_CPU_INSTRUCTIONS = 100_000_000;
export const MAX_MEM_BYTES = 41_943_040; // 40 MiB
export const MAX_READ_BYTES = 200_000;
export const MAX_WRITE_BYTES = 65_536;

export function profileSimulation(simResult) {
  const cost = simResult?.cost || {};
  const cpuInsns = Number(cost.cpuInsns || 0);
  const memBytes = Number(cost.memBytes || 0);
  const minResourceFee = Number(simResult?.minResourceFee || 0);

  const footprint = simResult?.transactionData?.footprint || {};
  const readOnly = footprint.readOnly || [];
  const readWrite = footprint.readWrite || [];

  const cpuPct = Math.min(100, (cpuInsns / MAX_CPU_INSTRUCTIONS) * 100);
  const memPct = Math.min(100, (memBytes / MAX_MEM_BYTES) * 100);

  return {
    cpu: {
      used: cpuInsns,
      limit: MAX_CPU_INSTRUCTIONS,
      percentage: Number(cpuPct.toFixed(2)),
      status: cpuPct < 70 ? 'NORMAL' : (cpuPct < 90 ? 'WARNING' : 'CRITICAL')
    },
    memory: {
      used: memBytes,
      limit: MAX_MEM_BYTES,
      percentage: Number(memPct.toFixed(2)),
      status: memPct < 70 ? 'NORMAL' : (memPct < 90 ? 'WARNING' : 'CRITICAL')
    },
    footprint: {
      readOnlyCount: readOnly.length,
      readWriteCount: readWrite.length
    },
    fees: {
      stroops: minResourceFee,
      xlm: minResourceFee / 10_000_000
    }
  };
}
