import Head from 'next/head'
import Container from 'react-bootstrap/Container' 
import Row from 'react-bootstrap/Row' 
import dynamic from 'next/dynamic'

import GameInfo from '../components/GameInfo'
import Game from '../components/Game'
import NavBar from '../components/NavBar'
import { useState,useRef,useMemo} from 'react'


function randomInteger(min, max) {
  var rand = min + Math.random() * (max + 1 - min);
  rand = Math.floor(rand);
  return rand;
}

function generate_players(){
  const usernames = ["You", "Computer"]
  const players=[]
  let figures = ["cross", "circle", "square", "triangle"]
  let colors = ["green", "blue", "light_blue", "orange"]
  for (let username of usernames) {
    console.log(123)
    const color_idx = randomInteger(0, colors.length - 1)
    const color = colors[color_idx]
    colors.splice(color_idx, 1)
    const figure_idx = randomInteger(0, figures.length - 1)
    const figure = figures[figure_idx]
    figures.splice(figure_idx, 1)
    players.push({ username: username, color: color, figure: figure })
  }
  return players
}

function Play(props) {
  const GameInfoRef = useRef(null)
  const players = useMemo(generate_players,[])
  const [gameData, setGameData] = useState({
    players: players,
    your_player_idx: 0,
    current_player_count: 2,
    max_player_count: 2,
    current_player_idx: randomInteger(0, players.length - 1),
    time: 0,
    bonuses:{
      "set_block":0,
      "destroy_block":0,
      "destroy_player_figure":0,
      "enemy_figure_transform":0,
      "mine":0,
    },
    selected_bonus:"",
    mode: "",
    GameInfoRef: GameInfoRef
  });

  return (
    <div>
      <NavBar />
      <Container fluid>
        <Row>
          <GameInfo gameData={gameData} setGameData={setGameData}/>
          <Game gameData={gameData} setGameData={setGameData} />
        </Row>
      </Container>
    </div>
  )
}

export default dynamic(() => Promise.resolve(Play), {
  ssr: false
})
// export async function getServerSideProps(context) {
//     return {
//       props: {
//           authed:  Boolean(context.req.session?.authed && context.req.session?.user_id) 
//       }
//   }
// }
