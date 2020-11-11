var os = require('os-utils');
var
var Playing_now_classic = {};
var Opened_games_classic = {}; request = require('request');
var querystring = require('querystring');

var https = require('https')
var fs = require('fs');
var server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/4battle.ru/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/4battle.ru/cert.pem')
});
var socketio = require('socket.io')(server);
server.listen(8443);
var exec = require('child_process').exec;
var moment = require('moment');
var Gameid = 0;
const  Maps = [];
Maps.push(new Array(21).fill(null).map(() => new Array(21).fill(0)))
//STANDARD
var Playing_now = {};
var Opened_games = {};

//DUEL
var Playing_now_duel = {};
var Opened_games_duel = {};
var Playing_now_classic_duel = {};
var Opened_games_classic_duel = {};
//
//private
var Playing_now_private = {};
var Opened_games_private = {};
var Playing_now_classic_private = {};
var Opened_games_classic_private = {};
//DUEL PRIVATE
var Playing_now_private_duel = {};
var Opened_games_private_duel = {};
var Playing_now_classic_private_duel = {};
var Opened_games_classic_private_duel = {};
//
var SocketbyName = {}; //для ограничений игр с 1 акка
var Players_name_by_socket_id = {}; //для отправки всех ников в комнату
console.log("working")
////
var bonuses = ["set_block", "destroy_block", "destroy_player_figure", "enemy_figure_transform", "mine"];
////
function Win_sequence(socket, xs, ys) {
    var Names = [];
    console.log("win DETECTED");
    socketio.in(socket.room).emit('win_detected', xs, ys, socket.id);
    let winner_index = socket.array_play[socket.room].names.indexOf(socket.id);
    var maxnumber = socket.array_play[socket.room].players
    for (var i = 0; i < maxnumber; i++) {
        if (i != winner_index) {
            Names.push(Players_name_by_socket_id[socket.array_play[socket.room].names[i]]);
        }
    }
    console.log(Names);
    var UsernamesOfLoosers = querystring.stringify({
        'usernames': JSON.stringify(Names),
        'mode': socket.mode + "_losses"
    });
    var UsernamesOfWinner = querystring.stringify({
        'username': socket.username,
        'mode': socket.mode + "_wins"
    });
    Send_Post_req(UsernamesOfLoosers, '/hujfhmatch_end');
    Send_Post_req(UsernamesOfWinner, '/hujfhplayer_winner_db');
    socketio.in(socket.room).emit('message_received', "Server", socket.username + " won the game");
    socket.array_play[socket.room] = undefined
}

function Move_transition(socket) {
    var Playing = socket.array_play
    Playing[socket.room].last_move_time = moment().format();
    let numberofturn = Playing[socket.room].names.indexOf(Playing[socket.room].Turn);
    if (numberofturn + 1 === Playing[socket.room].names.length) {
        Playing[socket.room].Turn = Playing[socket.room].names[0]
    } else {
        Playing[socket.room].Turn = Playing[socket.room].names[numberofturn + 1];
    }

}

function create_lobby(socket, Room, Opened) {
    var map;
        map = JSON.parse(JSON.stringify(Maps[randomInteger(0, Maps.length - 1)]));
    Opened[Room] = {
        players: 1,
        names: [socket.id],
        board: map,
        last_move_time: 0
    };
    socket.join(Room);
    socket.room = Room
    socket.emit('players_waiting', 1);
}

function join_lobby(socket, Room, Opened) {
    Opened[Room].players += 1;
    socket.join(Room);
    socketio.in(Room).emit('players_waiting', Opened[Room].players);
    Opened[Room].names.push(socket.id);
    socket.room = Room;
}

