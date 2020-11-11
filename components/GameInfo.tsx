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
    const GameData=props.gameData
    const setGameData=props.setGameData
    // console.log(GameData)
    const usernames = GameData.players.map((player,idx) => {
        return(<p key={"_"+player.username} className={`${styles[player.color]} ${styles.username}`}>
            <FontAwesomeIcon icon={faUserAlt} /> {player.username + ((GameData.current_player_idx===idx)?"<---":"")}
        </p>)
    });
    const YourFigure=()=>{
        if(GameData.players.length>0){
            switch (GameData.players[GameData.your_player_idx].figure) {
                case "cross":
                    return <FontAwesomeIcon className={styles.vertical_align_middle} icon={faTimes} />
                case "circle":
                    return <FontAwesomeIcon className={styles.vertical_align_middle} icon={faCircle} />
                case "triangle":
                    return <FontAwesomeIcon className={styles.vertical_align_middle} icon={faCaretUp} />
                case "square":
                    return <FontAwesomeIcon className={styles.vertical_align_middle} icon={faSquare} />
            }
        }
    }
    const [selectedItem, setSelectedItem] = useState("");
    // console.log(props)
    const alertClicked = (e) => {
        const selected_bonus=(selectedItem === e.target.id ? "" : e.target.id)
        if(GameData.bonuses[selected_bonus]===0){
            return
        }
        setGameData((prevState) => ({
            ...prevState,
            selected_bonus: selected_bonus,
          }));
        setSelectedItem(selected_bonus)

    }
    return (
        <Col md={2} style={{ padding: 0 }} ref={GameData.GameInfoRef}>
            <Card>
                <Card.Header>{`Time for move: ${GameData.time}s`}</Card.Header>
            </Card>
            <Card>
                <Card.Header>{`Players (${GameData.current_player_count} of ${GameData.max_player_count})`}</Card.Header>
                <Card.Body style={{ padding: 0 }}>
                    {usernames}
                </Card.Body>
            </Card>
            <Card>
                <Card.Header>Your Figure: {YourFigure()}</Card.Header>
            </Card>
            {GameData.mode==="classic"?(null):(
            <Card>
                <Card.Header>Your Bonuses</Card.Header>
                <ListGroup >
                    <ListGroup.Item action id="set_block" variant={(selectedItem === "set_block") ? ("success") : ""} onClick={alertClicked}>set_block {`(x${GameData.bonuses.set_block})`}</ListGroup.Item>
                    <ListGroup.Item action id="destroy_block" variant={(selectedItem === "destroy_block") ? ("success") : ""} onClick={alertClicked}>destroy_block {`(x${GameData.bonuses.destroy_block})`}</ListGroup.Item>
                    <ListGroup.Item action id="destroy_player_figure" variant={(selectedItem === "destroy_player_figure") ? ("success") : ""} onClick={alertClicked}>destroy_player_figure {`(x${GameData.bonuses.destroy_player_figure})`}</ListGroup.Item>
                    <ListGroup.Item action id="enemy_figure_transform" variant={(selectedItem === "enemy_figure_transform") ? ("success") : ""} onClick={alertClicked} >enemy_figure_transform {`(x${GameData.bonuses.enemy_figure_transform })`}</ListGroup.Item>
                    <ListGroup.Item action id="mine" variant={(selectedItem === "mine") ? ("success") : ""} onClick={alertClicked}>mine {`(x${GameData.bonuses.mine})`}</ListGroup.Item>
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
