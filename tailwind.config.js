/** @type {import('tailwindcss').Config} */
export default {
  content: [
    '*.html',
    './src/**/*.{js,ts,html}'
  ],
  theme: {
    extend: {
      fontFamily: {
        'chross': ['Germania One', 'cursive'],
        'symbol': ['Noto Sans Symbols 2']
      },
      colors: {
        'piece-light': '#ffffff',
        'piece-lighter': '#d1d5db', // gray-300
        'light': '#e5e7eb', // gray-200
        'light-active': '#c8e6c9',
        'light-breach-north': '#8c9ec2', // gray-200 with alpha
        'light-breach-south': '#eceef1', // gray-300 with alpha
        'light-breach-active': '#c8e6c9',
        'light-breach-historic': '#c8e6c9',
        'light-display': '#9ca3af', // gray-400

        'piece-dark': '#000000',
        'piece-darker': '#374151', // gray-700
        'dark': '#374151', // gray-700
        'dark-active': '#4a624d',
        'dark-breach-north': '#6d81a3', // gray-700 with alpha
        'dark-breach-south': '#d1d5db', // gray-600 with alpha
        'dark-breach-active': '#4a624d',
        'dark-breach-historic': '#93c5fd', // blue-300 for historic highlight
        'dark-display': '#111827', // gray-900

        'historic': '#81bdff', // blue-300 for historic highlight
        'historic-dark': '#15abf8', // blue-600 for historic highlight
        'historic-light': '#c8e7ff', // blue-200 for historic highlight

        'breach': '#00000077',
      }
    },
  },
  plugins: [],
}

