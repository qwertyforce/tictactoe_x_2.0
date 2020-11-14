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
import Table from 'react-bootstrap/Table'
import db_ops from 'server/helpers/db_ops'
import { useRouter } from 'next/router'

export default function Profile(props) {
  const router=useRouter()
  if(!props.authed || !props.has_username){
    router.push("/")
  }
 
  return (
    <div>
      <NavBar />
      <h1>{`Hello, ${props.username}`}</h1>
      <h1>Matchmaking games</h1>
      <Table striped bordered hover size="sm" responsive="sm">
        <thead>
          <tr>
            <th>Game mode</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Draws</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>classic</td>
            <td>{props.matchmaking_stats.classic.wins}</td>
            <td>{props.matchmaking_stats.classic.losses}</td>
            <td>{props.matchmaking_stats.classic.draws}</td>
          </tr>
          <tr>
            <td>classic_duel</td>
            <td>{props.matchmaking_stats.classic_duel.wins}</td>
            <td>{props.matchmaking_stats.classic_duel.losses}</td>
            <td>{props.matchmaking_stats.classic_duel.draws}</td>
          </tr>
          <tr>
            <td>modern</td>
            <td>{props.matchmaking_stats.modern.wins}</td>
            <td>{props.matchmaking_stats.modern.losses}</td>
            <td>{props.matchmaking_stats.modern.draws}</td>
          </tr>
          <tr>
            <td>modern_duel</td>
            <td>{props.matchmaking_stats.modern_duel.wins}</td>
            <td>{props.matchmaking_stats.modern_duel.losses}</td>
            <td>{props.matchmaking_stats.modern_duel.draws}</td>
          </tr>
        </tbody>
      </Table>
      <h1>Private games</h1>
      <Table striped bordered hover size="sm" responsive="sm">
        <thead>
          <tr>
            <th>Game mode</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Draws</th>
          </tr>
        </thead>
        <tbody>
        <tr>
            <td>classic</td>
            <td>{props.private_stats.classic.wins}</td>
            <td>{props.private_stats.classic.losses}</td>
            <td>{props.private_stats.classic.draws}</td>
          </tr>
          <tr>
            <td>classic_duel</td>
            <td>{props.private_stats.classic_duel.wins}</td>
            <td>{props.private_stats.classic_duel.losses}</td>
            <td>{props.private_stats.classic_duel.draws}</td>
          </tr>
          <tr>
            <td>modern</td>
            <td>{props.private_stats.modern.wins}</td>
            <td>{props.private_stats.modern.losses}</td>
            <td>{props.private_stats.modern.draws}</td>
          </tr>
          <tr>
            <td>modern_duel</td>
            <td>{props.private_stats.modern_duel.wins}</td>
            <td>{props.private_stats.modern_duel.losses}</td>
            <td>{props.private_stats.modern_duel.draws}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  )
}
export async function getServerSideProps(context) {
  console.log(context.req.session?.username)
  const authed = Boolean(context.req.session?.authed && context.req.session?.user_id)
  let private_stats
  let matchmaking_stats
  if (authed) {
    const user = await db_ops.activated_user.find_user_by_id(context.req.session?.user_id)
    if (user.length === 1) {
      private_stats = user[0].private_stats
      matchmaking_stats = user[0].matchmaking_stats
    }
  }

  return {
    props: {
      authed: authed,
      has_username: Boolean(context.req.session?.username !== ""),
      username:context.req.session?.username,
      private_stats: private_stats,
      matchmaking_stats: matchmaking_stats
    }
  }

}
