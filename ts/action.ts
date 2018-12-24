import { createStandardAction, createAction } from './common'

const enum Types {
  FETCH_LIST = 'FETCH_LIST',
  FETCH_DETAIL = 'FETCH_DETAIL',
}

export const fetchData = createStandardAction(Types.FETCH_LIST)<string>()
export const fetchData2 = createAction(Types.FETCH_DETAIL)
