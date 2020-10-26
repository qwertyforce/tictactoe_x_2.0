import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { Fragment, useState } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios';
import config from '../config/config'

export default function GameOverModal(props) {
    // const router = useRouter()
    // const [validated, setValidated] = useState(false);
    // const [isLoading, setLoading] = useState(false);
    const result=()=>{
        switch(props.result){
            case "won":
                return "won"
            case "lost":
                return "lost"
            case "draw":
                 return "draw"    
        }
    }
    return (
            <Modal show={props.open} size="sm" onHide={props.handleClose}>
                     <Modal.Body>
                     {result()}
                    </Modal.Body>
            </Modal>
    )
}
