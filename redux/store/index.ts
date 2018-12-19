import { combineReducers, Dispatch, Reducer, Action } from 'redux'
// import { routerReducer } from 'react-roouter-redux'
import { ChatState } from './chat/types'
import chatReducer from './chat/reducer'

export interface ApplicationState {
  chat: ChatState
}

export const reducers: Reducer<ApplicationState> = combineReducers<
  ApplicationState
>({
  // router: routerReducer,
  chat: chatReducer,
})

export interface ConnectedReduxProps<S extends Action> {
  dispatch: Dispatch<S>
}
