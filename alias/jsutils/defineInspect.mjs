export default function defineInspect(obj) {
  if (typeof obj.prototype.toJSON === 'function') {
    obj.prototype.inspect = obj.prototype.toJSON;
  }
}
