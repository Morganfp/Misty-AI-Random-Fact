/*
This program uses Puppeteerscrapes data from a website containing a fact about each US state, stores the data, and passes a random one of those facts
to the Misty robot using Google text-to-speak API
randFact stores 1 fact selected at random from all the facts
*/


// Pull in the Puppeteer package used to automate a web search
const puppeteer = require('puppeteer')

// Pull in node tool to allow saving to a txt file
// This llows us to use the file system module in nodejs which allows reading, writing, etc of files
const fs = require('fs/promises')

// Global var to store the random fact
var randFact;



// A function to send text to the Google text-to-speak API
function speakTheText(text) {
    var arguments = JSON.stringify({
        'input': {
            'text': text
        },
        // Choose a language and gender
        'voice': {
            'languageCode': "en-US",
            'ssmlGender': "FEMALE"
        },
        // Specify audio encoding and audio settings
        'audioConfig': {
            'audioEncoding': "LINEAR16",

            "effectsProfileId": [
                "small-bluetooth-speaker-class-device"
            ],
            "pitch": 0.7,
            "speakingRate": 0.91
        }
    });

    // Send an external request to google text to sound api
    misty.SendExternalRequest("POST", "https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=" + _params.APIKEY_Google, null, null, arguments, false, false, null, "application/json", "_Base64In");
}



// Event callback function for when a response is received from an external request
function _Base64In(data) 
{
        misty.SaveAudio("TTS.wav", JSON.parse(data.Result.ResponseObject.Data).audioContent, true, true);
    
}



// Register a user event called "speakTheText"
misty.RegisterUserEvent("speakTheText", true);



// Event callback function for when the "speakTheText" user event is triggered
function _speakTheText(data) 
{
        // Pass the "text" property from the data object as an argument for the speakTheText function
        speakTheText(data.text);
}



// Select a random fact from the facts.txt file and pass it as an argument for the "speakTheText" user event
function getFact()
{
    // Print all txt file contents
    // fsRead.readFile('facts.txt', 'utf8', (err, data) => {
    //     if(err)
    //     {
    //         console.error(err);
    //         return;
    //     }
    //     console.log(data);
    // });

    // Store txt file into an array line by line
    var fs = require('fs');
    fs.readFile('facts.txt', function(err, data)
    {
        // Check for errors
        if(err) throw err;

        // Store each line in an array
        var factArray = data.toString().split("\n");

        // Generate random number from 0 to 49
        var randNum = Math.floor(Math.random() * 50);

        // Store a random fact in the randFact variable
        var randFact = factArray[randNum];

        // Pass the random fact as an argument for misty speakTheText
        speakTheText(randFact);
    });

}



// Main function to automate a web search retreive data to store in a .txt file
// Most functions in puppeteer are asynchronous (unknown amount of time to complete)
// need to await the functions before moving onto something else using the await syntax
// can only use await inside an asynch function
async function main()
{
    // Launch browser
    // headless = false means we see the automation, headless = true means we don't (done in background)
    const browser = await puppeteer.launch( {headless: false} )

    // Create a new tab/page in the browser
    const page = await browser.newPage()

    // Navigate to a specific URL
    await page.goto("https://www.insider.com/one-weird-fact-about-every-state-2017-9")

    // Write a selector to save text to array
    // Pass an arrow function as the argument for page.evaluate
    const facts = await page.evaluate(() => 
    {
        // Return the text of class "slide-title-text" to the facts array
        // Use Array.from to change the returned node list of elements to an aray to just view the text content
        // x is the current "slide-title-text" class element we've looped to. Return x.textContent
        return Array.from(document.querySelectorAll(".slide-title-text")).map(x => x.textContent)
    })

    // Create and write the facts data to a file, facts.txt
    await fs.writeFile("facts.txt", facts.join("\r\n"))

    // Close the browser
    await browser.close()

    // Call the getFact function to select a random fact from the facts.txt file
    getFact();
}



main();
