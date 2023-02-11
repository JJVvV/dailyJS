window.JSBridge = {
  invoke(bridgeName, data) {
    window.nativeBridge.postMessage({
      bridgeName,
      data,
    })
  },
  receiveMessage(msg) {
    const { bridgeName, data } = msg
    console.log(bridgeName, data
  },
}



