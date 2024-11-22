import Pusher from 'pusher-js'
import { makeId } from './utils';


export type Pole = "north" | "south" | "out"
export type PlayState<B,A extends Action> = {
  board: B
  actions: A[]
  gameKey: string
  isStarted: boolean
  hasMet: boolean
  isTold: boolean
  pole: Pole
  stop: () => void
  start: () => void
  act: (initiative:Initiative<A>) => void
  current: () => PlayState<B, A>
  loadedFromCache: boolean
}
export type Action = {
  id: string
  actedAt: number
  pole: Pole
}
export type Initiative<A extends Action> = Omit<A, 'id' | 'actedAt' | 'pole'>
export type Engine<B, A extends Action> = (board:B, action:A) => B

export const Play = <B, A extends Action>(mux:string, engine: Engine<B, A>, initialBoard: B, onAction:(playState:PlayState<B, A>)=>void):PlayState<B, A> => {
  /*
  *
  * When you join you are gonna say hello
  * if someone who is not you says hello, retell the actionlog to them
  * on action record the action being told
  * on retell, set the actionlog and config, replay actionlog from start
  * When the config is ready client-start to lock in initial board
  * 
  */
  
  // PROPS
  const pusherKey = '33ff49d502fe46d06b8d'
  const urlParams = new URLSearchParams(window.location.search)
  const gameKey = urlParams.get('k')
  // STATE
  let board = initialBoard
  let mutualInitialBoard = {...initialBoard}
  let isTold = false
  let actions:A[] = []
  // This player has met opponent player
  let hasMet = false
  // This player or opponent player has started the game
  let isStarted = false
  // Set the pole of this player 
  // defaults to "out" which is permissionless
  let pole:Pole = "out"
  if (urlParams.get('p')?.toLowerCase()=="n") {
    pole = "north"
  } else if (urlParams.get('p')?.toLowerCase()=="s") {
    pole = "south"
  }

  // Flag to indicate if state was loaded from cache
  let loadedFromCache = false

  // Load state from local storage
  const loadFromCache = () => {
    const cachedState = localStorage.getItem(`playState_${mux}_${gameKey}`)
    if (cachedState) {
      const parsedState = JSON.parse(cachedState)
      board = parsedState.board
      actions = parsedState.actions
      loadedFromCache = true
    }
  }

  // Save state to local storage
  const saveToCache = () => {
    const stateToCache = {
      board,
      actions,
    }
    localStorage.setItem(`playState_${mux}_${gameKey}`, JSON.stringify(stateToCache))
  }

  // Load initial state from cache
  loadFromCache()

  const replay = (initialBoard:B, actionLog:A[]) => {
    board = actionLog.reduce((board, action) => engine(board, action), initialBoard)
    actions = actionLog
  }
  if (!pusherKey || !gameKey) throw `Game not configured properly: ${pusherKey} ${gameKey}`

  const pusher = new Pusher(pusherKey, {
    cluster: 'us2',
    channelAuthorization: { transport: 'ajax', endpoint: "/.netlify/functions/auth"}
  });

  const channel = pusher.subscribe(`private-${gameKey}`);
  channel.bind('pusher:subscription_succeeded', function() {
    if (!isTold) {
      isTold = true
      console.log(`∠ Hello ) #${mux}`)
      channel.trigger(`client-${mux}:hello`, {pole, latestAction:actions.length ? actions[actions.length - 1].id : null})
    }
  })
  channel.bind(`client-${mux}:retell`, function({actions, initialBoard}:{actions:A[], initialBoard:B}) {
    console.log("( Let me catch you up ≻")
    isStarted = true
    hasMet = true
    mutualInitialBoard = {...initialBoard}
    replay(initialBoard, actions)
    saveToCache()
    onAction(current())
  });
  channel.bind(`client-${mux}:start`, function(initialBoard:B) {
    board = initialBoard
    isStarted = true
  });
  channel.bind(`client-${mux}:hello`, function({from, latestActionId}:{from:Pole, latestActionId:string}) {
    console.log("( Hello ≻")
    if (pole != from) {
      if (!latestActionId || actions.find(a => a.id == latestActionId)) {
        hasMet = true
        channel.trigger(`client-${mux}:retell`, {actions, initialBoard:mutualInitialBoard})
      } else {
        console.log("∠ Hello Back )")
        channel.trigger(`client-${mux}:hello`, {pole, latestAction:actions.length ? actions[actions.length - 1].id : null})
      }
    }
  });
  channel.bind(`client-${mux}:action`, function(action:A) {
    console.log(`( Action! ≻ #${mux}`)
    board = engine(board, action)
    actions = [...actions, action]
    saveToCache()
    onAction(current())
  });

  const playState = {
    board,
    actions,
    gameKey,
    isStarted,
    hasMet,
    isTold,
    pole,
    loadedFromCache,
    stop() {
      if (channel) {
        channel.unbind('pusher:subscription_succeeded')
        channel.unbind(`client-${mux}:retell`)
        channel.unbind(`client-${mux}:start`)
        channel.unbind(`client-${mux}:hello`)
        channel.unbind(`client-${mux}:action`)
      }
    },
    start() {
      channel.trigger(`client-${mux}:start`, initialBoard)
      saveToCache()
    },
    act(initiative:Initiative<A>) {
      console.log("ACTING")
      const action:A = {...initiative, id:makeId(), actedAt:Date.now(), pole:pole} as A
      console.log(`∠ Action! ) #${mux}`)
      channel.trigger(`client-${mux}:action`, action)
      actions.push(action)
      board = engine(board, action)
      saveToCache()
      onAction(current())
    },
    current,
  }
  function current():PlayState<B, A> {
    return {...playState,
      board,
      gameKey: gameKey || "",
      isStarted,
      hasMet,
      isTold,
      pole,
      loadedFromCache,
    }
  }
  return playState
}

export const makeGameKey = () => Math.random().toString(36).substring(7)