import React, { useState } from 'react';
import { Cpu, Database, DollarSign, Activity, Play, RefreshCw, BarChart2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { profileSimulation, MAX_CPU_INSTRUCTIONS, MAX_MEM_BYTES } from '../utils/profiler';
import ResourceGauge from './ResourceGauge';

const PROFILE_PRESETS = [
  {
    label: 'Standard Token Transfer (Light)',
    simData: {
      cost: { cpuInsns: 1_250_000, memBytes: 524_288 },
      minResourceFee: 15_000,
      transactionData: { footprint: { readOnly: ['SAC_INSTANCE'], readWrite: ['BALANCE_SRC', 'BALANCE_DST'] } }
    }
  },
  {
    label: 'Heavy Computation / Cryptographic Signature (Moderate)',
    simData: {
      cost: { cpuInsns: 48_500_000, memBytes: 15_728_640 },
      minResourceFee: 450_000,
      transactionData: { footprint: { readOnly: ['PUBKEY_REGISTRY', 'CONFIG'], readWrite: ['SESSION_STATE'] } }
    }
  },
  {
    label: 'Massive Batch Storage Loop (Critical / Near Limit)',
    simData: {
      cost: { cpuInsns: 92_000_000, memBytes: 38_500_000 },
      minResourceFee: 2_850_000,
      transactionData: { footprint: { readOnly: ['CFG_1', 'CFG_2'], readWrite: Array.from({ length: 45 }, (_, i) => `ENTRY_${i}`) } }
    }
  }
];

export default function ProfilerTab() {
  const [selectedPreset, setSelectedPreset] = useState(PROFILE_PRESETS[0]);
  const [customCpu, setCustomCpu] = useState(PROFILE_PRESETS[0].simData.cost.cpuInsns);
  const [customMem, setCustomMem] = useState(PROFILE_PRESETS[0].simData.cost.memBytes);
  const [customFee, setCustomFee] = useState(PROFILE_PRESETS[0].simData.minResourceFee);

  const currentSimData = {
    cost: { cpuInsns: customCpu, memBytes: customMem },
    minResourceFee: customFee,
    transactionData: selectedPreset.simData.transactionData
  };

  const profile = profileSimulation(currentSimData);

  return (
    <div className="card space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-primary/10 text-primary">
              <BarChart2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold">Soroban Gas & Resource Profiler</h2>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Simulate and benchmark transaction execution costs, CPU instruction consumption, memory footprints, and resource fees.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="input text-xs py-1.5 px-3 max-w-xs"
            value={selectedPreset.label}
            onChange={(e) => {
              const p = PROFILE_PRESETS.find(x => x.label === e.target.value);
              if (p) {
                setSelectedPreset(p);
                setCustomCpu(p.simData.cost.cpuInsns);
                setCustomMem(p.simData.cost.memBytes);
                setCustomFee(p.simData.minResourceFee);
              }
            }}
          >
            {PROFILE_PRESETS.map((p, idx) => (
              <option key={idx} value={p.label}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceGauge
          label="CPU Gas Instructions"
          value={profile.cpu.used}
          max={MAX_CPU_INSTRUCTIONS}
          unit="insns"
          percentage={profile.cpu.percentage}
          status={profile.cpu.status}
        />
        <ResourceGauge
          label="WASM VM Memory RAM"
          value={(profile.memory.used / 1024 / 1024).toFixed(2)}
          max={40}
          unit="MiB"
          percentage={profile.memory.percentage}
          status={profile.memory.status}
        />
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-semibold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-primary" />
              Ledger Footprint
            </span>
          </div>
          <div className="text-xl font-bold text-text">
            {profile.footprint.readOnlyCount + profile.footprint.readWriteCount} Entries
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted pt-1 border-t border-border/50">
            <span>Read-Only: {profile.footprint.readOnlyCount}</span>
            <span>Read-Write: {profile.footprint.readWriteCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="font-semibold flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-success" />
              Resource Fee
            </span>
          </div>
          <div className="text-xl font-bold text-text">
            {profile.fees.xlm.toFixed(5)} XLM
          </div>
          <div className="text-xs text-text-muted pt-1 border-t border-border/50 font-mono">
            {profile.fees.stroops.toLocaleString()} stroops
          </div>
        </div>
      </div>

      {/* Interactive Sliders */}
      <div className="p-5 rounded-xl border border-border bg-surface-subtle space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent" />
          Interactive Resource Tuning
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-text-muted">Simulated CPU Instructions:</span>
              <span className="font-mono font-bold">{customCpu.toLocaleString()} / 100M</span>
            </div>
            <input
              type="range"
              min="100000"
              max={MAX_CPU_INSTRUCTIONS}
              step="500000"
              value={customCpu}
              onChange={(e) => setCustomCpu(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-text-muted">Simulated Memory Allocation:</span>
              <span className="font-mono font-bold">{(customMem / 1024 / 1024).toFixed(2)} MiB / 40 MiB</span>
            </div>
            <input
              type="range"
              min="65536"
              max={MAX_MEM_BYTES}
              step="524288"
              value={customMem}
              onChange={(e) => setCustomMem(Number(e.target.value))}
              className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
