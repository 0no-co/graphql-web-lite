const visited = 'visitedByTransformDevAssert';

const warningDevCheckTemplate = `
  if (false) {
    NODE;
  }
`.trim();

const plugin = ({ template, types: t }) => {
  const wrapWithDevCheck = template(warningDevCheckTemplate, {
    placeholderPattern: /^NODE$/,
  });

  return {
    visitor: {
      CallExpression(path) {
        const { name } = path.node.callee;
        if (path.node[visited]) return;

        if (name === 'devAssert') {
          path.node[visited] = true;

          // The production-check may be hoisted if the parent
          // is already an if-statement only containing the
          // warn call
          let p = path;
          while (t.isExpressionStatement(p.parentPath.node)) {
            if (
              t.isBlockStatement(p.parentPath.parentPath.node) &&
              p.parentPath.parentPath.node.body.length === 1 &&
              p.parentPath.parentPath.node.body[0] === path.parentPath.node &&
              t.isIfStatement(p.parentPath.parentPath.parentPath.node) &&
              p.parentPath.parentPath.parentPath.node.consequent ===
                p.parentPath.parentPath.node &&
              !p.parentPath.parentPath.node.alternate
            ) {
              p = p.parentPath.parentPath.parentPath;
            } else if (
              t.isIfStatement(p.parentPath.parentPath.node) &&
              p.parentPath.parentPath.node.consequent === p.parentPath.node &&
              !p.parentPath.parentPath.node.alternate
            ) {
              p = path.parentPath.parentPath;
            } else {
              break;
            }
          }

          p.replaceWith(wrapWithDevCheck({ NODE: p.node }));
        } else if (name === 'invariant') {
          path.node[visited] = true;
          path.node.arguments.length = 1;
        }
      },
    },
  };
};

export default plugin;
