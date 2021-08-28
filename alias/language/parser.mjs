/**
 * This is a spec-compliant implementation of a GraphQL query language parser,
 * up-to-date with the June 2018 Edition. Unlike the reference implementation
 * in graphql.js it will only parse the query language, but not the schema
 * language.
 */
import { Kind, GraphQLError } from 'graphql';
import { match, parse as makeParser } from 'reghex';

// 2.1.7: Includes commas, and line comments
const ignored = match()`
  ${/([\s,]|#[^\n\r]+)+/}
`;

// 2.1.9: Limited to ASCII character set, so regex shortcodes are fine
const name = match(Kind.NAME, (x) => ({
  kind: x.tag,
  value: x[0],
}))`
  ${/[_\w][_\d\w]*/}
`;

const null_ = match(Kind.NULL, (x) => ({
  kind: x.tag,
  value: null,
}))`
  ${'null'}
`;

const bool = match(Kind.BOOLEAN, (x) => ({
  kind: x.tag,
  value: x[0] === 'true',
}))`
  ${'true'} | ${'false'}
`;

const variable = match(Kind.VARIABLE, (x) => ({
  kind: x.tag,
  name: x[0],
}))`
  :${'$'} ${name}
`;

// 2.9.6: Technically, this parser doesn't need to check that true, false, and null
// aren't used as enums, but this prevents mistakes and follows the spec closely
const enum_ = match(Kind.ENUM, (x) => ({
  kind: x.tag,
  value: x[0].value,
}))`
  ${name}
`;

// 2.9.1-2: These combine both number values for the sake of simplicity.
// It allows for leading zeroes, unlike graphql.js, which shouldn't matter;
const number = match(null, (x) => ({
  kind: x.length === 1 ? Kind.INT : Kind.FLOAT,
  value: x.join(''),
}))`
  ${/[-]?\d+/}
  ${/[.]\d+/}?
  ${/[eE][+-]?\d+/}?
`;

// 2.9.4: Notably, this skips checks for unicode escape sequences and escaped
// quotes. This is mainly meant for client-side use, so we won't have to be strict.
const string = match(Kind.STRING, (x) => ({
  kind: x.tag,
  value: x[0],
}))`
  (:${'"""'} ${/.*(?=""")/} :${'"""'})
  | (:${'"'} ${/[^"\r\n]*/} :${'"'})
`;

const list = match(Kind.LIST, (x) => ({
  kind: x.tag,
  values: x,
}))`
  (?: ${'['} ${ignored}?)
  ${value}*
  (?: ${']'} ${ignored}?)
`;

const objectField = match(Kind.OBJECT_FIELD, (x) => ({
  kind: x.tag,
  name: x[0],
  value: x[1],
}))`
  ${name}
  (?: ${ignored} ${/:/} ${ignored})?
  ${value}
  (?: ${ignored})?
`;

const object = match(Kind.OBJECT, (x) => ({
  kind: x.tag,
  fields: x,
}))`
  (?: ${'{'} ${ignored}?)
  ${objectField}*
  (?: ${'}'} ${ignored}?)
`;

// 2.9: This matches the spec closely and is complete
const value = match(null, (x) => x[0])`
  :${ignored}?
  (
    ${null_}
    | ${bool}
    | ${variable}
    | ${string}
    | ${number}
    | ${enum_}
    | ${list}
    | ${object}
  )
  :${ignored}?
`;

const arg = match(Kind.ARGUMENT, (x) => ({
  kind: x.tag,
  name: x[0],
  value: x[1],
}))`
  ${name}
  (?: ${ignored}? ${':'} ${ignored}?)
  ${value}
`;

const args = match()`
  :${ignored}?
  (
    (?: ${'('} ${ignored}?)
    ${arg}+
    (?: ${')'} ${ignored}?)
  )?
`;

const directive = match(Kind.DIRECTIVE, (x) => ({
  kind: x.tag,
  name: x[0],
  arguments: x[1],
}))`
  :${'@'} ${name} :${ignored}?
  ${args}?
  :${ignored}?
`;

const directives = match()`
  :${ignored}?
  ${directive}*
`;

const field = match(Kind.FIELD, (x) => {
  let i = 0;
  return {
    kind: x.tag,
    alias: x[1].kind === Kind.NAME ? x[i++] : undefined,
    name: x[i++],
    arguments: x[i++],
    directives: x[i++],
    selectionSet: x[i++],
  };
})`
  :${ignored}?
  ${name}
  (
    (?: ${ignored}? ${':'} ${ignored}?)
    ${name}
  )?
  ${args}
  ${directives}
  ${selectionSet}?
`;

