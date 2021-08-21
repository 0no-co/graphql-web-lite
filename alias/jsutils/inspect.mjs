export default function inspect(value) {
  return JSON.stringify(value, null, 2);
}

export { inspect };
