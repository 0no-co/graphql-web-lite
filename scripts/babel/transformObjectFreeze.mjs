const plugin = ({ types: t }) => {
  return {
    visitor: {
      CallExpression(path) {
        if (
          t.isMemberExpression(path.node.callee) &&
          t.isIdentifier(path.node.callee.object) &&
          t.isIdentifier(path.node.callee.property) &&
          path.node.callee.object.name === 'Object' &&
          path.node.callee.property.name === 'freeze'
        ) {
          path.replaceWith(path.node.arguments[0]);
        }
      },
    }
  };
};

export default plugin;
