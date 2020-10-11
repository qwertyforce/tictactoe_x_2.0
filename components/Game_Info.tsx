import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faUserAlt} from '@fortawesome/free-solid-svg-icons'
import styles from "../styles/GameInfo.module.css"
export default function nav_bar(props) {
    console.log(props)
    // const profile_and_stats = () => {
    //     if (props.authed) {
    //         return (
    //             <Fragment>
    //                 <Nav.Link href="/profile">Profile</Nav.Link>
    //                 <Nav.Link href="/logout">Log out</Nav.Link>
    //             </Fragment>
    //         )
    //     } else {
    //         null
    //     }
    // }
    return (
 <Col md={2} style={{padding:0}}>
<Card>
    <Card.Header>{`Time for move: ${5}s`}</Card.Header>
</Card>
<Card>
<Card.Header>{`Players (${props.current_player_count||1} of ${props.max_player_count||2})`}</Card.Header>
   <Card.Body style={{padding:0}}>
   <p className={styles.username}><FontAwesomeIcon  icon={faUserAlt}/> wf</p>
   <p className={styles.username}><FontAwesomeIcon  icon={faUserAlt}/> wf</p>
   <p className={styles.username}><FontAwesomeIcon  icon={faUserAlt}/> wf</p>
   <p className={styles.username}><FontAwesomeIcon  icon={faUserAlt}/> wf</p>
   
   </Card.Body>
</Card>
<Card>
    <Card.Header>{`Your Figure: ${props.figure||'X'}`}</Card.Header>
</Card>
<Card>
    <Card.Header>
    <Form.Check style={{display:'flex'}} inline label="Play sound when it is  your turn to play" type="checkbox"/>
    </Card.Header>
</Card>
 </Col>
    )
}
 