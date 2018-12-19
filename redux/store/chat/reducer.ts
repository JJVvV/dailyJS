import { Reducer } from 'redux'
import { ChatState, ChatActions } from './types'

export const initialState: ChatState = {
  username: '',
  connectedUsers: [],
  messages: [],
}

const reducer: Reducer<ChatState> = (
  state: ChatState = initialState,
  action: ChatActions
) => {
  switch (action.type) {
    case '@@chat/USERS_LIST_UPDATED':
      return {
        ...state,
        connectedUsers: action.payload.users,
      }
    case '@@chat/MESSAGE_RECEIVED':
      return { ...state, messages: [...state.messages, action.payload.message] }
    default:
      return state
  }
}

export default reducer
