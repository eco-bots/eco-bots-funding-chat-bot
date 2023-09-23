const fs = require('fs');

const { OpenAI } =  require('langchain/llms/openai');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { FaissStore } = require('langchain/vectorstores/faiss');

async function main(){
    const userInput = `I have an AI, technology company. We are interested in ecology.
        What specific grants can I apply for? 
        List the grants: give only their names.`;

    const apiKey = fs.readFileSync('./api_key.txt', 'utf-8');
    const llm = new OpenAI({openAIApiKey: apiKey});
    const vectorStore = await FaissStore.load(
        './',
        new OpenAIEmbeddings({openAIApiKey: apiKey})
    );

    
    const vectorStoreRetriever = vectorStore.asRetriever();


    const res = await chain.call({ question: userInput });
    console.log(res['text']);
}

main();