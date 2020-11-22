import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { useState } from 'react'

export default function SetAiTimeModal(props:any) {
    const [isInvalid, setIsInvalid] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const handleSubmit = (event:any) => {
        event.preventDefault();
        event.stopPropagation();
        const formData = new FormData(event.target)
        const formDataObj = Object.fromEntries(formData.entries())
        const time=parseInt(formDataObj.time.toString().trim())
        if(isNaN(time) || time<=0){
            setIsInvalid(true)
            setErrorMessage("Number must be greater than 0")
            return
        }
        props.handleClose()
        props.setGameData((prevState:any) => ({
            ...prevState,
            time_for_ai_move: time*1000,
        }));
    };
    return (
        <Modal show={props.open} size="lg" onHide={props.handleClose} backdrop="static">
            <Form noValidate onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group controlId="formTime">
                        <Form.Control isInvalid={isInvalid} required type="number" placeholder="Enter the time for ai to think (in seconds)" name="time" />
                        <Form.Control.Feedback type="invalid">{errorMessage}</Form.Control.Feedback>
                    </Form.Group>
                    <Modal.Footer style={{ padding: "0px", border: "0px" }}>
                        <Button variant="primary" type="submit" block>Set Time</Button>
                    </Modal.Footer>
                </Modal.Body>
            </Form>
        </Modal>
    )
}
