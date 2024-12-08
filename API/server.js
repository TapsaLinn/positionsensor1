const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const sql = require("mssql");

const allowedOrigins = [
  "https://purple-pebble-00c5e1a03.4.azurestaticapps.net",
  "kohoankka2.azurewebsites.net",
  "https://zealous-stone-036c08d03.4.azurestaticapps.net",
];

const config = {
  user: process.env.user,
  password: process.env.password,
  server: process.env.host,
  database: process.env.database,
  options: {
    encrypt: true,
    enableArithAbort: true,
  },
};

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
};

app.use(cors(corsOptions));

sql.connect(config, (err) => {
  if (err) {
    console.error("Virhe yhdistettäessä SQL serveriin:", err);
    return;
  }
});

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Morjes!");
});

app.get("/litrat", (req, res) => {
  const request = new sql.Request();
  request.query(
    "SELECT TOP 20 CONVERT(VARCHAR(33), CreatedAt, 126) AS CreatedAt, Litra FROM Litra ORDER BY CreatedAt DESC;",
    (err, result) => {
      if (err) {
        console.error("Virhe kyselyn suorittamisessa:", err);
        res.status(500).send("Serveri virhe");
        return;
      }
      res.json(result.recordset);
    }
  );
});

app.post("/post_litrat", (req, res) => {
  const { Litra } = req.body;
  const request = new sql.Request();
  request.input("LitraValue", sql.Float, Litra);
  request.query(
    "INSERT INTO Litra (Litra) VALUES (@LitraValue)",
    (err, result) => {
      if (err) {
        console.error("Virhe kyselyn suorittamisessa:", err);
        res.status(500).send("Serveri virhe");
        return;
      }
      res.json({ ID: result.insertId, Litra });
    }
  );
});

app.get("/temp", (req, res) => {
  const request = new sql.Request();
  request.query(
    "SELECT TOP 1 Temperature FROM TemperatureData ORDER BY CreatedAt DESC;",
    (err, result) => {
      if (err) {
        console.error("Virhe kyselyn suorittamisessa:", err);
        res.status(500).send("Serveri virhe");
        return;
      }
      if (result.recordset.length === 0) {
        res.status(404).send("Ei lämpötilatietoja saatavilla.");
      } else {
        res.json(result.recordset);
      }
    }
  );
});

app.post("/post_temp", (req, res) => {
  const { temperature } = req.body;

  if (typeof temperature !== "number" || isNaN(temperature)) {
    return res.status(400).send("Virheellinen lämpötila");
  }

  const request = new sql.Request();
  request.input("Temperature", sql.Float, temperature);
  request.query(
    "INSERT INTO TemperatureData (Temperature) VALUES (@Temperature);",
    (err, result) => {
      if (err) {
        console.error("Virhe tallennettaessa lämpötilaa:", err);
        res.status(500).send("Virhe tallennettaessa lämpötilaa");
        return;
      }
      res.status(201).json({ message: "Lämpötila tallennettu", temperature });
    }
  );
});

app.get("/get_max", async (req, res) => {
  try {
    const request = new sql.Request();
    const result = await request.query(
      "SELECT TOP 1 MaxLitersValue FROM MaxLiters ORDER BY CreatedAt DESC;"
    );

    if (result.recordset.length === 0) {
      res.status(404).send("MaxLiters-arvoa ei löytynyt.");
      return;
    }

    res.json({ maxLiters: result.recordset[0].MaxLitersValue });
  } catch (err) {
    console.error("Virhe kyselyn suorittamisessa:", err.message, err.stack);
    res.status(500).send("Serveri virhe");
  }
});

app.post("/post_max", async (req, res) => {
  const { maxLiters } = req.body;

  if (typeof maxLiters !== "number" || maxLiters <= 0) {
    res.status(400).send("Virheellinen maxLiters-arvo.");
    return;
  }

  try {
    const request = new sql.Request();
    request.input("MaxLitersValue", sql.Float, maxLiters);
    const result = await request.query(
      "INSERT INTO MaxLiters (MaxLitersValue) VALUES (@MaxLitersValue);"
    );

    if (result.rowsAffected[0] === 0) {
      res.status(404).send("Päivitystä ei tehty. Kohde ei löytynyt.");
      return;
    }

    res.json({ success: true, maxLiters });
  } catch (err) {
    console.error("Virhe kyselyn suorittamisessa:", err.message, err.stack);
    res.status(500).send("Serveri virhe");
  }
});

app.listen(port, () => {
  console.log(`Serveri pyörii osoitteessa: http://localhost:${port}`);
});
