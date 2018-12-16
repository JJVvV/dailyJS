type Item = {
  name: string
  id: number
}

export interface State {
  state: string
  list: Item[]
}

const types = {
  add: (id, name) => ({id, name, type: "ADD"})
}

export interface Action {
  type: string
  [propName: string]: any
}

export function notesListReducer(state: State, action: Action) {
  switch (action.type === "ADD") {
    case 
  }
}
