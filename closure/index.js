function showHelp(help) {
  document.getElementById('help').innerHTML = help
}

const data = []

function setupHelp() {
  const helpText = [
    { id: 'email', help: 'Your e-mail address' },
    { id: 'name', help: 'Your full name' },
    { id: 'age', help: 'Your age (you must be over 16)' },
  ]

  for (var i = 0; i < helpText.length; i++) {
    // eslint-disable-next-line no-loop-func, func-names
    (function () {
      // eslint-disable-next-line no-var
      var item = helpText[i]
      // eslint-disable-next-line no-var
      var j = i
      data[i] = function () {
        console.log(j, item)
      }
      document.getElementById(item.id).onfocus = function () {
        showHelp(item.help)
      }
    }()) // 马上把当前循环项的 item 与事件回调相关联起来
  }
}

setupHelp()

data[0]()
data[1]()
data[2]()
