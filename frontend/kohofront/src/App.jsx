const fetchTemperature = async () => {
  if (lastUpdated) {
    const now = new Date();
    const diff = (now - lastUpdated) / (1000 * 60); // Erotus minuutteina
    if (diff > 15) {
      setStatus("Anturi offline");
      return;
    }
  }

  try {
    const response = await fetch("https://kohoankka2.azurewebsites.net/temp");
    if (!response.ok) {
      throw new Error(`Virhe palvelimen vastauksessa: ${response.status}`);
    }
    const data = await response.json();

    if (data.length > 0 && data[0].Temperature !== undefined) {
      const roundedTemperature = parseFloat(data[0].Temperature).toFixed(2);
      setTemperature(roundedTemperature);
      setLastUpdated(new Date());
      setStatus("");
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
