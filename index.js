import express, { query } from "express";
import bodyParser from "body-parser";
import pg from 'pg'
import path from 'path'
import { error } from "console";
const {pathname: root} = new URL(("views/"),import.meta.url)
const { Pool } = pg
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  database: 'world',
  user: 'postgres',
  password: 'admin',
  max: 20,
})

const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

 async function loadCountries(){
  const client = await pool.connect();
  const queryVisited = {
    text:'select * from countries_visited',
  }
  const result = client.query(queryVisited);
  client.release();
  return result;
}

function removeSpaces(countries){
  var elements=[];
  countries.forEach(element => {
  elements.push(element.country_code.trim());
 });
 return elements;
}

app.get("/", async (req, res) => {
  var result = loadCountries();
  var rowCountCountries = (await result).rowCount;
  var countries = removeSpaces((await result).rows);
  res.render("index.ejs",{assisted : rowCountCountries,countries:countries},function(err,html){
    res.send(html)
  });
});

app.post("/add",async(req,res)=>{
  try {
    var inTheMap = false;
    var coloredMap = false;
    var country = req.body.country; //value from index.ejs from attribute "name"
    country = country.toLowerCase();
    const queryPaintedCountries = {text:"select country_code from countries_visited"};
    const queryCountries = {text:"select country from capitals"};
    const client = await pool.connect();
    const countries = await client.query(queryCountries);
    const painted = await client.query(queryPaintedCountries);
    var paintedCountries = painted.rows;
    var availableCountries = countries.rows;
    for (let index = 0; index < availableCountries.length; index++) {
      var element = availableCountries[index].country.toLowerCase();
      if(element == country){
      inTheMap = true;
      break;
    }
  }
  for (let index = 0; index < paintedCountries.length; index++) {
    var element = paintedCountries[index].country_code.toLowerCase();
    element = element.trim();
    if(element == country){
      coloredMap = true;
      break;
    }
  }
  if(inTheMap){
    if(coloredMap){
      console.log("entro");
      client.release();
      var error = "This country is visited and marked as red";
      throw error;
    }else{
    const queryAdd = {
      text:'INSERT INTO countries_visited(country_code) VALUES ($1); ',
      values:[country]
  }
      const result = await client.query(queryAdd);
      client.release();
      res.redirect("/"); 
    }    
  }else{
    client.release();
    var error = "The country does not exist in the actual map";
    throw error;
  }
  }catch (error) {
    var result = await loadCountries();
    var rowCountCountries = (result).rowCount;
    var countries = removeSpaces((result).rows);
    res.render("index.ejs",{error:error,assisted : rowCountCountries,countries:countries},function(err,html){
      res.send(html);
    })
 }
})


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
