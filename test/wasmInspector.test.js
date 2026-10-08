import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Address, xdr } from '@stellar/stellar-sdk';
import { fetchContractSpec } from '../src/utils/wasmInspector.js';
import { NETWORKS } from '../src/utils/stellarRpc.js';

const id = Address.contract(Buffer.alloc(32, 1)).toString();
function leb(value) {
  const bytes = [];
  do { const byte = value & 127; value >>>= 7; bytes.push(byte | (value ? 128 : 0)); } while (value);
  return Buffer.from(bytes);
}
const entry = xdr.ScSpecEntry.scSpecEntryFunctionV0(new xdr.ScSpecFunctionV0({
  name: 'actual_method', doc: 'Deployed spec',
  inputs: [new xdr.ScSpecFunctionInputV0({ name: 'amount', doc: '', type: xdr.ScSpecTypeDef.scSpecTypeI128() })],
  outputs: [],
}));
const name = Buffer.from('contractspecv0');
const section = Buffer.concat([leb(name.length), name, entry.toXDR()]);
const wasm = Buffer.concat([Buffer.from([0,97,115,109,1,0,0,0,0]), leb(section.length), section]);
const server = {
  getNetwork: async () => ({ passphrase: NETWORKS.testnet.passphrase }),
  getContractWasmByContractId: async contractId => { assert.equal(contractId, id); return wasm; },
};

test('deployed WASM spec is decoded with real argument types and void output', async () => {
  const spec = await fetchContractSpec(id, 'testnet', { server });
  assert.equal(spec.contractId, id);
  assert.equal(spec.functions[0].name, 'actual_method');
  assert.deepEqual(spec.functions[0].inputs, [{ name: 'amount', type: 'I128' }]);
  assert.deepEqual(spec.functions[0].outputs, []);
});
test('invalid addresses, unknown networks and wrong network identity are rejected', async () => {
  await assert.rejects(fetchContractSpec('Cfake', 'testnet', { server }), /checksummed/);
  await assert.rejects(fetchContractSpec(id, 'unknown', { server }), /network/);
  await assert.rejects(fetchContractSpec(id, 'mainnet', { server }), /identity/);
});
test('missing contracts and missing WASM spec never return fabricated functions', async () => {
  await assert.rejects(fetchContractSpec(id, 'testnet', { server: {
    ...server, getContractWasmByContractId: async () => { throw new Error('not found'); },
  } }), /not found/);
  await assert.rejects(fetchContractSpec(id, 'testnet', { server: {
    ...server, getContractWasmByContractId: async () => Buffer.from([0,97,115,109,1,0,0,0]),
  } }), /spec/);
});
