export function printBlockString(str) {
  return '"""\n' +
    JSON.stringify(str).slice(1, -1)
      + '\n"""';
}

export function dedentBlockStringValue(str) {
  return str;
}

export function getBlockStringIndentation(str) {
  return 0;
}
