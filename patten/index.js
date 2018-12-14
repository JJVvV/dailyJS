/**
 * 16章 适配器模式
 */

var googleMap = {
  show: function(){
    console.log('渲染谷歌地图')
  }
}

var baiduMap = {
  show: function(){
    console.log('渲染百度地图')
  }
}

var renderMap = function(map){
  if(map.show instanceof Function){
    map.show()
  }
}

renderMap(googleMap)
renderMap(baiduMap)

googleMap = {
  show: function(){
    console.log('渲染谷歌地图')
  }
}


// @ts-ignore
baiduMap = {
  display: function(){
    console.log('渲染百度地图')
  }
}

var baiduMapAdapter = {
  show: function(){
    return baiduMap.display()
  }
}

var getGuangdongCity = function(){
  var guangdongCity = [
    {
      name: 'shenzhen',
      id: 11
    },
    {
      name: 'guangzhou',
      id: 12
    }
  ]
  return guangdongCity
}

var render = function(fn){
  console.log('渲染广东地图')
}

render(getGuangdongCity)

var guangdongCity = {
  shenzhen: 11,
  guangzhou: 12,
  zhuhai: 13
}

var addressAdapter = function(oldAddressfn){
  var address = {},
    oldAddress = oldAddressfn()

  for(var i=0, c; c = oldAddressfn[i++];){
    address[c.name] = c.id
  }

  return function(){
    return address
  }
}

/****
 * 16章 状态模式
 */

var Light = function(){
  this.state = 'off'
  this.button = null
}
Light.prototype.init = function(){
  var button = document.createElement('button'),
    self = this
  button.innerHTML = '开关'
  this.button.onclick = function(){
    self.buttonWasPressed()
  }
}

Light.prototype.buttonWasPressed = function(){
  if(this.state === 'off'){
    console.log('开灯')
    this.state = 'on'
  }else if(this.state === 'on'){
    console.log('关灯')
    this.state = 'off'
  }
}

var OffLightState = function(light){
  this.light = light
}

OffLightState.prototype.buttonWasPressed = function(){
  console.log('弱光')
  this.light.setState(this.light.weakLightState)
}

var weakLightState = function(){
  this.light = light
}

weakLightState.prototype.fbuttonWasPressed = function(){
  console.log('强光')
  this.light.setState(this.light.strongLightState)
}

var StrongLightState = function(light){
  this.light = light
}

StrongLightState.prototype.buttonWasPressed = function(){
  console.log('关灯')
  this.light.setState(this.light.OffLightState)
}

var Light = function(){
  this.offLightState = new OffLightState(this)
  this.weakLightState = new weakLightState(this)
  this.strongLightState = new StrongLightState(this)
  this.button = null
}

Light.prototype.init = function(){
  var button = document.createElement('button'),
    self = this
  this.button = document.body.appendChild(button)
  this.currState = this.offLightState

  this.button.onclick = function(){
    self.curState.buttonWasPressed()
  }
}

window.external.upload = function(state){
  console.log(state)
}

var plugin = (function(){
  var plugin = document.createElement('embed')
  plugin.style.display = 'none'
  plugin.type = 'application/txftn-webkit'
  plugin.sign = function(){
    console.log('开始文件扫码')
  }
  plugin.pause = function(){
    console.log('暂停文件上传')
  }

  plugin.uploading = function(){
    console.log('、开始文件上传')
  }

  plugin.del = function(){
    console.log('删除文件上传')
  }

  plugin.done = function(){
    console.log('文件上传完成')
  }

  document.body.appendChild(plugin)

  return plugin

})()

var Upload = function(fileName){
  this.plugin = plugin
  this.fileName = fileName
  this.button1 = null
  this.button2 = null
  this.state = 'sign'
}

Plugin.prototype.init = function(){
  var that = this
  this.dom = document.createElement('div')
  this.dom.innerHTML = `
    <span>文件名称：${this.fileName}</span>
    <button data-action="button1">扫描中</button>
    <button data-action="button2">删除</button>
  `
}