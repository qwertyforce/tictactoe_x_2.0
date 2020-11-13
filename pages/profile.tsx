import Head from 'next/head'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import NavBar from '../components/NavBar'
import EmailSignIn from '../components/EmailSignIn'
import EmailSignUp from '../components/EmailSignUp'
import GameModesModal from '../components/GameModesModal'
import SetUsernameModal from '../components/SetUsernameModal'
import SetGuestUsernameModal from '../components/SetGuestUsernameModal'


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons'
import { faPlay, faEnvelopeOpen, faUserSecret } from '@fortawesome/free-solid-svg-icons'

import { Fragment, useState,useEffect } from 'react'

export default function Profile(props) {

 
  return (
  
  )
}
export async function getServerSideProps(context) {
  console.log(context.req.session)
  return {
    props: {
      authed: Boolean(context.req.session?.authed && context.req.session?.user_id),
      has_username: Boolean(context.req.session?.username!=="")
    }
  }
}
