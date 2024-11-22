import "../style.css"
import { makeGameKey, Play, PlayState, Pole } from '../play.ts';
import V, { AppendableProps, State } from '../vee.ts';
import { ChrossAction, ChrossBoard, ChrossEngine, type Piece, Position, getTargetableSquares, initializeBoard, BOARD_BREACH_LIMIT } from "./engine.ts";

type ChrossAppState = {
  game: PlayState<ChrossBoard, ChrossAction>
  currentAction: Partial<ChrossAction>
  error?: string
}

const Checker = ({checker, onSelectChecker, selected=false, pole}: {checker: {pole: Pole, position: Position}, onSelectChecker: (position: Position) => void, selected?: boolean, pole: Pole}) => {
  const props:AppendableProps<HTMLDivElement> = {
    className: `relative z-10 w-12 h-12 max-w-[80%] max-h-[80%] rounded-full ${
      checker.pole === 'north' 
        ? 'bg-piece-dark border-2 border-piece-darker' 
        : 'bg-piece-light border-2 border-piece-lighter'
    } ${selected ? 'bg-yellow-100 border-2 border-yellow-300' : ''}`
  }
  if (checker.pole === pole) {
    props.onClick = () => onSelectChecker(checker.position)
  }
  return V.div(props)
}

type BoardProps = {
  board: ChrossBoard,
  pole: Pole,
  onSelectChecker: (position: Position) => void,
  onSelectTarget: (position: Position) => void,
  targetableSquares: Position[],
  selectedChecker?: Position,
  lastAction?: ChrossAction,
}

const Board = ({board, pole, lastAction, onSelectChecker, onSelectTarget, targetableSquares, selectedChecker}: BoardProps) => {
  const isNorth = pole === 'north'
  const rows = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8]
  if (isNorth) {
    rows.reverse()
  }
  const breachedPole = Object.entries(board.breached).find(([_, count]) => count >= BOARD_BREACH_LIMIT)?.[0]
  const winner = breachedPole && breachedPole === 'south' ? 'Black' : 'White'
  return V.div({className: 'relative'}).V(
    V.div({className: breachedPole ? 'flex' : 'hidden'}).V(
      V.div({className: 'absolute z-20 top-0 left-0 w-full h-full z-0 bg-breach flex items-center justify-center flex-col'}).V(
        V.h1({className: 'text-white text-4xl font-bold'}).V('BREACH'),
        V.p({className: 'text-white text-2xl py-4'}).V(`${winner} has breached the board!`),
        V.button({className: 'text-white rounded-lg border-white border-2 hover:bg-light text-2xl p-2', onClick: () => {
          window.location.assign(`${(''+window.location).split('?')[0]}?k=${makeGameKey()}&p=s`)
        }}).V('REMATCH')
      )
    ),
    V.div({className: 'grid grid-cols-8 w-full relative gap-0 bg-gray-300'}).V(
      ...rows.flatMap(row =>
        [0, 1, 2, 3, 4, 5, 6, 7].map(col => {
          const isBlackSquare = (row + col) % 2 === 0
          const checker = board.checkers.find(c => 
            c.position[0] === row && c.position[1] === col
          )

          const isActive = targetableSquares.some(([x,y]) => x === row && y === col)
          const isSouthBreach = row === -1
          const isNorthBreach = row === 8
          const isBreach = isSouthBreach || isNorthBreach
          const isNorth = pole === 'north'
          const isTo = lastAction?.to[0] === row && lastAction?.to[1] === col
          const isFrom = lastAction?.from[0] === row && lastAction?.from[1] === col
          const isHistoric = isTo || isFrom
          /*
          bg-[color][-breach-row][-active]
          bg-dark-breach-active
          bg-light-breach-active
          bg-dark-active
          bg-light-active
          border-dark-historic
          border-light-historic
          bg-dark-breach-historic
          bg-light-breach-historic
          bg-dark-breach-north
          bg-dark-breach-south
          bg-light-breach-north
          bg-light-breach-south
          bg-dark-historic
          bg-light-historic
          bg-dark
          bg-light
          border-dark
          border-light
          border-b-2
          border-t-2
          border-historic-dark
          bg-historic-light
          bg-historic
          */
          const textClass = isBlackSquare ? 'text-dark-display' : 'text-light-display'
          const borderClass = `${isHistoric ? `border-historic-dark border-2` : `${isBreach ? `border-${isNorth && isSouthBreach ? 't' : 'b'}-2 border-${isSouthBreach ? 'dark' : 'light'}` : ''}`}`
          const bgClass = `bg-${isTo ? 'historic' : isFrom ? 'historic-light' : `${isBlackSquare ? 'dark' : 'light'}${isBreach ? '-breach' : ''}${isActive ? '-active' : isSouthBreach ? '-south' : isNorthBreach ? '-north' : ''}`}`
          return V.div({
            className: `aspect-square font-sans relative w-full h-full flex items-center justify-center ${textClass} ${borderClass} ${bgClass}`,
            onClick:()=>onSelectTarget([row, col])
          }).V(
            // V.div({className: 'absolute top-0 left-0 w-full h-full z-0'}).V(`[${row},${col}]`),
            !!checker && V.branch(Checker, {checker, onSelectChecker, selected: checker.position === selectedChecker, pole})
          )
        })
      )
    )
  )
}

