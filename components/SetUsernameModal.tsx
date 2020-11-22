import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios';
import config from '../config/config'

export default function SetUsernameModal(props:any) {
    const router = useRouter()
    const [isInvalid, setIsInvalid] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setLoading] = useState(false);
    const handleSubmit = (event:any) => {
        event.preventDefault();
        event.stopPropagation();
        setLoading(true);
        const formData = new FormData(event.target)
        const formDataObj = Object.fromEntries(formData.entries())
        const username=formDataObj.username.toString().trim()
        const regex = /^[A-Za-z0-9]+$/
        if(username.length<1 || username.length>16){
            setIsInvalid(true)
            setErrorMessage("length must be greater than 1 and less than 17")
            return
        }
        if(!regex.test(username)){
            setIsInvalid(true)
            setErrorMessage("Only English alphanumeric characters are allowed")
            return
        }
        /*global grecaptcha*/ // defined in pages/_document.tsx
        grecaptcha.ready(function () {
            grecaptcha.execute(config.recaptcha_site_key, { action: 'set_username' }).then(function (token) {
                const username_data = { username: formDataObj.username,'g-recaptcha-response': token }
                axios(`/set_username`, {
                    method: "post",
                    data: username_data,
                    withCredentials: true
                }).then((_resp) => {
                    router.push("/");
                    setLoading(false);
                    props.handleClose()
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
    };
    return (
        <Modal show={props.open} size="sm" onHide={props.handleClose} backdrop="static">
            <Modal.Header>
                <Modal.Title>Username</Modal.Title>
            </Modal.Header>
            <Form noValidate onSubmit={handleSubmit}>
                <Modal.Body>
                    <Form.Group controlId="formUsername">
                        <Form.Label>Your username</Form.Label>
                        <Form.Control isInvalid={isInvalid} required type="text" placeholder="Enter your username" name="username" />
                        <Form.Control.Feedback type="invalid">{errorMessage}</Form.Control.Feedback>
                    </Form.Group>
                    <Modal.Footer style={{ padding: "0px", border: "0px" }}>
                        <Button disabled={isLoading} variant="primary" type="submit" block>{isLoading ? 'Setting username ...' : 'Set username'}</Button>
                    </Modal.Footer>
                </Modal.Body>
            </Form>
        </Modal>
    )
}
