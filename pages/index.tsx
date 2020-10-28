import Head from 'next/head'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import NavBar from '../components/NavBar'
import EmailSignIn from '../components/EmailSignIn'
import EmailSignUp from '../components/EmailSignUp'
import GameModesModal from '../components/GameModesModal'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons'
import { faPlay, faEnvelopeOpen, faUserSecret } from '@fortawesome/free-solid-svg-icons'

import { Fragment, useState } from 'react'

export default function Home(props) {
  const [openGameModesModal, setGameModesModal] = useState(false);
  const handleCloseGameModesModal = () => setGameModesModal(false);
  const handleOpenGameModesModal = () => setGameModesModal(true);

  const [openSignIn, setOpenSignIn] = useState(false);
  const handleCloseSignIn = () => setOpenSignIn(false);
  const handleOpenSignIn = () => setOpenSignIn(true);

  const [openSignUp, setOpenSignUp] = useState(false);
  const handleCloseSignUp = () => setOpenSignUp(false);
  const handleOpenSignUp = () => setOpenSignUp(true);

  const buttons = () => {
    if (props.authed) {
      return (
        <Button variant="success" onClick={handleOpenGameModesModal}> <FontAwesomeIcon icon={faPlay} /> Play</Button>
      )
    } else {
      return (
        <Fragment>
          <Button href="/auth/google" variant="danger" className="mr-3" ><FontAwesomeIcon icon={faGoogle} /> Google</Button>
          <Button href="/auth/github" variant="primary" className="mr-3"><FontAwesomeIcon icon={faGithub} /> Github</Button>
          <Button variant="secondary" className="mr-3" onClick={handleOpenSignIn}><FontAwesomeIcon icon={faEnvelopeOpen} /> E-mail</Button>
          <Button variant="info"><FontAwesomeIcon icon={faUserSecret} /> Guest play</Button>
        </Fragment>
      )
    }
  }
  if(!props.has_username){

  }
  return (
    <div>
      <NavBar authed={props.authed} />
      <Container>
        <h1 className="display-1  text-center">Tic Tac Toe X</h1>
        <h3 className="text-center ">A multiplayer tic tac toe  game</h3>
        <div className="d-flex justify-content-center mt-5 fadeInRight" style={{ flexWrap: 'wrap' }}>
          {buttons()}
        </div>
        <EmailSignIn open={openSignIn} handleClose={handleCloseSignIn} handleOpenSignUp={handleOpenSignUp} />
        <EmailSignUp open={openSignUp} handleClose={handleCloseSignUp} />
        <GameModesModal open={openGameModesModal} handleClose={handleCloseGameModesModal} />
      </Container>
    </div>
  )
}
export async function getServerSideProps(context) {
  return {
    props: {
      authed: Boolean(context.req.session?.authed && context.req.session?.user_id),
      has_username: Boolean(context.req.session?.username!=="")
    }
  }
}
