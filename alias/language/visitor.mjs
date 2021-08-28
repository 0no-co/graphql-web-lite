import { getVisitFn, visitInParallel, BREAK } from 'graphql/language/visitor';

export { getVisitFn, visitInParallel, BREAK };

export function visit(node, visitor) {
  const path = [];
  const ancestors = [];

  function callback(node, key, parent, isLeaving) {
    const visitFn = getVisitFn(visitor, node.kind, isLeaving)
    if (visitFn) {
      const result = visitFn.call(visitor, node, key, parent, path, ancestors)
      if (result === BREAK) throw BREAK
      return result
    }
  }

  function traverse(node, key, parent) {
    let result;
    
    result = callback(node, key, parent, false);
    if (result === false) {
      return;
    } else if (result && typeof result.kind === 'string') {
      node = result;
    }

    ancestors.push(node);
    const copy = {};

    let hasEdited = false;
    for (const nodeKey in node) {
      const value = node[nodeKey];

      let newValue;
      path.push(nodeKey);
      if (Array.isArray(value)) {
        newValue = value.slice();
        for (let index = 0; index < value.length; index++) {
          if (value[index] != null && typeof value[index].kind === 'string') {
            path.push(index);
            result = traverse(value[index], index, node);
            path.pop();
            if (result !== undefined) {
              newValue[index] = result;
              hasEdited = true;
            }
          }
        }

      } else if (value != null && typeof value.kind === 'string') {
        result = traverse(value, nodeKey, node);
        if (result !== undefined) {
          newValue = result;
          hasEdited = true;
        }
      }

      path.pop();
      copy[nodeKey] = hasEdited ? newValue : value;
    }

    ancestors.pop();

    if (hasEdited) node = copy;
    return callback(node, key, parent, true);
  }

  try {
    const result = traverse(node);
    return result !== undefined ? result : node;
  } catch (error) {
    if (error !== BREAK) throw error;
    return node;
  }
}
