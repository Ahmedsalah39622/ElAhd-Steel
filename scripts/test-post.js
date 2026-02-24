(async () => {
  try {
    const res = await fetch("http://localhost:3000/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "material",
        name: "TEST",
        sku: "TEST001",
        unit: "pcs",
        materialType: "factory",
        createdBy: "you"
      })
    });
    console.log("STATUS", res.status);
    console.log("CT", res.headers.get("content-type"));
    const text = await res.text();
    console.log("BODY:\\n", text);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
