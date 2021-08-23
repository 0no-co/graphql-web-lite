import { getLocation } from 'graphql/language/location';
import { printLocation, printSourceLocation } from 'graphql/language/printLocation';

export class GraphQLError extends Error {
  constructor(
    message,
    nodes,
    source,
    positions,
    path,
    originalError,
    extensions,
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

  toString() {
    return printError(this);
  }
}

/**
 * Prints a GraphQLError to a string, representing useful location information
 * about the error's position in the source.
 */
export function printError(error) {
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
