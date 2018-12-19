import { ActionCreator } from 'redux'
import {
  UsersListUpdatedAction,
  UserInfo,
  MessageReceivedAction,
  MessagePayload,
} from './types'

export const updateUsersList: ActionCreator<UsersListUpdatedAction> = (
  users: UserInfo[]
) => ({
  type: '@@chat/USERS_LIST_UPDATED',
  payload: {
    users,
  },
})

export const messageReceived: ActionCreator<MessageReceivedAction> = (
  user: string,
  message: MessagePayload
) => ({
  type: '@@chat/MESSAGE_RECEIVED',
  payload: {
    timestamp: new Date(),
    user,
    message,
  },
})
