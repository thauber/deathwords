import { Action, Pole } from "../play"

export type Presence = {
  name: string
  presentAt: number
}

export interface ChatAction extends Action {
  message: string
  name?: string
}

export interface ChatBoard {
  present: Record<Pole, Presence>
  log: ChatAction[]
}

export const ChatEngine = (board:ChatBoard, action:ChatAction):ChatBoard => {
  let presence = board.present[action.pole]
  if (!presence) {
    presence = board.present[action.pole] = { name: action.name || action.pole, presentAt: action.actedAt }
  }
  board.log.push(action)
  return board
}