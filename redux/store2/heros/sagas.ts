import { all, call, fork, put, takeEvery } from 'redux-saga/effects'
import { HeroesActionTypes } from './types'
import { fetchError, fetchSuccess } from './actions'
import callApi from '../../utils/callApi'

const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || ''

function* handleFetch() {
  try {
    const res = yield call(callApi, 'get', API_ENDPOINT, '/heroes')
    if (res.error) {
      yield put(fetchError(res.error))
    } else {
      yield put(fetchSuccess(res))
    }
  } catch (err) {
    if (err instanceof Error) {
      yield put(fetchError(err.stack!))
    } else {
      yield put(fetchError('error occured.'))
    }
  }
}

function* watchFetchRequest() {
  yield takeEvery(HeroesActionTypes.FETCH_REQUEST, handleFetch)
}

function* heroesSaga() {
  yield all([fork(watchFetchRequest)])
}

export default heroesSaga
