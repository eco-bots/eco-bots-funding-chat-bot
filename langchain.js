const fs = require('fs');
const af = require('./auxiliary-functions.js');

const { ChatOpenAI } = require('langchain/chat_models/openai');
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');

const { CSVLoader } = require ('langchain/document_loaders/fs/csv');
const { Document } = require("langchain/document");
const { TextLoader } = require ('langchain/document_loaders/fs/text');
const { DirectoryLoader } = require('langchain/document_loaders/fs/directory');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

const { BufferMemory } = require('langchain/memory');
const { FaissStore } = require('langchain/vectorstores/faiss');
const { ConversationalRetrievalQAChain } = require('langchain/chains');

function extractKeywords(userInput, chat){
    const query = 'From the statement: /"' +  userInput + `/", extract the adjectives that describe the company.
                                                          Return only the keywords themselves separated by commas.`;
    return chat.predict(query);
}

async function main(){
    const apiKey = fs.readFileSync('./api_key.txt', 'utf-8');
    const chat = new ChatOpenAI({modelName: "gpt-3.5-turbo", openAIApiKey: apiKey});
    const userInput = `I have an ai, technology, software, blockchain company. What eu grants can we potentially apply for? List the grants: give only their names, their descriptions and their urls.`;
    // const [, , userInput] = process.argv;

    const keywords = await extractKeywords(userInput, chat);
    const allGrantsThatMatchKeywords = await af.extractGrantsThatMatchKeywords(keywords);

    const docs = allGrantsThatMatchKeywords.map(grant => {
        // Convert the grant object to a string representation
        let pageContent = Object.entries(grant).map(([key, value]) => `${key}: ${value}`).join(', ');
    
        return new Document({ pageContent: pageContent });
    });

    const docsReduced = docs.slice(0,30);
 
    const splitter = new RecursiveCharacterTextSplitter(chunkSize=1000, chunkOverlap=200);
    const chunks = await splitter.splitDocuments(docsReduced);

    const embeddings = new OpenAIEmbeddings({openAIApiKey: apiKey});
    const vectorStore = await FaissStore.fromDocuments(
        chunks,
        embeddings,
    );

    const vectorStoreRetriever = vectorStore.asRetriever();
    const memory = new BufferMemory({memoryKey: "chat_history",});

    const chain = ConversationalRetrievalQAChain.fromLLM(
        chat,
        vectorStoreRetriever,
        { memory }
    );

    const res = await chain.call({ question: userInput });
    console.log(res['text']);
}

main();