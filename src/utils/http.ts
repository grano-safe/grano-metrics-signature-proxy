export function methodSupportsBody(method?: string): boolean {
  if (!method) return false

  const methodsWithBody = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

  return methodsWithBody.has(method.toUpperCase())
}
