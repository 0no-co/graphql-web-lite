import { getLocation } from 'graphql/language/location';

export function printLocation(location) {
  return printSourceLocation(
    location.source,
    getLocation(location.source, location.start)
  );
}

export function printSourceLocation(source, sourceLocation) {
  const firstLineColumnOffset = source.locationOffset.column - 1;
  const lineNum = sourceLocation.line + source.locationOffset.line - 1;
  const columnNum =
    sourceLocation.column + sourceLocation.line === 1
      ? firstLineColumnOffset
      : 0;
  return `${source.name}:${lineNum}:${columnNum}`;
}
