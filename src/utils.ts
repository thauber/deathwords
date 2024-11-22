import { v4 as uuid } from 'uuid';

export const makeId = () => {
  return uuid();
}


type Ref<T> = { current: T }

type Stack = Ref<any>[]

declare global {
  interface Window {
    _Locker: Record<string, Stack>
  }
}

export const Locker = (key:string) => {
  window._Locker = window._Locker || {}
  window._Locker[key] = window._Locker[key] || []
  const stack = window._Locker[key]

  let stackIndex = 0;
  const getStack = <T>(initial:T) => {
    if (stack.length == stackIndex) {
      stack.push({current:initial})
    }
    const index = stackIndex;
    stackIndex += 1;
    return stack[index] as Ref<T>
  }

  return {
    useState: <T>(initial:T):[T, (next: T) => void] => {
      const ref = getStack<T>(initial)
      return [ref.current, (next:T) => {ref.current = next}]
    }
  }
}