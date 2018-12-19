export interface Hero {
  id: number
  name: string
  localized_name: string
  attack_type: string
  roles: string[]
  legs: number
}

export type ApiResponse = Record<string, any>

export const enum HeroesActionTypes {
  FETCH_REQUEST = '@@heros/FETCH_REQUEST',
  FETCH_SUCCESS = '@@heros/FETCH_SUCCESS',
  FETCH_ERROR = '@@heros/FETCH_ERROR',
  SELECTED = '@@heros/SELECTED',
}

export interface HeroesState {
  readonly loading: boolean
  readonly data: Hero[]
  readonly errors?: string
}
