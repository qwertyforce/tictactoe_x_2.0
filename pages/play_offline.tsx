import Head from 'next/head'
import Container from 'react-bootstrap/Container' 
import Row from 'react-bootstrap/Row' 

import Game_Info from '../components/Game_Info'
import NavBar from '../components/NavBar'
export default function Home(props) {
 
  return (
    <div>
      <NavBar/>
      <Container fluid>
  <Row>
    
    <Game_Info/>
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
