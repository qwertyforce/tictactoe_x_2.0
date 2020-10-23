import Col from 'react-bootstrap/Col'
import Card from 'react-bootstrap/Card'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserAlt,faTimes,faCircle,faCaretUp,faSquare} from '@fortawesome/free-solid-svg-icons'
import styles from "../styles/GameInfo.module.css"
import GameDataContext from './GameDataContext'
import { useState } from 'react'

export default function GameInfo(props) {
    let GameData=props.gameData
    // console.log(GameData)
    const usernames = GameData.players.map((player,idx) => {
        return(<p key={"_"+player.username} className={styles[player.color]}>
            <FontAwesomeIcon icon={faUserAlt} /> {player.username + ((GameData.current_player_idx===idx)?"<---":"")}
        </p>)
    });
    const YourFigure=()=>{
        switch (GameData.players[GameData.your_player_idx].figure) {
            case "cross":
                return <FontAwesomeIcon icon={faTimes} />
            case "circle":
                return <FontAwesomeIcon icon={faCircle} />
            case "triangle":
                return <FontAwesomeIcon icon={faCaretUp} />
            case "square":
                return <FontAwesomeIcon icon={faSquare} />
        }

    }
    const [selectedItem, setSelectedItem] = useState("");
    console.log(props)
    const alertClicked = (e) => {
        setSelectedItem((selectedItem === e.target.id ? "" : e.target.id))
    }
    return (
        <Col md={2} style={{ padding: 0 }} ref={GameData.GameInfoRef}>
            <Card>
                <Card.Header>{`Time for move: ${GameData.time}s`}</Card.Header>
            </Card>
            <Card>
                <Card.Header>{`Players (${GameData.current_player_count || 1} of ${GameData.max_player_count || 2})`}</Card.Header>
                <Card.Body style={{ padding: 0 }}>
                    {usernames}
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>Your Figure:{YourFigure()}</Card.Header>
            </Card>
            {GameData.offline?(null):(
            <Card>
                <Card.Header>Your Bonuses</Card.Header>
                <ListGroup >
                    <ListGroup.Item action id="set_block" variant={(selectedItem === "set_block") ? ("success") : ""} onClick={alertClicked}>set_block {`(x${props.set_block || 1})`}</ListGroup.Item>
                    <ListGroup.Item action id="destroy_block" variant={(selectedItem === "destroy_block") ? ("success") : ""} onClick={alertClicked}>destroy_block {`(x${props.destroy_block || 1})`}</ListGroup.Item>
                    <ListGroup.Item action id="destroy_player_figure" variant={(selectedItem === "destroy_player_figure") ? ("success") : ""} onClick={alertClicked}>destroy_player_figure {`(x${props.destroy_player_figure || 1})`}</ListGroup.Item>
                    <ListGroup.Item action id="enemy_figure_transform" variant={(selectedItem === "enemy_figure_transform") ? ("success") : ""} onClick={alertClicked} >enemy_figure_transform {`(x${props.enemy_figure_transform || 1})`}</ListGroup.Item>
                    <ListGroup.Item action id="mine" variant={(selectedItem === "mine") ? ("success") : ""} onClick={alertClicked}>mine {`(x${props.mine || 1})`}</ListGroup.Item>
                </ListGroup >
            </Card>)
            }
            
            <Card>
                <Card.Header>
                    <Form.Check style={{ display: 'flex' }} inline label="Play sound when it is  your turn to play" type="checkbox" />
                </Card.Header>
            </Card>
        </Col>
    )
}
