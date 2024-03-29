import { BREAK, Kind } from '@0no-co/graphql.web';
export { BREAK, visit, Kind } from '@0no-co/graphql.web';

export function getEnterLeaveForKind(visitor, kind) {
  if (typeof visitor[kind] === 'object') {
    return visitor[kind];
  }
  return {
    enter: visitor[kind] || visitor.enter,
    leave: visitor.leave,
  };
}

export function getVisitFn(visitor, kind, isLeaving) {
  const { enter, leave } = getEnterLeaveForKind(visitor, kind);
  return isLeaving ? leave : enter;
}

export function visitInParallel(visitors) {
  const skipping = new Array(visitors.length).fill(null);
  const mergedVisitor = {};

  for (const kindName in Kind) {
    const kind = Kind[kindName];
    let hasVisitor = false;
    const enterList = new Array(visitors.length).fill();
    const leaveList = new Array(visitors.length).fill();

    for (let i = 0; i < visitors.length; ++i) {
      const { enter, leave } = getEnterLeaveForKind(visitors[i], kind);
      hasVisitor = hasVisitor || enter != null || leave != null;
      enterList[i] = enter;
      leaveList[i] = leave;
    }

    if (hasVisitor) {
      mergedVisitor[kind] = {
        enter(...args) {
          const node = args[0];
          for (let i = 0; i < visitors.length; i++) {
            if (!skipping[i]) {
              const result = enterList[i] && enterList[i].apply(visitors[i], args);
              if (result === false) {
                skipping[i] = node;
              } else if (result === BREAK) {
                skipping[i] = BREAK;
              } else if (result !== undefined) {
                return result;
              }
            }
          }
        },
        leave(...args) {
          const node = args[0];
          for (let i = 0; i < visitors.length; i++) {
            if (!skipping[i]) {
              const result = leaveList[i] && leaveList[i].apply(visitors[i], args);
              if (result === BREAK) {
                skipping[i] = BREAK;
              } else if (result !== undefined && result !== false) {
                return result;
              }
            } else if (skipping[i] === node) {
              skipping[i] = null;
            }
          }
        },
      };
    }
  }

  return mergedVisitor;
}
