import Head from 'next/head'
import Container from 'react-bootstrap/Container' 
import Row from 'react-bootstrap/Row' 
import dynamic from 'next/dynamic'

import GameInfo from '../components/GameInfo'
import Game from '../components/Game'
import NavBar from '../components/NavBar'
import { useState,useRef,forwardRef} from 'react'

function randomInteger(min, max) {
  var rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
}

function PlayOffline(props) {
  const GameInfoRef = useRef(null)
  const usernames = ["You", "Computer"]
  const players = []
  let figures = ["cross", "circle", "square", "triangle"]
  let colors = ["green", "blue", "light_blue", "orange"]
  for (let username of usernames) {
    const color_idx = randomInteger(0, colors.length - 1)
    const color = colors[color_idx]
    colors.splice(color_idx, 1)
    const figure_idx = randomInteger(0, figures.length - 1)
    const figure = figures[figure_idx]
    figures.splice(figure_idx, 1)
    players.push({ username: username, color: color, figure: figure })
  }
  console.log(players)
  const [gameData, setGameData] = useState({
    players: players,
    your_username: "You",
    your_player_idx: 0,
    current_player_count: 2,
    max_player_count: 2,
    player_turn: usernames[randomInteger(0, usernames.length - 1)],
    time: 0,
    offline: true,
    GameInfoRef: GameInfoRef
  });

  return (
    <div>
      <NavBar />
      <Container fluid>
        <Row>
          <GameInfo gameData={gameData} />
          <Game gameData={gameData} setGameData={setGameData} />
        </Row>
      </Container>
    </div>
  )
}

export default dynamic(() => Promise.resolve(PlayOffline), {
  ssr: false
})
// export async function getServerSideProps(context) {
//     return {
//       props: {
//           authed:  Boolean(context.req.session?.authed && context.req.session?.user_id) 
//       }
//   }
// }
