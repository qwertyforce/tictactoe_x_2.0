import * as sktio from "socket.io";
import cookie_parse from 'cookie-parser';
import session from 'express-session';
import connectMongo from 'connect-mongo';
import config from '../config/config'
import db_ops from "./helpers/db_ops";
import moment from "moment";
const MongoStore = connectMongo(session);
const ses_midleware=session({
    secret: config.session_secret,
    resave: false,
    saveUninitialized: true,
    name: "session",
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000,              //use secure: true
      sameSite: 'lax'
    },
    store: new MongoStore({
      url: config.mongodb_url+'TicTacToeX?authSource=admin',
      ttl: 14 * 24 * 60 * 60
    }) // = 14 days. Default
  })
const socketio=sktio.listen(8443)
const cookieParser = cookie_parse(config.session_secret);
const username_by_socket_id=new Map()
const socket_id_by_username=new Map()
socket_id_by_username.set("Server",1)

const  Maps:Array<any> = []
Maps.push(new Array(21).fill(null).map(() => new Array(21).fill(0)))

/////////////////////////////////////////////////////////////

//STANDARD (4 players)
const Playing_now = new Map();
const Opened_games =new Map();
// //CLASSIC (4 players)
const Playing_now_classic = new Map();
const Opened_games_classic = new Map();

