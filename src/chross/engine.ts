import { Engine, Action } from '../play'

// Types for game state
type Pole = 'north' | 'south'
export type Piece = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king'
export type Position = [number, number]
type Checker = {
  position: Position
  pole: Pole
}

type LogEntry = {
  message: string
  actedAt: number
  pole: Pole
}

export type ChrossBoard = {
  checkers: Checker[]
  hands: Record<Pole, Piece[]>
  decks: Record<Pole, Piece[]>
  turn: Pole
  breached: Record<Pole, number>
  log: LogEntry[]
}

// Actions a player can take
export type ChrossAction = Action & ({
  drawIndex: number
  handIndex: number
  from: Position
  to: Position
})

// Initial deck setup
const INITIAL_DECK: Piece[] = [
  'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn',
  'rook', 'rook',
  'knight', 'knight',
  'bishop', 'bishop',
  'queen',
  'king'
]

// Initial checker positions - 2 rows for each player
const INITIAL_CHECKERS: Checker[] = [
  // North pieces - rows 0 and 1
  ...[0,1].flatMap(row => 
    [0,1,2,3,4,5,6,7].map(col => ({
      position: [row, col] as Position,
      pole: 'north' as Pole
    }))
  ),
  // South pieces - rows 6 and 7
  ...[6,7].flatMap(row => 
    [0,1,2,3,4,5,6,7].map(col => ({
      position: [row, col] as Position,
      pole: 'south' as Pole
    }))
  )
]

// Constants
export const BOARD_BREACH_LIMIT = 3
// Initial board state
export const DEFAULT_BOARD: ChrossBoard = {
  checkers: INITIAL_CHECKERS,
  hands: {
    north: [],
    south: [],
  },
  decks: {
    north: [...INITIAL_DECK],
    south: [...INITIAL_DECK],
  },
  turn: 'south',
  breached: {
    north: 0,
    south: 0,
  },
  log: []
}

export const initializeBoard = (): ChrossBoard => {
  const board = { ...DEFAULT_BOARD }
  for (const pole of ['north', 'south'] as Pole[]) {
    const deck = [...INITIAL_DECK]
    const hand: Piece[] = []
    // Draw initial hand of 5 pieces
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * deck.length)
      hand.push(deck.splice(randomIndex, 1)[0])
    }
    board.hands[pole] = hand
    board.decks[pole] = deck
  }
  return {
    ...DEFAULT_BOARD,
    checkers: INITIAL_CHECKERS,
  }
}

export const getTargetableSquares = (board: ChrossBoard, pole: Pole, checker: Checker, piece: Piece): Position[] => {

  const targetableSquares: Position[] = []
  for (let row = -1; row < 9; row++) {
    for (let col = 0; col < 8; col++) {
      try {
        checkAndCaptureMove(board, pole, piece, checker.position, [row, col])
        targetableSquares.push([row, col])
      } catch (e) { }
    }
  }
  return targetableSquares
}

