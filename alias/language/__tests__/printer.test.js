// See: https://github.com/graphql/graphql-js/blob/976d64b/src/language/__tests__/printer-test.ts

import { describe, it, expect } from 'vitest';
import { parse } from '../parser';
import { print } from '../printer';

describe('Printer: Query document', () => {
  it('prints minimal ast', () => {
    const ast = {
      kind: 'Field',
      name: { kind: 'Name', value: 'foo' },
    };
    expect(print(ast)).toBe('foo');
  });

  // NOTE: The shim won't throw for invalid AST nodes
  it('returns empty strings for invalid AST', () => {
    const badAST = { random: 'Data' };
    expect(print(badAST)).toBe('');
  });

  it('correctly prints non-query operations without name', () => {
    const queryASTShorthanded = parse('query { id, name }');
    expect(print(queryASTShorthanded)).toBe(dedent`
      {
        id
        name
      }`);

    const mutationAST = parse('mutation { id, name }');
    expect(print(mutationAST)).toBe(dedent`
      mutation {
        id
        name
      }`);

    const queryASTWithArtifacts = parse('query ($foo: TestType) @testDirective { id, name }');
    expect(print(queryASTWithArtifacts)).toBe(dedent`
      query ($foo: TestType) @testDirective {
        id
        name
      }`);

    const mutationASTWithArtifacts = parse('mutation ($foo: TestType) @testDirective { id, name }');
    expect(print(mutationASTWithArtifacts)).toBe(dedent`
      mutation ($foo: TestType) @testDirective {
        id
        name
      }
    `);
  });

  it('prints query with variable directives', () => {
    const queryASTWithVariableDirective = parse(
      'query ($foo: TestType = {a: 123} @testDirective(if: true) @test) { id }'
    );
    expect(print(queryASTWithVariableDirective)).toBe(dedent`
      query ($foo: TestType = {a: 123} @testDirective(if: true) @test) {
        id
      }
    `);
  });

  it('keeps arguments on one line if line is short (<= 80 chars)', () => {
    const printed = print(parse('{trip(wheelchair:false arriveBy:false){dateTime}}'));

    expect(printed).toBe(
      dedent`
      {
        trip(wheelchair: false, arriveBy: false) {
          dateTime
        }
      }`
    );
  });

  it('prints kitchen sink without altering ast', () => {
    const ast = parse(kitchenSinkQuery, { noLocation: true });

    const astBeforePrintCall = JSON.stringify(ast);
    const printed = print(ast);
    const printedAST = parse(printed, { noLocation: true });

    expect(printedAST).toEqual(ast);
    expect(JSON.stringify(ast)).toBe(astBeforePrintCall);

    expect(printed).toBe(
      dedentString(String.raw`
      query queryName($foo: ComplexType, $site: Site = MOBILE) @onQuery {
        whoever123is: node(id: [123, 456]) {
          id
          ... on User @onInlineFragment {
            field2 {
              id
              alias: field1(first: 10, after: $foo) @include(if: $foo) {
                id
                ...frag @onFragmentSpread
              }
            }
          }
          ... @skip(unless: $foo) {
            id
          }
          ... {
            id
          }
        }
      }

      mutation likeStory @onMutation {
        like(story: 123) @onField {
          story {
            id @onField
          }
        }
      }

      subscription StoryLikeSubscription($input: StoryLikeSubscribeInput @onVariableDefinition) @onSubscription {
        storyLikeSubscribe(input: $input) {
          story {
            likers {
              count
            }
            likeSentence {
              text
            }
          }
        }
      }

      fragment frag on Friend @onFragmentDefinition {
        foo(size: $size, bar: $b, obj: {key: "value"})
      }

      {
        unnamed(truthy: true, falsy: false, nullish: null)
        query
      }

      {
        __typename
      }`)
    );
  });
});

const kitchenSinkQuery = String.raw`
query queryName($foo: ComplexType, $site: Site = MOBILE) @onQuery {
  whoever123is: node(id: [123, 456]) {
    id
    ... on User @onInlineFragment {
      field2 {
        id
        alias: field1(first: 10, after: $foo) @include(if: $foo) {
          id
          ...frag @onFragmentSpread
        }
      }
    }
    ... @skip(unless: $foo) {
      id
    }
    ... {
      id
    }
  }
}
mutation likeStory @onMutation {
  like(story: 123) @onField {
    story {
      id @onField
    }
  }
}
subscription StoryLikeSubscription(
  $input: StoryLikeSubscribeInput @onVariableDefinition
)
  @onSubscription {
  storyLikeSubscribe(input: $input) {
    story {
      likers {
        count
      }
      likeSentence {
        text
      }
    }
  }
}
fragment frag on Friend @onFragmentDefinition {
  foo(
    size: $size
    bar: $b
    obj: { key: "value" }
  )
}
{
  unnamed(truthy: true, falsy: false, nullish: null)
  query
}
query {
  __typename
}
`;

function dedentString(string) {
  const trimmedStr = string
    .replace(/^\n*/m, '') //  remove leading newline
    .replace(/[ \t\n]*$/, ''); // remove trailing spaces and tabs
  // fixes indentation by removing leading spaces and tabs from each line
  let indent = '';
  for (const char of trimmedStr) {
    if (char !== ' ' && char !== '\t') {
      break;
    }
    indent += char;
  }

  return trimmedStr.replace(RegExp('^' + indent, 'mg'), ''); // remove indent
}

function dedent(strings, ...values) {
  let str = strings[0];
  for (let i = 1; i < strings.length; ++i) str += values[i - 1] + strings[i]; // interpolation
  return dedentString(str);
}
