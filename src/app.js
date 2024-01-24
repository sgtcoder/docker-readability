// echo "" > /root/dockers/readability/app.js && nano /root/dockers/readability/app.js && restart_readability

// Ensure console.log spits out timestamps
require("log-timestamp");

// Express
const app = require("express")();
const bodyParser = require("body-parser").json({ limit: "20mb" });
const port = 3000;

// HTTP client
const axios = require("axios").default;

// Readability, dom and dom purify
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const createDOMPurify = require("dompurify");
const DOMPurify = createDOMPurify(new JSDOM("").window);

// Attributes to Whitelist
const WHITELISTED_ATTR = [
  "content",
  "datetime",
  "itemprop",
  "property",
  "type",
  "time",
];

// Tags to Whitelist
const WHITELISTED_TAGS = ["iframe", "video", "meta"];

const domPurifyOptions = {
  ADD_ATTR: WHITELISTED_ATTR,
  ADD_TAGS: WHITELISTED_TAGS,
  WHOLE_DOCUMENT: true,
  SANITIZE_DOM: false,
};

app.get("/", (req, res) => {
  return res.status(400).send({
    error: 'POST (not GET) JSON, like so: {"url": "https://url/to/whatever"}',
  }).end;
});

app.post("/", bodyParser, (req, res) => {
  const url = req.body.url;
  const html = req.body.html;
  const sanitize_html = req.body.sanitize_html;
  var sanitized;

  // Check if URL is set
  if (url === undefined || url === "") {
    return res
      .status(400)
      .send({
        error: 'Send JSON, like so: {"url": "https://url/to/whatever"}',
      })
      .end();
  }

  if (html) {
    if (sanitize_html !== false) {
      sanitized = DOMPurify.sanitize(html, domPurifyOptions);
    } else {
      sanitized = html;
    }

    const dom = new JSDOM(sanitized, {
      url: url,
    });

    const parsed = new Readability(dom.window.document).parse();

    console.log("Fetched and parsed html successfully");

    return res
      .status(200)
      .send({
        url,
        ...parsed,
      })
      .end();
  }

  console.log("Fetching " + url + "...");

  axios
    .get(url)
    .then((response) => {
      if (sanitize_html !== false) {
        sanitized = DOMPurify.sanitize(response.data, domPurifyOptions);
      } else {
        sanitized = response.data;
      }

      const dom = new JSDOM(sanitized, {
        url: url,
      });

      const parsed = new Readability(dom.window.document).parse();

      console.log("Fetched and parsed " + url + " successfully");

      return res
        .status(200)
        .send({
          url,
          ...parsed,
        })
        .end();
    })
    .catch((error) => {
      return res
        .status(500)
        .send({
          error: "Some weird error fetching the content",
          details: error,
        })
        .end();
    });
});

// Start server and dump current server version
const version = require("fs")
  .readFileSync("./release")
  .toString()
  .split(" ")[0];

app.listen(port, () =>
  console.log(`Readability.js server v${version} listening on port ${port}!`),
);
