/* eslint-disable react/prefer-stateless-function */
/* eslint-disable no-use-before-define */
function createElement(tag, attrs, ...children) {
  return {
    tag,
    attrs,
    children,
  }
}

function setAttribute(dom, name, value) {
  if (name === 'className') {
    name = 'class'
  }
  if (/on\w+/.test(name)) {
    name = name.toLowerCase()
    dom[name] = value
  } else if (name === 'style') {
    dom.style.cssText = value
  } else {
    if (name in dom) {
      dom[name] = value
    }
    if (value) {
      dom.setAttribute(name, value)
    } else {
      dom.removeAttribute(name)
    }
  }
}

function render(vnode, container) {
  // eslint-disable-next-line no-use-before-define
  return container.appendChild(_render(vnode))
}

function createComponent(component, props) {
  let inst
  if (component.prototype && component.prototype.render) {
    // eslint-disable-next-line new-cap
    inst = new component(props)
  } else {
    // eslint-disable-next-line no-use-before-define
    inst = new Component(props)
    inst.constructor = component
    inst.render = function () {
      return this.constructor(props)
    }
  }
  return inst
}

function renderComponent(component) {
  const renderer = component.render(component.props)
  if (component.base && component.componentWillUpdate) {
    component.componentWillUpdate()
  }
  const base = _render(renderer)
  if (component.base) {
    if (component.componentDidUpdate) {
      component.componentDidUpdate()
    }
  } else if (component.compoentDidMount) {
    component.compoentDidMount()
  }
  if (component.base && component.base.parentNode) {
    component.base.parentNode.replaceChild(base, component.base)
  }

  component.base = base
  base._component = component
}


function setComponentProps(component, props) {
  if (!component.base) {
    if (component.componentWillMount) {
      component.componentWillMount()
    }
  } else if (component.componentWillReceiveProps) {
    component.componentWillReceiveProps(props)
  }
  component.props = props
  renderComponent(component)
}

function _render(vnode) {
  if (vnode === undefined || vnode === null || typeof vnode === 'boolean') {
    vnode = ''
  }
  if (typeof vnode === 'number') {
    vnode = String(vnode)
  }
  if (typeof vnode === 'string') {
    const textNode = document.createTextNode(vnode)
    return textNode
  }
  if (typeof vnode.tag === 'function') {
    const component = createComponent(vnode.tag, vnode.attrs)
    setComponentProps(component, vnode.attrs)
    return component.base
  }
  const dom = document.createElement(vnode.tag)
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach(key => {
      const value = vnode.attrs[key]
      setAttribute(dom, key, value)
    })
  }
  vnode.children.forEach(child => render(child, dom))
  return dom
}


class Component {
  constructor(props = {}) {
    this.state = {}
    this.props = props
  }

  setState(stateChange) {
    Object.assign(this.state, stateChange)
    renderComponent(this)
  }
}


window.React = {
  Component,
  createElement,
  render: (vnode, container) => render(vnode, container),
}