const Hand = ({hand, pole, selectedIndex=-1, onSelectPiece=undefined}: {hand: Piece[], pole: Pole, selectedIndex?: number, onSelectPiece?: (index: number) => void}) => {
  return V.div({className: 'flex justify-center my-4'}).V(
    ...hand.map((piece, i) => V.branch(Piece, {piece, pole, selected: i === selectedIndex, onSelectPiece: () => onSelectPiece?.(i)}))
  )
}

const Piece = ({piece, pole, selected=false, onSelectPiece}: {piece: Piece, pole: Pole, selected?: boolean, onSelectPiece: () => void}) => {
  return V.div({
    onClick: onSelectPiece,
    className: `rounded-lg h-16 w-16 aspect-square m-1 ${
      pole === 'south' 
        ? selected 
          ? 'bg-yellow-100 border-2 border-yellow-300' 
          : 'bg-piece-light border-2 border-piece-lighter'
        : selected 
          ? 'bg-yellow-100 border-2 border-yellow-300 text-black' 
          : 'bg-piece-dark border-2 border-piece-darker text-white'
    } flex items-center justify-center`
  }).V(
  V.div({className: 'font-bold font-symbol text-6xl'}).V(piece === 'pawn' ? '♟' : piece === 'knight' ? '♞' : piece === 'bishop' ? '♝' : piece === 'rook' ? '♜' : piece === 'queen' ? '♛' : '♚')
  )
}

type ChrossAppProps = {
  className?: string
}

export const App = ({className}: ChrossAppProps, state:State<ChrossAppState>) => {
  const [{board, act, pole, actions}, setGame] = state('game', ()=>Play('chross', ChrossEngine, initializeBoard(), (playState) => {
    setGame(playState)
    if (!Object.values(playState.board.breached).some(count => count > BOARD_BREACH_LIMIT)) {
      let currentPoleValue = "n"
      let nextPoleValue = "s"
      if (playState.pole == "south") {
        currentPoleValue = "s"
        nextPoleValue = "n"
      }
      const url = (""+window.location).replace(`p=${currentPoleValue}`, `p=${nextPoleValue}`)
      window.location.assign(url)
    }
  }))

  if (pole !== 'north' && pole !== 'south') {
    throw new Error(`Invalid pole: ${pole}`)
  }

  const [currentAction, setCurrentAction] = state('currentAction', {})

  const onSelectPiece = (index: number) => {
    setCurrentAction((currentAction)=> {
      return {
        ...currentAction,
        handIndex: index === currentAction.handIndex ? undefined : index
      }
    })
  }

  const onSelectChecker = (position: [number, number]) => {
    setCurrentAction((currentAction)=> {
      return {
        ...currentAction,
        from: position
      }
    })
  }

  const [error, setError] = state('error', undefined)
  const onSelectTarget = (position: [number, number]) => {
    if (currentAction.handIndex !== undefined && currentAction.from !== undefined) {
      const action = {
        handIndex: currentAction.handIndex,
        from: currentAction.from,
        to: position,
        drawIndex: Math.floor(Math.random() * board.decks[pole].length),
      }
      try {
        act(action)
      } catch (e) {
        setError(e as string)
      }
    }
  }

  let targetableSquares: Position[] = []
  const checker = board.checkers.find(c => c.position === currentAction.from)
  if (currentAction.handIndex !== undefined && checker) {
    targetableSquares = getTargetableSquares(board, pole, checker, board.hands[pole][currentAction.handIndex])
  }

  const otherPole = pole === 'north' ? 'south' : 'north'
  const lastAction = actions.length > 0 ? actions[actions.length - 1] : undefined

  return V.div({ className: `flex w-screen justify-center ${className}` }).V( // Full page container
    V.div({ className: "flex-col bg-gray-200 max-w-96 bg-gray-200 justify-end" }).V( // Main content (left 4/5th)
      V.branch(Hand, {hand: board.hands[otherPole], pole: otherPole}),
      V.branch(Board, {board, pole, lastAction, onSelectChecker, onSelectTarget, targetableSquares, selectedChecker: currentAction.from}),
      !!error && V.div({className: 'text-red-500 text-center'}).V(error),
      V.branch(Hand, {hand: board.hands[pole], pole, onSelectPiece, selectedIndex: currentAction.handIndex})
    ),
  );
};