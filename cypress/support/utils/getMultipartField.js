export function getMultipartField(body, fieldName) {
  const re = new RegExp(`name="${fieldName}"\\r\\n\\r\\n([^\\r]*)`, '');
  const match = body.match(re);
  return match ? match[1] : null;
}
