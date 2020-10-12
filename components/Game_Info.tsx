import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faUserAlt} from '@fortawesome/free-solid-svg-icons'
import styles from "../styles/GameInfo.module.css"
import { useState } from 'react'
export default function nav_bar(props) {
    const [selectedItem, setSelectedItem] = useState("");
    console.log(props)
    const alertClicked=(e)=>{
        setSelectedItem((selectedItem===e.target.id?"":e.target.id))
    }
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
    <Card.Header>Your Bonuses</Card.Header>
    <ListGroup >
    <ListGroup.Item action id="set_block" variant={(selectedItem==="set_block")?("success"):""} onClick={alertClicked}>set_block {`(x${props.set_block || 1})`}</ListGroup.Item>
    <ListGroup.Item action id="destroy_block" variant={(selectedItem==="destroy_block")?("success"):""}  onClick={alertClicked}>destroy_block {`(x${props.destroy_block || 1})`}</ListGroup.Item>
    <ListGroup.Item action id="destroy_player_figure" variant={(selectedItem==="destroy_player_figure")?("success"):""}  onClick={alertClicked}>destroy_player_figure {`(x${props.destroy_player_figure || 1})`}</ListGroup.Item>
    <ListGroup.Item action id="enemy_figure_transform" variant={(selectedItem==="enemy_figure_transform")?("success"):""}  onClick={alertClicked} >enemy_figure_transform {`(x${props.enemy_figure_transform || 1})`}</ListGroup.Item>
    <ListGroup.Item action id="mine"variant={(selectedItem==="mine")?("success"):""}  onClick={alertClicked}>mine {`(x${props.mine || 1})`}</ListGroup.Item>
    </ListGroup >
</Card>
<Card>
    <Card.Header>
    <Form.Check style={{display:'flex'}} inline label="Play sound when it is  your turn to play" type="checkbox"/>
    </Card.Header>
</Card>
 </Col>
    )
}
 