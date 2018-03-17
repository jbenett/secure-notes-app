function register_routes(app) {
    // When somebody goes to ourdomain.com/, reply with "Hello world"
    app.get('/', (req, res) => {
        // Add "controller code" inside here
        res.send('Hello World!');
    });

    app.post('/cat', (req, res) => {
        // When somebody posts data to ourdomain.com/cat, do the following:
        // Nada
    });
}


module.exports = register_routes;
