// See: https://github.com/graphql/graphql-js/blob/976d64b/src/language/__tests__/parser-test.ts
// Note: Tests regarding reserved keywords have been removed.

import { Kind } from 'graphql';
import { parse, parseValue, parseType } from '../parser';

describe('Parser', () => {
  it('parse provides errors', () => {
    expect(() => parse('{')).toThrow();
  });

  it('parses variable inline values', () => {
    expect(() => {
      return parse('{ field(complex: { a: { b: [ $var ] } }) }');
    }).not.toThrow();
  });

  it('parses constant default values', () => {
    expect(() => {
      return parse('query Foo($x: Complex = { a: { b: [ $var ] } }) { field }');
    }).not.toThrow();
  });

  it('parses variable definition directives', () => {
    expect(() => {
      return parse('query Foo($x: Boolean = false @bar) { field }');
    }).not.toThrow();
  });

  it('does not accept fragments spread of "on"', () => {
    expect(() => {
      return parse('{ ...on }');
    }).toThrow();
  });

  it('parses multi-byte characters', () => {
    // Note: \u0A0A could be naively interpreted as two line-feed chars.
    const ast = parse(`
      # This comment has a \u0A0A multi-byte character.
      { field(arg: "Has a \u0A0A multi-byte character.") }
    `);

    expect(ast).toHaveProperty(
      'definitions.0.selectionSet.selections.0.arguments.0.value.value',
      'Has a \u0A0A multi-byte character.'
    );
  });

  it('parses kitchen sink', () => {
    expect(() => parse(kitchenSinkQuery)).not.toThrow();
  });

  it('parses anonymous mutation operations', () => {
    expect(() => {
      return parse(`
        mutation {
          mutationField
        }
      `);
    }).not.toThrow();
  });

  it('parses anonymous subscription operations', () => {
    expect(() => {
      return parse(`
        subscription {
          subscriptionField
        }
      `);
    }).not.toThrow();
  });

  it('parses named mutation operations', () => {
    expect(() => {
      return parse(`
        mutation Foo {
          mutationField
        }
      `);
    }).not.toThrow();
  });

  it('parses named subscription operations', () => {
    expect(() => {
      return parse(`
        subscription Foo {
          subscriptionField
        }
      `);
    }).not.toThrow();
  });

  it('creates ast', () => {
    const result = parse(`
      {
        node(id: 4) {
          id,
          name
        }
      }
    `);

    expect(result).toMatchObject({
      kind: Kind.DOCUMENT,
      definitions: [
        {
          kind: Kind.OPERATION_DEFINITION,
          operation: 'query',
          name: undefined,
          variableDefinitions: [],
          directives: [],
          selectionSet: {
            kind: Kind.SELECTION_SET,
            selections: [
              {
                kind: Kind.FIELD,
                alias: undefined,
                name: {
                  kind: Kind.NAME,
                  value: 'node',
                },
                arguments: [
                  {
                    kind: Kind.ARGUMENT,
                    name: {
                      kind: Kind.NAME,
                      value: 'id',
                    },
                    value: {
                      kind: Kind.INT,
                      value: '4',
                    },
                  },
                ],
                directives: [],
                selectionSet: {
                  kind: Kind.SELECTION_SET,
                  selections: [
                    {
                      kind: Kind.FIELD,
                      alias: undefined,
                      name: {
                        kind: Kind.NAME,
                        value: 'id',
                      },
                      arguments: [],
                      directives: [],
                      selectionSet: undefined,
                    },
                    {
                      kind: Kind.FIELD,
                      alias: undefined,
                      name: {
                        kind: Kind.NAME,
                        value: 'name',
                      },
                      arguments: [],
                      directives: [],
                      selectionSet: undefined,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });

  it('creates ast from nameless query without variables', () => {
    const result = parse(`
      query {
        node {
          id
        }
      }
    `);

    expect(result).toMatchObject({
      kind: Kind.DOCUMENT,
      definitions: [
        {
          kind: Kind.OPERATION_DEFINITION,
          operation: 'query',
          name: undefined,
          variableDefinitions: [],
          directives: [],
          selectionSet: {
            kind: Kind.SELECTION_SET,
            selections: [
              {
                kind: Kind.FIELD,
                alias: undefined,
                name: {
                  kind: Kind.NAME,
                  value: 'node',
                },
                arguments: [],
                directives: [],
                selectionSet: {
                  kind: Kind.SELECTION_SET,
                  selections: [
                    {
                      kind: Kind.FIELD,
                      alias: undefined,
                      name: {
                        kind: Kind.NAME,
                        value: 'id',
                      },
                      arguments: [],
                      directives: [],
                      selectionSet: undefined,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
  });

  it('allows parsing without source location information', () => {
    const result = parse('{ id }', { noLocation: true });
    expect('loc' in result).toBe(false);
  });

  describe('parseValue', () => {
    it('parses null value', () => {
      const result = parseValue('null');
      expect(result).toEqual({ kind: Kind.NULL });
    });

    it('parses list values', () => {
      const result = parseValue('[123 "abc"]');
      expect(result).toEqual({
        kind: Kind.LIST,
        values: [
          {
            kind: Kind.INT,
            value: '123',
          },
          {
            kind: Kind.STRING,
            value: 'abc',
          },
        ],
      });
    });

    it('parses block strings', () => {
      const result = parseValue('["""long""" "short"]');
      expect(result).toEqual({
        kind: Kind.LIST,
        values: [
          {
            kind: Kind.STRING,
            value: 'long',
          },
          {
            kind: Kind.STRING,
            value: 'short',
          },
        ],
      });
    });

    it('allows variables', () => {
      const result = parseValue('{ field: $var }');
      expect(result).toEqual({
        kind: Kind.OBJECT,
        fields: [
          {
            kind: Kind.OBJECT_FIELD,
            name: {
              kind: Kind.NAME,
              value: 'field',
            },
            value: {
              kind: Kind.VARIABLE,
              name: {
                kind: Kind.NAME,
                value: 'var',
              },
            },
          },
        ],
      });
    });

    it('correct message for incomplete variable', () => {
      expect(() => {
        return parseValue('$');
      }).toThrow();
    });

    it('correct message for unexpected token', () => {
      expect(() => {
        return parseValue(':');
      }).toThrow();
    });
  });

  describe('parseType', () => {
    it('parses well known types', () => {
      const result = parseType('String');
      expect(result).toEqual({
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: 'String',
        },
      });
    });

    it('parses custom types', () => {
      const result = parseType('MyType');
      expect(result).toEqual({
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: 'MyType',
        },
      });
    });

    it('parses list types', () => {
      const result = parseType('[MyType]');
      expect(result).toEqual({
        kind: Kind.LIST_TYPE,
        type: {
          kind: Kind.NAMED_TYPE,
          name: {
            kind: Kind.NAME,
            value: 'MyType',
          },
        },
      });
    });

    it('parses non-null types', () => {
      const result = parseType('MyType!');
      expect(result).toEqual({
        kind: Kind.NON_NULL_TYPE,
        type: {
          kind: Kind.NAMED_TYPE,
          name: {
            kind: Kind.NAME,
            value: 'MyType',
          },
        },
      });
    });

    it('parses nested types', () => {
      const result = parseType('[MyType!]');
      expect(result).toEqual({
        kind: Kind.LIST_TYPE,
        type: {
          kind: Kind.NON_NULL_TYPE,
          type: {
            kind: Kind.NAMED_TYPE,
            name: {
              kind: Kind.NAME,
              value: 'MyType',
            },
          },
        },
      });
    });
  });
});

const kitchenSinkQuery: string = String.raw`
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
    obj: {
      key: "value"
      block: """
      block string uses \"""
      """
    }
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
