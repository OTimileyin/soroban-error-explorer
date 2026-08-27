/**
 * TrapTrace Rust Test Generator for Web Explorer.
 */

export const TEST_FIXTURES = {
  'arith-error': {
    title: 'Test for Arithmetic Overflow Panic Prevention',
    code: `#[test]
#[should_panic(expected = "attempt to add with overflow")]
fn test_reproduce_arith_overflow_panic() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SampleContract);
    let client = SampleContractClient::new(&env, &contract_id);

    client.calculate(&u128::MAX, &1);
}

#[test]
fn test_safe_arithmetic_prevention() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SampleContract);
    let client = SampleContractClient::new(&env, &contract_id);

    let res = client.try_calculate_safe(&u128::MAX, &1);
    assert!(res.is_err());
}`
  },
  'require-auth-missing': {
    title: 'Test for Missing Caller Authorization',
    code: `#[test]
#[should_panic(expected = "missing required authorization")]
fn test_reproduce_missing_auth() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SampleContract);
    let client = SampleContractClient::new(&env, &contract_id);

    let caller = Address::generate(&env);
    client.withdraw(&caller, &1000);
}

#[test]
fn test_verified_auth_success() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, SampleContract);
    let client = SampleContractClient::new(&env, &contract_id);

    let caller = Address::generate(&env);
    let res = client.withdraw(&caller, &1000);
    assert_eq!(res, 1000);
}`
  },
  'option-unwrap-none': {
    title: 'Test for Option::unwrap() on None Panic',
    code: `#[test]
#[should_panic(expected = "called \`Option::unwrap()\` on a \`None\` value")]
fn test_reproduce_option_unwrap_panic() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SampleContract);
    let client = SampleContractClient::new(&env, &contract_id);

    client.get_uninitialized_value();
}`
  }
};

export function generateRustTest(errorId) {
  if (TEST_FIXTURES[errorId]) {
    return TEST_FIXTURES[errorId];
  }

  const safeFn = (errorId || 'generic').replace(/-/g, '_');
  return {
    title: `Unit Test for ${errorId}`,
    code: `#[test]
fn test_${safeFn}_prevention() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SampleContract);
    let client = SampleContractClient::new(&env, &contract_id);

    let res = client.try_execute();
    assert!(res.is_ok());
}`
  };
}
