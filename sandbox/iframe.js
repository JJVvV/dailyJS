const foo = 'foo'
const ctx = {
  func: (variable) => {
    console.log(variable)
  },
  foo: 'ctx foo',
}


// function veryPoorSandbox(code, ctx) {
//   with(ctx){
//     eval(code)
//   }
// }

// const code = `func(foo)`;
// veryPoorSandbox(code, ctx)


function withedYourCode(code) {
  code = `with(shadow){${code}}`
  return new Function('shadow', code)
}

const access_white_list = ['func']

// const code = 'func(foo)'

const ctxProxy = new Proxy(ctx, {
  has(target, prop) {
    if (access_white_list.includes(prop)) {
      return target.hasOwnProperty(prop)
    }
    if (!target.hasOwnProperty(prop)) {
      throw new Error(`Not found - ${prop}`)
    }
    return true
  },
})

function littlePoorSandbox(code, ctx) {
  withedYourCode(code).call(ctx, ctx)
}

// littlePoorSandbox(code, ctxProxy)

class SandboxGlobalProxy {
  constructor(sharedState) {
    const iframe = document.createElement('iframe', { url: 'about:blank' })
    iframe.style.display = 'none'
    document.body.appendChild(iframe)
    const sandboxGlobal = iframe.contentWindow
    return new Proxy(sandboxGlobal, {
      has(target, prop) {
        if (access_white_list.includes(prop)) {
          return target.hasOwnProperty(prop)
        }
        if (!target.hasOwnProperty(prop)) {
          throw new Error(`Not found - ${prop}`)
        }
        return true
      },
      get(target, prop) {
        return target[prop]
      },
      set(target, prop, value) {
        console.log('set')
        target[prop] = value
      },
    })
  }
}

function maybeAvailableSandbox(code, context) {
  withedYourCode(code).call(context, context)
}


const code = `
  String.prototype.toString2 = function(){
    console.log('cc');
    return 'asdf'
  }
  window.aa = 'bb'
  console.log(aa.toString());
`
const sharedGlobal = ['history']

const globalProxy = new SandboxGlobalProxy(sharedGlobal)

maybeAvailableSandbox(code, globalProxy)
