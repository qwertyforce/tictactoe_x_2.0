import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button' 
import Form from 'react-bootstrap/Form' 
import {Fragment,useState} from 'react'

export default function EmailSignIn(props) {
    const [validated, setValidated] = useState(false);

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    const formData = new FormData(event.target),
                formDataObj = Object.fromEntries(formData.entries())
          console.log(formDataObj)
    setValidated(true);
  };
  
    const openSignUp=()=>{
        props.handleClose()
        props.handleOpenSignUp()
    }
    return (
        <Fragment>
        <Modal show={props.open} size="sm" onHide={props.handleClose}>
            <Modal.Header>
                <Modal.Title>Sign in</Modal.Title>
                <Button variant="outline-primary" onClick={openSignUp}>Sign up</Button>
            </Modal.Header>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Your email</Form.Label>
                        <Form.Control required type="email" placeholder="Enter email" name="email"/>
                    </Form.Group>
                    <Form.Group controlId="formBasicPassword">
                        <Form.Label>Your password</Form.Label>
                        <Form.Control required type="password" placeholder="Password" name="password"/>
                    </Form.Group>
                    <Modal.Footer style={{ padding: "0px", border: "0px" }}>
                        <Button variant="primary" type="submit" block>Login</Button>
                    </Modal.Footer>
                </Modal.Body>
            </Form>
        </Modal>
        </Fragment>
    )
}
 