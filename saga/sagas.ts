import { call, put, takeEvery, takeLatest } from 'redux-saga/effects'
import * as Api from './api'

export function* helloSaga() {
  console.log('Hello Sagas')
}

function* fetchUser(action) {
  try {
    const user = yield call(Api.fetchUser, action.payload.userId)
    yield put({ type: 'USER_FETCH_SUCCESSED', user })
  } catch (e) {
    yield put({ type: 'USER_FETCH_FAILED', message: e.message })
  }
}

function* mySaga() {
  yield takeEvery('USER_FETCH_REQUESTED', fetchUser)
}
