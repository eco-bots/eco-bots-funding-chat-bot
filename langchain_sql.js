const fs = require('fs');
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { DataSource } = require("typeorm");
const { SqlDatabase } = require("langchain/sql_db");
const { SqlDatabaseChain } = require("langchain/chains/sql_db");

async function main(){
    const apiKey = fs.readFileSync('./api_key.txt', 'utf-8');

    const datasource = new DataSource({
        type: "sqlite",
        database: "wikibooks.sqlite",
    });

    const db = await SqlDatabase.fromDataSourceParams({
        appDataSource: datasource,
        includesTables: ["en"],
    });

    const chain = new SqlDatabaseChain({
        llm: new ChatOpenAI({ modelName: "gpt-3.5-turbo-16k", temperature: 0, openAIApiKey: apiKey }),
        database: db,
    });

    const res = await chain.run("Tell me the titles of books that mention war");
    console.log(res);
}

main();