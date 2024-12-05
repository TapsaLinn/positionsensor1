import React, { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import Header from "/Header";
import Footer from "/Footer";

function App() {
  const [chartData, setChartData] = useState([["Date", "Liters"]]);
  const [temperature, setTemperature] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState("");

  const fetchData = async () => {
    try {
      const response = await fetch(
        "https://kohoankka2.azurewebsites.net/litrat"
      );
      const latestData = await response.json();
      const transformedData = [
        ["CreatedAt", "Litra"],
        ...latestData.map((item) => [new Date(item.CreatedAt), item.Litra]),
      ];

      setChartData(transformedData);
    } catch (error) {
      console.error("Virhe datan haussa:", error);
    }
  };

  const fetchTemperature = async () => {
    try {
      const response = await fetch("https://kohoankka2.azurewebsites.net/temp");
      if (!response.ok) {
        throw new Error(`Virhe palvelimen vastauksessa: ${response.status}`);
      }
      const data = await response.json();

      if (data.length > 0 && data[0].Temperature !== undefined) {
        const roundedTemperature = parseFloat(data[0].Temperature).toFixed(2);
        setTemperature(roundedTemperature);
        setLastUpdated(new Date()); // Päivitetään viimeisin lukuaika
        setStatus(""); // Tyhjennetään mahdollinen virheviesti
      } else {
        console.error("Data ei sisältänyt odotettua Temperature-arvoa");
        setTemperature(null);
        setStatus("Anturi offline");
      }
    } catch (error) {
      console.error("Virhe haettaessa lämpötilaa:", error);
      setTemperature(null);
      setStatus("Anturi offline");
    }
  };

  useEffect(() => {
    fetchData();
    const dataInterval = setInterval(() => {
      fetchData();
    }, 1000);
    return () => {
      clearInterval(dataInterval);
    };
  }, []);

  // Tarkistetaan, onko anturi ollut offline 15 minuutin ajan
  useEffect(() => {
    if (lastUpdated) {
      const checkInterval = setInterval(() => {
        const now = new Date();
        const diff = (now - lastUpdated) / (1000 * 60); // Erotus minuuteissa
        if (diff > 15) {
          setStatus("Anturi offline");
        }
      }, 1000);
      return () => {
        clearInterval(checkInterval);
      };
    }
  }, [lastUpdated]);

  const [liters, setLiters] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const value = e.target.value;

    if (/^\d*\.?\d*$/.test(value)) {
      setLiters(value);
      setError("");
    } else {
      setError("Syötä desimaaliluku!");
    }
  };

  const handleSubmit = async () => {
    if (!liters || isNaN(parseFloat(liters))) {
      setError("Syötä desimaaliluku!");
      return;
    }

    const data = { maxLiters: parseFloat(liters) };

    try {
      const response = await fetch(
        "https://kohoankka2.azurewebsites.net/post_max",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      console.log("Palvelimen vastaus:", result);
    } catch (error) {
      console.error("Virhe lähetyksessä:", error);
    }
  };

  const options = {
    title: "",
    curveType: "function",
    legend: { position: "bottom" },
    hAxis: {
      title: "Päivä ja aika",
      format: "EEE HH:mm:ss",
      gridlines: { count: 5 },
    },
    vAxis: {
      title: "Määrä litroissa",
    },
  };

  return (
    <>
      <Header />
      <main>
        <div className="main">
          <div className="chart">
            <Chart
              chartType="LineChart"
              width="800px"
              height="400px"
              data={chartData}
              options={options}
            />
            <div className="napit">
              <div className="lämpötila-osio">
                {status && <div style={{ color: "red" }}>{status}</div>}
                {temperature !== null && (
                  <div className="lämpö-display">
                    Veden lämpötila: {temperature} °C
                  </div>
                )}
                <button onClick={fetchTemperature}>Hae veden lämpötila</button>
              </div>
              <div className="litrat">
                <div className="inputti">
                  <input
                    type="number"
                    step="0.1"
                    id="litersInput"
                    placeholder="Aseta max. litramäärä"
                    value={liters}
                    onChange={handleInputChange}
                  />
                </div>
                <button onClick={handleSubmit}>Lähetä</button>{" "}
                {error && <div style={{ color: "red" }}>{error}</div>}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default App;
