import Head from 'next/head'
import Container from 'react-bootstrap/Container' 
import Row from 'react-bootstrap/Row' 

import GameInfo from '../components/GameInfo'
import Game from '../components/Game'
import NavBar from '../components/NavBar'
import { useState,useRef,forwardRef} from 'react'

export default function PlayOffline(props) {
  const GameInfoRef = useRef(null)
  const [gameData, setGameData] = useState({players:[],time:0,offline:true,GameInfoRef:GameInfoRef});

  return (
    <div>
      <NavBar />
      <Container fluid>
        <Row>
        <GameInfo gameData={gameData}/>
        <Game gameData={gameData} setGameData={setGameData}/>
        </Row>
      </Container>
    </div>
  )
}
// export async function getServerSideProps(context) {
//     return {
//       props: {
//           authed:  Boolean(context.req.session?.authed && context.req.session?.user_id) 
//       }
//   }
// }
