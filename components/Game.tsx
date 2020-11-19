import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import chat_styles from "../styles/Chat.module.css"
import { useEffect, useState, useRef, Fragment } from 'react'
import GameOverModal from './GameOverModal'
import io from 'socket.io-client';
import { useRouter } from 'next/router'
import Chat from '../components/Chat'
import SetGuestUsernameModal from "./SetGuestUsernameModal"

function divide(numerator: number, denominator: number) {
    const remainder = numerator % denominator;
    const quotient = (numerator - remainder) / denominator;
    return quotient;
}

let gameData: any;
function game(socket: any, canvas: any, setMargin: any, setGameData: any, game_over: any, game_mode: number) {
    console.log("Game")
    const used_cells_for_bonus: any[] = []
    const Game_Board: any = []
    const time_for_move = 45
    const FiguresToWin = (game_mode === 1) ? 5 : 7;
    const Rows = 21;
    const Columns = 21;
    let Paused = false;
    let prev_player_idx: number;
    let prev_move_column: number;
    let prev_move_row: number;
    let timer: NodeJS.Timer

    const c = canvas;
    let lineWidth = 3;
    let g_cellSize: number;
    const BLOCK_COLOR = "rgba(155,155,155,0.7)"
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
    const offset = lineWidth / 2;
    const height = g_cellSize * Rows + (lineWidth);
    const width = g_cellSize * Columns + (lineWidth);
    if (window.innerWidth >= 767) {
        setMargin(((window.innerHeight - 56 - height) / 2).toString() + "px")
    }
    const scale = window.devicePixelRatio * 2;
    const ctx = c.getContext('2d');
    c.style.width = width + "px";
    c.style.height = height + "px";
    c.width = width * scale;
    c.height = height * scale;
    ctx.scale(scale, scale);
    ctx.lineWidth = lineWidth;
   
    init_grid()

    c.addEventListener('click', function (ev: MouseEvent) {
        if (gameData.current_player_idx === gameData.your_player_idx && !Paused) {
            const of = c.getBoundingClientRect();
            const xz = ev.clientX - of.left;
            const yz = ev.clientY - of.top;
            const xx = divide(xz, g_cellSize);
            const yy = divide(yz, g_cellSize);
            if (gameData.selected_bonus !== "") {
                socket.emit('use_bonus', yy, xx, gameData.selected_bonus);
                if (gameData.selected_bonus === "mine" && Game_Board[yy][xx] === 0) {
                    setGameData((prevState: any) => {
                        const bonuses = prevState.bonuses
                        bonuses["mine"] -= 1
                        return {
                            ...prevState,
                            selected_bonus: "",
                            bonuses: bonuses,
                        }
                    });
                }
            } else {
                if (Game_Board[yy][xx] === 0) {
                    //    make_move(yy,xx,gameData.your_player_idx)
                    socket.emit('Make_Move', yy, xx);
                    console.log(yy, xx);
                }
            }
        }
    }, false);
    
    function init_grid() {
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
            setGameData((prevState: any) => ({
                ...prevState,
                time: prevState.time - 1,
            }));
        }
        else {
            socket.emit('MoveTimeUp');
            clearInterval(timer);
        }
    }

    function Move_transition() {
        clearInterval(timer);
        console.log("MOVE TRANSITION")
        setGameData((prevState: any) => ({
            ...prevState,
            time: time_for_move,
        }));

        setGameData((prevState: any) => {
            if (prevState.current_player_idx === prevState.players.length - 1) {
                prevState.current_player_idx = 0;
                while (prevState.players[prevState.current_player_idx].disconnected) {
                    prevState.current_player_idx += 1;
                }
            } else {
                prevState.current_player_idx += 1;
                while (prevState.players[prevState.current_player_idx].disconnected) {
                    if (prevState.current_player_idx === prevState.players.length - 1) {
                        prevState.current_player_idx = 0;
                        continue;
                    };
                    prevState.current_player_idx += 1;
                }
            }
            return { ...prevState }
        })
        timer = setInterval(timer_Func, 1000);
    }

    function make_move(row: number, column: number, player_idx: number) {
        if ((prev_move_column !== null) && (prev_move_column !== undefined)) {
            ctx.fillStyle = colorOfplayer(prev_player_idx);
            drawBox(prev_move_column, prev_move_row);
        }
        prev_move_column = column;
        prev_move_row = row;
        prev_player_idx = player_idx;
        console.log(Game_Board)
        Game_Board[row][column] = (player_idx + 1); // 0 is reserved for blank space
        const set_figure: any = figureOfplayer(player_idx);
        set_figure(column, row);
        console.log(prev_move_row, prev_move_column)
        if (gameData.your_player_idx === player_idx && check_for_bonus(Game_Board, row, column) && game_mode===2) {
            socket.emit("get_bonus", row, column)
        }
        if (gameData.your_player_idx === player_idx && check_win(Game_Board, prev_move_row, prev_move_column)) {
            socket.emit("win_detected", prev_move_row, prev_move_column)
        } else if (check_draw(Game_Board)) {
            socket.emit("draw_detected")
        } else {
            Move_transition()
        }
    }


    ///////////////////////////////////////////////////////////CHECK_FOR_DRAW
    function check_draw(Game_Board: number[][]) {
        for (let row = 0; row < Rows; row++) {
            for (let column = 0; column < Columns; column++) {
                if (Game_Board[row][column] === 0) {
                    return false
                }
            }
        }
        return true
    }
    ////////////////////////////////////////////////////////////////////////



    ///////////////////////////////////////////////////////////CHECK_FOR_WIN

    function check_win(Board: any, x: number, y: number) {
        const Directions = get_directions(Board, x, y, FiguresToWin)
        console.log(Directions)
        for (let i = 0; i < 4; i++) {
            const res = check_directions(Directions[i], i, FiguresToWin)
            if (res) {
                const xs = res[0]
                const ys = res[1]
                console.log(xs, ys)
                // draw_winning_line(xs,ys,player_idx);
                return true
            }
        }
    }

    function get_vector(i: number) {
        switch (i) {
            case 0:
                return [1, 0]
            case 1:
                return [0, 1]
            case 2:
                return [1, 1]
            case 3:
                return [-1, 1]
        }
    }

    function check_directions(arr: any[], i: number, figures_to_win: number) {
        const vector: any = get_vector(i)
        const reference_point = arr[arr.length - 1]
        let comp_func: any;
        switch (figures_to_win) {
            case 3:
                comp_func = check3
                break;
            case 5:
                comp_func = check5
                break;
            case 7:
                comp_func = check7
                break;
        }
        for (let i = 0; i < arr.length - (figures_to_win - 1); i++) {
            if (arr[i] !== 0) {
                if (comp_func(arr, i)) {
                    const win_xs = []
                    const win_ys = []
                    for (let k = i; k <= i + (figures_to_win - 1); k++) {
                        win_xs.push(reference_point[0] + k * vector[0])
                        win_ys.push(reference_point[1] + k * vector[1])
                    }
                    return [win_xs, win_ys]
                }
            }

        }
        return false
    }
    function check3(arr: number[], i: number) {
        return arr[i] === arr[i + 1] && arr[i] === arr[i + 2]
    }
    function check5(arr: number[], i: number) {
        return arr[i] === arr[i + 1] && arr[i] === arr[i + 2] && arr[i] === arr[i + 3] && arr[i] === arr[i + 4]
    }
    function check7(arr: number[], i: number) {
        return arr[i] === arr[i + 1] && arr[i] === arr[i + 2] && arr[i] === arr[i + 3] && arr[i] === arr[i + 4] && arr[i] === arr[i + 5] && arr[i] === arr[i + 6]
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

    ////////////////////////////////////////////////////////////////////////



    ///////////////////////////////////////////////////////////CHECK_FOR_BONUS
    function check_for_bonus(Board: number[][], row: number, column: number) {
        const Directions = get_directions_bonus(Board, row, column)
        console.log(Directions)
        for (let i = 0; i < 4; i++) {
            const res = check_directions(Directions[i], i, 3)
            if (res) {
                const rows = res[0]
                const columns = res[1]
                for (let i = 0; i < rows.length; i++) {
                    used_cells_for_bonus.push({ row: rows[i], column: columns[i] })
                }
                console.log("BONUS!!!")
                console.log(rows, columns)
                return true
            }
        }
    }

    function get_directions_bonus(Board: any, x: number, y: number) {
        const Directions: any = [[], [], [], []];
        const pieces_in_a_row = 3
        const Rows = 21
        const Columns = 21
        let dir0: number[] = []
        let dir1: number[] = []
        let dir2: number[] = []
        let dir3: number[] = []
        for (let i = -(pieces_in_a_row - 1); i < pieces_in_a_row; i++) {
            if (x + i >= 0 && x + i <= Rows - 1) {
                if (dir0.length === 0) { dir0.push(x + i, y) }
                if (used_cells_for_bonus.find((el) => el.row === (x + i) && el.column === (y))) {
                    Directions[0].push(-1)
                } else {
                    Directions[0].push(Board[x + i][y])
                }

                if (y + i >= 0 && y + i <= Columns - 1) {
                    if (dir2.length === 0) { dir2.push(x + i, y + i) }
                    if (used_cells_for_bonus.find((el) => el.row === (x + i) && el.column === (y + i))) {
                        Directions[2].push(-1)
                    } else {
                        Directions[2].push(Board[x + i][y + i])
                    }
                }
            }
            if (y + i >= 0 && y + i <= Columns - 1) {
                if (dir1.length === 0) { dir1.push(x, y + i) }
                if (used_cells_for_bonus.find((el) => el.row === (x) && el.column === (y + i))) {
                    Directions[1].push(-1)
                } else {
                    Directions[1].push(Board[x][y + i])
                }
                if (x - i >= 0 && x - i <= Rows - 1) {
                    if (dir3.length === 0) { dir3.push(x - i, y + i) }
                    if (used_cells_for_bonus.find((el) => el.row === (x - i) && el.column === (y + i))) {
                        Directions[3].push(-1)
                    } else {
                        Directions[3].push(Board[x - i][y + i])
                    }
                }
            }
        }
        Directions[0].push(dir0)
        Directions[1].push(dir1)
        Directions[2].push(dir2)
        Directions[3].push(dir3)
        return Directions
    }
    ///////////////////////////////////////////////////////////



    ///////////////////////////////////////////////////////////CANVAS DRAWING FUNCTIONS
    function colorOfplayer(player_idx: number) {
        const color = gameData.players[player_idx].color
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

    function figureOfplayer(player_idx: number) {
        const figure = gameData.players[player_idx].figure
        switch (figure) {
            case "circle":
                return (column: number, row: number) => {
                    drawCircle(column, row);
                };
            case "triangle":
                return (column: number, row: number) => {
                    drawTriangle(column, row);
                };
            case "square":
                return (column: number, row: number) => {
                    drawSquare(column, row);
                };
            case "cross":
                return (column: number, row: number) => {
                    drawCross(column, row);
                };
        };
    }

    function drawSquare(x: number, y: number) {
        const k = Math.round(g_cellSize / 4);
        ctx.strokeRect(x * g_cellSize + k + offset, y * g_cellSize + k + offset, g_cellSize - (k * 2), g_cellSize - (k * 2));
    };
    function drawTriangle(x: number, y: number) {
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
    function drawCross(x: number, y: number) {
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
    function drawCircle(x: number, y: number) {
        const k = Math.round(g_cellSize / 2) + offset;
        ctx.beginPath();
        ctx.arc(x * g_cellSize + k, y * g_cellSize + k, g_cellSize / 3.5, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.stroke();
    };

    function drawBox(x: number, y: number) {
        ctx.fillRect(x * g_cellSize + offset + lineWidth / 2, y * g_cellSize + offset + lineWidth / 2, g_cellSize - lineWidth, g_cellSize - lineWidth);
    };

    function draw_winning_line(win_rows: number[], win_columns: number[], player_idx: number) {
        const set_figure: any = figureOfplayer(player_idx);
        for (let i = 0; i < (win_rows.length); i++) {
            clear_cell(win_columns[i], win_rows[i]);
            set_figure(win_columns[i], win_rows[i]);
            ctx.fillStyle = "rgba(255,20,147,0.5)"
            drawBox(win_columns[i], win_rows[i]);
        }
    }

    function clear_cell(x: number, y: number) {
        if (true) {
            ctx.fillStyle = "rgb(" + 255 + "," + 255 + "," + 255 + ")";
        } else {
            ctx.fillStyle = "rgb(" + 66 + "," + 66 + "," + 66 + ")";
        }
        drawBox(x, y);
    }
    /////////////////////////////////////////////////////////////////////////



    ////////////////////////////////////SOCKET.IO LISTENERS
    socket.on('win_detected', function (win_rows: number[], win_columns: number[], winner_socket_id: string) {
        const player_idx = gameData.players.findIndex((el: any) => el.socket_id === winner_socket_id)
        Paused = true;
        clearInterval(timer);
        draw_winning_line(win_rows, win_columns, player_idx)
        game_over((player_idx === gameData.your_player_idx) ? "won" : "lost")
    })

    socket.on('Map_Load', function (data: any) {
        ctx.fillStyle = BLOCK_COLOR;
        for (let xxx = 0; xxx < Rows; xxx++) {
            Game_Board[xxx] = [];
            for (let yyy = 0; yyy < Columns; yyy++) {
                Game_Board[xxx][yyy] = data[xxx][yyy];
                if (data[xxx][yyy] === "Obstacle") {
                    drawBox(xxx, yyy);
                }
            }
        }
        timer = setInterval(timer_Func, 1000)
    });

    socket.on('On_move', function (row: number, column: number, socket_id: string) {
        const player_idx = gameData.players.findIndex((el: any) => el.socket_id === socket_id)
        console.log(player_idx)
        make_move(row, column, player_idx)
    })

    socket.on('get_bonus', function (bonus: string) {
        setGameData((prevState: any) => {
            const bonuses = prevState.bonuses
            bonuses[bonus] += 1
            return {
                ...prevState,
                bonuses: bonuses,
            }
        });
    })

    socket.on('player_left', function (socket_id: string) {
        const player_idx = gameData.players.findIndex((el: any) => el.socket_id === socket_id)
        if (gameData.current_player_idx === player_idx) {
            Move_transition();
        }
        setGameData((prevState: any) => {
            const players = prevState.players
            players[player_idx].disconnected = true
            return {
                ...prevState,
                players: players,
                max_player_count: prevState.max_player_count - 1
            }
        });
    });
    socket.on('PlayerTimeUp', function () {
        Move_transition();
    });

    socket.on('bonus_used', function (bonus_name: string, row: number, column: number, player_socket_id: string) {
        const player_idx = gameData.players.findIndex((el: any) => el.socket_id === player_socket_id)
        switch (bonus_name) {
            case 'set_block':
                Game_Board[row][column] = "Obstacle";
                ctx.fillStyle = BLOCK_COLOR;
                drawBox(column, row);
                if (check_draw(Game_Board)) {
                    socket.emit("draw_detected")
                }
                break;
            case 'destroy_block':
                Game_Board[row][column] = 0;
                clear_cell(column, row);
                break;
            case 'destroy_player_figure':
                Game_Board[row][column] = 0;
                clear_cell(column, row);
                break;
            case 'enemy_figure_transform':
                Game_Board[row][column] = (player_idx + 1);
                clear_cell(column, row);
                console.log(colorOfplayer(player_idx));
                ctx.fillStyle = colorOfplayer(player_idx);
                const figure: any = figureOfplayer(player_idx);
                figure(column, row)
                drawBox(column, row);
                if (gameData.your_player_idx === player_idx && check_for_bonus(Game_Board, row, column) && game_mode===2) {
                    socket.emit("get_bonus", row, column)
                }
                if (gameData.your_player_idx === player_idx && check_win(Game_Board, prev_move_row, prev_move_column)) {
                    socket.emit("win_detected", prev_move_row, prev_move_column)
                }
                break;
        }
        console.log("bonus used", bonus_name);
        if (gameData.your_player_idx === player_idx) {
            setGameData((prevState: any) => {
                const bonuses = prevState.bonuses
                bonuses[bonus_name] -= 1
                return {
                    ...prevState,
                    selected_bonus: "",
                    bonuses: bonuses,
                }
            });
        }
    });
    //////////////////////////////////////////////////////////////////////
}


function send_message(msg: string) {
    socket.emit('send_message', msg)
}

let socket: SocketIOClient.Socket
let query: any
function try_to_reconnect() {
    if (window.sessionStorage.getItem("guest_username")) {
        socket.io.opts.query = `guest_username=${window.sessionStorage.getItem("guest_username")}`
    }
    socket.connect()
}
export default function Game(props: { gameData: any; setGameData: any }) {
    const router = useRouter();
    const [openGameOverModal, setOpenGameOverModal] = useState(false);
    const [gameResult, setGameResult] = useState("");
    const handleCloseGameOverModal = () => setOpenGameOverModal(false);

    const [openSetGuestUsernameModal, setSetGuestUsernameModal] = useState(false);
    const handleCloseSetGuestUsernameModal = () => setSetGuestUsernameModal(false);
    const handleOpenSetGuestUsernameModal = () => setSetGuestUsernameModal(true);

    const game_over = (result: string) => {
        setGameResult(result)
        setOpenGameOverModal(true)
    }
    gameData = props.gameData
    const setGameData = props.setGameData
    const canvasRef = useRef(null)
    const [messages, setMessages] = useState([]);
    const generate_msg = (msg: string, username: string, color: string) => {
        setMessages((prev_messages) => {
            const msg_id = prev_messages.length
            const message = (<div className={chat_styles.chat_msg} key={msg_id}>
                <div className={chat_styles.username + " " + color}>{`${username}: `}</div>
                <div className={chat_styles.cm_msg_text}>{msg}</div>
            </div>)
            return [...prev_messages, message] as any
        })
        if (document.getElementsByClassName(chat_styles.chat_logs)[0]) {
            document.getElementsByClassName(chat_styles.chat_logs)[0].scrollTop = document.getElementsByClassName(chat_styles.chat_logs)[0].scrollHeight
        }
    }
    const [margin, setMargin] = useState("0px");

    useEffect(() => {

        query = router.query
        if (Object.entries(query).length === 0) {
            return;
        }
        const wss_server_url = "ws://localhost:8443"
        const options: any = { transports: ["websocket"] }
        if (window.sessionStorage.getItem("guest_username")) {
            options.query = `guest_username=${window.sessionStorage.getItem("guest_username")}`
        }

        socket = io.connect(wss_server_url, options)
        if (query.gm) { query.gm = parseInt(query.gm) }
        if (query.duel) { query.duel = parseInt(query.duel) }
        console.log(query)
        socket.on('players_waiting', function (current_player_count: number) {
            setGameData((prevState: any) => ({
                ...prevState,
                current_player_count: current_player_count,
            }));
        });
        socket.on('get_usernames_colors_figures', function (usernames_colors_figures: any) {
            console.log(usernames_colors_figures)
            setGameData((prevState: any) => ({
                ...prevState,
                your_player_idx: usernames_colors_figures.findIndex((el: any) => el.socket_id === (socket.io as any).engine.id),
                players: usernames_colors_figures,
            }));
        });

        socket.on('get_first_turn_player_idx', function (current_player_idx: number) {
            setGameData((prevState: any) => ({
                ...prevState,
                current_player_idx: current_player_idx,
            }));
        });

        socket.on('message_received', function (username: string, msg: string) {
            let color;
            console.log(gameData.players.findIndex((el: any) => el.username === username))
            if (username !== "Server") {
                switch (gameData.players.find((el: any) => el.username === username)?.color) {
                    case "green":
                        color = "text-success";
                        break;
                    case "light_blue":
                        color = chat_styles.text_light_blue
                        break;
                    case "orange":
                        color = "text-warning";
                        break;
                    case "blue":
                        color = "text-primary";
                        break;
                    default:
                        color = "text-primary";
                        break;
                };
            }
            else {
                color = "text-danger";
            }
            generate_msg(msg.trim(), username, color);
        });

        socket.on('error', function (error: string) {
            if (error === "not authed") {
                if (!(window.sessionStorage.getItem("guest_username"))) {
                    socket.disconnect();
                    handleOpenSetGuestUsernameModal()
                }
            }
            alert(error);
        });

        socket.on('disconnect', function (error: string) {
            console.log(error)
            generate_msg("You was disconnected due to afk", "Server", "text-danger");
        });
        socket.emit("find_game", query)
        game(socket, canvasRef.current, setMargin, setGameData, game_over, query.gm)
    }, [router]);
    return (
        <Fragment>
            <Col md={7} style={{ padding: 0 }}>
                <Row className="justify-content-center" style={{ marginTop: margin, marginBottom: margin }}>
                    <canvas ref={canvasRef} id="myCanvas"></canvas>
                </Row>
                <GameOverModal result={gameResult} open={openGameOverModal} handleClose={handleCloseGameOverModal} />
            </Col>
            <Chat messages={messages} send_message={send_message} />
            <SetGuestUsernameModal open={openSetGuestUsernameModal} handleClose={handleCloseSetGuestUsernameModal} try_to_reconnect={try_to_reconnect} />
        </Fragment>
    )
}
