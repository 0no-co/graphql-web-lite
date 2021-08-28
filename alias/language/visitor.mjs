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
    let hasEdited = false;
    let result;
    
    result = callback(node, key, parent, false);
    if (result === false) {
      return;
    } else if (result && typeof result.kind === 'string') {
      hasEdited = true;
      node = result;
    }

    ancestors.push(node);
    const copy = { ...node };

    for (const nodeKey in node) {
      let value = node[nodeKey];
      path.push(nodeKey);
      if (Array.isArray(value)) {
        value = value.slice();
        for (let index = 0; index < value.length; index++) {
          if (value[index] != null && typeof value[index].kind === 'string') {
            path.push(index);
            result = traverse(value[index], index, node);
            path.pop();
            if (result !== undefined) {
              value[index] = result;
              hasEdited = true;
            }
          }
        }

      } else if (value != null && typeof value.kind === 'string') {
        result = traverse(value, nodeKey, node);
        if (result !== undefined) {
          value = result;
          hasEdited = true;
        }
      }

      path.pop();
      if (hasEdited) copy[nodeKey] = value;
    }

    ancestors.pop();

    if (hasEdited) node = copy;
    result = callback(node, key, parent, true);
    return hasEdited && result === undefined ? node : result;
  }

  try {
    const result = traverse(node);
    return result !== undefined ? result : node;
  } catch (error) {
    if (error !== BREAK) throw error;
    return node;
  }
}
