import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserAlt } from '@fortawesome/free-solid-svg-icons'
import styles from "../styles/GameInfo.module.css"
import { useEffect, useState,useRef } from 'react'

function randomInteger(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    rand = Math.floor(rand);
    return rand;
}

function divide(numerator, denominator) {
    var remainder = numerator % denominator;
    var quotient = (numerator - remainder) / denominator;
    return quotient;
}

let gameData;
function game(canvas,setMargin,setGameData){
    console.log("Game")
    const Engine = new Worker("mtdf(10)_worker.js");
    Engine.onmessage = function (e) {
        console.log(e.data.bestmove);
        console.log(`Cache Hits: ${e.data.CacheHits}`)
        console.log(`Cache Cutoffs: ${e.data.CacheCutoffs}`)
        console.log(`Cache Puts: ${e.data.CachePuts}`)
        console.log(`function calls ${e.data.fc}`)
        console.log(`Call to iterative mtdf took ${e.data.time} seconds.`)
        console.log(`StateCacheHits: ${e.data.StateCacheHits}`)
        console.log(`StateCachePuts: ${e.data.StateCachePuts}`)
        console.log(e.data.firstMoves)
        make_move(e.data.bestmove.j, e.data.bestmove.i,1)
    }
    const Game_Board = new Array(21).fill(null).map(() => new Array(21).fill(0))
    const Time_for_move = parseInt(prompt("Enter the time for ai to think (in seconds)")||"0")*1000
    if (Time_for_move === 0 || isNaN(Time_for_move)) {
        location.reload();
    }
    const time_for_ai=Time_for_move/1000
    const time_for_human=Time_for_move/10
    const c = canvas;
    let lineWidth =3;
    let g_cellSize:number;
    const InnerWidth = window.innerWidth -gameData.GameInfoRef.current.clientWidth
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
    let Paused = false;
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

    let prev_player_idx;
    let prev_move_column;
    let prev_move_row;
    init_grid()
    if(gameData.current_player_idx===0){
        setGameData((prevState) => ({
            ...prevState,
            time: time_for_human,
        }));
    }else{
        setGameData((prevState) => ({
            ...prevState,
            time: time_for_ai,
        }));
        make_move(10,10,1);
    }
    
    let timer = setInterval(timer_Func, 1000)
    c.addEventListener('click', function(ev) {
        if (gameData.player_turn === gameData.your_username && !Paused) {
            const of = c.getBoundingClientRect();
            const xz = ev.clientX - of.left;
            const yz = ev.clientY - of.top;
            const xx = divide(xz, g_cellSize);
            const yy = divide(yz, g_cellSize);
                if (Game_Board[yy][xx] === 0) {
                   make_move(xx,yy,gameData.your_player_idx)
                   console.log(xx, yy);
                }
        }  
    }, false);
   
    

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

    function timer_Func() {
        console.log(gameData.time)
        if (gameData.time > 0) {
            setGameData((prevState) => ({
                ...prevState,
                time: prevState.time-1,
              }));
           // console.log(gameData)
            }
        // } else {
        //     if (player_turn_idx === gameData.your_player_idx) {
        //         Move_transition();
        //         Engine.postMessage([Game_Board, 1, Time_for_move]);
        //     }
        // }
    }

    

    function Move_transition() {
        if(gameData.current_player_idx===gameData.your_player_idx){
            setGameData((prevState) => ({
                ...prevState,
                time: time_for_ai,
              }));
        }else{
            setGameData((prevState) => ({
                ...prevState,
                time: time_for_human,
              }));
        } 
         clearInterval(timer);
         timer = setInterval(timer_Func, 1000);
         if (gameData.current_player_idx === gameData.players.length - 1) {
            gameData.current_player_idx = 0;
             while (gameData.players[gameData.current_player_idx] === null) {
                gameData.current_player_idx += 1;
             }
         } else {
            gameData.current_player_idx += 1;
             while (gameData.players[gameData.current_player_idx] === null) {
                 if (gameData.current_player_idx === gameData.players.length - 1) {
                    gameData.current_player_idx = 0;
                     continue;
                 };
                 gameData.current_player_idx += 1;
             }
         }
        setGameData({...gameData})
        //  if (player_turn_idx == gameData.players[gameData.your_username] && localStorage.getItem('sound') == "true") {
        //      audio.play();
        //  }
     }

    function make_move(column, row, player_idx) {
        if ((prev_move_column !== null) && (prev_move_column !== undefined)) {
            ctx.fillStyle = colorOfplayer(prev_player_idx);
            drawBox(prev_move_column, prev_move_row);
        }
        prev_move_column = column;
        prev_move_row = row;
        prev_player_idx = player_idx;
        console.log(Game_Board)
        Game_Board[row][column] = (player_idx===0)?-1:1;
        const set_figure = figureOfplayer(player_idx);
        console.log(set_figure)
        set_figure(column, row);
        if (check_win(player_idx)) {
            clearInterval(timer);
        }
        Move_transition();
        if (prev_player_idx === gameData.your_player_idx) {
            Engine.postMessage([Game_Board, 1, Time_for_move]); //time in ms
        }
    }
    function colorOfplayer(player_idx) {
        const color=gameData.players[player_idx].color
        switch (color) {
            case 'blue':
                return "rgba(" + 0 + "," + 0 + "," + 255 + "," + 0.5 + ")";
            case "green":
                return "rgba(" + 0 + "," + 255 + "," + 0 + "," + 0.5 + ")";
            case "light_blue":
                return "rgba(" + 0 + "," + 197 + "," + 255 + "," + 0.5 + ")";
            case "orange":
                return "rgba(" + 255 + "," + 165 + "," + 0 + "," + 0.5 + ")";
        };
    }
   
    function figureOfplayer(player_idx) {
        const figure=gameData.players[player_idx].figure
        switch (figure) {
            case "circle":
                return (x, y) => {
                    drawCircle(x, y);
                };
            case "triangle":
                return (x, y) => {
                    drawTriangle(x, y);
                };
            case "square":
                return (x, y) => {
                    drawSquare(x, y);
                };
            case "cross":
                return (x, y) => {
                    drawCross(x, y);
                };
        };
    }

    function drawSquare(x, y) {
        const k = Math.round(g_cellSize / 4);
        ctx.strokeRect(x * g_cellSize + k + offset, y * g_cellSize + k + offset, g_cellSize - (k * 2), g_cellSize - (k * 2));
    };
    function drawTriangle(x, y) {
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
    function drawCross(x, y) {
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
    function drawCircle(x, y) {
        const k = Math.round(g_cellSize / 2) + offset;
        ctx.beginPath();
        ctx.arc(x * g_cellSize + k, y * g_cellSize + k, g_cellSize/3.5, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.stroke();
    };
    function drawWinLine(xs, ys, r, g, b, winner) {
        const Winnerfigure = figureOfplayer(winner);
        for (let i = 0; i < (xs.length); i += 1) {
            clear_cell(xs[i], ys[i]);
            Winnerfigure(xs[i], ys[i]);
            ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + 0.5 + ")";
            drawBox(xs[i], ys[i]);
        }
    };
    function drawBox (x, y) {
        ctx.fillRect(x * g_cellSize + offset + lineWidth/2, y * g_cellSize + offset + lineWidth/2, g_cellSize - lineWidth, g_cellSize - lineWidth);
    };
    function check_win(player_idx) {
        let r, g, h, won, xx, yy, xs, ys;
        for (let i = 0; i < Game_Board.length; i++) {
            for (let j = 0; j < Game_Board[i].length; j++) {
                for (let d = 0; d < 360; d = d + 45) {
                    r = d * Math.PI / 180;
                    g = Math.round(Math.sin(r));
                    h = Math.round(Math.cos(r));
                    won = true;
                    xx = i;
                    yy = j;
                    xs = new Array;
                    ys = new Array;
                    for (let ii = 0; ii <= (FiguresToWin - 1); ii++) {
                        if (xx < 0 || xx >= Game_Board.length || yy < 0 || yy >= Game_Board[0].length) {
                            won = false;
                            break;
                        }
                        if (Game_Board[xx][yy] !== (player_idx===0)?-1:1) {
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
    
    function drawwon(xs, ys, winner) {
        Paused = true;
        drawWinLine(ys, xs, 255, 20, 147, winner);
        window.iziToast.show({
            theme: 'dark',
            timeout: false,
            close: false,
            drag: false,
            message: "Do you want to play another one?",
            layout: 2,
            position: 'center', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
            progressBarColor: 'rgb(0, 255, 184)',
            buttons: [
                ['<button>Ok</button>', function (instance, toast) {
                    location.reload();
                }],
                ['<button>Close</button>', function (instance, toast) {
                    instance.hide({
                        transitionOut: 'fadeOutUp'
                    }, toast, 'close', 'btn2');
                }]
            ]
        });
    }

    function clear_cell(x, y) {
        if (true) {
            ctx.fillStyle = "rgb(" + 255 + "," + 255 + "," + 255 + ")";
        } else {
            ctx.fillStyle = "rgb(" + 66 + "," + 66 + "," + 66 + ")";
        }
        drawBox(x, y);
    }
}

export default function Game(props) {
    gameData=props.gameData
    const setGameData=props.setGameData
    const canvasRef = useRef(null)
    const [margin, setMargin] = useState("0px");
    useEffect(() => {
        console.log(gameData.GameInfoRef.current.clientWidth)
        //  const x={...gameData,time:14}
        // setGameData(x)
        game(canvasRef.current,setMargin,setGameData)
      },[]);
    return (
        <Col md={7} style={{ padding: 0 }}>
            <Row className="justify-content-center" style={{ marginTop: margin, marginBottom: margin}}>
                <canvas  ref={canvasRef} id="myCanvas"></canvas>
            </Row>
        </Col>
    )
}
