<?php

$userInput = "I have an AI, technology company. We are interested in ecology. 
              What specific grants can I apply for? 
              List the grants: give only their names.";
$sanitizedInput = escapeshellarg($userInput);
$sanitizedInput = preg_replace("/[^a-zA-Z0-9]/", "", $sanitizedInput);

exec("node ./langchain.js {$sanitizedInput}", $output, $return);
echo implode(' ',$output);