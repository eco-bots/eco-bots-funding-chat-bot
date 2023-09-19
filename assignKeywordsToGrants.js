const fs = require('fs');
const { glob } = require('glob');
const openai = require("openai");
const csv = require('fast-csv');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function getKeywordsFromDescription (description, openAI) {
    const result = await openAI.chat.completions.create({
        messages: [{ role: 'user', content: 'Grant Description: ' + description + '/n' +
                                            'Based on the above description, what kind of companies are eligible to apply for this grant? Extract only 5 most relevant keywords.'}],
        model: 'gpt-3.5-turbo',
    });
    return result.choices[0]['message']['content'];
}

async function assignKeywordsToGrants (){
    const apiKey = fs.readFileSync('./api_key.txt', 'utf-8').trim();
    const openAI = new openai({
        apiKey: apiKey,
    });

    const fileList = await glob('./generalData/at/*.csv');
    for (const file of fileList) {
        const data = [];
        fs.createReadStream(file)
        .pipe(csv.parse({ headers: true }))
        .on('error', (error) => console.error(error))
        .on('data', (row) => data.push(row))
        .on('end', async () => {
            const keywords = await Promise.all(
                data.map(async (row) => {
                    const descriptionValue = row['description'];
                    return await getKeywordsFromDescription(descriptionValue, openAI);
                })
            );

            for (let i = 0; i < data.length; i++) {
                data[i].keywords = keywords[i];
            }
    
            const csvWriter = createCsvWriter({
                path: 'output.csv',
                header: [
                    ...Object.keys(data[0]).map(key => ({ id: key, title: key }))
                ]
            });
            
            csvWriter.writeRecords(data);
        });
    }
}

assignKeywordsToGrants();