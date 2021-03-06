import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import {Fragment,memo} from 'react'
const nav_bar=memo((props:any)=>{
    const profile_and_stats = () => {
        if (props.authed) {
            return (
                <Fragment>
                    <Nav.Link href="/profile">Profile</Nav.Link>
                    <Nav.Link href="/logout">Log out</Nav.Link>
                </Fragment>
            )
        } else {
            return null
        }
    }
    return (
        <Navbar bg="light" expand="lg" >
            <Navbar.Brand href="/">TicTacToe</Navbar.Brand>
            <Navbar.Toggle aria-controls="responsive-navbar-nav" />
            <Navbar.Collapse id="responsive-navbar-nav">
                <Nav className="mr-auto">
                    <Nav.Link href="/play_offline">Play against AI</Nav.Link>
                    <Nav.Link href="/leaderboard">Leaderboard</Nav.Link>
                   {profile_and_stats()}
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    )
},(_prev,_next)=>{
    // console.log(prev)
    return true
})
export default nav_bar
 