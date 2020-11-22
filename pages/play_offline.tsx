import Container from 'react-bootstrap/Container' 
import Row from 'react-bootstrap/Row' 
import GameInfo from '../components/GameInfo'
import GameOffline from '../components/GameOffline'
import NavBar from '../components/NavBar'
import SetAiTimeModal from '../components/SetAiTimeModal'
import { useState,useRef,useMemo, Fragment, useEffect} from 'react'

function randomInteger(min:number, max:number) {
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

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export default function PlayOffline(_props:any) {
  const [openSetAiTimeModal, setSetAiTimeModal] = useState(true);
  const handleCloseSetAiTimeModal = () => setSetAiTimeModal(false);
  const isMounted = useMounted()
  const GameInfoRef = useRef(null)
  const players = useMemo(generate_players,[])
  const [gameData, setGameData] = useState({
    players: players,
    your_player_idx: 0,
    current_player_count: 2,
    max_player_count: 2,
    time_for_ai_move:0,
    current_player_idx: randomInteger(0, players.length - 1),
    time: 0,
    mode: "classic",
    GameInfoRef: GameInfoRef
  });

  return (
    <div>
      <NavBar />
      <Container fluid>
        <Row>
          {(isMounted ? (
            <Fragment>
              <GameInfo gameData={gameData} />
              <GameOffline gameData={gameData} setGameData={setGameData} />
            </Fragment>
          ) : (null))}
          <SetAiTimeModal open={openSetAiTimeModal} handleClose={handleCloseSetAiTimeModal} setGameData={setGameData}/>
        </Row>
      </Container>
    </div>
  )
}


export async function getServerSideProps(context: any) {
  return {
    props: {
      authed: Boolean(context.req.session?.authed && context.req.session?.user_id)
    }
  }
}