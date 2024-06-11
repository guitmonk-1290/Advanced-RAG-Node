const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3010;

// Configure middlewares
app.use(bodyParser.json());
app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).send('Something went wrong! PLease try again.')
})
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Or specify the allowed origin
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.set('view engine', 'ejs');

app.post("/get_tables", async (req, res) => {
    const userInput = req.body.message
    try {
        const data = await fetch("http://127.0.0.1:5000/tables", {
            method: "POST",
            body: JSON.stringify({ inputText: userInput }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        const tables = await data.json()
        return res.status(200).send({ "tables": tables })
    }
    catch(error) {
        return res.status(500).send({ error: 'Internal Server Error: ' + error })
    }
})

app.post("/get_response", async (req, res) => {
    const choosen_tables = req.body.tables
    const userInput = req.body.message
    try {
        // get response from the LLM
        const response = await fetch("http://127.0.0.1:5000/response", {
            method: "POST",
            body: JSON.stringify({
                "inputText": userInput,
                "choose_tables": choosen_tables
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        response = await response.json()
        return res.status(200).send({
            "SQL": response.SQL,
            "Response": response.response
        })
    }
    catch(error) {
        return res.status(500).send({ error: 'Internal Server Error: ' + error })
    }
})

app.post("/bot", async (req, res) => {
    console.log('req: ', req);
    const userInput = req.body.message;

    try {
        const response = await fetch("http://127.0.0.1:5000/process-text", {
            method: 'POST',
            body: JSON.stringify({ inputText: userInput }),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (response.ok) {
            // response.response = response.response.split(": ", 1)[1].strip()
            const data = await response.json();
            console.log("RCVD DATA: ", data);
            res.send(data);
        } else {
            // Handle the case when the response is not OK (e.g., error handling)
            console.error('Failed to fetch data:', response.status);
            res.status(response.status).send({ error: 'Failed to fetch data' });
        }
    } catch (error) {
        console.error("[ERROR] POST /bot -> ", error)
        return res.status(500).send({ error: "Internal Server Error" })
    }
})


// Optional - Displaying the detailed result
app.get("/data", (req, res) => {
    const encodedArray = req.data;
    const decodedArray = JSON.parse(decodeURIComponent(encodedArray));
    console.log("decodedArray: ", decodedArray);
    res.render('data_table', {decodedArray});
})


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})