import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { useState } from 'react'
import { useRouter } from 'next/router'


function generate_id(length:number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export default function GameOverModal(props:any) {
    const router = useRouter()
    const [gameMode, setGameMode] = useState("classic");
    const [privGameCheckBox, setPrivGameCheckbox] = useState(false);
    const [duelGameCheckBox, setDuelGameCheckbox] = useState(false);
    const privGameCheckBoxChange = () => {
        setPrivGameCheckbox(!privGameCheckBox)
    };
    const setDuelGameCheckboxChange = () => {
        setDuelGameCheckbox(!duelGameCheckBox)
    };
    const handleChange = (e:any) => {
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
    const play=()=>{
        let link="/play"
        if(gameMode==="classic"){
            link+="?gm=1"
        }else{
            link+="?gm=2"
        }
        if (privGameCheckBox) {
            const pass=generate_id(12)
            link+=`&pass=${pass}`
        }
        if (duelGameCheckBox) {
            link+="&duel=1"
        }
        router.push(link)
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
                    <Button variant="primary" onClick={play}>Play</Button>
                </div>
            </Modal.Body>
        </Modal>
    )
}
