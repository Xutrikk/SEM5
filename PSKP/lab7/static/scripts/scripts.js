const jsonDataDiv = document.getElementById("jsonData");
const xmlDataDiv = document.getElementById("xmlData");

fetch("/data/data.json")
    .then(response => {
        if (!response.ok) throw new Error("Failed to load JSON");
        return response.json();
    })
    .then(data => {
        const cats = data.cats;
        let output = "<h3>JSON Data:</h3><ul>";
        for (let i = 0; i < cats.length; i++) {
            const cat = cats[i];
            output += `<li>Name: ${cat.name}, Breed: ${cat.breed}, Age: ${cat.age}, Color: ${cat.color}</li>`;
        }
        output += "</ul>";
        jsonDataDiv.innerHTML = output;
    })
    .catch(error => {
        jsonDataDiv.innerHTML = `<p>Error loading JSON: ${error.message}</p>`;
    });


fetch("/data/data.xml")
    .then(response => {
        if (!response.ok) throw new Error("Failed to load XML");
        return response.text();
    })
    .then(xmlText => {
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
        const cats = xmlDoc.getElementsByTagName("cat");
        let output = "<h3>XML Data:</h3><ul>";
        for (let i = 0; i < cats.length; i++) {
            const cat = cats[i];
            const name = cat.getElementsByTagName("name")[0].textContent;
            const breed = cat.getElementsByTagName("breed")[0].textContent;
            const age = cat.getElementsByTagName("age")[0].textContent;
            const color = cat.getElementsByTagName("color")[0].textContent;
            output += `<li>Name: ${name}, Breed: ${breed}, Age: ${age}, Color: ${color}</li>`;
        }
        output += "</ul>";
        xmlDataDiv.innerHTML = output;
    })
    .catch(error => {
        xmlDataDiv.innerHTML = `<p>Error loading XML: ${error.message}</p>`;
    });