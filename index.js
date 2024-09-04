require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const urlparser = require("url");
const dns = require("dns");
const mongoose = require("mongoose");
const app = express();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

const createAndSaveUrl = (url, done) => {
  // Find the highest short_url in the database
  Url.findOne()
    .sort({ short_url: -1 })
    .exec((err, result) => {
      const newShortUrl = result ? result.short_url + 1 : 1;
      const newUrl = new Url({
        original_url: url,
        short_url: newShortUrl,
      });
      newUrl.save((err, savedUrl) => {
        if (err) return done(err);
        done(null, savedUrl);
      });
    });
};

// Basic Configuration
const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/public", express.static(`${process.cwd()}/public`));

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
        Url.findOne({ original_url: orgURL }).exec((err, existingUrl) => {
          if (existingUrl) {
            return res.json({
              original_url: existingUrl.original_url,
              short_url: existingUrl.short_url,
            });
          }
          createAndSaveUrl(orgURL, (err, savedUrl) => {
            if (err) return res.json({ error: "Error saving URL" });
            res.json({
              original_url: savedUrl.original_url,
              short_url: savedUrl.short_url,
            });
          });
        });
      }
    }
  );
});

app.get("/api/shorturl/:id", (req, res) => {
  const inputShortUrl = parseInt(req.params.id);

  Url.findOne({ short_url: inputShortUrl }, (err, foundUrl) => {
    if (err || !foundUrl) {
      return res.json({ error: "No short URL found for the given input" });
    }
    res.redirect(foundUrl.original_url);
  });
});
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
