/*
  Vee is a library for building UI in the browser.

  It is from the ground up micro framework built on react,

  The goal is syntatically heirachical "react"ish components

  Simple wrapper around createElement that wires handlres, 
  and manages state for it's children, while simplifying
  the they syntax for dom description (woefully failing)

  State management is the job of the parent, before appending
  children it should note the state of it's children. This state
  is managed via Shadows which are stored in a global map called
  lightMap keyed by their depth first path.
*/

export type Appendable<T> = (T & {
  V: (...els:(HTMLElement|string|number|Branch<any, any>|undefined|null|false)[]) => Appendable<T>,
})

export type AppendableProps<T> = Partial<T> & {
  onClick?: (e:MouseEvent) => void
  onMouseEnter?: (e: MouseEvent) => void
  onMouseLeave?: (e: MouseEvent) => void
  onMouseOver?: (e: MouseEvent) => void
  onMouseOut?: (e: MouseEvent) => void
  onMouseMove?: (e: MouseEvent) => void
  onMouseDown?: (e: MouseEvent) => void
  onMouseUp?: (e: MouseEvent) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onKeyPress?: (e: KeyboardEvent) => void
  onKeyUp?: (e: KeyboardEvent) => void
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  onChange?: (e: Event) => void
  onInput?: (e: Event) => void
  onSubmit?: (e: Event) => void
  onReset?: (e: Event) => void
  onDrag?: (e: DragEvent) => void
  onDragEnd?: (e: DragEvent) => void
  onDragEnter?: (e: DragEvent) => void
  onDragExit?: (e: DragEvent) => void
  onDragLeave?: (e: DragEvent) => void
  onDragOver?: (e: DragEvent) => void
  onDragStart?: (e: DragEvent) => void
  onDrop?: (e: DragEvent) => void
}

/*
  Vee is a tree of functions that run to generate UI. State they created in their last run is passed to them
  in subsequent runs.

  When a component renders it recieves the result of the previous runs state.

  These are called shadows. Shadows are stored in a dictionary by a shadowKey. Shadow keys are depth first descriptions of your place in the tree.  'div0.div0.div2.span1' would be the shadow key for a span inside a div inside a div inside a div.

  When a component is asked to render it is passed the previous shadow and asked to return a new shadow.

  This mechanism is done by a global scope automoton. When a component is called it will create it's shadow key using the pathToRoot and childIndex in the global scope, and load it's shadow from the shadowMap, storing it later if there is stuff to store. When adding children components, it will add it self to pathToRoot, and increment the childIndex between each and pop itself off when the subtree is done rendering. It will also increment the childIndex for every object in the V call will they will add themselves to the pathToRoot. When the children are done they will pop themselves off the pathToRoot. As a result pathToRoot is a stack describing the current subtree, and childIndex is a counter for the current component.

  to preserve the child index conditional components can be return undefined or Appendable<T>. The index is skipped if it's contents is undefined, but reserves its spot in the shadow map. All indeterminate lists must use manual keys. which do not increment the child index. Using these rules any list of shadowable children should be definable.

*/

const stateMap:Record<string, {state:State<any>, props:any, elm:Appendable<any>}> = {}
const RootPath = function () {
  const _history:string[][] = []
  let _pathToRoot:string[] = []
  return {
    push: (item:string) => {
      _pathToRoot.push(item)
    },
    pop: () => {
      const val = _pathToRoot.pop()
      return val
    },
    asKey: () => _pathToRoot.join('.'),
    path: () => [..._pathToRoot],
    pushRoot: (path:string[]) => {
      _history.push(_pathToRoot)
      _pathToRoot = path
    },
    popRoot: () => {
      _pathToRoot = _history.pop() || []
    }
  }
}
let pathToRoot = RootPath()
let childIndex:number = 0

const path = (tag:string, index:number) => `${tag}${index}`
const key = (tag:string, index:number) => `${pathToRoot.asKey()}.${path(tag, index)}`

const V = <K extends keyof HTMLElementTagNameMap, T extends HTMLElementTagNameMap[K]> (tag:K , props:Partial<T>) => {
  const self = document.createElement<K>(tag)
  Object.entries(props).forEach(([key, value])=>{
    if (key == 'className') {
      self.setAttribute('class', value as string)
    } else {
      self.setAttribute(key, value)
    }
    if (key.startsWith('on') && key[2] === key[2].toUpperCase()) {
      self.addEventListener(key.slice(2).toLowerCase(), value as any)
    }
  })

  const l = self as any
  l.V = (...els:(HTMLElement|string|Branch<any, any>|undefined|null|false)[]) => {
    const parentChildIndex = childIndex
    childIndex = 0;
    pathToRoot.push(path(tag, parentChildIndex))
    const rootPath = pathToRoot.path()
    els.forEach((child) => {
      if (child === undefined || child === null || child === false) {
        return
      }
      if (typeof child === 'string' || typeof child === 'number') {
        l.appendChild(document.createTextNode(child))
      } else if (typeof child === 'function') {
        const lightKey = key('branch', childIndex)
        const {state, props, elm} = stateMap[lightKey] || {
          state: Cast(()=>{
            pathToRoot.pushRoot(rootPath)
            const {state, props, elm} = stateMap[lightKey]
            const [newElm, newProps] = child({state, props, lightKey}, props)
            if (elm != newElm) {
              elm.replaceWith(newElm)
            }
            stateMap[lightKey] = {state, props: newProps, elm: newElm}
            pathToRoot.popRoot()
          })
        }
        const [newElm, newProps] = child({state, props, elm, lightKey})
        l.appendChild(newElm)
        stateMap[lightKey] = {state, props: newProps, elm: newElm}
      } else {
        l.appendChild(child)
      }
      childIndex++;
    })
    pathToRoot.pop()
    childIndex = parentChildIndex
    return l as Appendable<T>
  }
  return l as Appendable<T>
}

