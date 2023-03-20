export { printBlockString } from '@0no-co/graphql.web';

export function isPrintableAsBlockString(value) {
  return true;
}

export function dedentBlockStringLines(lines) {
  return lines;
}
