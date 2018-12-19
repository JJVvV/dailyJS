import { combineReducers, Dispatch, Reducer, Action, AnyAction } from 'redux'
import { LayoutState, layoutReducer } from './layout'

export interface ApplicationState {
  layout: LayoutState
}

export const rootReducer = combineReducers<ApplicationState>({
  layout: layoutReducer,
})
