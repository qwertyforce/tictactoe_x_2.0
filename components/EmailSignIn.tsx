import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button' 
import Form from 'react-bootstrap/Form' 
import {Fragment,useState} from 'react'
import { useRouter } from 'next/router'
import axios from 'axios';

export default function EmailSignIn(props) {
    const router = useRouter()
    const [validated, setValidated] = useState(false);
    const [isLoading, setLoading] = useState(false);
  
    const handleSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setLoading(true);
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            setLoading(false);
        }
        const formData = new FormData(event.target)
        const formDataObj = Object.fromEntries(formData.entries())
        const login_data = { email: formDataObj.email, password: formDataObj.password}
        axios(`/login`, {
            method: "post",
            data: login_data,
            withCredentials: true
          }).then((resp) => {
            router.push("/");
            console.log(resp)
          }).catch((err) => {
            if (err.response.data.message) {
                alert(err.response.data.message)
              console.log(err.response)
            } else {
              alert("Unknown error")
            }
          })
        console.log(formDataObj)
        setValidated(true);
    };
    const openSignUp = () => {
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
                        <Button disabled={isLoading} variant="primary" type="submit" block>{isLoading ? 'Logging in...' : 'Login'}</Button>
                    </Modal.Footer>
                </Modal.Body>
            </Form>
        </Modal>
        </Fragment>
    )
}
 