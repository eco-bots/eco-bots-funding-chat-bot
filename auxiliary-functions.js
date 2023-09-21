const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const openai = require("openai");
const csv = require('fast-csv');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function expandKeywordList (keywords, openAI) {
    const result = await openAI.chat.completions.create({
        messages: [{ role: 'user', content: 'A set of keywords: ' + keywords + '/n' +
                                            `Please expand the list of keywords to include other keywords
                                             that are similar in meaning to the ones provided. Return only
                                             the keywords themselves separated by commas.`}],
        model: 'gpt-3.5-turbo',
    });
    return result.choices[0]['message']['content'].split(', ');
}

function containsKeywords(keywords, value) {
    return keywords.some(keyword => value.includes(keyword));
}

async function extractGrantsThatMatchKeywords(keywords){
    const apiKey = fs.readFileSync('./api_key.txt', 'utf-8').trim();
    const openAI = new openai({
        apiKey: apiKey,
    });

    const expandedKeywords = await expandKeywordList(keywords, openAI);
    const fileList = await glob('./generalData/**/*.csv');
    for (const file of fileList) {
        const grantsThatMatchKeywords = [];
                
        const pathSegments = file.split(path.sep);
        const fileName = './grantsThatMatchKeywords/' + pathSegments[1] + '/' + pathSegments[2];
        const directory = path.dirname(fileName);
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
        }

        fs.createReadStream(file)
            .pipe(csv.parse({ headers: true, skipEmptyLines: true }))
            .on('data', (row) => {
                if (containsKeywords(expandedKeywords, row.description) ||
                    containsKeywords(expandedKeywords, row.name)) {
                        
                    grantsThatMatchKeywords.push(row);
                }
            })
            .on('end', () => {
                if (grantsThatMatchKeywords.length === 0) return;

                const csvWriter = createCsvWriter({
                    path: fileName,
                    header: [
                        ...Object.keys(grantsThatMatchKeywords[0]).map(key => ({ id: key, title: key }))
                    ]
                });
                
                csvWriter.writeRecords(grantsThatMatchKeywords);
            });
    };
}

module.exports = {
    extractGrantsThatMatchKeywords,
}