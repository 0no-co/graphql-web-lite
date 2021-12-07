import { getLocation } from 'graphql/language/location';

import { printLocation, printSourceLocation } from '../language/printLocation';

export class GraphQLError extends Error {
  constructor(
    message,
    nodes,
    source,
    positions,
    path,
    originalError,
    extensions
  ) {
    super(message);

    this.name = 'GraphQLError';
    this.message = message;

    if (path) this.path = path;
    if (nodes) this.nodes = nodes;
    if (source) this.source = source;
    if (positions) this.positions = positions;
    if (originalError) this.originalError = originalError;

    let _extensions = extensions;
    if (_extensions == null && originalError != null) {
      const originalExtensions = originalError.extensions;
      if (isObjectLike(originalExtensions)) {
        _extensions = originalExtensions;
      }
    }

    if (_extensions) {
      this.extensions = _extensions;
    }
  }

  toJSON() {
    const formattedError = { message: this.message };

    if (this.locations != null) formattedError.locations = this.locations;
    if (this.path != null) formattedError.path = this.path;
    if (this.extensions != null && Object.keys(this.extensions).length > 0)
      formattedError.extensions = this.extensions;
    return formattedError;
  }

  toString() {
    let output = error.message;

    if (error.nodes) {
      for (const node of error.nodes) {
        if (node.loc) {
          output += '\n\n' + printLocation(node.loc);
        }
      }
    } else if (error.source && error.locations) {
      for (const location of error.locations) {
        output += '\n\n' + printSourceLocation(error.source, location);
      }
    }

    return output;
  }
}

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
