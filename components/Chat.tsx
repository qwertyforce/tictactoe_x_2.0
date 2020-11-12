import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserAlt } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState,useRef } from 'react'
import GameOverModal from './GameOverModal'
import io from 'socket.io-client';
import { useRouter } from 'next/router'
import styles from "../styles/Chat.module.css"

export default function Chat(props) {
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
                    <textarea className={styles.chat_input} placeholder="Send a message..." rows={2}></textarea>
                    <button className={styles.chat_submit}>send</button>
                </div>
            </div>
        </Col>
    )
}
