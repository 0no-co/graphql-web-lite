export { GraphQLError } from '@0no-co/graphql.web';

/**
 * Prints a GraphQLError to a string, representing useful location information
 * about the error's position in the source.
 *
 * @deprecated Please use `error.toString` instead. Will be removed in v17
 */
export function printError(error) {
  return error.toString();
}

/**
 * Given a GraphQLError, format it according to the rules described by the
 * Response Format, Errors section of the GraphQL Specification.
 *
 * @deprecated Please use `error.toString` instead. Will be removed in v17
 */
export function formatError(error) {
  return error.toJSON();
}
