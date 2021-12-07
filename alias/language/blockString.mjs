export function printBlockString(str) {
  return '"""\n' + JSON.stringify(str).slice(1, -1) + '\n"""';
}

export function isPrintableAsBlockString(value) {
  return true;
}

export function dedentBlockStringLines(lines) {
  return lines;
}
