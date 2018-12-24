import * as actions from './action'
import { ActionType } from './common'

// {
//   type: '2',
//   payload: string
// }

type AllActions = ActionType<typeof actions>
function reducer(action: AllActions) {
  switch (
    action.type
    // case Types.FETCH_DETAIL:
    //   console.log(action.type)
  ) {
  }
}
