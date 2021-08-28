const plugin = ({ types: t }) => {
  return {
    visitor: {
      ClassMethod(path) {
        if (
          path.node.kind === 'get' &&
          path.node.computed &&
          t.isMemberExpression(path.node.key) &&
          t.isIdentifier(path.node.key.object) &&
          t.isIdentifier(path.node.key.property) &&
          path.node.key.object.name === 'Symbol' &&
          path.node.key.property.name === 'toStringTag'
        ) {
          path.remove();
        }
      },
    },
  };
};

export default plugin;
