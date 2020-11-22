import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { useEffect, useState,useRef } from 'react'
import GameOverModal from './GameOverModal'

function divide(numerator:number, denominator:number) {
    const remainder = numerator % denominator;
    const quotient = (numerator - remainder) / denominator;
    return quotient;
}

let gameData:any;
function game(canvas:any,setMargin:any,setGameData:any,game_over:any){
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
        console.log(e.data.bestmove)
        make_move(e.data.bestmove.i, e.data.bestmove.j,1)
    }
    const Game_Board = new Array(21).fill(null).map(() => new Array(21).fill(0))
    const Time_for_move = gameData.time_for_ai_move
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

    let prev_player_idx:number;
    let prev_move_column:number;
    let prev_move_row:number;
    let timer:any 
    init_grid()
    if(gameData.current_player_idx===0){
        setGameData((prevState:any) => ({
            ...prevState,
            time: time_for_human,
        }));
        timer=setInterval(timer_Func, 1000)
    }else{
        setGameData((prevState:any) => ({
            ...prevState,
            time: time_for_ai,
        }));
        make_move(10,10,1);
    }
    
    c.addEventListener('click', function(ev:MouseEvent) {
        if (gameData.current_player_idx === gameData.your_player_idx && !Paused) {
            const of = c.getBoundingClientRect();
            const xz = ev.clientX - of.left;
            const yz = ev.clientY - of.top;
            const xx = divide(xz, g_cellSize);
            const yy = divide(yz, g_cellSize);
                if (Game_Board[yy][xx] === 0) {
                   make_move(yy,xx,gameData.your_player_idx)
                   console.log(yy, xx);
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
            setGameData((prevState:any) => ({
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
            setGameData((prevState:any) => ({
                ...prevState,
                time: time_for_ai,
              }));
        }else{
            setGameData((prevState:any) => ({
                ...prevState,
                time: time_for_human,
              }));
        } 
         setGameData((prevState:any) => {
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
     
     function get_vector(i:number){
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
    function check_directions(arr:number[],i:number) {
        const vector:any=get_vector(i)
        const reference_point:any=arr[arr.length-1]
        for (let i = 0; i < arr.length - (4+1); i++) {
            if (arr[i] !== 0) {
                if (arr[i] === arr[i + 1] && arr[i] === arr[i + 2] && arr[i] === arr[i + 3] && arr[i] === arr[i + 4]) {
                    const win_rows=[]
                    const win_columns=[]
                    for(let k=i;k<=i+4;k++){
                        win_rows.push(reference_point[0]+k*vector[0])
                        win_columns.push(reference_point[1]+k*vector[1])
                    }
                    return [win_rows,win_columns]
                }
            }
    
        }
        return false
    }

    function get_directions(Board: any, x: number, y: number, figures_to_win: number) {
        const Directions: any = [[], [], [], []];
        const Rows = 21
        const Columns = 21
        let dir0: number[] = []
        let dir1: number[] = []
        let dir2: number[] = []
        let dir3: number[] = []
        for (let i = -(figures_to_win - 1); i < figures_to_win; i++) {
            if (x + i >= 0 && x + i <= Rows - 1) {
                if (dir0.length === 0) { dir0.push(x + i, y) }
                Directions[0].push(Board[x + i][y])
                if (y + i >= 0 && y + i <= Columns - 1) {
                    if (dir2.length === 0) { dir2.push(x + i, y + i) }
                    Directions[2].push(Board[x + i][y + i])
                }
            }
            if (y + i >= 0 && y + i <= Columns - 1) {
                if (dir1.length === 0) { dir1.push(x, y + i) }
                Directions[1].push(Board[x][y + i])
                if (x - i >= 0 && x - i <= Rows - 1) {
                    if (dir3.length === 0) { dir3.push(x - i, y + i) }
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

     function checkwin(Board:number[][], row:number, column:number,player_idx:number) {
        const Directions = get_directions(Board, row, column,FiguresToWin)
        console.log(Directions)
        for (let i = 0; i < 4; i++) {
            const res=check_directions(Directions[i],i)
            if (res) {
                const wins_rows=res[0]
                const wins_columns=res[1]
                draw_winning_line(wins_rows,wins_columns,player_idx);
                return true
            }
        }
    }

    
    function make_move(row:number, column:number, player_idx:number) {
        if ((prev_move_column !== null) && (prev_move_column !== undefined)) {
            ctx.fillStyle = colorOfplayer(prev_player_idx);
            drawBox(prev_move_column, prev_move_row);
        }
        moves_made++
        prev_move_column = column;
        prev_move_row = row;
        prev_player_idx = player_idx;
        console.log(Game_Board)
        Game_Board[row][column] = (player_idx === 0) ? -1 : 1;
        const set_figure:any = figureOfplayer(player_idx);
        set_figure(column,row);
        console.log(prev_move_row,prev_move_column)
        if (checkwin(Game_Board,prev_move_row,prev_move_column,player_idx)) {
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
    function colorOfplayer(player_idx:number) {
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
   
    function figureOfplayer(player_idx:number) {
        const figure=gameData.players[player_idx].figure
        switch (figure) {
            case "circle":
                return (column:number, row:number) => {
                    drawCircle(column, row);
                };
            case "triangle":
                return (column:number, row:number) => {
                    drawTriangle(column, row);
                };
            case "square":
                return (column:number, row:number) => {
                    drawSquare(column, row);
                };
            case "cross":
                return (column:number, row:number) => {
                    drawCross(column, row);
                };
        };
    }

    function drawSquare(x:number, y:number) {
        const k = Math.round(g_cellSize / 4);
        ctx.strokeRect(x * g_cellSize + k + offset, y * g_cellSize + k + offset, g_cellSize - (k * 2), g_cellSize - (k * 2));
    };
    function drawTriangle(x:number, y:number) {
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
    function drawCross(x:number, y:number) {
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
    function drawCircle(x:number, y:number) {
        const k = Math.round(g_cellSize / 2) + offset;
        ctx.beginPath();
        ctx.arc(x * g_cellSize + k, y * g_cellSize + k, g_cellSize/3.5, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.stroke();
    };

    function drawBox (x:number, y:number) {
        ctx.fillRect(x * g_cellSize + offset + lineWidth/2, y * g_cellSize + offset + lineWidth/2, g_cellSize - lineWidth, g_cellSize - lineWidth);
    };
    
    function draw_winning_line(win_rows:number[], win_columns:number[], player_idx:number) {
        const set_figure:any = figureOfplayer(player_idx);
        for (let i = 0; i < (win_rows.length); i++) {
            clear_cell(win_columns[i],win_rows[i]);
            set_figure(win_columns[i], win_rows[i]);
            ctx.fillStyle = "rgba(255,20,147,0.5)"
            drawBox(win_columns[i],win_rows[i]);
        }
    }

    function clear_cell(x:number, y:number) {
        if (true) {
            ctx.fillStyle = "rgb(" + 255 + "," + 255 + "," + 255 + ")";
        } else {
            ctx.fillStyle = "rgb(" + 66 + "," + 66 + "," + 66 + ")";
        }
        drawBox(x, y);
    }
}
let started=false
export default function Game(props:any) {
    const [openGameOverModal, setOpenGameOverModal] = useState(false);
    const [gameResult, setGameResult] = useState("");
    const handleCloseGameOverModal = () => setOpenGameOverModal(false);
    const game_over=(result:string)=>{
        setGameResult(result)
        setOpenGameOverModal(true)
    }
    gameData=props.gameData
    const setGameData=props.setGameData
    const canvasRef = useRef(null)
    const [margin, setMargin] = useState("0px");
    useEffect(() => {
        if(props.gameData.time_for_ai_move>0 && !started){
            started=true
            console.log(props.gameData.time_for_ai_move)
            game(canvasRef.current,setMargin,setGameData,game_over)
        }
      },[props.gameData]);
    return (
        <Col  md={9} style={{ padding: 0 }}>
            <Row className="justify-content-center" style={{ marginTop: margin, marginBottom: margin}}>
                <canvas  ref={canvasRef} id="myCanvas"></canvas>
            </Row>
            <GameOverModal result={gameResult} open={openGameOverModal} handleClose={handleCloseGameOverModal}/>
        </Col>
    )
}
