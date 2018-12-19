import { action } from 'typesafe-actions'
import { HeroesActionTypes, Hero } from './types'
export const fetchRequest = () => action(HeroesActionTypes.FETCH_REQUEST)
export const fetchSuccess = (data: Hero[]) =>
  action(HeroesActionTypes.FETCH_SUCCESS, data)
export const fetchError = (message: string) =>
  action(HeroesActionTypes.FETCH_ERROR, message)