// Helper to check if move is valid for given piece type
const checkAndCaptureMove = (board:ChrossBoard, pole: Pole, piece: Piece, from: Position, to: Position): Checker | undefined => {
  const checker = board.checkers.find(c => c.pole === pole && c.position[0] === from[0] && c.position[1] === from[1])
  if (!checker) {
    throw `Player does not have a checker at ${from}`
  }
  if (to[0] < -1 || to[0] > 8 || to[1] < 0 || to[1] > 7) {
    throw `Player cannot move to position ${to}` 
  }
  // Prevent moving into own back row
  if ((pole === 'north' && to[0] === -1) || (pole === 'south' && to[0] === 8)) {
    throw `Player cannot move into their own back row`
  }
  const attackedChecker = board.checkers.find(c => c.position[0] === to[0] && c.position[1] === to[1])
  if (attackedChecker && attackedChecker.pole === pole) {
    throw `Player cannot attack their own piece at ${to}`
  }
  const dx = Math.abs(to[1] - from[1])
  const dy = Math.abs(to[0] - from[0])


  // Check if path is blocked by any pieces between from and to positions
  let isBlocked = false;
  
  // For straight or diagonal moves, check all squares in between
  if (dx === dy || dx === 0 || dy === 0) {
    const rowStep = to[0] > from[0] ? 1 : to[0] < from[0] ? -1 : 0;
    const colStep = to[1] > from[1] ? 1 : to[1] < from[1] ? -1 : 0;
    
    let row = from[0] + rowStep;
    let col = from[1] + colStep;
    
    // Check each square until we reach the destination
    while (row !== to[0] || col !== to[1]) {
      if (board.checkers.some(c => c.position[0] === row && c.position[1] === col)) {
        isBlocked = true;
        break;
      }
      row += rowStep;
      col += colStep;
    }
  }

  let isLegal = false
  switch(piece) {
    case 'pawn':
      const isGoingRightDirection = pole === 'north' ? to[0] > from[0] : to[0] < from[0]
      const isInitialMove = from[0] === (pole === 'north' ? 1 : 6) && dy === 2 && dx === 0
      const isAttacking = attackedChecker && dy === 1 && dx === 1
      const isMoving = dx === 0 && dy === 1
      isLegal = (isInitialMove || isAttacking || isMoving) && isGoingRightDirection
      break;
    case 'knight':
      isLegal = (dx === 2 && dy === 1) || (dx === 1 && dy === 2)
      break;
    case 'bishop':
      isLegal = dx === dy && !isBlocked
      break;
    case 'rook':
      isLegal = (dx === 0 || dy === 0) && !isBlocked
      break;
    case 'queen':
      isLegal = (dx === dy || dx === 0 || dy === 0) && !isBlocked
      break;
    case 'king':
      isLegal = dx <= 1 && dy <= 1
      break;
    default:
      throw `Invalid piece type: ${piece}`
  }
  if (!isLegal) {
    throw `Invalid move: ${piece} from ${from} to ${to}`
  }
  return attackedChecker
}

export const ChrossEngine: Engine<ChrossBoard, ChrossAction> = (board, action) => {
  ['north', 'south'].forEach(pole => {
    if (board.breached[pole as Pole] >= BOARD_BREACH_LIMIT) {
      throw `Player ${pole} has breached the board`
    }
  })
  const {drawIndex, handIndex, from, to, pole} = action
  if (pole !== board.turn) {
    throw `Player can not move on opponent's turn`
  }
  const piece = board.hands[pole][handIndex]
  const checker = board.checkers.find(c => c.position[0] === from[0] && c.position[1] === from[1] && c.pole === pole)
  if (!checker) {
    throw `Player can only move their own pieces`
  }
  try {
    const capturedChecker = checkAndCaptureMove(board, pole, piece, from, to)
    if (capturedChecker ) {
      board.checkers = board.checkers.filter(c => c.pole !== capturedChecker.pole || c.position[0] !== capturedChecker.position[0] || c.position[1] !== capturedChecker.position[1])
    }
    checker.position = to
  } catch (e) { throw e }
  // Remove the piece from the hand
  board.hands[pole] = board.hands[pole].filter((_,i) => i !== handIndex)
  // Draw a new piece from the deck
  const drawnPiece = board.decks[pole][drawIndex]
  // Remove the drawn piece from the deck
  board.decks[pole] = board.decks[pole].filter((_,i) => i !== drawIndex)
  // Add the drawn piece to the hand
  board.hands[pole].push(drawnPiece)

  // const pieceMap = {
  //   'pawn': '♟',
  //   'knight': '♞',
  //   'bishop': '♝',
  //   'rook': '♜',
  //   'queen': '♛',
  //   'king': '♚'
  // }

  if (board.decks[pole].length === 0) {
    // Shuffle discarded pieces back into deck, excepting the pieces in hand
    board.decks[pole] = board.hands[pole].reduce((newDeck, piece) => {
      const index = newDeck.indexOf(piece);
      if (index !== -1) {
        newDeck.splice(index, 1);
      }
      return newDeck
    }, [...INITIAL_DECK])
  }
  board.turn = pole === 'north' ? 'south' : 'north'
  board.breached = {
    north: board.checkers.filter(c => c.pole === 'south' && c.position[0] === -1).length,
    south: board.checkers.filter(c => c.pole === 'north' && c.position[0] === 8).length,
  }
  return board
}