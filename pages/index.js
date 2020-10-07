import Head from 'next/head'
import Container from 'react-bootstrap/Container' 
import Button from 'react-bootstrap/Button' 
import NavBar from '../components/NavBar'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faGoogle,faVk} from '@fortawesome/free-brands-svg-icons'
import {faPlay,faEnvelopeOpen,faUserSecret} from '@fortawesome/free-solid-svg-icons'

import {Fragment} from 'react'

export default function Home(props) {
  const buttons=()=>{
   if(props.authed){
     return (
      <Button variant="success"><FontAwesomeIcon icon={faPlay}/> Play</Button> 
     )
   }else{
    return (
    <Fragment>
    <Button variant="danger" className="mr-3" ><FontAwesomeIcon icon={faGoogle}/> Google</Button> 
    <Button variant="primary" className="mr-3"><FontAwesomeIcon icon={faVk}/> Vkontakte</Button> 
    <Button variant="secondary" className="mr-3"><FontAwesomeIcon icon={faEnvelopeOpen}/> E-mail</Button> 
    <Button variant="info"><FontAwesomeIcon icon={faUserSecret}/> Guest play</Button> 
    </Fragment>
    )
   }
  }
  return (
    <div>
     <NavBar authed={props.authed}/>
     <Container>
     <h1 className="display-1  text-center">Tic Tac Toe X</h1>
     <h3 className="text-center ">A multiplayer tic tac toe  game</h3>
     <div className="d-flex justify-content-center mt-5 fadeInRight" style={{flexWrap:'wrap'}}>
     {buttons()}
     </div>
     
     </Container>
    </div>
  )
}
export async function getServerSideProps(context) {
  return {
      props: {
          authed: false
      }
  }
}
