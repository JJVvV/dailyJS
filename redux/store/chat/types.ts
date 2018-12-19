import { Action } from 'redux'

export interface ChatState {
  username: string
  connectedUsers: UserInfo[]
  messages: MessagePayload[]
}

export interface UserInfo {
  name: string
  id: number
}

export interface TemplateItem {
  item: string
  text: string
}

export interface MessagePayload {
  timestamp: Date
  user: string
  message: {
    type: 'text' | 'template'
    content?: string
    items: TemplateItem[]
  }
}

export interface UsersListUpdatedAction extends Action {
  type: '@@chat/USERS_LIST_UPDATED'
  payload: {
    users: UserInfo[]
  }
}

export interface MessageReceivedAction extends Action {
  type: '@@chat/MESSAGE_RECEIVED'
  payload: {
    timestamp: Date
    user: string
    message: MessagePayload
  }
}

export type ChatActions = UsersListUpdatedAction | MessageReceivedAction
