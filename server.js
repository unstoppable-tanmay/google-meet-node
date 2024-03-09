const { http } = require('./sig_server')

// Server Listen
http.listen(3000, () => {
    console.log('listening on *:3000');
});