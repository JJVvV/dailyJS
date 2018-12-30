import { useState, useEffect } from 'react'

function FriendListItem(props: { name: string }) {
  const [isOnline, setIsOnline] = useState(false)
  function handleStatusChange(status: { isOnline: boolean }) {
    setIsOnline(status.isOnline)
  }
  useEffect(() => {
    console.log('hehe')
  })
  return <li>{props.name}</li>
}
