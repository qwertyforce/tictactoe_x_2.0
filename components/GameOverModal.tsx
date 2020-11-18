import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'


export default function GameOverModal(props:any) {
    const play_again=()=>{
        location.reload()
    }
    const exit=()=>{
        props.handleClose()
    }
    const result=()=>{
        switch(props.result){
            case "won":
                return "You've won."
            case "lost":
                return "You've lost."
            case "draw":
                 return "Draw."    
        }
    }
    return (
        <Modal show={props.open} size="sm" onHide={props.handleClose}>
            <Modal.Body style={{display:"flex",alignItems:"center",flexDirection:"column"}}>
                <div style={{marginBottom:"20px"}}>{result()}</div>
                <div>
                    <Button style={{marginRight:"10px"}} variant="outline-primary" onClick={play_again} >Play again</Button>
                    <Button variant="outline-primary" onClick={exit}>Exit</Button>
                </div>
            </Modal.Body>
        </Modal>
    )
}