// 2.11: The type declarations may be simplified since there's little room
// for error in this limited type system.
const type = match(null, (x) => {
  const node =
    x[0].kind === 'Name'
      ? { kind: Kind.NAMED_TYPE, name: x[0] }
      : { kind: Kind.LIST_TYPE, type: x[0] };
  return x[1] === '!' ? { kind: Kind.NON_NULL_TYPE, type: node } : node;
})`
  (
    (
      (?: ${'['} ${ignored}?)
      ${type}
      (?: ${ignored}? ${']'} ${ignored}?)
    ) | ${name}
  )
  ${'!'}?
  :${ignored}?
`;

const typeCondition = match(null, (x) => ({
  kind: Kind.NAMED_TYPE,
  name: x[0],
}))`
  (?: ${ignored} ${'on'} ${ignored})
  ${name}
  :${ignored}?
`;

const inlineFragment = match(Kind.INLINE_FRAGMENT, (x) => {
  let i = 0;
  return {
    kind: x.tag,
    typeCondition: x[i].kind === Kind.NAMED_TYPE ? x[i++] : undefined,
    directives: x[i++],
    selectionSet: x[i],
  };
})`
  (?: ${'...'} ${ignored}?)
  ${typeCondition}?
  ${directives}
  ${selectionSet}
`;

const fragmentSpread = match(Kind.FRAGMENT_SPREAD, (x) => ({
  kind: x.tag,
  name: x[0],
  directives: x[1],
}))`
  (?: ${'...'} ${ignored}?)
  !${'on'}
  ${name}
  :${ignored}?
  ${directives}
`;

const selectionSet = match(Kind.SELECTION_SET, (x) => ({
  kind: x.tag,
  selections: x.slice(),
}))`
  (?: ${'{'} ${ignored}?)
  (
    ${inlineFragment} |
    ${fragmentSpread} |
    ${field}
  )+
  (?: ${'}'} ${ignored}?)
`;

const varDefinitionDefault = match(null, (x) => x[0])`
 (?: ${'='} ${ignored}?)
 ${value}
`;

const varDefinition = match(Kind.VARIABLE_DEFINITION, (x) => ({
  kind: x.tag,
  variable: x[0],
  type: x[1],
  defaultValue: x[2].kind ? x[2] : undefined,
  directives: !x[2].kind ? x[2] : x[3],
}))`
  ${variable}
  (?: ${ignored}? ${':'} ${ignored}?)
  ${type}
  ${varDefinitionDefault}?
  ${directives}
  :${ignored}?
`;

const varDefinitions = match('vars')`
  (?: ${'('} ${ignored}?)
  ${varDefinition}+
  (?: ${')'} ${ignored}?)
`;

const fragmentDefinition = match(Kind.FRAGMENT_DEFINITION, (x) => ({
  kind: x.tag,
  name: x[0],
  typeCondition: x[1],
  directives: x[2],
  selectionSet: x[3],
}))`
  (?: ${ignored}? ${'fragment'} ${ignored})
  ${name}
  ${typeCondition}
  ${directives}
  ${selectionSet}
`;

const operationDefinition = match(Kind.OPERATION_DEFINITION, (x) => {
  let i = 1;
  return {
    kind: x.tag,
    operation: x[0],
    name: x.length === 5 ? x[i++] : undefined,
    variableDefinitions: x[i].tag === 'vars' ? x[i++].slice() : null,
    directives: x[i++],
    selectionSet: x[i],
  };
})`
  :${ignored}?
  ${/query|mutation|subscription/}
  ((?: ${ignored}) ${name})?
  :${ignored}?
  ${varDefinitions}?
  ${directives}
  ${selectionSet}
`;

const queryShorthand = match(Kind.OPERATION_DEFINITION, (x) => ({
  kind: x.tag,
  operation: 'query',
  name: undefined,
  variableDefinitions: [],
  directives: [],
  selectionSet: x[0],
}))`
  :${ignored}?
  ${selectionSet}
`;

const root = match(Kind.DOCUMENT, (x) =>
  x.length ? { kind: x.tag, definitions: x.slice() } : undefined
)`
  ${queryShorthand}
  | (${operationDefinition} | ${fragmentDefinition})+
`;

const _parse = makeParser(root);
const _parseValue = makeParser(value);
const _parseType = makeParser(type);

export function parse(input) {
  const result = _parse(input);
  if (result == null) throw new GraphQLError('Syntax Error');
  return result;
}

export function parseValue(input) {
  const result = _parseValue(input);
  if (result == null) throw new GraphQLError('Syntax Error');
  return result;
}

export function parseType(input) {
  const result = _parseType(input);
  if (result == null) throw new GraphQLError('Syntax Error');
  return result;
}
