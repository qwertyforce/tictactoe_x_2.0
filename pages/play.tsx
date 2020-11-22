import Container from 'react-bootstrap/Container' 
import Row from 'react-bootstrap/Row' 
import GameInfo from '../components/GameInfo'
import Game from '../components/Game'
import NavBar from '../components/NavBar'
import { useState,useRef, useEffect, Fragment} from 'react'
import { useRouter } from 'next/router'

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

export default function Play(props:any) {
  const isMounted = useMounted()
  const router=useRouter()
  const GameInfoRef = useRef(null)
  // const players = useMemo(generate_players,[])
  const [gameData, setGameData] = useState({
    players: [],
    your_player_idx: 0,
    current_player_count: 1,
    max_player_count: 0,
    current_player_idx: 0,
    time: 45,
    bonuses:{
      "set_block":0,
      "destroy_block":0,
      "destroy_player_figure":0,
      "enemy_figure_transform":0,
      "mine":0,
    },
    selected_bonus:"",
    mode: "classic",
    GameInfoRef: GameInfoRef
  });
  useEffect(() => {
    const query=router.query
    if (Object.entries(query).length===0) {
        return;
    }
    setGameData((prevState) => ({
      ...prevState,
      max_player_count: (router.query.duel)?2:4,
      mode:(parseInt((router.query as any).gm)===1)?"classic":"modern"
    }));
  },[router])

  return (
    <div>
      <NavBar authed={props.authed}/>
      <Container fluid>
        <Row>
          {(isMounted ? (
            <Fragment>
              <GameInfo gameData={gameData} setGameData={setGameData} />
              <Game gameData={gameData} setGameData={setGameData} />
            </Fragment>
          ) : (null))}
        </Row>
      </Container>
    </div>
  )
}

export async function getServerSideProps(context:any) {
    return {
      props: {
          authed:  Boolean(context.req.session?.authed && context.req.session?.user_id) 
      }
  }
}
