import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import {Fragment} from 'react'
export default function nav_bar(props) {
    console.log(props)
    const profile_and_stats = () => {
        if (props.authed) {
            return (
                <Fragment>
                    <Nav.Link href="/profile">Profile</Nav.Link>
                    <Nav.Link href="/logout">Log out</Nav.Link>
                </Fragment>
            )
        } else {
            null
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
                    <Nav.Link href="/stats">Server Statistics</Nav.Link>
                   {profile_and_stats()}
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    )
}
 