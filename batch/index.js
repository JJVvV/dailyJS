async function request(url) {
  // 这里可以使用 axios 等第三方库发送请求
  // 示例代码：
  try {
    // const res = await fetch(url);
    // return await res.json();
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`data: ${url}`)
      }, url * 1000)
    })
  } catch (err) {
    throw new Error(err)
  }
}

// 定义限制并发量函数
async function limitRequest(urls, limit) {
  const results = []
  let running = 0
  let index = 0
  while (index < urls.length || running > 0) {
    while (running < limit && index < urls.length) {
      const url = urls[index]
      running++
      index++
      console.log('started')
      // eslint-disable-next-line no-loop-func
      results.push(request(url).then((res) => {
        console.log('done')
        running--
        return res
      }))
    }
  }
  return results
}


// init()

function batchFetch(urls, limit) {
  const queue = urls.slice() // 将urls数组复制一份
  let active = 0 // 当前正在请求的数量
  const result = [] // 请求结果
  return new Promise((resolve, reject) => {
    function run(index) {
      if (active >= limit || queue.length === 0) return // 超过限制或者队列为空时停止请求
      active++
      console.log('started')
      request(queue.shift())
        .then(res => {
          result[index] = res
          console.log('done')
          active--
          run(urls.length - queue.length)
          if (queue.length === 0 && !active) {
            resolve(result)
          }
        })
        .catch(err => {
          reject(err)
        })
    }

    for (let i = 0; i < limit; i++) {
      run(i)
    }
  })
}

function batchFetch2(urls, limit) {
  let active = 0
  const result = []
  return new Promise((resolve, reject) => {
    const queue = urls.slice()
    function run(index) {
      if (active >= limit || !queue.length) {
        return
      }
      active++
      request(queue.shift()).then((res) => {
        result[index] = res
        active--
        run(urls.length - queue.length)
        if (!active && !queue.length) {
          resolve(result)
        }
      }).catch((err) => {
        reject(err)
      })
    }

    for (let i = 0; i < limit; i++) {
      run(i)
    }
  })
}


async function init() {
  const res = await batchFetch2([2, 1, 3, 0, 4], 5)
  console.log(res)
}

init()
