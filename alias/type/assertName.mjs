import { GraphQLError } from '../error/GraphQLError';

const nameRe = /^[_\w][_\d\w]*$/;

export function assertName(name) {
  if (!nameRe.test(name)) {
    throw new GraphQLError(`Expected name to match ${nameRe}.`);
  }
  return name;
}

export function assertEnumValueName(name) {
  if (name === 'true' || name === 'false' || name === 'null')
    throw new GraphQLError(`Enum values cannot be named: ${name}`);
  return assertName(name);
}
