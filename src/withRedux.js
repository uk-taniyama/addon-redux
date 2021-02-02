import React from 'react'
import { diff as differ } from 'jsondiffpatch'
import * as events from './lib/events'
import { mergeStateAction, setStateAction, WITH_REDUX_ENABLED } from './enhancer'

let nextId = 0

export default addons => ({Provider, store, state, actions}) => {
  const channel = addons.getChannel()

  if (!store) throw new Error('withRedux: store is required')
  if (!Provider) throw new Error('withRedux: Provider is required as of v1.0.0')

  channel.removeAllEventListener(events.SET_STATE)
  channel.removeAllEventListener(events.DISPATCH)
  channel.on(events.SET_STATE, state => store.dispatch(setStateAction(state)))
  channel.on(events.DISPATCH, action => store.dispatch(action))

  const onDispatchListener = (action, prev, next) => {
    const diff = differ(prev, next)
    const date = new Date()
    channel.emit(events.ON_DISPATCH, {id: nextId++, date, action, diff, prev, next})
  }

  return story => {
    if (!store[WITH_REDUX_ENABLED]) throw new Error('withRedux enhancer is not enabled in the store')

    store[WITH_REDUX_ENABLED].listenToStateChange(onDispatchListener)
    channel.emit(events.INIT, {state: store.getState(), actions})
    store.dispatch(mergeStateAction(state))

    return <Provider store={store}>{story()}</Provider>
  }
}
