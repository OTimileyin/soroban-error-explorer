import { contract, rpc, StrKey } from '@stellar/stellar-sdk';
import { NETWORKS } from './stellarRpc.js';

function typeName(type) {
  const name = type.switch().name.replace(/^scSpecType/, '');
  if (name === 'Udt') return type.udt().name().toString();
  if (name === 'Vec') return `Vec<${typeName(type.vec().elementType())}>`;
  if (name === 'Option') return `Option<${typeName(type.option().valueType())}>`;
  if (name === 'Result') return `Result<${typeName(type.result().okType())}, ${typeName(type.result().errorType())}>`;
  if (name === 'Map') return `Map<${typeName(type.map().keyType())}, ${typeName(type.map().valueType())}>`;
  if (name === 'Tuple') return `(${type.tuple().valueTypes().map(typeName).join(', ')})`;
  if (name === 'BytesN') return `BytesN<${type.bytesN().n()}>`;
  return name;
}

/** Read declared methods from deployed WASM. Missing contracts never produce samples. */
export async function fetchContractSpec(contractId, network = 'testnet', { server } = {}) {
  const config = NETWORKS[network];
  if (!config) throw new Error('Unsupported Stellar network');
  if (typeof contractId !== 'string' || !StrKey.isValidContract(contractId)) {
    throw new Error('Enter a valid checksummed contract address (C...)');
  }
  const client = server ?? new rpc.Server(config.rpcUrl);
  if (!server) client.httpClient.defaults.timeout = 10000;
  const identity = await client.getNetwork();
  if (identity.passphrase !== config.passphrase) throw new Error('RPC network identity does not match the selected network');
  const wasm = await client.getContractWasmByContractId(contractId);
  const spec = contract.Spec.fromWasm(wasm);
  return { contractId, network, functions: spec.funcs().map(fn => ({
    name: fn.name().toString(), doc: fn.doc().toString(),
    inputs: fn.inputs().map(input => ({ name: input.name().toString(), type: typeName(input.type()) })),
    outputs: fn.outputs().map(type => ({ type: typeName(type) })),
  })) };
}
