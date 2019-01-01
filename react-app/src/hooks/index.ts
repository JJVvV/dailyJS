import { userState, userEffect, useEffect } from 'react'

function userFriendStatus(friendID) {
  const [isOnline, setIsOnline] = userState(null)
  function handleStatusChange(status) {
    setIsOnline(status.isOnline)
  }
  console.log('')
  useEffect(() => {})
  return isOnline
}
