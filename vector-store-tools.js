const fs = require('fs');
const csv = require('csv-parser');

const { OpenAIEmbeddings } = require('langchain/embeddings/openai');
const { Document } = require("langchain/document");
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { FaissStore } = require('langchain/vectorstores/faiss');

async function readCSV(fileName) {
    const data = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(fileName)
        .pipe(csv())
        .on('data', (datum) => data.push(datum))
        .on('end', () => {
          resolve(data);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
}

export async function createVectorStore(fileName, apiKey) {
    const grantData = await readCSV(fileName);
    const columnsToEmbed = ['description', 'name'];
    const columnsToMetadata = ['opening_date', 'deadline', 'url', 'description', 'name'];

    const docs = grantData.map(grant => {
        const pageContent = columnsToEmbed.map(column => `${column}: ${grant[column]}`).join('\n');
        const metadata = columnsToMetadata.reduce((acc, column) => {
            acc[column] = grant[column];
            return acc;
        }, {});

        return new Document({ pageContent: pageContent, metadata: metadata });
    });

    const splitter = new RecursiveCharacterTextSplitter(chunkSize=500, chunkOverlap=0);
    const chunks = await splitter.splitDocuments(docs);

    const embeddings = new OpenAIEmbeddings({openAIApiKey: apiKey});
    const vectorStore = await FaissStore.fromDocuments(
        chunks,
        embeddings,
    );

    await vectorStore.save('./');
}