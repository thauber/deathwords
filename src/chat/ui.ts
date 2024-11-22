import { Play, PlayState } from "../play";
import { ChatBoard, ChatAction } from "./engine.ts";
import V, { State } from "../vee.ts";
import { ChatEngine, DEFAULT_BOARD } from "../chat.ts";

type ChatAppProps = {
  className: string
}
type ChatAppState = {
  game: PlayState<ChatBoard, ChatAction>
}
export const ChatApp = ({ className }: ChatAppProps, state:State<ChatAppState>) => {
  const [{board, act}, setGame] = state('game', ()=>Play('chat', ChatEngine, DEFAULT_BOARD, (playstate) => { setGame(playstate) }))
  let inputRef = null;
  return V.div({ className: `h-full flex flex-col justify-between p-4 ${className}` }).V( // Chat container
    V.div({ className: "text-2xl font-bold mb-4" }).V('Chat'),
    V.div({ className: "flex-1 overflow-y-auto space-y-4" }).V( // Chat log container
      ...board.log.map((action) => V.div({ className: "bg-gray-100 p-3 rounded-md" }).V( // Chat message
        V.div({ className: "text-gray-700" }).V(action.message),
        V.div({ className: "text-xs text-gray-500" }).V(board.present[action.pole].name || action.pole)
      ))
    ),
    V.div({ className: "mt-4 flex space-x-2" }).V( // Chat input section
      inputRef = V.input({
        type: 'text', placeholder: 'Message', className: 'border rounded-lg p-2 flex-1'
      }),
      V.button({
        className: 'bg-blue-500 text-white rounded-lg px-4 py-2',
        onClick: () => act({ message: inputRef.value })
      }).V('Send')
    )
  );
}