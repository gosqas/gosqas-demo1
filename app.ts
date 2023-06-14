import dotenv from 'dotenv';

import { Sequelize } from 'sequelize';
import { createSequelizeRepository } from './services';
import { createExpressApp } from './server';

dotenv.config();
const port = process.env.PORT || 3000;

async function main() {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './database.sqlite'
    })
    
    const repo = await createSequelizeRepository(sequelize);
    const app = createExpressApp(repo);

    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
    });
}

main();