function run_lobby(socket, Room, Opened, Playing, lobbysize) {
    Opened[Room].players += 1;
    let Names = [];
    Opened[Room].names.push(socket.id);
    for (var i = 0; i < lobbysize; i++) {
        Names[i] = Players_name_by_socket_id[Opened[Room].names[i]];
    }
    Opened[Room].Turn = Opened[Room].names[Math.floor((Math.random() * lobbysize))];
    socket.join(Room);
    socketio.in(Room).emit('players_waiting', lobbysize);
    socketio.in(Room).emit('player_Names', Names);
    socketio.in(Room).emit("get_Players", Opened[Room].names);
    socketio.in(Room).emit("FirstTurn", Opened[Room].Turn);
    Playing[Room] = Object.assign({}, Opened[Room]);
    delete Opened[Room];
    socket.room = Room
    socketio.in(Room).emit("Map_Load", Playing[Room].board);
    Playing[Room].last_move_time = moment().format();
}
////////DDOS_PROTECTION
function check(socket) {
    socket.EPS += 1;
    if ((socket.EPS >= 150) && (!socket.banned)) {
        console.log(socket.handshake.address.substr(7) + " banned")
        socket.banned = true;
        socket.disconnect(true);
        exec("iptables -I INPUT -s " + socket.handshake.address.substr(7) + " -j DROP;");
    }
};
setInterval(function() {
    var x = Object.keys(socketio.sockets.connected).length;
    for (var i = 0; i < x; i++) {
        let x = socketio.sockets.connected[Object.keys(socketio.sockets.connected)[i]].EPS;
        if (x >= 0) {
            x -= 60;
        }
    }
}, 60000);
////////END_OF_DDOS_PROTECTION

function matchmaking(socket, lobbysize) {
    var Playing = socket.array_play
    var Opened = socket.array_open
    if (Object.keys(Opened).length > 0) {
        if (Opened[Object.keys(Opened)[0]].players < lobbysize - 1) {
            let Room = Object.keys(Opened)[0];
            join_lobby(socket, Room, Opened)
        } else if (Opened[Object.keys(Opened)[0]].players === lobbysize - 1) {
            let Room = Object.keys(Opened)[0];
            run_lobby(socket, Room, Opened, Playing, lobbysize)
        }
    } else {
        Gameid += 1;
        create_lobby(socket, Gameid, Opened);
    }

}

