require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const urlparser = require("url");
const dns = require("dns");
const app = express();

// Basic Configuration
const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

let idCounter = 1;
const mapUrl = {};

//check if URL is valid
// const isValidUrl = (url) => {
//   try {
//     const validProtocols = ["http:", "https:"];
//     const urlObject = new URL(url); // This will throw if the URL is invalid

//     return validProtocols.includes(urlObject.protocol);
//   } catch (error) {
//     return false;
//   }
// };

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
  console.log(req.body);

  const orgURL = req.body.url;
  console.log(orgURL);
  const dnslookup = dns.lookup(
    urlparser.parse(orgURL).hostname,
    (err, address) => {
      if (!address) {
        res.json({ error: "invalid url" });
      } else {
        const shortUrlId = idCounter++;
        mapUrl[shortUrlId] = orgURL;
        res.json({ original_url: orgURL, short_url: shortUrlId });
      }
    }
  );
});

app.get("/api/shorturl/:url", (req, res) => {
  const inputShortUrl = parseInt(req.params.url);
  const foundUrl = mapUrl[inputShortUrl];
  console.log("db: ", mapUrl);

  res.redirect(foundUrl);
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