// //DUEL STANDARD (2 players)
const Playing_now_duel = new Map();
const Opened_games_duel = new Map();
// //DUEL CLASSIC (2 players)
const Playing_now_classic_duel = new Map();
const Opened_games_classic_duel = new Map();
// //PRIVATE STANDARD (4 players)
const Playing_now_private = new Map();
const Opened_games_private = new Map();
// //PRIVATE CLASSIC (4 players)
const Playing_now_classic_private = new Map();
const Opened_games_classic_private = new Map();
// //DUEL PRIVATE STANDARD (2 players)
const Playing_now_private_duel = new Map();
const Opened_games_private_duel = new Map();
// //DUEL PRIVATE CLASSIC (2 players)
const Playing_now_classic_private_duel = new Map();
const Opened_games_classic_private_duel = new Map();
//////////////////////////////////////////////////////////////
const bonuses = ["set_block", "destroy_block", "destroy_player_figure", "enemy_figure_transform", "mine"];
let GAME_ID=0
function randomInteger(min:number, max:number) {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

function join_lobby(socket:any, Room:string, Opened:any) {
  console.log("JOIN LOBBY")
  Opened.get(Room).players.push(socket.id);
  socket.join(Room);
  socketio.in(Room).emit('players_waiting', Opened.get(Room).players.length);
  socket.room = Room;
  console.log(Opened)
}

function matchmaking(socket: any, lobby_size: number,game_mode:string) {
  const Playing = socket.array_play
  const Opened = socket.array_open

  if (Opened.size > 0) {
    const Room = Opened.keys().next().value
    if (Opened.get(Room).players.length < lobby_size - 1) {
      join_lobby(socket, Room, Opened)
    } else if (Opened.get(Room).players.length === lobby_size - 1) {
      run_lobby(socket, Room, Opened, Playing, lobby_size)
    }
  } else {
    GAME_ID += 1;
    create_lobby(socket, GAME_ID.toString(), Opened,game_mode);
  }
}

function private_matchmaking(socket: any, Room: string, lobbysize: number, game_mode:string) {
  const Playing = socket.array_play
  const Opened = socket.array_open
  if (Opened.get(Room) !== undefined) {
    if (Opened.get(Room).players.length < lobbysize - 1) {
      join_lobby(socket, Room, Opened)
    } else if (Opened.get(Room).players.length === lobbysize - 1) {
      run_lobby(socket, Room, Opened, Playing, lobbysize)
    }
  } else {
    create_lobby(socket, Room, Opened,game_mode);
  }
}

function generate_players(usernames: string[],socket_ids: string[]){
  const players=[]
  let figures = ["cross", "circle", "square", "triangle"]
  let colors = ["green", "blue", "light_blue", "orange"]
  for (let i=0;i<usernames.length;i++) {
    const color_idx = randomInteger(0, colors.length - 1)
    const color = colors[color_idx]
    colors.splice(color_idx, 1)
    const figure_idx = randomInteger(0, figures.length - 1)
    const figure = figures[figure_idx]
    figures.splice(figure_idx, 1)
    players.push({ username: usernames[i], socket_id:socket_ids[i], color: color, figure: figure })
  }
  return players
}

function run_lobby(socket: any, Room: string, Opened: any, Playing: any, lobby_size: number) {
  let usernames = [];
  Opened.get(Room).players.push(socket.id);
  for (let i = 0; i < lobby_size; i++) {
    usernames[i] = username_by_socket_id.get(Opened.get(Room).players[i]);
  }
  const current_player_idx=Math.floor((Math.random() * lobby_size))
  Opened.get(Room).Turn = Opened.get(Room).players[current_player_idx];
  socket.join(Room);
  console.log(usernames)
  const usernames_colors_figures=generate_players(usernames,Opened.get(Room).players)
  socketio.in(Room).emit('players_waiting', lobby_size);
  // socketio.in(Room).emit('player_usernames', usernames);
  socketio.in(Room).emit("get_usernames_colors_figures", usernames_colors_figures);
  // socketio.in(Room).emit("get_Players", Opened.get(Room).players);
  socketio.in(Room).emit("get_first_turn_player_idx", current_player_idx);
  Playing.set(Room, Opened.get(Room))
  Opened.delete(Room);
  socket.room = Room
  socketio.in(Room).emit("Map_Load", Playing.get(Room).board);
  Playing.get(Room).last_move_time = moment().format();
}

function create_lobby(socket: any, Room: string, Opened: any, game_mode:string) {
  const map = JSON.parse(JSON.stringify(Maps[randomInteger(0, Maps.length - 1)]));
  Opened.set(Room, {
    players: [socket.id],
    board: map,
    game_mode:game_mode,
    last_move_time: 0
  })
  socket.join(Room);
  socket.room = Room
  socket.emit('players_waiting', 1);
}
function Move_transition(socket:any) {
  const Playing = socket.array_play
  Playing.get(socket.room).last_move_time = moment().format();
  const player_idx = Playing.get(socket.room).players.indexOf(Playing.get(socket.room).Turn);
  if (player_idx + 1 === Playing.get(socket.room).players.length) {
    Playing.get(socket.room).Turn = Playing.get(socket.room).players[0]
  } else {
    Playing.get(socket.room).Turn = Playing.get(socket.room).players[player_idx + 1];
  }
}
socketio.use(async function (socket: any, next) {
  console.log(socket.handshake.query)
  if (socket.handshake.query.guest_username && typeof socket.handshake.query.guest_username === "string") {
    const username = socket.handshake.query.guest_username
    if (socket_id_by_username.get(username) === undefined) { // no players with this username online
      const users = await db_ops.activated_user.find_user_by_username(socket.handshake.query.guest_username)
      if (users.length === 0) {//no players with this username are registered
        socket_id_by_username.set(username, socket.id)
        username_by_socket_id.set(socket.id,username)
        socket.username = socket.handshake.query.guest_username
        socket.guest = 1
        return next()
      }
    }
    const err = new Error("Username is already taken");
    return next(err);
  } else {
    cookieParser((socket.handshake as any), ({} as any), function (err: any) {
      if (err) {
        err = new Error("Can't parse cookie");
        return next(err);
      }
      if ((socket.handshake as any).signedCookies.session) {
        ses_midleware((socket.handshake as any), ({} as any), function (err: any) {
          if (err) {
            err = new Error("ses_midleware_error");
            return next(err);
          }
          if ((socket.handshake as any).session.username === undefined) {
            err = new Error("not authed");
            return next(err);
          }
          const username = (socket.handshake as any).session.username
          if (socket_id_by_username.get(username) === undefined) {
            socket.username = (socket.handshake as any).session.username
            socket_id_by_username.set(username, socket.id)
            username_by_socket_id.set(socket.id,username)
            return next()
          }

        })
      }
    });
  }
});



socketio.on('connection', function(socket:any) {
  socket.afk = 0;
  console.log("============CONNECTION");
  socket.leave(socket.id);
  // socket.join("fqwf",function(){
  //   console.log(socket.rooms)
  // })
  console.log(socket.username)
  console.log(socket.handshake.address);
 
 
  socket.on('send_message', function (message: any) {
    if (socket.room) {
      socketio.in(socket.room).emit('message_received', socket.username, message);
    }
  });
  socket.on("find_game", function (query: any) {
    if(socket.room!==undefined){
      return
    }
    if(!query){
      return
    }
    if (query?.pass && typeof query?.pass==="string" ) { //private game'
      let lobby_size: number;
      let game_mode:string;
      if (query?.gm === 1 || query?.gm === 2) {
        if (query?.gm === 1) {
          socket.classic = 1;
          if (query.duel) {
            lobby_size = 2
            socket.array_play = Playing_now_classic_private_duel
            socket.array_open = Opened_games_classic_private_duel
            game_mode = "p_classic_duel"
          } else {
            lobby_size = 4
            socket.array_play = Playing_now_classic_private
            socket.array_open = Opened_games_classic_private
            game_mode = "p_classic"
          }
        } else {
          socket.used_cells_for_bonus = []
          socket.available_bonuses = {}
          socket.number_of_bonuses_to_use_in_this_turn = 2
          const random_bonus = bonuses[randomInteger(0, bonuses.length - 1)]
          socket.available_bonuses[random_bonus] = 1;
          socket.emit("get_bonus",random_bonus)
          if (query.duel) {
            lobby_size = 2
            socket.array_play = Playing_now_private_duel
            socket.array_open = Opened_games_private_duel
            game_mode = "p_modern_duel"
          } else {
            lobby_size = 4
            socket.array_play = Playing_now_private
            socket.array_open = Opened_games_private
            game_mode = "p_modern"
          }
        }
        private_matchmaking(socket,query.pass, lobby_size, game_mode)
      }
    } else {
      let lobby_size: number;
      let game_mode:string;
      if (query?.gm === 1 || query?.gm === 2) {
        if (query?.gm === 1) {
          socket.classic = 1;
          if (query.duel) {
            lobby_size = 2
            socket.array_play = Playing_now_classic_duel
            socket.array_open = Opened_games_classic_duel
            game_mode = "m_classic_duel"
          } else {
            lobby_size = 4
            socket.array_play = Playing_now_classic
            socket.array_open = Opened_games_classic
            game_mode = "m_classic"
          }
        } else {
          socket.used_cells_for_bonus = []
          socket.available_bonuses = {}
          socket.number_of_bonuses_to_use_in_this_turn = 2
          const random_bonus = bonuses[randomInteger(0, bonuses.length - 1)]
          socket.available_bonuses[random_bonus] = 1;
          socket.emit("get_bonus",random_bonus)
          if (query.duel) {
            lobby_size = 2
            socket.array_play = Playing_now_duel
            socket.array_open = Opened_games_duel
            game_mode = "m_modern_duel"
          } else {
            lobby_size = 4
            socket.array_play = Playing_now
            socket.array_open = Opened_games
            game_mode = "m_modern"
          }
        }
        matchmaking(socket, lobby_size, game_mode)
      }
    }
  })

socket.on('disconnect', function() {
  socket_id_by_username.delete(socket.username)
  username_by_socket_id.delete(socket.id)
  console.log('Got disconnect!');
  if (socket.room === undefined) {
      return
  }
  const Playing = socket.array_play
  const Opened = socket.array_open
  socketio.in(socket.room).emit('message_received', "Server", socket.username + " disconnected");
  if (Playing.get(socket.room) !== undefined) {
      if(!socket.guest){
        db_ops.game_ops.set_game_result_by_username(socket.username,Playing.get(socket.room).game_mode,"lost")
      }
      if (Playing.get(socket.room).Turn === socket.id) {
          Move_transition(socket);
          console.log("After_leave ", Playing.get(socket.room).Turn);
      }
      Playing.get(socket.room).players.splice(Playing.get(socket.room).players.indexOf(socket.id), 1);
      if (Playing.get(socket.room).players.length === 0) {
          Playing.delete(socket.room)
          return;
      };
      socketio.in(socket.room).emit('player_left', socket.id);
  };
  if ((Opened.get(socket.room) !== undefined) && (Opened.get(socket.room).players.indexOf(socket.id) > -1)) {
      Opened.get(socket.room).players.splice(Opened.get(socket.room).players.indexOf(socket.id), 1);
      socketio.in(socket.room).emit('players_waiting', Opened.get(socket.room).players.length);
  }
  socket.room = undefined;
});

  socket.on('Make_Move', function (row:any, column:any) {
    const Playing = socket.array_play
    if ((socket.room !== undefined) &&
      (Playing.get(socket.room) !== undefined) &&
      (Playing.get(socket.room).Turn === socket.id) &&
      (Number.isInteger(column) === true) &&
      (Number.isInteger(row) === true) &&
      (column >= 0) &&
      (column <= 20) &&
      (row >= 0) &&
      (row <= 20) &&
      ((Playing.get(socket.room).board[row][column] === 0) || (Playing.get(socket.room).board[row][column] === "Mine"))) {
      if (socket.classic != 1) {
        socket.number_of_bonuses_to_use_in_this_turn = 2;
      }
      if (Playing.get(socket.room).board[row][column] === "Mine") {
        console.log("MINE")
        socketio.in(socket.room).emit("Fake_on_move", row, column, socket.id);
        Playing.get(socket.room).board[row][column] = 0;
        Move_transition(socket);
        socketio.in(socket.room).emit('message_received', "Server", socket.username + " vzorvan na mine");
        return
      }
      Playing.get(socket.room).board[row][column] = socket.id;
      console.log(socket.id + "Made a move at " + row + " " + column); //numberofturn=индекс ходящего в массиве игрков
      Move_transition(socket)
      socketio.in(socket.room).emit("On_move", row, column, socket.id);
    }
  });
  socket.on('MoveTimeUp', function () {
    const Playing = socket.array_play
    if ((socket.room !== undefined) &&
      (Playing.get(socket.room) !== undefined)) {
      const Turn = Playing.get(socket.room).Turn
      if (moment().diff(Playing.get(socket.room).last_move_time, 'milliseconds') >= 45000) {
        console.log((socketio.sockets.connected[Turn] as any).afk)
        if ((socketio.sockets.connected[Turn] as any).afk === 1) {
          socketio.sockets.connected[Turn].disconnect(true)
          return
        }
        (socketio.sockets.connected[Turn] as any).afk += 1;
        Move_transition(socket);
        socketio.in(socket.room).emit("PlayerTimeUp");
      }
    }
  });

  socket.on('use_bonus', function (row:number, column:number, name_of_bonus:string) {
    const Playing = socket.array_play
    if ((socket.room !== undefined) &&
      (Playing.get(socket.room)!== undefined) &&
      (Playing.get(socket.room).Turn === socket.id) &&
      (socket.available_bonuses[name_of_bonus] !== undefined) &&
      (socket.available_bonuses[name_of_bonus] > 0) &&
      (socket.number_of_bonuses_to_use_in_this_turn > 0)
    ) {
      let succes = false;
      console.log("bonus used", name_of_bonus);
      console.log(Playing.get(socket.room).board[row][column]);
      switch (name_of_bonus) {
        case "set_block":
          if (Playing.get(socket.room).board[row][column] === 0) {
            Playing.get(socket.room).board[row][column] = "Obstacle";
            succes = true;
          }
          break;

        case "mine":
          if (Playing.get(socket.room).board[row][column] === 0) {
            Playing.get(socket.room).board[row][column] = "Mine";
            succes = true;
          }
          break;

        case "destroy_block":
          if (Playing.get(socket.room).board[row][column] === "Obstacle") {
            Playing.get(socket.room).board[row][column] = 0;
            succes = true;
          }
          break;
        case "destroy_player_figure":
          if ((Playing.get(socket.room).board[row][column] !== 0) &&
            (Playing.get(socket.room).board[row][column] !== "Obstacle")
          ) {
            Playing.get(socket.room).board[row][column] = 0;
            succes = true;
          }
          break;
        case "enemy_figure_transform":
          if ((Playing.get(socket.room).board[row][column] !== 0) &&
            (Playing.get(socket.room).board[row][column] !== "Obstacle") &&
            (Playing.get(socket.room).board[row][column] !== socket.id)
          ) {
            Playing.get(socket.room).board[row][column] = socket.id;
            succes = true;
          }
          break;
      }
      if (succes) {
        socket.number_of_bonuses_to_use_in_this_turn -= 1;
        socket.available_bonuses[name_of_bonus] -= 1;
        if (name_of_bonus === "mine") {
          return;
        }
        socketio.in(socket.room).emit('bonus_used', name_of_bonus, row, column, socket.id);
      }
    }
  });
  socket.on("get_bonus", function (row: number, column: number) {
    const Playing = socket.array_play
    if ((socket.room !== undefined) &&
      (Playing.get(socket.room) !== undefined) &&
      (Number.isInteger(column) === true) &&
      (Number.isInteger(row) === true) &&
      (column >= 0) &&
      (column <= 20) &&
      (row >= 0) &&
      (row <= 20) &&
      (Playing.get(socket.room).board[row][column] === socket.id)) {
        const Directions = get_directions_bonus(Playing.get(socket.room).board, row, column,socket.used_cells_for_bonus)
        console.log(Directions)
        for (let i = 0; i < 4; i++) {
            const res=check_directions(Directions[i],i,3)
            if (res) {
                const rows=res[0]
                const columns=res[1]
                for(let i=0;i<rows.length;i++){
                    socket.used_cells_for_bonus.push({row:rows[i],column:columns[i]})
                }
                const random_bonus = bonuses[randomInteger(0, bonuses.length - 1)]
                if (socket.available_bonuses[random_bonus] == undefined) {
                    socket.available_bonuses[random_bonus] = 1;
                } else {
                    socket.available_bonuses[random_bonus] += 1;
                }
                socket.emit("get_bonus", random_bonus);
                //console.log(Playing[room].UsedForBonus);
                socketio.in(socket.room).emit('message_received', "Server", socket.username + " got " + random_bonus + " bonus for 3 in a row");
                console.log("BONUS!!!")
                socket.emit("get_bonus",row,column)
                console.log(rows,columns)
                return true
            }
        }

      }
  })
  socket.on('win_detected', function (row: number, column: number) {
    const Playing = socket.array_play
    if ((socket.room !== undefined) &&
      (Playing.get(socket.room) !== undefined) &&
      (Number.isInteger(column) === true) &&
      (Number.isInteger(row) === true) &&
      (column >= 0) &&
      (column <= 20) &&
      (row >= 0) &&
      (row <= 20) &&
      (Playing.get(socket.room).board[row][column] === socket.id)) {
      let figures_to_win = 7;
      if (socket.classic === 1) {
        figures_to_win = 5
      }
      const Directions = get_directions(Playing.get(socket.room).board, row, column, figures_to_win)
      for (let i = 0; i < 4; i++) {
        const res = check_directions(Directions[i], i, figures_to_win)
        if (res) {
          const win_rows = res[0]
          const win_columns = res[1]
          // console.log(win_rows)
          // console.log(win_columns)
          console.log("win DETECTED");
          handle_win(socket, win_rows, win_columns, socket.id)
          return true
        }
      }
    }
  })
  socket.on('draw_detected', function () {
    const Playing = socket.array_play
    if (socket.room === undefined || Playing.get(socket.room) === undefined) {
      return
    }
    const isDraw=check_draw(Playing.get(socket.room).board)
    if(isDraw){
      console.log("DRAW DETECTED")
      socketio.in(socket.room).emit('draw_detected');
      for (let i = 0; i < Playing.get(socket.room).players.length; i++) {
        const username=username_by_socket_id.get(Playing.get(socket.room).players[i])
        db_ops.game_ops.set_game_result_by_username(username,Playing.get(socket.room).game_mode,"draw")
      }
      socketio.in(socket.room).emit('message_received', "Server", "Draw");
      socket.array_play.delete(socket.room)
    }
  });

})

function check_draw(Game_Board:number[][]){
  const Rows=21
  const Columns=21
  for(let row=0;row<Rows;row++){
      for(let column=0;column<Columns;column++){
          if(Game_Board[row][column]===0){
              return false
          }
      }
  }
  return true
}

function get_directions_bonus(Board:number[][], x:number, y:number,used_cells_for_bonus:any[]) {
  const Directions:any = [[],[],[],[]];
  const pieces_in_a_row=3
  const Rows=21
  const Columns=21
  let dir0:number[]=[]
  let dir1:number[]=[]
  let dir2:number[]=[]
  let dir3:number[]=[]
  for (let i = -(pieces_in_a_row-1); i < pieces_in_a_row; i++) {
      if (x + i >= 0 && x + i <= Rows - 1) {
          if(dir0.length===0){dir0.push(x+i,y)}
          if(used_cells_for_bonus.find((el)=>el.row===(x + i)&&el.column===(y))){
              Directions[0].push(-1)
          }else{
              Directions[0].push(Board[x + i][y])
          }
          
          if (y + i >= 0 && y + i <= Columns - 1) {
              if(dir2.length===0){dir2.push(x+i,y+i)}
              if(used_cells_for_bonus.find((el)=>el.row===(x + i)&&el.column===(y + i))){
                  Directions[2].push(-1)
              }else{
                  Directions[2].push(Board[x + i][y + i])
              }
          }
      }
      if (y + i >= 0 && y + i <= Columns - 1) {
        if(dir1.length===0){dir1.push(x,y+i)}
          if (used_cells_for_bonus.find((el) => el.row === (x) && el.column === (y + i))) {
              Directions[1].push(-1)
          } else {
              Directions[1].push(Board[x][y + i])
          }
          if (x - i >= 0 && x - i <= Rows - 1) {
            if(dir3.length===0){dir3.push(x-i,y+i)}
              if (used_cells_for_bonus.find((el) => el.row === (x-i) && el.column === (y + i))) {
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

function get_directions(Board:number[][], x:number, y:number,figures_to_win:number) {
  const Directions:any[][] = [[],[],[],[]];
  const Rows=21
  const Columns=21
  let dir0:number[]=[]
  let dir1:number[]=[]
  let dir2:number[]=[]
  let dir3:number[]=[]
  for (let i = -(figures_to_win-1); i < figures_to_win; i++) {
      if (x + i >= 0 && x + i <= Rows - 1) {
          if(dir0.length===0){dir0.push(x+i,y)}
          Directions[0].push(Board[x + i][y])
          if (y + i >= 0 && y + i <= Columns - 1) {
            if(dir2.length===0){dir2.push(x+i,y+i)}
              Directions[2].push(Board[x + i][y + i])
          }
      }
      if (y + i >= 0 && y + i <= Columns - 1) {
        if(dir1.length===0){dir1.push(x,y+i)}
          Directions[1].push(Board[x][y + i])
          if (x - i >= 0 && x - i <= Rows - 1) {
            if(dir3.length===0){dir3.push(x-i,y+i)}
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

function check_directions(arr:any[],i:number,figures_to_win:number) {
  const vector=get_vector(i)
  const reference_point=arr[arr.length-1]
  let comp_func:any;
  switch(figures_to_win){
      case 3:
          comp_func=check3
          break;
      case 5:
          comp_func=check5
          break;
      case 7:
          comp_func=check7
          break;
  }
  for (let i = 0; i < arr.length - (figures_to_win-1); i++) {
      if (arr[i] !== 0) {
          if (comp_func(arr,i)) {
              const win_xs=[]
              const win_ys=[]
              for(let k=i;k<=i+(figures_to_win-1);k++){
                  win_xs.push(reference_point[0]+k*vector![0])
                  win_ys.push(reference_point[1]+k*vector![1])
              }
              return [win_xs,win_ys]
          }
      }
  }
  return false
}

function check3(arr:number[],i:number){
  return arr[i] === arr[i + 1] && arr[i] === arr[i + 2]
}

function check5(arr:number[],i:number){
  return arr[i] === arr[i + 1] && arr[i] === arr[i + 2] && arr[i] === arr[i + 3] && arr[i] === arr[i + 4]
}
function check7(arr:number[],i:number){
  return arr[i] === arr[i + 1] && arr[i] === arr[i + 2] && arr[i] === arr[i + 3] && arr[i] === arr[i + 4]  && arr[i] === arr[i + 5]  && arr[i] === arr[i + 6] 
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
function handle_win(socket:any,win_rows:any,win_columns:any,winner_socket_id:any){
  const Playing=socket.array_play
  const winner_index = Playing.get(socket.room).players.indexOf(winner_socket_id);
  socketio.in(socket.room).emit('win_detected', win_rows, win_columns,winner_socket_id);
  const winner_username=username_by_socket_id.get(Playing.get(socket.room).players[winner_index])
  db_ops.game_ops.set_game_result_by_username(winner_username,Playing.get(socket.room).game_mode,"won")
  for (let i = 0; i < Playing.get(socket.room).players.length; i++) {
      if (i != winner_index) {
        const username=username_by_socket_id.get(Playing.get(socket.room).players[i])
        db_ops.game_ops.set_game_result_by_username(username,Playing.get(socket.room).game_mode,"lost")
      }
  }
  socketio.in(socket.room).emit('message_received', "Server", socket.username + " won the game");
  Playing.delete(socket.room)
}