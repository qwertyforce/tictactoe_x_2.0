import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserAlt } from '@fortawesome/free-solid-svg-icons'
import styles from "../styles/GameInfo.module.css"
import { useEffect, useState,useRef } from 'react'

function game(canvasRef){
    console.log(canvasRef.current.getContext('2d'))
    // const c = document.getElementById("myCanvas");
    // var scale = window.devicePixelRatio*2; 
    // var ctx = c.getContext('2d');
}
export default function Game(props) {
    const canvasRef = useRef(null)
    const [selectedItem, setSelectedItem] = useState("");
    const [canvasWidth, setCanvasWidth] = useState(0);
    const [canvasHeight, setCanvasHeight] = useState(0);
    useEffect(() => {
        game(canvasRef)
        setCanvasWidth(100)
        setCanvasHeight(100)
      },[]);
    return (
        <Col md={7} style={{ padding: 0 }}>
            <Row style={{ marginTop: "12px", marginBottom: "12px" }}>
                <canvas  ref={canvasRef} width={canvasWidth} height={canvasHeight} id="myCanvas"></canvas>
            </Row>
        </Col>
    )
}
