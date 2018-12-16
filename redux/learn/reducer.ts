import { Reducer } from 'redux'
import { ChatState, ChatAction } from './types'

export const initialState: ChatState = {
  username: '',
  connectedUsers: [],
  messages: [],
}

// const reducer: Reducer<ChatState> = ()
