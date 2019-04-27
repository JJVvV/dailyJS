const TEXT_ELEMENT = 'TEXT_ELEMENT'
function createElement(type, config, ...args) {
  const hasChildren = args.length > 0
  const rawChildren = hasChildren ? [...args] : []
  const children = rawChildren
    .filter((c) => c != null && c !== false)
    .map((c) => (c instanceof Object ? c : createTextElement(c)))
  return {
    type,
    props: {
      ...config,
      children,
    },
  }
}

function createTextElement(value) {
  return createElement(TEXT_ELEMENT, { nodeValue: value })
}
