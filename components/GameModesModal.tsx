import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import { useState } from 'react'



export default function GameOverModal(props) {
    const [gameMode, setGameMode] = useState("classic");
    const [privGameCheckBox, setPrivGameCheckbox] = useState(false);
    const [duelGameCheckBox, setDuelGameCheckbox] = useState(false);
    const privGameCheckBoxChange = (e) => {
        setPrivGameCheckbox(!privGameCheckBox)
    };
    const setDuelGameCheckboxChange = () => {
        setDuelGameCheckbox(!duelGameCheckBox)
    };
    const handleChange = e => {
        console.log(e.target.value);
        setGameMode(e.target.value);
    };
    const description = () => {
        let description = "";
        if (gameMode === "classic") {
            description += "Win line=5. No bonuses. "
        } else {
            description += "Win line=7. Bonuses available. "
        }
        if (!privGameCheckBox) {
            description += "Matchmaking. "
        } else {
            description += "Game is available only by link. "
        }
        if (duelGameCheckBox) {
            description += "1v1."
        }
        return description
    }
    return (
        <Modal show={props.open} onHide={props.handleClose}>
            <Modal.Body style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <Form.Group style={{ flexDirection: "row", display: "flex" }} controlId="game_modes">
                    <Form.Check checked={gameMode === "classic"} value="classic" name="123" inline label="Classic" type="radio" id={`inline-1`} onChange={handleChange} />
                    <Form.Check checked={gameMode === "modern"} value="modern" name="123" inline label="Modern" type="radio" id={`inline-2`} onChange={handleChange} />
                </Form.Group>
                <div>
                    <Form.Group style={{ flexDirection: "row", display: "flex" }} controlId="game_modes_modificators">
                        <Form.Check checked={privGameCheckBox} name="1234" inline label="Private game" type="checkbox" id={`inline-3`} onChange={privGameCheckBoxChange} />
                        <Form.Check checked={duelGameCheckBox} name="1234" inline label="1v1" type="checkbox" id={`inline-4`} onChange={setDuelGameCheckboxChange} />
                    </Form.Group>
                </div>
                <p>{description()}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Button variant="primary" type="submit">Play</Button>
                </div>
            </Modal.Body>
        </Modal>
    )
}
