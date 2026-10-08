import { Address, buildInvocationTree, xdr } from '@stellar/stellar-sdk';

/** Decode one SorobanAuthorizationEntry. Parsing never establishes signature validity. */
export function validateAuthTree(xdrString) {
  const result = {
    isValid: false, status: 'FAIL', signaturesVerified: false, requiredSigners: [],
    functionName: null, invocation: null, credentialsType: null, issues: [],
  };
  try {
    if (typeof xdrString !== 'string' || xdrString.length > 1024 * 1024
        || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(xdrString)
        || !xdrString) throw new Error('Expected canonical base64 SorobanAuthorizationEntry XDR');
    const entry = xdr.SorobanAuthorizationEntry.fromXDR(xdrString, 'base64');
    if (entry.toXDR('base64') !== xdrString) throw new Error('Noncanonical or trailing authorization XDR');
    const credentials = entry.credentials();
    result.credentialsType = credentials.switch().name;
    switch (credentials.switch().value) {
      case 0:
        result.issues.push('Source-account authorization requires a verified transaction envelope');
        break;
      case 1:
      case 2: {
        const address = credentials.switch().value === 1 ? credentials.address() : credentials.addressV2();
        result.requiredSigners = [Address.fromScAddress(address.address()).toString()];
        result.issues.push('Address signatures, nonce, expiration and network authorization have not been verified');
        break;
      }
      default:
        throw new Error('Unsupported delegated authorization credentials');
    }
    result.invocation = buildInvocationTree(entry.rootInvocation());
    result.functionName = result.invocation.type === 'execute' ? result.invocation.args.function : null;
    result.isValid = true;
    result.status = 'REVIEW_REQUIRED';
  } catch (error) {
    result.issues = [error.message];
  }
  return result;
}