V.div = (props:AppendableProps<HTMLDivElement>={}) => V('div', props)
V.a = (props:AppendableProps<HTMLAnchorElement>={}) => V('a', props)
V.h1 = (props:AppendableProps<HTMLHeadingElement>={}) => V('h1', props)
V.span = (text: string | number, props:AppendableProps<HTMLSpanElement>={}) => V('span', props).V(text)
V.p = (props: AppendableProps<HTMLParagraphElement> = {}) => V('p', props)
V.ul = (props: AppendableProps<HTMLUListElement> = {}) => V('ul', props)
V.li = (props: AppendableProps<HTMLLIElement> = {}) => V('li', props)
V.img = (props: AppendableProps<HTMLImageElement> = {}) => V('img', props)
V.button = (props: AppendableProps<HTMLButtonElement> = {}) => V('button', props)
V.input = (props: AppendableProps<HTMLInputElement> = {}) => V('input', props)
V.form = (props: AppendableProps<HTMLFormElement> = {}) => V('form', props)
V.table = (props: AppendableProps<HTMLTableElement> = {}) => V('table', props)
V.tr = (props: AppendableProps<HTMLTableRowElement> = {}) => V('tr', props)
V.td = (props: AppendableProps<HTMLTableCellElement> = {}) => V('td', props)
V.th = (props: AppendableProps<HTMLTableCellElement> = {}) => V('th', props)


/*
  Shadow is a function that holds internal type-safe state with getters and setters.

  When you call it you give it a name and an initial value and it will return for you the type-safe value and a setter.

  When ever a shadow is mutated onMutate will be called. Vee uses this to trigger re-renders.
*/

type RefInitial<T> = Promise<T> | T | (()=>T)
type RefSetter<T> = (newValue:(T|((oldValue:T)=>T)))=>T
type RefValue<I,T> = I extends Promise<any> ? T | undefined : T

export type State<S> = {
  <N extends keyof S, I extends RefInitial<S[N]>>(name:N, initial:I): [RefValue<I, S[N]>, RefSetter<S[N]>]
  _debug: ()=>{pathToRoot:string, storage:Partial<S>}
}
function Cast<S>(onMutate: ()=>void): State<S> {
  const storage:Partial<S> = {}
  function state<N extends keyof S>(name:N, initial:RefInitial<S[N]>) {
    const current = storage[name]
    const setter:RefSetter<S[N]> = ((newValue) => {
      if (newValue instanceof Function) {
        storage[name] = newValue(storage[name] as S[N]) 
      } else {
        storage[name] = newValue
      }
      onMutate()
      return storage[name] as S[N]
    })

    if (current === undefined) {
      if (initial instanceof Promise) {
        initial.then(v=>{
          storage[name] = v
          onMutate()
        })
        return [undefined, setter]
      } else if (initial instanceof Function) {
        storage[name] = initial()
      } else {
        storage[name] = initial
      }
    }
    return [storage[name] as S[N], ((newValue) => {
      if (newValue instanceof Function) {
        storage[name] = newValue(storage[name] as S[N]) 
      } else {
        storage[name] = newValue
      }
      onMutate()
      return storage[name] as S[N]
    }) as RefSetter<S[N]>]
  }
  state._debug = () => {
    return {
      pathToRoot: pathToRoot.asKey(),
      storage: {...storage},
    }
  }
  return state as State<S>
}

/*
  V.branch is how you shade a component. To shade it means to give it a mask and connect it to the shadow map.
  
  Your component will be rerendered if the shadow map changes or the mask changes.
  Think of these as internal and external state.

  It is responsible for two things. Returning a cached component if the mask hasn't changed.
  and replacing itself when a shadow changes with a new render.
*/
export type Elm<T,D> = (props:D, state?:State<T>) => Appendable<any>

type Branch<T,D> = ({state, props, elm}:{state:State<T>, props?:D, elm?:Appendable<any>, lightKey:string}, propsOverride?:D) => [Appendable<any>, D]
V.branch = <T,D extends {}>(render: Elm<T,D>, newProps:D={} as D):Branch<T,D> => {
  return ({state}:{state:State<T>, props?:D, elm?:Appendable<any>, lightKey:string}, propsOverride?:D):[Appendable<any>, D] => {
    // TODO: Only rerender if props change. Internal state is already managed.
    // if (propsOverride || newProps) == props) {
    //   return [elm, propsOverride || newProps]
    // }
    return [render(propsOverride || newProps, state), propsOverride || newProps]
  }
}

export default V
