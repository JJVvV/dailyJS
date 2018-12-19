import { createStore, applyMiddleware, Store } from 'redux'

import { routerMiddleware } from 'react-router-redux'
import { History } from 'history'

import { ApplicationState, reducers } from './store'

export default function configureStore(
  history: History,
  initialState: ApplicationState
): Store<ApplicationState> {
  return createStore(reducers, initialState)
}
