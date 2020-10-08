import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button' 
import Form from 'react-bootstrap/Form' 
import {Fragment} from 'react'

export default function EmailSingUp(props) {
    return (
        <Fragment>
        <Modal show={props.open} size="sm" onHide={props.handleClose}>
            <Modal.Header>
                <Modal.Title>Sign Up</Modal.Title>
            </Modal.Header>
            <Form>
                <Modal.Body>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Your email</Form.Label>
                        <Form.Control type="email" placeholder="Enter email" />
                    </Form.Group>
                    <Form.Group controlId="formBasicPassword">
                        <Form.Label>Your password</Form.Label>
                        <Form.Control type="password" placeholder="Password" />
                    </Form.Group>
                    <Form.Group controlId="formBasicPassword2">
                        <Form.Label>Repeat password</Form.Label>
                        <Form.Control type="password" placeholder="Password" />
                    </Form.Group>
                    <Modal.Footer style={{ padding: "0px", border: "0px" }}>
                        <Button variant="primary" type="submit" block>Sign Up</Button>
                    </Modal.Footer>
                </Modal.Body>
            </Form>
        </Modal>
        </Fragment>
    )
}
 