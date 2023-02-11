const tasks = [
  () => {
    console.log('task 1')
  },
  () => {
    console.log('task 2')
  },
]

function work() {
  tasks.shift()()
}

function myNonEssentialWork(deadline) {
  while (tasks.length && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
    work()
  }
  if (tasks.length) {
    requestIdleCallback(myNonEssentialWork)
  }
}


requestIdleCallback(myNonEssentialWork, { timeout: 2000 })
