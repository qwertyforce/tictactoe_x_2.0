import Col from 'react-bootstrap/Col'
import { useState } from 'react'
import styles from "../styles/Chat.module.css"

export default function Chat(props:any) {
    const [text,setText] = useState("");
    const handleChange=(e:any)=>{
        setText(e.target.value)
    }
    const send_msg=()=>{
        props.send_message(text.trim())
        setText("")
    }
    return (
        <Col md={3} style={{ padding: 0 }}>
            <div className={styles.chat_box}>
                <div className={styles.chat_box_header}>
                    Chat
                    </div>
                <div className={styles.chat_box_body} style={{ height: 100 - ((56 / window.innerHeight) * 100 + 5 + 5) + 'vh' }}>
                    <div className={styles.chat_box_overlay}></div>
                    <div className={styles.chat_logs}>
                        {props.messages}
                    </div>
                </div>
                <div className={styles.input_group}>
                    <textarea className={styles.chat_input} onChange={handleChange}  value={text} placeholder="Send a message..." rows={2}></textarea>
                    <button className={styles.chat_submit} onClick={send_msg}>send</button>
                </div>
            </div>
        </Col>
    )
}
