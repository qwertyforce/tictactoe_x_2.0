import NavBar from '../components/NavBar'
import Table from 'react-bootstrap/Table'
import db_ops from 'server/helpers/db_ops'


export default function Leaderboard(props:any) {
  const users=props.leader_board.map((el:any)=>{
    return(
      <tr>
      <td>{el.username}</td>
      <td>{el.matchmaking_games}</td>
      <td>{el.matchmaking_wins}</td>
    </tr>
    )
  })
  return (
    <div>
     <NavBar authed={props.authed}/>
     <Table striped bordered hover size="sm" responsive="sm">
        <thead>
          <tr>
            <th>Username</th>
            <th>Wins</th>
            <th>Games played</th>
          </tr>
        </thead>
        <tbody>
          {users}
        </tbody>
      </Table>
    </div>
  )
}
export async function getServerSideProps(context:any) {
  const leader_board=await db_ops.game_ops.get_leaderboard()
  console.log(leader_board)
  return {
    props: {
      leader_board: leader_board,
      authed: Boolean(context.req.session?.authed && context.req.session?.user_id)
    }
  }
}