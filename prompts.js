const { PromptTemplate } =  require('langchain/prompts');

export const getKeywordsPrompt = PromptTemplate.fromTemplate(
    `From the statement: "{userInput}" extract the adjectives that describe
     the company. Return only the keywords themselves separated by commas.`
);

export const expandKeywordsPrompt = PromptTemplate.fromTemplate(
    `Expand this set of keywords: "{keywords}" to include other keywords
     that are similar in meaning to the ones provided. Return only the 
     keywords themselves separated by commas.`
);