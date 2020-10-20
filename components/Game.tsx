import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserAlt } from '@fortawesome/free-solid-svg-icons'
import styles from "../styles/GameInfo.module.css"
import { useEffect, useState,useRef } from 'react'

function game(canvas,GameInfo,setMargin){
    const Engine = new Worker("mtdf(10)_worker.js");
    const Game_Board = new Array(21).fill(null).map(() => new Array(21).fill(0))
    const Time_for_move = prompt("Enter the time for ai to think (in seconds)");
    if (Time_for_move === "0" || isNaN(parseInt(Time_for_move||"0"))) {
        location.reload();
    }
    
    const c = canvas;
    let lineWidth =3;
    let g_cellSize:number;
    const InnerWidth = window.innerWidth - GameInfo.clientWidth
    console.log(InnerWidth)
    console.log(window.innerHeight)
    if (window.innerWidth < 767) {
        g_cellSize = Math.floor((window.innerWidth) / 21);
        lineWidth = 2;
    } else {
        if (InnerWidth > window.innerHeight - 56) {
            g_cellSize = Math.floor((window.innerHeight - 56) / 21);
            console.log(InnerWidth)
        } else {
            g_cellSize = Math.floor(InnerWidth / 21);
        }
    }
    // if (localStorage.getItem('sound') == "true") {
    //     $('.custom-control-input').prop('checked', true);
    // }
    const FiguresToWin = 5;
    const Rows = 21;
    const Columns = 21;
    const offset = lineWidth / 2;
    const height = g_cellSize * Rows + (lineWidth);
    const width = g_cellSize * Columns + (lineWidth);
    if (window.innerWidth >= 767) {
        setMargin(((window.innerHeight - 56 - height) / 2).toString() + "px")
    } 
    const scale = window.devicePixelRatio*2; 
    const ctx = c.getContext('2d');
    c.style.width = width + "px";
    c.style.height = height + "px";
    c.width = width * scale;
    c.height = height * scale;
    ctx.scale(scale, scale);
    ctx.lineWidth = lineWidth;
    init_grid()
    function init_grid(){
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#8DA382';
        for (let i = 0; i <= Columns; i++) {
            const k = g_cellSize * i + (offset);
            ctx.beginPath();
            ctx.moveTo(k, 0);
            ctx.lineTo(k, height);
            ctx.stroke();
        };
        for (let i = 0; i <= Rows; i++) {
            const k = g_cellSize * i + (offset);
            ctx.beginPath();
            ctx.moveTo(0, k);
            ctx.lineTo(width, k);
            ctx.stroke();
        }
    }
    const drawSquare = function(x, y) {
        const k = Math.round(g_cellSize / 4);
        ctx.strokeRect(x * g_cellSize + k + offset, y * g_cellSize + k + offset, g_cellSize - (k * 2), g_cellSize - (k * 2));
    };
    const drawTriangle = function(x, y) {
        const x1 = x * g_cellSize + (g_cellSize / 2) + offset;
        const y1 = y * g_cellSize + (g_cellSize / 4) + offset;
        const x2 = x * g_cellSize + (g_cellSize / 5) + offset;
        const y2 = y * g_cellSize + (g_cellSize - (g_cellSize / 5)) + offset;
        const x3 = x * g_cellSize + (g_cellSize - (g_cellSize / 5)) + offset;
        const y3 = y * g_cellSize + (g_cellSize - (g_cellSize / 5)) + offset;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.stroke();
    };
    const drawCross = function(x, y) {
        const k = Math.round(g_cellSize / 2) + offset;
        const midx = x * g_cellSize + k;
        const midy = y * g_cellSize + k;
        ctx.beginPath();
        ctx.moveTo(midx - 10, midy - 10);
        ctx.lineTo(midx + 10, midy + 10);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midx + 10, midy - 10);
        ctx.lineTo(midx - 10, midy + 10);
        ctx.closePath();
        ctx.stroke();
    };
    const drawCircle = function(x, y) {
        const k = Math.round(g_cellSize / 2) + offset;
        ctx.beginPath();
        ctx.arc(x * g_cellSize + k, y * g_cellSize + k, g_cellSize/3.5, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.stroke();
    };
    const drawWinLine = function(xs, ys, r, g, b, winner) {
        const Winnerfigure = figureOfplayer(winner);
        for (i = 0; i < (xs.length); i += 1) {
            clear_cell(xs[i], ys[i]);
            Winnerfigure(xs[i], ys[i]);
            ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + 0.5 + ")";
            drawBox(xs[i], ys[i]);
        }
    };
    const drawBox = function(x, y) {
        ctx.fillRect(x * g_cellSize + offset + lineWidth/2, y * g_cellSize + offset + lineWidth/2, g_cellSize - lineWidth, g_cellSize - lineWidth);
    };
    const checkWon = function(id) {
        var r, g, h, won, xx, yy, xs, ys;
        for (var i = 0; i < Game_Board.length; i++) {
            for (var j = 0; j < Game_Board[i].length; j++) {
                for (var d = 0; d < 360; d = d + 45) {
                    r = d * Math.PI / 180;
                    g = Math.round(Math.sin(r));
                    h = Math.round(Math.cos(r));
                    won = true;
                    xx = i;
                    yy = j;
                    xs = new Array;
                    ys = new Array;
                    for (var ii = 0; ii <= (FiguresToWin - 1); ii++) {
                        if (xx < 0 || xx >= Game_Board.length || yy < 0 || yy >= Game_Board[0].length) {
                            won = false;
                            break;
                        }
                        if (Game_Board[xx][yy] !== players[id]) {
                            won = false;
                            break;
                        }
                        xs.push(xx);
                        ys.push(yy);
                        xx += g;
                        yy += h;
                    }
                    if (won == true) {
                        console.log("won");
                        console.log(xx);
                        console.log(yy);
                        drawwon(xs,ys,id);
                        return true;
                    }
                }
            }
        }
    };

}
export default function Game(props) {
    const gameData=props.gameData
    const canvasRef = useRef(null)
    const [selectedItem, setSelectedItem] = useState("");
    const [margin, setMargin] = useState("0px");
    useEffect(() => {
        console.log(gameData.GameInfoRef.current.clientWidth)
        game(canvasRef.current,gameData.GameInfoRef.current,setMargin)
      },[]);
    return (
        <Col md={7} style={{ padding: 0 }}>
            <Row className="justify-content-center" style={{ marginTop: margin, marginBottom: margin}}>
                <canvas  ref={canvasRef} id="myCanvas"></canvas>
            </Row>
        </Col>
    )
}
