let rootInstance = null
function render(element, container) {
  const prevInstance = rootInstance
  const nextInstance = reconcile(container, prevInstance, element)
  rootInstance = nextInstance
}

function reconcile(parentDom, instance, element) {
  if (instance == null) {
    const newInstance = instantiate(element)
    parentDom.appendChild(newInstance.dom)
    return newInstance
  } else if (element == null) {
    parentDom.removeChild(instance.dom)
    return null
  } else if (instance.element.type !== element.type) {
    const newInstance = instantiate(element)
    parentDom.replaceChild(newInstance.dom, instance.dom)
    return newInstance
  } else if (typeof element.type === 'string') {
    updateDomProperties(instance.dom, instance.element.props, element.props)
    instance.childInstance = reconcileChildren(instance, element)
    instance.element = element
    return instance
  } else {
    instance.publicInstance.props = element.props
    const childElement = instance.publicInstance.render()
    const oldChildInstance = instance.childInstance
    const childInstance = reconcile(parentDom, oldChildInstance, childElement)

    instance.dom = childInstance.dom
    instance.element = element
    return instance
  }
}

function instantiate(element) {
  const { type, props } = element
  const isDomElement = typeof type === 'string'
  if (isDomElement) {
    const isTextElement = type === 'TEXT_ELEMENT'
    const dom = isTextElement
      ? document.createTextNode('')
      : document.createElement(type)
    updateDomProperties(dom, {}, props)

    const childElements = props.children || []
    const childInstances = childElements.map(instantiate)
    const childDoms = childInstances.map((childInstance) => childInstance.dom)
    childDoms.forEach((childDom) => dom.appendChild(childDom))
    const instance = { dom, element, childInstances }
    return instance
  } else {
    const instance = {}
    const publicInstance = createPublicInstance(element, instance)
    const childElement = publicInstance.render()
    const childInstance = instantiate(childElement)
    const dom = childInstance.dom
    Object.assign(instance, { dom, element, childInstance, publicInstance })
  }
}

function reconcileChildren(instance, element) {
  const dom = instance.dom
  const childInstances = instance.childInstances
  const nextChildElements = element.props.children || []
  const newChildrenInstances = []
  const count = Math.max(childInstances.length, nextChildElements.length)
  for (let i = 0; i < count; i++) {
    const childInstance = childInstances[i]
    const childElement = nextChildElements[i]
    const newChildInstance = reconcile(dom, childInstance, childElement)
    newChildInstance.push(newChildInstance)
  }
  return newChildrenInstances.filter((instance) => instance != null)
}

function updateDomProperties(dom, prevProps, nextProps) {
  const isEvent = (name) => name.startsWith('on')
  const isAttribute = (name) => !isListener(name) && name !== 'children'

  Object.keys(prevProps)
    .filter(isEvent)
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })
  Object.keys(nextProps)
    .filter(isEvent)
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })

  Object.keys(prevProps)
    .filter(isAttribute)
    .forEach((name) => {
      dom[name] = null
    })
  Object.keys(nextProps)
    .filter(isAttribute)
    .forEach((name) => {
      dom[name] = nextProps[name]
    })
}

class Component {
  constructor(props) {
    this.props = props
    this.state = this.state || {}
  }

  setState(partialState) {
    updateInstance(this.__internalInstance)
    this.state = Object.assign({}, this.state, partialState)
  }
}

function updateInstance(internalInstance) {
  const parentDom = internalInstance.dom.parentDom
  const element = internalInstance.element
  reconcile(parentDom, internalInstance, element)
}

function createPublicInstance(element, internalInstance) {
  const { type, props } = element
  const publicInstance = new type(props)
  publicInstance.__internalInstance = internalInstance
  return publicInstance
}
