import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button' 
import Form from 'react-bootstrap/Form' 
import {useState} from 'react'
import axios from 'axios'
import config from '../config/config'

export default function EmailSingUp(props) {
    const [validated, setValidated] = useState(false);
    const [isLoading, setLoading] = useState(false)
    const handleSubmit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setLoading(true);
        setValidated(true);
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            setLoading(false);
            return
        }
        const formData = new FormData(event.target)
        const formDataObj = Object.fromEntries(formData.entries())
        if(formDataObj.password!==formDataObj.password2){
            alert("Passwords don't match")
            return
        }
         /*global grecaptcha*/ // defined in pages/_document.tsx
         grecaptcha.ready(function () {
            grecaptcha.execute(config.recaptcha_site_key, { action: 'signup' }).then(function (token) {
                const signup_data = { email: formDataObj.email, password: formDataObj.password, 'g-recaptcha-response': token }
                axios(`/signup`, {
                    method: "post",
                    data: signup_data,
                    withCredentials: true
                }).then((resp) => {
                    setLoading(false);
                    alert(resp.data.message)
                }).catch((err) => {
                    setLoading(false);
                    if (err.response.data.message) {
                        alert(err.response.data.message)
                        console.log(err.response)
                    } else {
                        alert("Unknown error")
                    }
                })
            });
        })
        console.log(formDataObj)  
    };

    return (
        <Modal show={props.open} size="sm" onHide={props.handleClose}>
            <Modal.Header>
                <Modal.Title>Sign Up</Modal.Title>
            </Modal.Header>
            <Form noValidate validated={validated} onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group controlId="formBasicEmail">
                        <Form.Label>Your email</Form.Label>
                        <Form.Control type="email" placeholder="Enter email" name="email"/>
                    </Form.Group>
                    <Form.Group controlId="formBasicPassword">
                        <Form.Label>Your password</Form.Label>
                        <Form.Control type="password" placeholder="Password" name="password"/>
                    </Form.Group>
                    <Form.Group controlId="formBasicPassword2">
                        <Form.Label>Repeat password</Form.Label>
                        <Form.Control type="password" placeholder="Password" name="password2" />
                    </Form.Group>
                    <Modal.Footer style={{ padding: "0px", border: "0px" }}>
                        <Button disabled={isLoading} variant="primary" type="submit" block>{isLoading ? 'Signing up...' : 'Sign up'}</Button>
                    </Modal.Footer>
                </Modal.Body>
            </Form>
        </Modal>
    )
}
 