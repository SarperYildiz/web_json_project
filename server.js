const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');

// Starter Code Setup
const SPREADSHEET_ID = "1lHqY4DJW-z7XX2nDOsTTaV9c6Moo4lcWLwngrMF_oS8"

// Set up authentication
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'keys.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Create a new instance of the Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Create Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static pages on the base URL, on the root path
app.use(express.static('public'));

app.get('/', function(req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.sendFile('index.html');
});

// Handle GET requests on "/api"
async function onGet(req, res) {
    try {
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A2:B',
        });

        const rows = result.data.values;
        const data = rows.map(row => {
            return {
                name: row[0],
                email: row[1],
            };
        });

        res.json({ data });
    } catch (err) {
        console.error(err);
        res.status(500).send('Google API Server error on GET');
    }
}

app.get('/api', onGet)


// Handle POST requests
async function onPost(req, res) {
    try {
        const rowValues = Object.values(req.body);
        const result = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [rowValues]
            }
        });
        console.log(result);
        res.json({ status: 'Row added to the sheet' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Google API Server error on POST');
    }
}

app.post('/api', onPost);

// Handle PUT requests
async function onPut(req, res) {

    res.status(501).json({ status: "Update (PUT) not implemented!!!" })
}

app.put('/api', onPut);

// Handle DELETE requests
async function onDelete(req, res) {
    try {
        const { name } = req.params;

        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `Sheet1!A:B`,
        });

        const rows = result.data.values;
        const rowIndex = rows.findIndex(row => row[0] === name);

        if (rowIndex === -1) {
            res.send(`No rows found with name ${name}`);
            return;
        }

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Sheet1!A${rowIndex+1}:B${rowIndex+1}`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [
                    ['', '']
                ]
            },

        });

        res.send(`Row with name ${name} deleted`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Google API Server error on DELETE');
    }
}

app.delete('/api/name/:name', onDelete);

const port = process.env.PORT || 3000;
const ip = "localhost";
app.listen(port, ip, () => {
    console.log(`Server running at http://${ip}:${port}`);
});