function private_matchmaking(socket, roomName, lobbysize) {
    var Playing = socket.array_play
    var Opened = socket.array_open
    console.log(Opened)
    if (Opened[roomName] !== undefined) {
        if (Opened[roomName].players < lobbysize - 1) {
            let Room = roomName;
            join_lobby(socket, Room, Opened)
        } else if (Opened[roomName].players === lobbysize - 1) {
            let Room = roomName;
            run_lobby(socket, Room, Opened, Playing, lobbysize)
        }
    } else {
        create_lobby(socket, roomName, Opened);
    }


}

 
//
function randomInteger(min, max) {
    return Math.floor(min + Math.random() * (max + 1 - min));
}
socketio.use(function(socket, next) { //CHANGE ERROR CODES
    cookieParser(socket.handshake, {}, function(err) {
        var cookie = "Auth=" + socket.handshake.cookies["Auth"]
        request({
            url: 'https://backend.4battle.ru:8080/check',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': "Auth=" + socket.handshake.cookies["Auth"]
            }
        }, function(error, response, body) {
            if (body == "0") {
                request({
                    method: 'POST',
                    url: 'https://backend.4battle.ru:8080/check_username',
                    form:{name:socket.handshake.query.guest_name}
                }, function(error, response, body) {
                    if ((body == "0")&&(SocketbyName[socket.handshake.query.guest_name]===undefined)) {
                        var name = socket.handshake.query.guest_name;
                        console.log(socket.handshake.query.guest_name)
                        console.log(socket.id)
                        SocketbyName[name] = socket.id;
                        Players_name_by_socket_id[socket.id] = name;
                        socket.username = name;
                        socket.guest=1;
                        next();
                    } else {
                        err = new Error('Username is used');
                        next(err);
                    }
                });
            } else {
                if (SocketbyName[body] === undefined || body == "Qwertyforce" || body == "Inject0r") { //change  to  production
                    var name = body;
                    console.log(socket.handshake.query)
                    console.log(socket.id)
                    SocketbyName[name] = socket.id;
                    Players_name_by_socket_id[socket.id] = name;
                    socket.username = name;
                    next();
                } else {
                    err = new Error('Already playing');
                    console.log('failed connection to socket.io: Already playing');
                    console.log(SocketbyName[body]);
                    next(err);
                }
            }
        });
    });
});
socketio.on('connection', function(socket) {
    socket.EPS = 0;
    socket.banned = false;
    socket.afk = 0;
    console.log("============CONNECTION");
    console.log(socket.handshake.address);
    socket.leave(socket.id);

    socket.on('send_message', function(msg) {
        check(socket);
        socketio.in(socket.room).emit('message_received', socket.username, msg);
    });

    socket.on('use_bonus', function(x, y, nameofbonus) {
        check(socket);
        var Playing = socket.array_play
        console.log(Playing[socket.room])
        if ((socket.room !== undefined) &&
            (Playing[socket.room] !== undefined) &&
            (socket.id === Playing[socket.room].Turn) &&
            (socket.bonus[nameofbonus] !== undefined) &&
            (socket.bonus[nameofbonus] > 0) &&
            (socket.bonus_available_for_this_turn > 0)
        ) {
            let succes = false;
            console.log("bonus used", nameofbonus);
            console.log(Playing[socket.room].board[x][y]);
            switch (nameofbonus) {
                case "set_block":
                    if (Playing[socket.room].board[x][y] === null) {
                        Playing[socket.room].board[x][y] = "Obstacle";
                        succes = true;
                    }
                    break;

                case "mine":
                    if (Playing[socket.room].board[x][y] === null) {
                        Playing[socket.room].board[x][y] = "Mine";
                        succes = true;
                    }
                    break;

                case "destroy_block":
                    if (Playing[socket.room].board[x][y] === "Obstacle") {
                        Playing[socket.room].board[x][y] = null;
                        succes = true;
                    }
                    break;
                case "destroy_player_figure":
                    if ((Playing[socket.room].board[x][y] !== null) &&
                        (Playing[socket.room].board[x][y] !== "Obstacle")
                    ) {
                        Playing[socket.room].board[x][y] = null;
                        succes = true;
                    }
                    break;
                case "enemy_figure_transform":
                    if ((Playing[socket.room].board[x][y] !== null) &&
                        (Playing[socket.room].board[x][y] !== "Obstacle") &&
                        (Playing[socket.room].board[x][y] !== socket.id)
                    ) {
                        Playing[socket.room].board[x][y] = socket.id;
                        succes = true;
                    }
                    break;
            }
            if (succes) {
                socket.bonus_available_for_this_turn -= 1;
                socket.bonus[nameofbonus] -= 1;
                if (nameofbonus === "mine") {
                    return;
                }
                socketio.in(socket.room).emit('bonus_used', nameofbonus, x, y, socket.id);
            }

        }
    });

    socket.on('disconnect', function() {
        check(socket);
        SocketbyName[socket.username] = undefined;
        console.log('Got disconnect!');
        if (socket.room === undefined) {
            return
        }
        var Playing = socket.array_play
        var Opened = socket.array_open
        socketio.in(socket.room).emit('message_received', "Server", socket.username + " disconnected");
        if (Playing[socket.room] !== undefined) {
            var UsernameofLooser = querystring.stringify({
                'usernames': '["' + socket.username + '"]'
            });
            Send_Post_req(UsernameofLooser, '/hujfhmatch_end');
            if (Playing[socket.room].Turn === socket.id) {
                Move_transition(socket);
                console.log("After_leave ", Playing[socket.room].Turn);
            }
            Playing[socket.room].names.splice(Playing[socket.room].names.indexOf(socket.id), 1);
            Playing[socket.room].players -= 1;
            if (Playing[socket.room].players === 0) {
                Playing[socket.room] = undefined;
                return;
            };
            socketio.in(socket.room).emit('player_left', socket.id);
        };
        if ((Opened[socket.room] !== undefined) && (Opened[socket.room].names.indexOf(socket.id) > -1)) {
            Opened[socket.room].names.splice(Opened[socket.room].names.indexOf(socket.id), 1);
            Opened[socket.room].players -= 1;
            socketio.in(socket.room).emit('players_waiting', Opened[socket.room].players);
        }
        socket.room = undefined;
    });
    socket.on('win_detected', function() {
        check(socket);
        var Playing = socket.array_play
        if (socket.room === undefined || Playing[socket.room] === undefined) {
            return
        }
        var room = socket.room;
        var r, g, h, won, xx, yy, xs, ys, ii;
        var lineLength = 7;
        if (socket.classic === 1) {
            lineLength = 5
        }
        var Lentgh = 21;

        main: for (var i = 0; i < Lentgh; i++) {
            for (var j = 0; j < Lentgh; j++) {
                for (var d = 0; d < 360; d = d + 45) {
                    r = d * Math.PI / 180
                    g = Math.round(Math.sin(r))
                    h = Math.round(Math.cos(r))
                    won = true;
                    xx = i
                    yy = j
                    xs = [];
                    ys = [];
                    for (ii = 0; ii <= (lineLength - 1); ii++) {
                        if (xx < 0 || xx >= Lentgh || yy < 0 || yy >= Lentgh) {
                            won = false;
                            break;
                        }
                        if (Playing[room].board[xx][yy] !== socket.id) {
                            won = false;
                            break;
                        }
                        xs.push(xx);
                        ys.push(yy);
                        xx += g
                        yy += h
                    }
                    if (won == true) {
                        Win_sequence(socket, xs, ys);
                        break main;
                    }
                }
            }
        }

    });



    socket.on('Make_Move', function(column, row) {
        check(socket);
        var Playing = socket.array_play
        if ((socket.room !== undefined) &&
            (Playing[socket.room] !== undefined) &&
            (Playing[socket.room].Turn === socket.id) &&
            (Number.isInteger(column) === true) &&
            (Number.isInteger(row) === true) &&
            (column >= 0) &&
            (column <= 20) &&
            (row >= 0) &&
            (row <= 20) &&
            (Playing[socket.room].board[column][row] !== undefined) &&
            ((Playing[socket.room].board[column][row] === null) || (Playing[socket.room].board[column][row] === "Mine"))) {
            if (socket.classic != 1) {
                socket.bonus_available_for_this_turn = 2;
            }
            if (Playing[socket.room].board[column][row] === "Mine") {
                console.log("MINE")
                socketio.in(socket.room).emit("Fake_on_move", column, row, socket.id);
                Playing[socket.room].board[column][row] = null;
                Move_transition(socket);
                socketio.in(socket.room).emit('message_received', "Server", socket.username + " vzorvan na mine");
                return
            }
            Playing[socket.room].board[column][row] = socket.id;
            console.log(socket.id + "Made a move at " + column + " " + row); //numberofturn=индекс ходящего в массиве игрков
            Move_transition(socket)
            socketio.in(socket.room).emit("On_move", column, row, socket.id);

        }

    });
    socket.on('MoveTimeUp', function() {
        check(socket);
        var Playing = socket.array_play
        if ((socket.room !== undefined) &&
            (Playing[socket.room] !== undefined)) {
            var Turn = Playing[socket.room].Turn
            if (moment().diff(Playing[socket.room].last_move_time, 'milliseconds') >= 45000) {
                console.log(socketio.sockets.connected[Turn].afk)
                if (socketio.sockets.connected[Turn].afk === 1) {
                    socketio.sockets.connected[Turn].disconnect(true)
                    return
                }
                socketio.sockets.connected[Turn].afk += 1;
                Move_transition(socket);
                socketio.in(socket.room).emit("PlayerTimeUp");

            }

        }

    });

    socket.on('GetBonus', function() {
        check(socket);
        var Playing = socket.array_play
        if (socket.classic === 1 || socket.room === undefined || Playing[socket.room] === undefined) {
            return
        }
        var room = socket.room;
        var temporaryusedbonus = {}
        var r, g, h, won, xx, yy, xs, ys, ii;
        var lineLength = 3;
        var Lentgh = 21;

        main: for (var i = 0; i < Lentgh; i++) {
            for (var j = 0; j < Lentgh; j++) {
                for (var d = 0; d < 360; d = d + 45) {
                    r = d * Math.PI / 180
                    g = Math.round(Math.sin(r))
                    h = Math.round(Math.cos(r))
                    won = true;
                    xx = i
                    yy = j
                    xs = [];
                    ys = [];
                    for (ii = 0; ii <= (lineLength - 1); ii++) {
                        if (xx < 0 || xx >= Lentgh || yy < 0 || yy >= Lentgh) {
                            won = false;
                            break;
                        }
                        if (Playing[room].board[xx][yy] !== socket.id || socket.UsedForBonus[xx.toString() + yy.toString()] == 1) {
                            won = false;
                            break;
                        }
                        temporaryusedbonus[xx.toString() + yy.toString()] = 1;
                        xs.push(xx);
                        ys.push(yy);
                        xx += g
                        yy += h
                    }
                    if (won == true) {
                        socket.UsedForBonus = Object.assign(socket.UsedForBonus, temporaryusedbonus);
                        console.log("Bonus Activated");
                        var randombonus = bonuses[randomInteger(0, bonuses.length - 1)]
                        if (socket.bonus[randombonus] == undefined) {
                            socket.bonus[randombonus] = 1;
                        } else {
                            socket.bonus[randombonus] += 1;
                        }
                        socket.emit("get_bonus", randombonus);
                        //console.log(Playing[room].UsedForBonus);
                        socketio.in(room).emit('message_received', "Server", socket.username + " got " + randombonus + " bonus for 3 in a row");
                        break main;
                    }
                }
            }
        }
    });



    socket.on('matchmaking', function(duel) {
        check(socket);
        socket.UsedForBonus = {}
        socket.bonus_available_for_this_turn = 2;
        socket.bonus = {}
        var randombonus = bonuses[randomInteger(0, bonuses.length - 1)]
        socket.bonus[randombonus] = 1;
        socket.emit("get_bonus", randombonus);
        socket.array_play = Playing_now
        socket.array_open = Opened_games
        var lobbysize = 4;
        socket.mode = "m_modern"
        if (duel == 1) {
            socket.array_play = Playing_now_duel
            socket.array_open = Opened_games_duel
            lobbysize = 2
            socket.mode = "m_modern_pvp"
        }
        matchmaking(socket, lobbysize)

    });
    socket.on('matchmaking_classic', function(duel) {
        check(socket);
        socket.classic = 1;
        socket.mode = "m_classic"
        socket.array_play = Playing_now_classic
        socket.array_open = Opened_games_classic
        var lobbysize = 4;
        if (duel == 1) {
            socket.array_play = Playing_now_classic_duel
            socket.array_open = Opened_games_classic_duel
            lobbysize = 2;
            socket.mode = "m_classic_pvp"
        }
        matchmaking(socket, lobbysize)
    });
    socket.on('private_matchmaking_classic', function(roomName, duel) {
        check(socket);
        if ((duel == 1) && (Playing_now_classic_private_duel[roomName] !== undefined)) {
            console.log("hijacking detected")
            return
        }
        if ((duel == 0) && (Playing_now_classic_private[roomName] !== undefined)) {
            console.log("hijacking detected")
            return
        }
        socket.classic = 1;
        socket.mode = "p_classic"
        socket.array_play = Playing_now_classic_private
        socket.array_open = Opened_games_classic_private
        var lobbysize = 4;
        if (duel == 1) {
            socket.array_play = Playing_now_classic_private_duel
            socket.array_open = Opened_games_classic_private_duel
            lobbysize = 2;
            socket.mode = "p_classic_pvp"
        }
        private_matchmaking(socket, roomName + socket.mode, lobbysize)
    });
    socket.on('private_matchmaking', function(roomName, duel) {
        check(socket);
        if ((duel == 1) && (Playing_now_private_duel[roomName] !== undefined)) {
            console.log("hijacking detected")
            return
        }
        if ((duel == 0) && (Playing_now_private[roomName] !== undefined)) {
            console.log("hijacking detected")
            return
        }
        socket.mode = "p_modern"
        socket.UsedForBonus = {}
        socket.bonus_available_for_this_turn = 2;
        socket.bonus = {}
        var randombonus = bonuses[randomInteger(0, bonuses.length - 1)]
        socket.bonus[randombonus] = 1;
        socket.emit("get_bonus", randombonus);
        socket.array_play = Playing_now_private
        socket.array_open = Opened_games_private
        var lobbysize = 4;
        if (duel == 1) {
            socket.array_play = Playing_now_private_duel
            socket.array_open = Opened_games_private_duel
            lobbysize = 2;
            socket.mode = "p_modern_pvp"
        }
        private_matchmaking(socket, roomName + socket.mode, lobbysize)
    });
