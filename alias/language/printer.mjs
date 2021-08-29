import { Kind } from 'graphql';
import { printBlockString } from './blockString';
import { printString } from './printString';

export function print(node) {
  if (Array.isArray(node)) {
    return node.map(print);
  } else if (node == null || typeof node !== 'object') {
    return node ? '' + node : '';
  }

  switch (node.kind) {
    case 'OperationDefinition': {
      const prefix = join(
        [
          node.operation,
          print(node.name) +
            wrap('(', join(print(node.variableDefinitions), ', '), ')'),
          join(print(node.directives), ' '),
        ],
        ' '
      );

      return (
        (prefix === 'query' ? '' : prefix + ' ') + print(node.selectionSet)
      );
    }

    case 'VariableDefinition':
      return (
        print(node.variable) +
        ': ' +
        print(node.type) +
        wrap(' = ', print(node.defaultValue)) +
        wrap(' ', join(print(node.directives), ' '))
      );

    case 'Field':
      return join(
        [
          wrap('', print(node.alias), ': ') +
            print(node.name) +
            wrap('(', join(print(node.arguments), ', '), ')'),
          join(print(node.directives), ' '),
          print(node.selectionSet),
        ],
        ' '
      );

    case 'StringValue':
      return node.isBlockString
        ? printBlockString(node.value)
        : printString(node.value);

    case 'BooleanValue':
      return node.value ? 'true' : 'false';

    case 'NullValue':
      return 'null';

    case 'IntValue':
    case 'FloatValue':
    case 'EnumValue':
    case 'Name':
      return node.value;

    case 'ListValue':
      return '[' + join(print(node.values), ', ') + ']';

    case 'ObjectValue':
      return '{' + join(print(node.fields), ', ') + '}';

    case 'ObjectField':
      return node.name.value + ': ' + print(node.value);

    case 'Variable':
      return '$' + node.name.value;
    case 'Document':
      return join(print(node.definitions), '\n\n') + '\n';
    case 'SelectionSet':
      return block(print(node.selections));
    case 'Argument':
      return node.name.value + ': ' + print(node.value);

    case 'FragmentSpread':
      return (
        '...' + print(node.name) + wrap(' ', join(print(node.directives), ' '))
      );

    case 'InlineFragment':
      return join(
        [
          '...',
          wrap('on ', print(node.typeCondition)),
          join(print(node.directives), ' '),
          print(node.selectionSet),
        ],
        ' '
      );

    case 'FragmentDefinition':
      return (
        'fragment ' +
        node.name.value +
        wrap('(', join(print(node.variableDefinitions), ', '), ')') +
        ' ' +
        'on ' +
        print(node.typeCondition) +
        ' ' +
        wrap('', join(print(node.directives), ' '), ' ') +
        print(node.selectionSet)
      );

    case 'Directive':
      return (
        '@' +
        node.name.value +
        wrap('(', join(print(node.arguments), ', '), ')')
      );

    case 'NamedType':
      return node.name.value;

    case 'ListType':
      return '[' + print(node.type) + ']';

    case 'NonNullType':
      return print(node.type) + '!';

    default:
      return '';
  }
}

const join = (array, separator) =>
  (array && array.filter((x) => x).join(separator || '')) || '';

const block = (array) =>
  wrap('{\n  ', join(array, '\n').replace(/\n/g, '\n  '), '\n}');

const wrap = (start, value, end) => (value ? start + value + (end || '') : '');
