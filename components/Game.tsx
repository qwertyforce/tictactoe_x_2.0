import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Form from 'react-bootstrap/Form'
import ListGroup from 'react-bootstrap/ListGroup'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserAlt } from '@fortawesome/free-solid-svg-icons'
import styles from "../styles/GameInfo.module.css"
import { useEffect, useState,useRef } from 'react'
import GameOverModal from './GameOverModal'
import io from 'socket.io-client';
import { useRouter } from 'next/router'

function divide(numerator, denominator) {
    const remainder = numerator % denominator;
    const quotient = (numerator - remainder) / denominator;
    return quotient;
}

let gameData;
function game(canvas,setMargin,setGameData,game_over){
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
        make_move(e.data.bestmove.i, e.data.bestmove.j,1)
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
    const InnerWidth = window.innerWidth - gameData.GameInfoRef.current.clientWidth
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
    let moves_made=0
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
    let timer 
    init_grid()
    if(gameData.current_player_idx===0){
        setGameData((prevState) => ({
            ...prevState,
            time: time_for_human,
        }));
        timer=setInterval(timer_Func, 1000)
    }else{
        setGameData((prevState) => ({
            ...prevState,
            time: time_for_ai,
        }));
        make_move(10,10,1);
    }
    
    c.addEventListener('click', function(ev) {
        if (gameData.current_player_idx === gameData.your_player_idx && !Paused) {
            const of = c.getBoundingClientRect();
            const xz = ev.clientX - of.left;
            const yz = ev.clientY - of.top;
            const xx = divide(xz, g_cellSize);
            const yy = divide(yz, g_cellSize);
                if (Game_Board[yy][xx] === 0) {
                   make_move(yy,xx,gameData.your_player_idx)
                   console.log(yy, yy);
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
        // console.log(gameData.time)
        if (gameData.time > 0) {
            setGameData((prevState) => ({
                ...prevState,
                time: prevState.time - 1,
            }));
        }
        else {
            if (gameData.current_player_idx === gameData.your_player_idx) {
                Move_transition();
                Engine.postMessage([Game_Board, 1, Time_for_move]);
            }
        }
    }

    function Move_transition() {
        clearInterval(timer);
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
         setGameData((prevState) => {
            if (prevState.current_player_idx === prevState.players.length - 1) {
                prevState.current_player_idx = 0;
                 while (prevState.players[prevState.current_player_idx] === null) {
                    prevState.current_player_idx += 1;
                 }
             } else {
                prevState.current_player_idx += 1;
                 while (prevState.players[prevState.current_player_idx] === null) {
                     if (prevState.current_player_idx === prevState.players.length - 1) {
                        prevState.current_player_idx = 0;
                         continue;
                     };
                     prevState.current_player_idx += 1;
                 }
             }
             return {...prevState}
         })
         timer = setInterval(timer_Func, 1000);
     }
     
     function get_vector(i){
        switch(i){
            case 0:
                return [1,0]
            case 1:
                return [0,1]
            case 2:
                return [1,1]
            case 3:
                return [-1,1]
        }
    }
    function check_directions(arr,i) {
        const vector=get_vector(i)
        const reference_point=arr[arr.length-1]
        for (let i = 0; i < arr.length - (4+1); i++) {
            if (arr[i] !== 0) {
                if (arr[i] === arr[i + 1] && arr[i] === arr[i + 2] && arr[i] === arr[i + 3] && arr[i] === arr[i + 4]) {
                    const win_xs=[]
                    const win_ys=[]
                    for(let k=i;k<=i+4;k++){
                        win_xs.push(reference_point[0]+k*vector[0])
                        win_ys.push(reference_point[1]+k*vector[1])
                    }
                    return [win_xs,win_ys]
                }
            }
    
        }
        return false
    }

     function get_directions(Board, x, y) {
        const Directions = [[],[],[],[]];
        let dir0=-1
        let dir1=-1
        let dir2=-1
        let dir3=-1
        for (let i = -4; i < 5; i++) {
            if (x + i >= 0 && x + i <= Rows - 1) {
                if(dir0===-1){dir0=[x+i,y]}
                Directions[0].push(Board[x + i][y])
                if (y + i >= 0 && y + i <= Columns - 1) {
                    if(dir2===-1){dir2=[x+i,y+i]}
                    Directions[2].push(Board[x + i][y + i])
                }
            }
            if (y + i >= 0 && y + i <= Columns - 1) {
                if(dir1===-1){dir1=[x,y+i]}
                Directions[1].push(Board[x][y + i])
                if (x - i >= 0 && x - i <= Rows - 1) {
                    if(dir3===-1){dir3=[x-i,y+i]}
                    Directions[3].push(Board[x - i][y + i])
                }
            }
        }
        Directions[0].push(dir0)
        Directions[1].push(dir1)
        Directions[2].push(dir2)
        Directions[3].push(dir3)
        return Directions
    }

     function checkwin(Board, x, y,player_idx) {
        const Directions = get_directions(Board, x, y)
        console.log(Directions)
        for (let i = 0; i < 4; i++) {
            const res=check_directions(Directions[i],i)
            if (res) {
                const xs=res[0]
                const ys=res[1]
                draw_winning_line(xs,ys,player_idx);
                return true
            }
        }
    }

    
    function make_move(column, row, player_idx) {
        if ((prev_move_column !== null) && (prev_move_column !== undefined)) {
            ctx.fillStyle = colorOfplayer(prev_player_idx);
            drawBox(prev_move_row, prev_move_column);
        }
        moves_made++
        prev_move_column = column;
        prev_move_row = row;
        prev_player_idx = player_idx;
        console.log(Game_Board)
        Game_Board[column][row] = (player_idx === 0) ? -1 : 1;
        const set_figure = figureOfplayer(player_idx);
        set_figure(row,column);
        console.log(prev_move_column,prev_move_row)
        if (checkwin(Game_Board,prev_move_column,prev_move_row,player_idx)) {
            Paused = true;
            game_over((player_idx===gameData.your_player_idx)?"won":"lost")
            clearInterval(timer);
        } else {
            if (moves_made === 21 * 21) {
                Paused = true;
                clearInterval(timer);
                game_over("draw")
            } else {
                Move_transition();
                if (prev_player_idx === gameData.your_player_idx) {
                    Engine.postMessage([Game_Board, 1, Time_for_move]); //time in ms
                }
            }
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

    function drawBox (x, y) {
        ctx.fillRect(x * g_cellSize + offset + lineWidth/2, y * g_cellSize + offset + lineWidth/2, g_cellSize - lineWidth, g_cellSize - lineWidth);
    };
    
    function draw_winning_line(xs, ys, player_idx) {
        const set_figure = figureOfplayer(player_idx);
        for (let i = 0; i < (xs.length); i += 1) {
            clear_cell(ys[i], xs[i]);
            set_figure(ys[i], xs[i]);
            ctx.fillStyle = "rgba(255,20,147,0.5)"
            drawBox(ys[i],xs[i]);
        }
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
    const router=useRouter();
    const [openGameOverModal, setOpenGameOverModal] = useState(false);
    const [gameResult, setGameResult] = useState(false);
    const handleCloseGameOverModal = () => setOpenGameOverModal(false);
    const game_over=(result)=>{
        setGameResult(result)
        setOpenGameOverModal(true)
    }
    gameData=props.gameData
    const setGameData=props.setGameData
    //window.sessionStorage.guest_username
    const canvasRef = useRef(null)
    const [margin, setMargin] = useState("0px");
    useEffect(() => {
        const query=router.query
        const wss_server_url="ws://localhost:8443"
        const options={transports: ["websocket"]}
        if(true){
          options.query=`guest_name=a`
        }
        const socket = io.connect(wss_server_url,options)
        socket.emit("find_game",query)
        // game(canvasRef.current,setMargin,setGameData,game_over)
      },[]);
    return (
        <Col  md={9} style={{ padding: 0 }}>
            <Row className="justify-content-center" style={{ marginTop: margin, marginBottom: margin}}>
                <canvas  ref={canvasRef} id="myCanvas"></canvas>
            </Row>
            <GameOverModal result={gameResult} open={openGameOverModal} handleClose={handleCloseGameOverModal}/>
        </Col>
    )
}
