export function newObject(obj = {}, val = 0) {
  return Object.fromEntries(Object.keys(obj).map(k => [k, val]))
}
