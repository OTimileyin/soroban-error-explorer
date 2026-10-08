import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Address, xdr } from '@stellar/stellar-sdk';
import { validateAuthTree } from '../src/utils/auth.js';

test('arbitrary text and malformed XDR cannot report authorization success', () => {
  for (const value of ['', 'this is definitely not valid XDR or a signature', 'AAAA']) {
    const report = validateAuthTree(value);
    assert.equal(report.isValid, false);
    assert.equal(report.status, 'FAIL');
    assert.equal(report.signaturesVerified, false);
  }
});
test('real authorization entry is decoded with signatures unverified', () => {
  const entry = new xdr.SorobanAuthorizationEntry({
    credentials: xdr.SorobanCredentials.sorobanCredentialsSourceAccount(),
    rootInvocation: new xdr.SorobanAuthorizedInvocation({
      function: xdr.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(new xdr.InvokeContractArgs({
        contractAddress: Address.contract(Buffer.alloc(32, 1)).toScAddress(), functionName: 'actual_function', args: [],
      })), subInvocations: [],
    }),
  });
  const report = validateAuthTree(entry.toXDR('base64'));
  assert.equal(report.isValid, true);
  assert.equal(report.functionName, 'actual_function');
  assert.equal(report.status, 'REVIEW_REQUIRED');
  assert.equal(report.signaturesVerified, false);
});
