import express from 'express';
import dotenv from 'dotenv';
import { urlencoded } from 'body-parser';

import { router as devicesRouter } from './routes/devices';
import { Sequelize } from 'sequelize';
import { init } from './models';

dotenv.config();

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
})

init(sequelize);

const port = process.env.PORT || 3000;

const app = express();
app.set('view engine', 'ejs');
app.set('sequelize', sequelize);
app.use(urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.render('index', { title: 'Express GOSQAS Provenence Tracker' });
});

app.use('/devices', devicesRouter);

async function main() {
    await sequelize.sync();
    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
    });
}

main();