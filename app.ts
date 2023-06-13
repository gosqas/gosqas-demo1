import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index', { title: 'Express GOSQAS Provenence Tracker' });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});