import { makeGameKey } from './play.ts';
import './style.css'
import V, { Appendable } from './vee.ts'

export const IndexApp = () => {

  let hiddenTextRef: Appendable<HTMLDivElement>;
  let theRef: Appendable<HTMLDivElement>;
  let labRef: Appendable<HTMLDivElement>;

  return V.div({className: 'flex flex-col items-center justify-center min-h-screen'}).V(
    V.div({
      className: 'flex flex-col items-center justify-center text-8xl font-bold text-gray-800 font-mono leading-[5rem] border-2 border-gray-800 pt-1 m-4',
      onMouseEnter() {
        hiddenTextRef.classList.toggle('invisible');
      },
      onMouseLeave() {
        theRef.innerHTML = 'thE';
        labRef.innerHTML = 'lAb';
        hiddenTextRef.classList.toggle('invisible');
      },
      onMouseOver() {
        theRef.innerHTML = ['t', 'h', 'e'].map(char => Math.random() < 0.5 ? char.toUpperCase() : char.toLowerCase()).join('');
        labRef.innerHTML = ['l', 'a', 'b'].map(char => Math.random() < 0.5 ? char.toUpperCase() : char.toLowerCase()).join('');
      },
    }).V(
      theRef = V.div().V('thE'),
      labRef = V.div().V('lAb'),
    ),
    hiddenTextRef = V.div({
      className: 'invisible font-bold uppercase text-gray-600 h-8 -mt-4 tracking-wide',
    }).V('Experiments In Fun'),

    V.a({
      className: 'flex flex-col items-center justify-center py-1 px-2 m-4 border-2 border-blue-500 rounded-lg hover:bg-blue-100 active:bg-blue-300',
      href:`/arcana?k=${Math.random().toString(36).substring(7)}`,
    }).V(
      V.div({className: 'text-blue-800 text-4xl font-bold'}).V('Arcana'),
      V.div({className: 'text-blue-500 text-lg'}).V('The Council'),
    ),

    V.a({
      className: 'flex flex-col items-center justify-center p-4 hover:bg-black hover:text-white text-black text-2xl font-bold border-black hover:border-white border-[3px] border-dashed active:border-solid active:bg-white active:text-black',
      href:`/chross?k=${makeGameKey()}&p=s`,
    }).V('CHROSS'),

  )
}

